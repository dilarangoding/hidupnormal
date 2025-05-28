$(document).ready(function() {
    $('#btnhasil').click(function(){
        $('#hasil').hide();
        $('#langkah1').show();
    });
    $('#btnlangkah1').click(function(){
        $('#langkah1').hide();
        $('#langkah3').show();
    });
    $('#btnlangkah1back').click(function(){
        $('#hasil').show();
        $('#langkah1').hide();
    });
    $('#btnlangkah3back').click(function(){
        $('#langkah1').show();
        $('#langkah3').hide();
    });

    $('#apaan').click(function(){
        $(this).hide();
        $('#thebody').hide();
        $('#iniapaan').show(); 
        $('#btnapaan').show(); 
    });
    $('#btnapaan').click(function(){
        $(this).hide();
        $('#thebody').show();
        $('#iniapaan').hide();
        $('#apaan').show();
    });

    $('#generate-form').on('submit', function(event) {
        event.preventDefault();
        $.ajax({
            url: '/generate', 
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ targetDate: $('#date').val() })
        })
        .done(function(data) {
            if (data.error) {
                alert(data.error); 
            } else {
                $('#hasil').show();
                $('#pilih').hide();
                $('#password').val(data.password);
                $('#code').val(data.secretCode); 
                $('#t').text(data.date);
            }
        })
        .fail(function(jqXHR) {
            const errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.error : "Terjadi kesalahan";
            alert(errorMsg);
        });
    });
});