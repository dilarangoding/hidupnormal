$(document).ready(function() {
    $('#status-form').on('submit', function(event) {
        event.preventDefault(); 

        $.ajax({
            url: '/status', 
            type: 'POST',
            contentType: 'application/json', 
            data: JSON.stringify({
                secretCode: $('#KodeInput').val() 
            }),
            success: function(data) {
                $('#errorAlert').hide();
                if (data.status === 'LOCKED') {
                    $('#notfinished').show();
                    $('#finished').hide();
                    $('#total').text(data.daysRemaining);
                } else if (data.status === 'UNLOCKED') {
                    $('#finished').show();
                    $('#notfinished').hide();
                    $('#password').val(data.password);
                    
                }
            },
            error: function(jqXHR) {
                const errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.error : "Terjadi kesalahan.";
                $('#errorAlert').text(errorMessage).show();
                $('#notfinished').hide();
                $('#finished').hide();
            }
        });
    });
});