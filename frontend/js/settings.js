/**
 * settings.js
 * Platform configurations, theme selectors, and database resets.
 */

$(document).ready(function() {
    // 1. Render Navigation Shell
    if (window.FinOpsUtils) {
        window.FinOpsUtils.renderShell('settings');
    }

    // 2. Load and Populate Initial Settings Values
    function loadSystemSettings() {
        if (!window.FinOpsStorage) return;

        const settings = window.FinOpsStorage.getSettings();

        $('#inputCompanyName').val(settings.companyName || 'FinOps Prime');
        $('#inputCurrency').val(settings.currency || '$');
        $('#inputDefaultRate').val(settings.interestRate || 8.5);

        // Highlight Active Theme Card
        const theme = settings.theme || 'dark';
        updateThemeCardActiveState(theme);
    }

    function updateThemeCardActiveState(theme) {
        if (theme === 'dark') {
            $('#themeSelectDark').addClass('active');
            $('#darkCheckIcon').removeClass('d-none').addClass('text-indigo');
            $('#themeSelectLight').removeClass('active');
            $('#lightCheckIcon').addClass('d-none').removeClass('text-indigo');
        } else {
            $('#themeSelectLight').addClass('active');
            $('#lightCheckIcon').removeClass('d-none').addClass('text-indigo');
            $('#themeSelectDark').removeClass('active');
            $('#darkCheckIcon').addClass('d-none').removeClass('text-indigo');
        }
    }

    // 3. Save Settings Form
    $('#systemSettingsForm').on('submit', function(e) {
        e.preventDefault();

        if (!window.FinOpsStorage || !window.FinOpsUtils) return;

        const currentSettings = window.FinOpsStorage.getSettings();
        const updated = {
            ...currentSettings,
            companyName: $('#inputCompanyName').val().trim(),
            currency: $('#inputCurrency').val(),
            interestRate: parseFloat($('#inputDefaultRate').val()) || 8.5
        };

        window.FinOpsStorage.saveSettings(updated);
        window.FinOpsUtils.showAlert('System parameters saved successfully.', 'success');

        // Re-render layout wrapper to update logo text and currency tags immediately
        window.FinOpsUtils.renderShell('settings');
    });

    // 4. Bind Theme Cards Click Events
    function handleThemeChange(newTheme) {
        if (!window.FinOpsStorage || !window.FinOpsUtils) return;

        const settings = window.FinOpsStorage.getSettings();
        if (settings.theme !== newTheme) {
            settings.theme = newTheme;
            window.FinOpsStorage.saveSettings(settings);
            
            // Sync theme display elements
            updateThemeCardActiveState(newTheme);
            
            // Render changes
            window.FinOpsUtils.renderShell('settings');
            
            // Fire custom event
            const event = new CustomEvent('themeChanged', { detail: { theme: newTheme } });
            window.dispatchEvent(event);

            window.FinOpsUtils.showAlert(`Interface theme set to ${newTheme} mode!`, 'info');
        }
    }

    $('#themeSelectDark').on('click', function() {
        handleThemeChange('dark');
    });

    $('#themeSelectLight').on('click', function() {
        handleThemeChange('light');
    });

    // 5. Danger Zone Database Reset handler
    $('#resetSystemBtn').on('click', function() {
        if (!window.FinOpsStorage || !window.FinOpsUtils) return;

        const confirmFirst = confirm("CRITICAL WARNING:\nAre you sure you want to reset the system database?\nThis will clear all registered customers, outstanding loan sheets, payments logs, and your active user session.");
        
        if (confirmFirst) {
            const confirmSecond = confirm("FINAL CONFIRMATION:\nThis operation is irreversible. Default system users, active client records, and default loans will be re-seeded. Do you want to continue?");
            
            if (confirmSecond) {
                window.FinOpsStorage.resetDatabase();
                window.FinOpsUtils.showAlert('Database reset complete. Redirecting to login...', 'success');
                
                // Redirect back to login page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        }
    });

    // Run initialize
    loadSystemSettings();
});
