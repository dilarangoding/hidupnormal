const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { format, parseISO, differenceInCalendarDays, isPast, isToday } = require('date-fns');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    console.error("FATAL ERROR: ENCRYPTION_KEY tidak valid. Harus 64 karakter hex.");
    process.exit(1);
}
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');
const ALGORITHM = 'aes-256-gcm';

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
    message: { error: "Terlalu banyak request, silakan coba lagi nanti." }
});
app.use('/generate', limiter); 
app.use('/status', limiter);  


function generateSecurePassword(length = 16) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function generateSecureEmail() {
    const randomPart = crypto.randomBytes(8).toString('hex');
    return `${randomPart}@hidupnormal.xyz`; 
}

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(hash) {
    try {
        const parts = hash.split(':');
        if (parts.length !== 3) return null;
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = Buffer.from(parts[2], 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        return null;
    }
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'status.html'));
});


app.post('/generate', (req, res) => {
    const { targetDate } = req.body;
    if (!targetDate) return res.status(400).json({ error: "Tanggal dibutuhkan." });
    
    const parsedDate = parseISO(targetDate);
    if (isNaN(parsedDate.getTime())) return res.status(400).json({ error: "Format tanggal tidak valid." });
    if (isPast(parsedDate) && !isToday(parsedDate)) return res.status(400).json({ error: "Tanggal sudah lewat." });

    const newPassword = generateSecurePassword(16);
    const newEmail = generateSecureEmail();
    
    const payload = `${format(parsedDate, 'yyyy-MM-dd')}|${newPassword}|${newEmail}`;
    const secretCode = encrypt(payload);

    res.status(201).json({
        date: format(parsedDate, 'dd/MM/yyyy'), 
        password: newPassword,
        email: newEmail, 
        secretCode: secretCode,
    });
});

app.post('/status', (req, res) => {
    const { secretCode } = req.body;
    if (!secretCode) return res.status(400).json({ error: "Kode rahasia dibutuhkan." });

    const decryptedPayload = decrypt(secretCode);
    if (!decryptedPayload) return res.status(400).json({ error: "Kode rahasia tidak valid." });
    
    const payloadParts = decryptedPayload.split('|');
    if (payloadParts.length < 2) return res.status(400).json({ error: "Format kode rusak." });

    const [dateString, password, email] = payloadParts; 
    const targetDate = parseISO(dateString);
    const today = new Date();

    if (isPast(targetDate) || isToday(targetDate)) {
        res.json({
            status: "UNLOCKED",
            password: password,
            email: email || "Tidak tersedia" 
        });
    } else {
        const daysRemaining = differenceInCalendarDays(targetDate, today);
        res.json({
            status: "LOCKED",
            daysRemaining: daysRemaining
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});