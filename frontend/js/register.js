$(document).ready(function () {

    const settings = window.FinOpsStorage ? window.FinOpsStorage.getSettings() : {};
    $('html').attr('data-bs-theme', settings.theme || 'dark');

    // Toggle Password Visibility
    function togglePassword(inputId, btnId) {
        const input = $(`#${inputId}`);
        const btn = $(`#${btnId}`);
        const icon = btn.find('i');
        
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    }

    $('#togglePasswordBtn').on('click', function () {
        togglePassword('passwordInput', 'togglePasswordBtn');
    });

    $('#toggleConfirmPasswordBtn').on('click', function () {
        togglePassword('confirmPasswordInput', 'toggleConfirmPasswordBtn');
    });

    $('#registerForm').on('submit', function (e) {
        e.preventDefault();
        const fullName        = $('#nameInput').val().trim();
        const email           = $('#emailInput').val().trim();
        const password        = $('#passwordInput').val();
        const confirmPassword = $('#confirmPasswordInput').val();
        const role            = $('#roleSelect').val();

        if (!fullName || !email || !password || !confirmPassword || !role) {
            window.FinOpsUtils.showAlert('Please fill in all fields.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            window.FinOpsUtils.showAlert('Passwords do not match. Please verify.', 'error');
            return;
        }

        const btn = $('#registerBtn');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Creating Account…');

        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: email, password, fullName, role })
        }).then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create account.');

            window.FinOpsUtils.showAlert('Registration successful! Please wait for Manager/Admin approval.', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        }).catch(error => {
            window.FinOpsUtils.showAlert(error.message, 'error');
            btn.prop('disabled', false).html('Sign Up <i class="fa-solid fa-user-plus ms-2"></i>');
        });
    });
});
