 
$(document).ready(function () {

    const settings = window.FinOpsStorage ? window.FinOpsStorage.getSettings() : {};
    $('html').attr('data-bs-theme', settings.theme || 'dark');
 
    $(document).on('click', '.btn-demo-fill', function () {
        const email = $(this).data('email');
        const pass  = $(this).data('pass');
        $('#emailInput').val(email);
        $('#passwordInput').val(pass);
        window.FinOpsUtils.showAlert(`Filled credentials for ${email}`, 'info');
    });

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        const email    = $('#emailInput').val().trim();
        const password = $('#passwordInput').val();
        if (!email || !password) {
            window.FinOpsUtils.showAlert('Please enter email and password.', 'warning');
            return;
        }
        const btn = $('#loginBtn');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Authenticating…');

        setTimeout(() => {
            const result = window.FinOpsStorage.login(email, password);
            if (result.success) {
                window.FinOpsUtils.showAlert('Login successful!', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
            } else {
                window.FinOpsUtils.showAlert(result.message, 'error');
                btn.prop('disabled', false).html('Sign In <i class="fa-solid fa-arrow-right ms-2"></i>');
            }
        }, 300);
    });
});
