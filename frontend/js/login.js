$(document).ready(function () {

    const settings = window.FinOpsStorage ? window.FinOpsStorage.getSettings() : {};
    $('html').attr('data-bs-theme', settings.theme || 'dark');

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

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'same-origin',
            body: new URLSearchParams({ username: email, password })
        }).then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Invalid username or password');

            const userRole = data.role || 'Admin';
            const userName = data.name || email.split('@')[0];

            sessionStorage.setItem(FinOpsStorage.KEYS.SESSION, JSON.stringify({
                email: data.username || email,
                name: userName,
                role: userRole,
                loginTime: new Date().toISOString()
            }));

            window.FinOpsUtils.showAlert(`Login successful as ${userRole}!`, 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
        }).catch(error => {
            window.FinOpsUtils.showAlert(error.message, 'error');
            btn.prop('disabled', false).html('Sign In <i class="fa-solid fa-arrow-right ms-2"></i>');
        });
    });
});
