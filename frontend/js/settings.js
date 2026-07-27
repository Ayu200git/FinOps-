$(document).ready(function () {

    /*  
       STATE
      */
    let activeModule = 'general';   
    let settingsData = {};           
    let isDirty      = false;       
    let lastSaved    = 'Never';      

    /*
       CONFIG (Nested Corporate Architecture)
    */
    const DEFAULT_CONFIG = {
        general: {
            companyName: 'FinOps Prime',
            brandText: 'FinOps Prime',
            supportEmail: 'user@example.com',
            supportPhone: '+91 1800-456-7890',
            currency: '₹',
            timeZone: 'Asia/Kolkata',
            dateFormat: 'dd-mm-yyyy',
            language: 'en',
            theme: 'dark',
            compactMode: false
        },
        security: {
            passwordMinLength: 8,
            requireSpecialChar: true,
            sessionTimeout: 15,
            mfaEnabled: false,
            loginAttempts: 5,
            passwordExpiryDays: 90,
            ipRestrictions: '127.0.0.1\n192.168.1.0/24'
        },
        loan: {
            interestRate: 8.5,
            minLoanAmount: 10000,
            maxLoanAmount: 5000000,
            processingFeePct: 1.5,
            gracePeriodDays: 5
        },
        kyc: {
            kycAadhaarRequired: true,
            kycPanRequired: true,
            kycPhotoRequired: true,
            kycSalaryRequired: false,
            kycSlaDays: 3,
            autoApprovalEnabled: false
        },
        notification: {
            emailNotifsEnabled: true,
            smsNotifsEnabled: false,
            pushNotifsEnabled: true,
            loanAlertsEnabled: true,
            recoveryAlertsEnabled: true
        },
        branch: {
            branches: [
                { code: 'DEL', name: 'Delhi', manager: 'Ayush Sharma', status: 'Active', region: 'North' },
                { code: 'BOM', name: 'Mumbai', manager: 'Priya Mehta', status: 'Active', region: 'West' },
                { code: 'PNQ', name: 'Pune', manager: 'Rahul Verma', status: 'Active', region: 'West' },
                { code: 'MAA', name: 'Chennai', manager: 'Srinivasan K', status: 'Active', region: 'South' },
                { code: 'CCU', name: 'Kolkata', manager: 'Amit Sen', status: 'Inactive', region: 'East' }
            ]
        }
    };

    // Mapping module keys to dynamic rendering functions
    const MODULE_RENDERERS = {
        general: renderGeneral,
        security: renderSecurity,
        loan: renderLoan,
        kyc: renderKYC,
        branch: renderBranch,
        notifications: renderNotifications,
        users: renderUsers,
        audit: renderAudit
    };

    /* 
       INITIALIZATION
     */
    function init() {
        FinOpsStorage.checkAuth();
        if (window.FinOpsUtils) {
            window.FinOpsUtils.renderShell('settings');
        }
        loadSettings();
        switchModule(activeModule);
        bindEvents();
        updateLastSaved();
        updateDirtyState(false);
    }

    /* 
       EVENT BINDINGS
    */
    function bindEvents() {
        $('#settingsNavMenu button').on('click', function (e) {
            e.preventDefault();
            const targetMod = $(this).data('module');
            
            if (isDirty) {
                const proceed = confirm("You have unsaved changes. Are you sure you want to navigate away?");
                if (!proceed) return;
            }

            switchModule(targetMod);
        });

        $(document).on('input change', '#settingsMasterForm input, #settingsMasterForm select, #settingsMasterForm textarea', function () {
            updateDirtyState(true);
        });

        $('#btnSaveAllSettings').on('click', function () {
            saveSettings();
        });

        $('#btnResetSettings').on('click', function () {
            resetSettings();
        });

        $('#btnExportSettings').on('click', function () {
            exportSettings();
        });

        // Dynamic elements handlers 
        $(document).on('click', '.btn-toggle-branch', function () {
            const index = $(this).data('index');
            const currentStatus = settingsData.branch.branches[index].status;
            settingsData.branch.branches[index].status = currentStatus === 'Active' ? 'Inactive' : 'Active';
            updateDirtyState(true);
            renderBranch();
        });
    }

    /*  
       MODULE NAVIGATION
   */
    function switchModule(module) {
        activeModule = module;
        updateActiveMenu(module);

        const renderer = MODULE_RENDERERS[module];
        if (renderer) {
            renderer();
        }

        populateForm();
        updateSaveButton();
    }

    function updateActiveMenu(module) {
        $('#settingsNavMenu button').removeClass('active').addClass('text-secondary');
        $(`#settingsNavMenu button[data-module="${module}"]`).addClass('active').removeClass('text-secondary');
    }

    /*  
       DATA MANAGEMENT
    */
    function loadSettings() {
        const stored = FinOpsStorage.getSettings();
        
        // If the stored data is flat (old version), normalize it to the nested structure
        let normalized = {};
        if (stored && !stored.general) {
            normalized = {
                general: {
                    companyName: stored.companyName || DEFAULT_CONFIG.general.companyName,
                    brandText: stored.brandText || DEFAULT_CONFIG.general.brandText,
                    supportEmail: stored.supportEmail || DEFAULT_CONFIG.general.supportEmail,
                    supportPhone: stored.supportPhone || DEFAULT_CONFIG.general.supportPhone,
                    currency: stored.currency || DEFAULT_CONFIG.general.currency,
                    timeZone: stored.timeZone || DEFAULT_CONFIG.general.timeZone,
                    dateFormat: stored.dateFormat || DEFAULT_CONFIG.general.dateFormat,
                    language: stored.language || DEFAULT_CONFIG.general.language,
                    theme: stored.theme || DEFAULT_CONFIG.general.theme,
                    compactMode: stored.compactMode !== undefined ? stored.compactMode : DEFAULT_CONFIG.general.compactMode
                },
                security: {
                    passwordMinLength: stored.passwordMinLength || DEFAULT_CONFIG.security.passwordMinLength,
                    requireSpecialChar: stored.requireSpecialChar !== undefined ? stored.requireSpecialChar : DEFAULT_CONFIG.security.requireSpecialChar,
                    sessionTimeout: stored.sessionTimeout || DEFAULT_CONFIG.security.sessionTimeout,
                    mfaEnabled: stored.mfaEnabled !== undefined ? stored.mfaEnabled : DEFAULT_CONFIG.security.mfaEnabled,
                    loginAttempts: stored.loginAttempts || DEFAULT_CONFIG.security.loginAttempts,
                    passwordExpiryDays: stored.passwordExpiryDays || DEFAULT_CONFIG.security.passwordExpiryDays,
                    ipRestrictions: stored.ipRestrictions || DEFAULT_CONFIG.security.ipRestrictions
                },
                loan: {
                    interestRate: stored.interestRate || DEFAULT_CONFIG.loan.interestRate,
                    minLoanAmount: stored.minLoanAmount || DEFAULT_CONFIG.loan.minLoanAmount,
                    maxLoanAmount: stored.maxLoanAmount || DEFAULT_CONFIG.loan.maxLoanAmount,
                    processingFeePct: stored.processingFeePct || DEFAULT_CONFIG.loan.processingFeePct,
                    gracePeriodDays: stored.gracePeriodDays || DEFAULT_CONFIG.loan.gracePeriodDays
                },
                kyc: {
                    kycAadhaarRequired: stored.kycAadhaarRequired !== undefined ? stored.kycAadhaarRequired : DEFAULT_CONFIG.kyc.kycAadhaarRequired,
                    kycPanRequired: stored.kycPanRequired !== undefined ? stored.kycPanRequired : DEFAULT_CONFIG.kyc.kycPanRequired,
                    kycPhotoRequired: stored.kycPhotoRequired !== undefined ? stored.kycPhotoRequired : DEFAULT_CONFIG.kyc.kycPhotoRequired,
                    kycSalaryRequired: stored.kycSalaryRequired !== undefined ? stored.kycSalaryRequired : DEFAULT_CONFIG.kyc.kycSalaryRequired,
                    kycSlaDays: stored.kycSlaDays || DEFAULT_CONFIG.kyc.kycSlaDays,
                    autoApprovalEnabled: stored.autoApprovalEnabled !== undefined ? stored.autoApprovalEnabled : DEFAULT_CONFIG.kyc.autoApprovalEnabled
                },
                notification: {
                    emailNotifsEnabled: stored.emailNotifsEnabled !== undefined ? stored.emailNotifsEnabled : DEFAULT_CONFIG.notification.emailNotifsEnabled,
                    smsNotifsEnabled: stored.smsNotifsEnabled !== undefined ? stored.smsNotifsEnabled : DEFAULT_CONFIG.notification.smsNotifsEnabled,
                    pushNotifsEnabled: stored.pushNotifsEnabled !== undefined ? stored.pushNotifsEnabled : DEFAULT_CONFIG.notification.pushNotifsEnabled,
                    loanAlertsEnabled: stored.loanAlertsEnabled !== undefined ? stored.loanAlertsEnabled : DEFAULT_CONFIG.notification.loanAlertsEnabled,
                    recoveryAlertsEnabled: stored.recoveryAlertsEnabled !== undefined ? stored.recoveryAlertsEnabled : DEFAULT_CONFIG.notification.recoveryAlertsEnabled
                },
                branch: {
                    branches: stored.branches || DEFAULT_CONFIG.branch.branches
                }
            };
        } else {
            normalized = stored;
        }

        settingsData = $.extend(true, {}, DEFAULT_CONFIG, normalized);
    }

    function collectFormData() {
        if (activeModule === 'general')            collectGeneral();
        else if (activeModule === 'security')      collectSecurity();
        else if (activeModule === 'loan')          collectLoan();
        else if (activeModule === 'kyc')           collectKYC();
        else if (activeModule === 'notifications')  collectNotifications();
    }

    function collectGeneral() {
        settingsData.general.companyName = $('#cfgOrgName').val().trim();
        settingsData.general.brandText = $('#cfgBrandText').val().trim();
        settingsData.general.supportEmail = $('#cfgSupportEmail').val().trim();
        settingsData.general.supportPhone = $('#cfgSupportPhone').val().trim();
        settingsData.general.currency = $('#cfgCurrency').val();
        settingsData.general.timeZone = $('#cfgTimeZone').val();
        settingsData.general.dateFormat = $('#cfgDateFormat').val();
        settingsData.general.language = $('#cfgLanguage').val();
        settingsData.general.theme = $('input[name="cfgTheme"]:checked').val();
        settingsData.general.compactMode = $('#cfgCompactMode').is(':checked');
    }

    // eslint-disable-next-line no-unused-vars
    function collectSecurity() {
        settingsData.security.passwordMinLength = parseInt($('#cfgPassLength').val()) || 8;
        settingsData.security.requireSpecialChar = $('#cfgRequireSpecial').is(':checked');
        settingsData.security.sessionTimeout = parseInt($('#cfgSessionTimeout').val()) || 15;
        settingsData.security.mfaEnabled = $('#cfgMfaEnabled').is(':checked');
        settingsData.security.loginAttempts = parseInt($('#cfgAttempts').val()) || 5;
        settingsData.security.passwordExpiryDays = parseInt($('#cfgPassExpiry').val()) || 90;
        settingsData.security.ipRestrictions = $('#cfgIpRestrictions').val().trim();
    }

    function collectLoan() {
        settingsData.loan.interestRate = parseFloat($('#cfgInterestRate').val()) || 8.5;
        settingsData.loan.minLoanAmount = parseFloat($('#cfgMinLoan').val()) || 10000;
        settingsData.loan.maxLoanAmount = parseFloat($('#cfgMaxLoan').val()) || 5000000;
        settingsData.loan.processingFeePct = parseFloat($('#cfgFeePct').val()) || 1.5;
        settingsData.loan.gracePeriodDays = parseInt($('#cfgGracePeriod').val()) || 5;
    }

    function collectKYC() {
        settingsData.kyc.kycAadhaarRequired = $('#cfgKycAadhaar').is(':checked');
        settingsData.kyc.kycPanRequired = $('#cfgKycPan').is(':checked');
        settingsData.kyc.kycPhotoRequired = $('#cfgKycPhoto').is(':checked');
        settingsData.kyc.kycSalaryRequired = $('#cfgKycSalary').is(':checked');
        settingsData.kyc.kycSlaDays = parseInt($('#cfgKycSla').val()) || 3;
        settingsData.kyc.autoApprovalEnabled = $('#cfgAutoApproval').is(':checked');
    }

    function collectNotifications() {
        settingsData.notification.emailNotifsEnabled = $('#cfgEmailNotif').is(':checked');
        settingsData.notification.smsNotifsEnabled = $('#cfgSmsNotif').is(':checked');
        settingsData.notification.pushNotifsEnabled = $('#cfgPushNotif').is(':checked');
        settingsData.notification.loanAlertsEnabled = $('#cfgLoanAlerts').is(':checked');
        settingsData.notification.recoveryAlertsEnabled = $('#cfgRecoveryAlerts').is(':checked');
    }

    function populateForm() {
        if (activeModule === 'general')            populateGeneral();
        else if (activeModule === 'security')      populateSecurity();
        else if (activeModule === 'loan')          populateLoan();
        else if (activeModule === 'kyc')           populateKYC();
        else if (activeModule === 'notifications')  populateNotifications();
    }

    function populateGeneral() {
        $('#cfgOrgName').val(settingsData.general.companyName);
        $('#cfgBrandText').val(settingsData.general.brandText);
        $('#cfgSupportEmail').val(settingsData.general.supportEmail);
        $('#cfgSupportPhone').val(settingsData.general.supportPhone);
        $('#cfgCurrency').val(settingsData.general.currency);
        $('#cfgTimeZone').val(settingsData.general.timeZone);
        $('#cfgDateFormat').val(settingsData.general.dateFormat);
        $('#cfgLanguage').val(settingsData.general.language);
        $(`input[name="cfgTheme"][value="${settingsData.general.theme}"]`).prop('checked', true);
        $('#cfgCompactMode').prop('checked', settingsData.general.compactMode);
    }

    function populateSecurity() {
        $('#cfgPassLength').val(settingsData.security.passwordMinLength);
        $('#cfgRequireSpecial').prop('checked', settingsData.security.requireSpecialChar);
        $('#cfgSessionTimeout').val(settingsData.security.sessionTimeout);
        $('#cfgMfaEnabled').prop('checked', settingsData.security.mfaEnabled);
        $('#cfgAttempts').val(settingsData.security.loginAttempts);
        $('#cfgPassExpiry').val(settingsData.security.passwordExpiryDays);
        $('#cfgIpRestrictions').val(settingsData.security.ipRestrictions);
    }

    function populateLoan() {
        $('#cfgInterestRate').val(settingsData.loan.interestRate);
        $('#cfgMinLoan').val(settingsData.loan.minLoanAmount);
        $('#cfgMaxLoan').val(settingsData.loan.maxLoanAmount);
        $('#cfgFeePct').val(settingsData.loan.processingFeePct);
        $('#cfgGracePeriod').val(settingsData.loan.gracePeriodDays);
    }

    function populateKYC() {
        $('#cfgKycAadhaar').prop('checked', settingsData.kyc.kycAadhaarRequired);
        $('#cfgKycPan').prop('checked', settingsData.kyc.kycPanRequired);
        $('#cfgKycPhoto').prop('checked', settingsData.kyc.kycPhotoRequired);
        $('#cfgKycSalary').prop('checked', settingsData.kyc.kycSalaryRequired);
        $('#cfgKycSla').val(settingsData.kyc.kycSlaDays);
        $('#cfgAutoApproval').prop('checked', settingsData.kyc.autoApprovalEnabled);
    }

    function populateNotifications() {
        $('#cfgEmailNotif').prop('checked', settingsData.notification.emailNotifsEnabled);
        $('#cfgSmsNotif').prop('checked', settingsData.notification.smsNotifsEnabled);
        $('#cfgPushNotif').prop('checked', settingsData.notification.pushNotifsEnabled);
        $('#cfgLoanAlerts').prop('checked', settingsData.notification.loanAlertsEnabled);
        $('#cfgRecoveryAlerts').prop('checked', settingsData.notification.recoveryAlertsEnabled);
    }

    /* 
       MODULE RENDERING
    */
    function renderGeneral() {
        const html = `
            <!-- Card 1: Organization Profile -->
            <div class="card border-0 shadow-sm mb-4 bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-building me-2"></i>Organization Profile
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Organization Name</label>
                            <input type="text" class="form-control form-control-sm" id="cfgOrgName" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Logo Text / Brand Icon</label>
                            <input type="text" class="form-control form-control-sm" id="cfgBrandText" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Support Contact Email</label>
                            <input type="email" class="form-control form-control-sm" id="cfgSupportEmail" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Support Helpline Phone</label>
                            <input type="text" class="form-control form-control-sm" id="cfgSupportPhone" required>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Regional Settings -->
            <div class="card border-0 shadow-sm mb-4 bg-body">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-globe me-2"></i>Regional & Localization Settings
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Currency Sign</label>
                            <select class="form-select form-select-sm" id="cfgCurrency">
                                <option value="₹">INR (₹)</option>
                                <option value="$">USD ($)</option>
                                <option value="€">EUR (€)</option>
                                <option value="£">GBP (£)</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Time Zone</label>
                            <select class="form-select form-select-sm" id="cfgTimeZone">
                                <option value="Asia/Kolkata">IST (UTC+05:30) — India</option>
                                <option value="UTC">UTC (UTC+00:00) — GMT</option>
                                <option value="America/New_York">EST (UTC-05:00) — New York</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Date Format</label>
                            <select class="form-select form-select-sm" id="cfgDateFormat">
                                <option value="dd-mm-yyyy">DD-MM-YYYY (e.g. 22-07-2026)</option>
                                <option value="yyyy-mm-dd">YYYY-MM-DD (e.g. 2026-07-22)</option>
                                <option value="mm/dd/yyyy">MM/DD/YYYY (e.g. 07/22/2026)</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Preferred Language</label>
                            <select class="form-select form-select-sm" id="cfgLanguage">
                                <option value="en">English (UK)</option>
                                <option value="hi">Hindi</option>
                                <option value="es">Spanish</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 3: Appearance Preferences -->
            <div class="card border-0 shadow-sm bg-body">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-palette me-2"></i>Portal Theme & Appearance
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3 align-items-center">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold d-block">Interface Color Theme</label>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="cfgTheme" id="themeRadioDark" value="dark">
                                <label class="form-check-label small fw-medium" for="themeRadioDark">
                                    <i class="fa-solid fa-moon me-1 text-primary"></i> Dark (Recommended)
                                </label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="cfgTheme" id="themeRadioLight" value="light">
                                <label class="form-check-label small fw-medium" for="themeRadioLight">
                                    <i class="fa-solid fa-sun me-1 text-warning"></i> Light Mode
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold d-block">System Display Density</label>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="cfgCompactMode">
                                <label class="form-check-label small" for="cfgCompactMode">Enable compact layout grid rows</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

    function renderSecurity() {
        const html = `
            <!-- Card 1: Password & Expiry Policies -->
            <div class="card border-0 shadow-sm mb-4 bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-key me-2"></i>Password Complexity & Expiry
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Minimum Password Length</label>
                            <input type="number" class="form-control form-control-sm" id="cfgPassLength" min="6" max="32" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Password Periodic Expiry (Days)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgPassExpiry" min="0" required>
                        </div>
                        <div class="col-12">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="cfgRequireSpecial">
                                <label class="form-check-label small fw-medium text-body" for="cfgRequireSpecial">Require special character ($@#$%) & digits in credentials</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Access & Session Timeout -->
            <div class="card border-0 shadow-sm mb-4 bg-body">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-clock-rotate-left me-2"></i>Access & Session Timeout
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Session Idle Timeout (Minutes)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgSessionTimeout" min="1" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Max Login Attempts (Before Lockout)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgAttempts" min="3" required>
                        </div>
                        <div class="col-12">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="cfgMfaEnabled">
                                <label class="form-check-label small fw-medium text-body" for="cfgMfaEnabled">Enforce Multi-Factor Authentication (MFA) for Administrative roles</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 3: Network Firewall Constraints -->
            <div class="card border-0 shadow-sm bg-body">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-shield-halved me-2"></i>IP Access Restrictions
                    </h6>
                </div>
                <div class="card-body">
                    <div class="mb-2">
                        <label class="form-label small fw-semibold">Allowed IP Ranges (One per line)</label>
                        <textarea class="form-control form-control-sm font-monospace" id="cfgIpRestrictions" rows="3" placeholder="e.g. 192.168.1.0/24"></textarea>
                    </div>
                    <small class="text-secondary">Leaving this blank allows access from any network connection.</small>
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

    function renderLoan() {
        const html = `
            <!-- Card 1: Lending Boundaries & Rates -->
            <div class="card border-0 shadow-sm bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-sack-dollar me-2"></i>Lending Limits & Rates
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Default Annual Interest Rate (%)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgInterestRate" step="0.05" min="0" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Lending Processing Fee (%)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgFeePct" step="0.1" min="0" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Minimum Disbursal Capital (₹)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgMinLoan" step="1000" min="0" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Maximum Disbursal Capital (₹)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgMaxLoan" step="10000" min="0" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">EMI Payment Grace Period (Days)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgGracePeriod" min="0" required>
                        </div>
                    </div>
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

    function renderKYC() {
        const html = `
            <!-- Card 1: Documentation Audit Checklist -->
            <div class="card border-0 shadow-sm mb-4 bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-list-check me-2"></i>Mandatory Papers Config
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-2">
                        <div class="col-md-6">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgKycAadhaar">
                                <label class="form-check-label small fw-medium" for="cfgKycAadhaar">Aadhaar Document Required</label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgKycPan">
                                <label class="form-check-label small fw-medium" for="cfgKycPan">PAN Card Verification Required</label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgKycPhoto">
                                <label class="form-check-label small fw-medium" for="cfgKycPhoto">Passport Photo Required</label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgKycSalary">
                                <label class="form-check-label small fw-medium" for="cfgKycSalary">Salary Slip Audit Required</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: SLA & Workflow Configuration -->
            <div class="card border-0 shadow-sm bg-body">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-rotate me-2"></i>SLA & Auto Approval
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Verification Target SLA (Days)</label>
                            <input type="number" class="form-control form-control-sm" id="cfgKycSla" min="1" required>
                        </div>
                        <div class="col-12">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="cfgAutoApproval">
                                <label class="form-check-label small fw-medium" for="cfgAutoApproval">Enable Auto-Verification on matches (Simulated API)</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

    function renderBranch() {
        const rows = settingsData.branch.branches.map((b, i) => `
            <tr>
                <td class="fw-semibold text-primary small">${b.code}</td>
                <td class="fw-medium small">${b.name}</td>
                <td class="small">${b.manager}</td>
                <td class="small">${b.region}</td>
                <td>
                    <span class="badge ${b.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${b.status}</span>
                </td>
                <td class="text-end">
                    <button class="btn btn-outline-secondary btn-sm btn-toggle-branch py-0 px-2 fs-8" data-index="${i}">
                        Toggle Status
                    </button>
                </td>
            </tr>`).join('');

        const html = `
            <!-- Branch Listing Table -->
            <div class="card border-0 shadow-sm bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-network-wired me-2"></i>Corporate Branch Offices
                    </h6>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Manager</th>
                                <th>Region</th>
                                <th>Status</th>
                                <th class="text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

    function renderNotifications() {
        const html = `
            <!-- Card 1: Channel Rules -->
            <div class="card border-0 shadow-sm mb-4 bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-paper-plane me-2"></i>Active Channels
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-2">
                        <div class="col-md-4">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgEmailNotif">
                                <label class="form-check-label small fw-medium" for="cfgEmailNotif">Email Notifications</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgSmsNotif">
                                <label class="form-check-label small fw-medium" for="cfgSmsNotif">SMS / Text Alerts</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgPushNotif">
                                <label class="form-check-label small fw-medium" for="cfgPushNotif">Push Notifications</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: System Trigger Rules -->
            <div class="card border-0 shadow-sm bg-body">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-toggle-on me-2"></i>Transaction Triggers
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-2">
                        <div class="col-12">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgLoanAlerts">
                                <label class="form-check-label small" for="cfgLoanAlerts">Send alerts on Loan Stage approvals/rejections</label>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="cfgRecoveryAlerts">
                                <label class="form-check-label small" for="cfgRecoveryAlerts">Remind customers of upcoming EMI recovery dates</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

    function renderUsers() {
        const users = FinOpsStorage.getCustomers().slice(0, 5); 

        const rows = users.map(u => `
            <tr>
                <td><span class="fw-semibold text-primary small">${u.id}</span></td>
                <td class="fw-semibold small">${u.name}</td>
                <td class="small">${u.email}</td>
                <td>
                    <span class="badge bg-primary bg-opacity-10 text-primary">${u.kycStatus === 'Verified' ? 'Customer Manager' : 'Officer'}</span>
                </td>
                <td class="text-end small">Active</td>
            </tr>`).join('');

        const html = `
            <!-- Users list matrix -->
            <div class="card border-0 shadow-sm mb-4 bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-users-gear me-2"></i>Active Team Members
                    </h6>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Operator ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Assigned Role</th>
                                <th class="text-end">Status</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>

            <!-- Role Access Toggles -->
            <div class="card border-0 shadow-sm bg-body">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-shield me-2"></i>Security Access Toggles
                    </h6>
                </div>
                <div class="card-body">
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" id="cfgAllowClerkApproval" disabled>
                        <label class="form-check-label small" for="cfgAllowClerkApproval">Allow Clerks to approve KYC documents (Blocked by default)</label>
                    </div>
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" id="cfgAllowOfficerSettings" disabled>
                        <label class="form-check-label small" for="cfgAllowOfficerSettings">Allow Officers to access settings configurations</label>
                    </div>
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

    function renderAudit() {
        const logs = FinOpsStorage.getActivityLogs().slice(0, 10);

        const rows = logs.map(l => `
            <div class="d-flex gap-3 mb-3 border-bottom pb-2">
                <div class="text-primary small" style="min-width: 80px;">${l.action}</div>
                <div class="flex-grow-1">
                    <div class="fw-semibold small">${l.description}</div>
                    <div class="text-secondary" style="font-size: 0.72rem;">User: ${l.userName} (${l.userId}) · Module: ${l.module}</div>
                </div>
                <div class="text-secondary small text-end" style="min-width:140px;">
                    ${FinOpsUtils.formatDateTime(l.timestamp)}
                </div>
            </div>`).join('');

        const html = `
            <!-- Audit Log Timeline Card -->
            <div class="card border-0 shadow-sm bg-body animate__fadeIn">
                <div class="card-header bg-transparent border-bottom py-3">
                    <h6 class="fw-bold mb-0 text-primary">
                        <i class="fa-solid fa-clock-rotate-left me-2"></i>System Activity Audit Trail
                    </h6>
                </div>
                <div class="card-body" style="max-height: 480px; overflow-y: auto;">
                    ${rows || '<div class="text-center py-5 text-secondary">No activity logs recorded yet.</div>'}
                </div>
            </div>`;
        $('#settingsModuleContent').html(html);
    }

     
    function validateGeneral() {
        const email = $('#cfgSupportEmail').val();
        if (email && !email.includes('@')) {
            showToast('Please enter a valid Support Contact Email address.', 'warning');
            return false;
        }
        return true;
    }

    function validateSecurity() {
        const passLen = parseInt($('#cfgPassLength').val()) || 0;
        const session = parseInt($('#cfgSessionTimeout').val()) || 0;

        if (passLen < 6) {
            showToast('Minimum Password length should be at least 6 characters.', 'warning');
            return false;
        }
        if (session < 1) {
            showToast('Session idle timeout should be at least 1 minute.', 'warning');
            return false;
        }
        return true;
    }

    function validateLoan() {
        const rate = parseFloat($('#cfgInterestRate').val()) || 0;
        const minL = parseFloat($('#cfgMinLoan').val()) || 0;
        const maxL = parseFloat($('#cfgMaxLoan').val()) || 0;

        if (rate <= 0) {
            showToast('Default Annual Interest Rate must be greater than 0%.', 'warning');
            return false;
        }
        if (minL >= maxL) {
            showToast('Minimum Disbursal Capital must be lower than Maximum Disbursal.', 'warning');
            return false;
        }
        return true;
    }

    /*  
       ACTIONS
   */
    function saveSettings() {
        collectFormData();
 
        if (activeModule === 'general' && !validateGeneral()) return;
        if (activeModule === 'security' && !validateSecurity()) return;
        if (activeModule === 'loan' && !validateLoan()) return;

        // Flatten nested copy back to storage schema for app-wide compatibility
        const flatToSave = {
            companyName: settingsData.general.companyName,
            brandText: settingsData.general.brandText,
            supportEmail: settingsData.general.supportEmail,
            supportPhone: settingsData.general.supportPhone,
            currency: settingsData.general.currency,
            timeZone: settingsData.general.timeZone,
            dateFormat: settingsData.general.dateFormat,
            language: settingsData.general.language,
            theme: settingsData.general.theme,
            compactMode: settingsData.general.compactMode,

            passwordMinLength: settingsData.security.passwordMinLength,
            requireSpecialChar: settingsData.security.requireSpecialChar,
            sessionTimeout: settingsData.security.sessionTimeout,
            mfaEnabled: settingsData.security.mfaEnabled,
            loginAttempts: settingsData.security.loginAttempts,
            passwordExpiryDays: settingsData.security.passwordExpiryDays,
            ipRestrictions: settingsData.security.ipRestrictions,

            interestRate: settingsData.loan.interestRate,
            minLoanAmount: settingsData.loan.minLoanAmount,
            maxLoanAmount: settingsData.loan.maxLoanAmount,
            processingFeePct: settingsData.loan.processingFeePct,
            gracePeriodDays: settingsData.loan.gracePeriodDays,

            kycAadhaarRequired: settingsData.kyc.kycAadhaarRequired,
            kycPanRequired: settingsData.kyc.kycPanRequired,
            kycPhotoRequired: settingsData.kyc.kycPhotoRequired,
            kycSalaryRequired: settingsData.kyc.kycSalaryRequired,
            kycSlaDays: settingsData.kyc.kycSlaDays,
            autoApprovalEnabled: settingsData.kyc.autoApprovalEnabled,

            emailNotifsEnabled: settingsData.notification.emailNotifsEnabled,
            smsNotifsEnabled: settingsData.notification.smsNotifsEnabled,
            pushNotifsEnabled: settingsData.notification.pushNotifsEnabled,
            loanAlertsEnabled: settingsData.notification.loanAlertsEnabled,
            recoveryAlertsEnabled: settingsData.notification.recoveryAlertsEnabled,

            branches: settingsData.branch.branches
        };
        
        FinOpsStorage.saveSettings(flatToSave);
        lastSaved = new Date().toLocaleTimeString();

        updateDirtyState(false);
        updateLastSaved();
        showToast('Settings saved successfully.', 'success');
 
        FinOpsUtils.renderShell('settings');
        switchModule(activeModule);
    }

    function resetSettings() {
        const proceed = confirm("Are you sure you want to revert all changes to their last saved state?");
        if (!proceed) return;

        loadSettings();
        switchModule(activeModule);
        updateDirtyState(false);
        showToast('Configuration settings reset.', 'info');
    }

    function exportSettings() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settingsData, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `FinOps_Config_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showToast('System configuration file exported.', 'success');
    }

  
    function updateLastSaved() {
        $('#cfgLastSavedTime').text(lastSaved);
    }

    function updateDirtyState(dirty) {
        isDirty = dirty;
        updateSaveButton();
    }

    function showToast(message, type = 'info') {
        if (window.FinOpsUtils && typeof window.FinOpsUtils.showAlert === 'function') {
            window.FinOpsUtils.showAlert(message, type);
        } else {
            alert(message);
        }
    }

    function updateSaveButton() {
        const btn = $('#btnSaveAllSettings');
        if (isDirty) {
            btn.removeClass('btn-primary').addClass('btn-success');
        } else {
            btn.removeClass('btn-success').addClass('btn-primary');
        }
    }

   
    init();
});
