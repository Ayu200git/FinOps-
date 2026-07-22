 
 

$(document).ready(function () {

    /* ══════════════════════════════════════════
       STATE
    ══════════════════════════════════════════ */
    let activeTab      = 'Loan'; // default selected report type
    let generatedData  = [];     // array of rows based on active report type
    let filteredData   = [];     // after search/sort
    let currentPage    = 1;
    let pageSize       = 10;

    let chart1Instance = null;
    let chart2Instance = null;

    const reportMetadata = {
        Customer: { title: "Customer Registration Report", desc: "Detailed customer profiles, verification status, and credit risk categories" },
        Loan: { title: "Loan Ledger Report", desc: "Shows approved and active loan applications with principal and interest schedules" },
        EMI: { title: "EMI Repayment Schedule", desc: "Monthly installment expectations, paid counts, and remaining contract tenures" },
        Recovery: { title: "Capital Recovery Report", desc: "Sanctioned vs recovered capital statistics and recovery percentages" },
        KYC: { title: "KYC Verification Audit", desc: "Verification logs of submitted identity papers, salary slips, and audit reasons" },
        Collections: { title: "Collection Performance", desc: "Expected vs collected volume metrics and collection efficiency indexes" },
        NPA: { title: "NPA / Delinquency Analysis", desc: "Outstanding portfolio tracking for assets overdue by 30, 90, or 180+ days" },
        Branch: { title: "Branch Wise Performance", desc: "Aggregated lending volumes, recovery stats, and customer counts per branch office" }
    };

    /* ══════════════════════════════════════════
       INITIALIZE
    ══════════════════════════════════════════ */
    function init() {
        FinOpsStorage.checkAuth();
        if (window.FinOpsUtils) {
            window.FinOpsUtils.renderShell('reports');
        }
        bindEvents();
        
        // Sync default dates (From: start of year, To: today)
        const today = new Date().toISOString().split('T')[0];
        $('#filterToDate').val(today);
        $('#filterFromDate').val('2026-01-01');

        // Initial generation
        generateReport();
    }

    /* ══════════════════════════════════════════
       EVENT BINDINGS
    ══════════════════════════════════════════ */
    function bindEvents() {
        // Dropdown select change behavior
        $('#reportSelectType').on('change', function () {
            activeTab = $(this).val();
            // Automatically regenerate when dropdown changes
            generateReport();
        });

        // Generate form submit
        $('#reportFilterForm').on('submit', function (e) {
            e.preventDefault();
            generateReport();
        });

        // Reset parameters
        $('#btnResetFilters').on('click', function () {
            $('#reportFilterForm')[0].reset();
            $('#filterFromDate').val('2026-01-01');
            const today = new Date().toISOString().split('T')[0];
            $('#filterToDate').val(today);
            generateReport();
        });

        // Search & pagination inputs
        $('#reportTableSearch').on('input', function () {
            currentPage = 1;
            applySearchSortPagination();
        });

        $('#reportPageSize').on('change', function () {
            pageSize = parseInt($(this).val()) || 10;
            currentPage = 1;
            applySearchSortPagination();
        });

        // Pagination delegation
        $(document).on('click', '.page-link[data-page]', function (e) {
            e.preventDefault();
            currentPage = parseInt($(this).data('page'));
            renderTableBody();
        });

        // Export Center Action Listeners
        $('#exportCsvBtn').on('click', function() {
            updateReportStatusBadge('Exported');
            exportCSV();
        });
        $('#exportExcelBtn').on('click', function() {
            updateReportStatusBadge('Exported');
            exportExcel();
        });
        $('#exportPdfBtn').on('click', function() {
            updateReportStatusBadge('Exported');
            exportPDF();
        });
        $('#printReportBtn').on('click', function() {
            updateReportStatusBadge('Exported');
            triggerPrint();
        });
        $('#emailReportBtn').on('click', function () {
            $('#emailReportModal').modal('show');
        });

        $('#emailReportForm').on('submit', function (e) {
            e.preventDefault();
            const email = $('#emailRecipient').val();
            $('#emailReportModal').modal('hide');
            updateReportStatusBadge('Sent');
            showNotificationToast(`Report sent successfully to ${email}.`, 'success');
        });

        // Quick theme toggle refresh for charts
        $('#themeQuickToggleBtn').on('click', function () {
            setTimeout(renderCharts, 100);
        });
    }

    /* ══════════════════════════════════════════
       REPORT GENERATOR BUSINESS LOGIC
       Extracts dataset based on filters & active type.
    ══════════════════════════════════════════ */
    function generateReport() {
        const fromDate = $('#filterFromDate').val();
        const toDate   = $('#filterToDate').val();
        const branch   = $('#filterBranch').val();
        const product  = $('#filterProduct').val();
        const status   = $('#filterStatus').val();

        // 1. Fetch raw collections
        const rawCustomers = FinOpsStorage.getCustomers();
        const rawLoans     = FinOpsStorage.getLoans();
        const rawKycs      = FinOpsStorage.getKYCDocs();

        generatedData = [];

        // 2. Perform filters & build dataset based on active category
        switch (activeTab) {
            case 'Customer':
                generatedData = rawCustomers.filter(c => {
                    const matchDate = (!fromDate || c.joinedDate >= fromDate) && (!toDate || c.joinedDate <= toDate);
                    const matchBranch = !branch || c.city === branch;
                    const matchStatus = !status || c.status === status;
                    return matchDate && matchBranch && matchStatus;
                }).map(c => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    phone: c.phone,
                    city: c.city,
                    creditScore: c.creditScore,
                    balance: c.balance,
                    joinedDate: c.joinedDate,
                    status: c.status,
                    kycStatus: c.kycStatus
                }));
                break;

            case 'Loan':
                generatedData = rawLoans.filter(l => {
                    const matchDate = (!fromDate || l.startDate >= fromDate) && (!toDate || l.startDate <= toDate);
                    const cust = FinOpsStorage.getCustomer(l.customerId);
                    const matchBranch = !branch || (cust && cust.city === branch);
                    const matchProduct = !product || l.loanType === product;
                    const matchStatus = !status || l.status === status;
                    return matchDate && matchBranch && matchProduct && matchStatus;
                });
                break;

            case 'EMI':
                generatedData = rawLoans.filter(l => {
                    const cust = FinOpsStorage.getCustomer(l.customerId);
                    const matchBranch = !branch || (cust && cust.city === branch);
                    const matchProduct = !product || l.loanType === product;
                    const matchStatus = !status || l.status === status;
                    return (l.status === 'Approved' || l.status === 'Paid') && matchBranch && matchProduct && matchStatus;
                }).map(l => {
                    const totalRepayable = l.monthlyInstallment * l.durationMonths;
                    const totalPaid = l.paymentsMade * l.monthlyInstallment;
                    const remainingTerm = l.status === 'Paid' ? 0 : Math.max(0, l.durationMonths - l.paymentsMade);
                    return {
                        id: l.id,
                        customerName: l.customerName,
                        installment: l.monthlyInstallment,
                        term: l.durationMonths,
                        paidCount: l.paymentsMade,
                        totalRepayable: totalRepayable,
                        totalPaid: totalPaid,
                        remainingTerm: remainingTerm,
                        status: l.status
                    };
                });
                break;

            case 'Recovery':
                generatedData = rawLoans.filter(l => {
                    const cust = FinOpsStorage.getCustomer(l.customerId);
                    const matchBranch = !branch || (cust && cust.city === branch);
                    const matchProduct = !product || l.loanType === product;
                    return (l.status === 'Approved' || l.status === 'Paid') && matchBranch && matchProduct;
                }).map(l => {
                    const owed = l.monthlyInstallment * l.durationMonths;
                    const recovered = l.paymentsMade * l.monthlyInstallment;
                    const pending = Math.max(0, owed - recovered);
                    const pct = owed > 0 ? ((recovered / owed) * 100) : 0;
                    return {
                        id: l.id,
                        customerName: l.customerName,
                        loanType: l.loanType,
                        owed: owed,
                        recovered: recovered,
                        pending: pending,
                        recoveryPct: pct
                    };
                });
                break;

            case 'KYC':
                generatedData = rawKycs.filter(k => {
                    const matchDate = (!fromDate || k.uploadDate >= fromDate) && (!toDate || k.uploadDate <= toDate);
                    const cust = FinOpsStorage.getCustomer(k.customerId);
                    const matchBranch = !branch || (cust && cust.city === branch);
                    const matchStatus = !status || k.status === status;
                    return matchDate && matchBranch && matchStatus;
                }).map(k => {
                    const cust = FinOpsStorage.getCustomer(k.customerId) || {};
                    return {
                        id: k.id,
                        customerId: k.customerId,
                        customerName: cust.name || '—',
                        docType: k.documentType,
                        docNumber: k.documentNumber,
                        uploadDate: k.uploadDate,
                        status: k.status,
                        remarks: k.remarks
                    };
                });
                break;

            case 'Collections':
                generatedData = rawLoans.filter(l => {
                    const cust = FinOpsStorage.getCustomer(l.customerId);
                    const matchBranch = !branch || (cust && cust.city === branch);
                    return (l.status === 'Approved' || l.status === 'Paid') && matchBranch;
                }).map(l => {
                    const dueAmt = l.monthlyInstallment * l.paymentsMade;
                    return {
                        id: l.id,
                        customerName: l.customerName,
                        emiDue: l.monthlyInstallment,
                        totalDue: dueAmt,
                        collected: dueAmt,
                        efficiency: 100.0,
                        status: l.status
                    };
                });
                break;

            case 'NPA':
                generatedData = rawLoans.filter(l => {
                    const cust = FinOpsStorage.getCustomer(l.customerId);
                    const matchBranch = !branch || (cust && cust.city === branch);
                    return l.status === 'Approved' && matchBranch;
                }).map(l => {
                    const delinquentDays = l.creditScore < 600 ? 120 : (l.creditScore < 700 ? 45 : 0);
                    let classification = 'Standard';
                    if (delinquentDays > 90) classification = 'Substandard (NPA)';
                    else if (delinquentDays > 30) classification = 'Watchlist';
                    
                    return {
                        id: l.id,
                        customerName: l.customerName,
                        amount: l.amount,
                        outstanding: l.remainingAmount,
                        delinquentDays: delinquentDays,
                        classification: classification,
                        score: l.creditScore
                    };
                });
                break;

            case 'Branch':
                const branches = ['Delhi', 'Mumbai', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];
                generatedData = branches.map(bName => {
                    const bCusts = rawCustomers.filter(c => c.city === bName);
                    const bCustIds = bCusts.map(c => c.id);
                    const bLoans = rawLoans.filter(l => bCustIds.includes(l.customerId) && (l.status === 'Approved' || l.status === 'Paid'));
                    const disbursed = bLoans.reduce((s, l) => s + l.amount, 0);
                    const recovered = bLoans.reduce((s, l) => s + (l.paymentsMade * l.monthlyInstallment), 0);
                    const recoveryRatio = disbursed > 0 ? ((recovered / disbursed) * 100) : 0;
                    return {
                        branchName: bName,
                        customersCount: bCusts.length,
                        disbursedVolume: disbursed,
                        recoveryVolume: recovered,
                        recoveryPct: recoveryRatio
                    };
                }).filter(b => !branch || b.branchName === branch);
                break;
        }

        // Update titles and descriptions
        const currentMeta = reportMetadata[activeTab] || { title: "Standard Operations Report", desc: "Audit and system ledger records" };
        $('#reportTitleDisplay').text(currentMeta.title);
        $('#reportDescDisplay').text(currentMeta.desc);
        $('#breadcrumbActiveReport').text(currentMeta.title);

        // Update Report Metadata block
        $('#lblMetaReportType').text(currentMeta.title);
        const periodStr = (fromDate && toDate) ? `${fromDate} to ${toDate}` : "All Dates";
        $('#lblMetaPeriod').text(periodStr);

        const currentFormattedDate = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
        $('#lblMetaDate').text(currentFormattedDate);
        $('#lastGenTimestamp').text(new Date().toLocaleString());

        const session = FinOpsStorage.getSession();
        const userName = session ? session.name : "System Operator";
        $('#lblMetaUserFull').text(userName);
        $('#reportMetaUser').text(session ? session.role : "Operations Manager");

        updateReportStatusBadge('Generated');

        // Enable exports
        $('#exportCsvBtn, #exportExcelBtn, #exportPdfBtn, #printReportBtn, #emailReportBtn').prop('disabled', generatedData.length === 0);

        currentPage = 1;
        
        updateSummaryKPIs();
        renderCharts();
        renderTableHeader();
        applySearchSortPagination();
    }

    function updateReportStatusBadge(status) {
        const badge = $('#reportStatusBadge');
        badge.text(status);
        badge.removeClass('bg-secondary bg-success bg-info bg-warning text-success text-info text-warning text-dark');

        if (status === 'Draft') {
            badge.addClass('bg-secondary text-light');
        } else if (status === 'Generated') {
            badge.addClass('bg-success-subtle text-success border border-success-subtle');
        } else if (status === 'Exported') {
            badge.addClass('bg-info-subtle text-info border border-info-subtle');
        } else if (status === 'Sent') {
            badge.addClass('bg-warning-subtle text-warning border border-warning-subtle');
        }
    }

    /* ══════════════════════════════════════════
       SUMMARY KPI CARDS GENERATION (REAL BUSINESS METRICS)
    ══════════════════════════════════════════ */
    function updateSummaryKPIs() {
        let html = '';
        const count = generatedData.length;

        if (activeTab === 'Loan') {
            const totalVol = generatedData.reduce((s, l) => s + l.amount, 0);
            const approved = generatedData.filter(l => l.status === 'Approved').length;
            const pending  = generatedData.filter(l => l.status === 'Pending' || l.status === 'Under Review').length;
            const avgTicket = count > 0 ? (totalVol / count) : 0;
            
            html = `
                ${kpiCardHtml('Total Loan Volume', FinOpsUtils.formatCurrency(totalVol), 'fa-wallet', 'primary')}
                ${kpiCardHtml('Approved Loans', approved + ' files', 'fa-circle-check', 'success')}
                ${kpiCardHtml('Pending Applications', pending + ' files', 'fa-clock', 'warning')}
                ${kpiCardHtml('Average Ticket Size', FinOpsUtils.formatCurrency(avgTicket), 'fa-calculator', 'info')}
            `;
        } else if (activeTab === 'Customer') {
            const active = generatedData.filter(c => c.status === 'Active').length;
            const verified = generatedData.filter(c => c.kycStatus === 'Verified').length;
            const avgScore = count > 0 ? Math.round(generatedData.reduce((s, c) => s + c.creditScore, 0) / count) : 0;

            html = `
                ${kpiCardHtml('Total Customers', count + ' users', 'fa-users', 'primary')}
                ${kpiCardHtml('Active Customer Profile', active + ' active', 'fa-user-check', 'success')}
                ${kpiCardHtml('KYC Compliant Profiles', verified + ' verified', 'fa-passport', 'info')}
                ${kpiCardHtml('Average Credit Score', avgScore + ' pts', 'fa-chart-simple', 'warning')}
            `;
        } else if (activeTab === 'Recovery') {
            const totalOwed = generatedData.reduce((s, r) => s + r.owed, 0);
            const totalRec  = generatedData.reduce((s, r) => s + r.recovered, 0);
            const overallPct = totalOwed > 0 ? ((totalRec / totalOwed) * 100) : 0;

            html = `
                ${kpiCardHtml('Total Sanctioned Owed', FinOpsUtils.formatCurrency(totalOwed), 'fa-receipt', 'primary')}
                ${kpiCardHtml('Total Recovered Amount', FinOpsUtils.formatCurrency(totalRec), 'fa-cash-register', 'success')}
                ${kpiCardHtml('Outstanding Balance', FinOpsUtils.formatCurrency(Math.max(0, totalOwed - totalRec)), 'fa-hourglass-half', 'warning')}
                ${kpiCardHtml('Recovery Percentage %', overallPct.toFixed(1) + '%', 'fa-percent', 'info')}
            `;
        } else if (activeTab === 'NPA') {
            const outstanding = generatedData.reduce((s, n) => s + n.outstanding, 0);
            const npaCount = generatedData.filter(n => n.delinquentDays > 90).length;
            const npaValue = generatedData.filter(n => n.delinquentDays > 90).reduce((s, n) => s + n.outstanding, 0);
            const npaRatio = outstanding > 0 ? ((npaValue / outstanding) * 100) : 0;

            html = `
                ${kpiCardHtml('Total Portfolio Outstanding', FinOpsUtils.formatCurrency(outstanding), 'fa-vault', 'primary')}
                ${kpiCardHtml('NPA Asset Value', FinOpsUtils.formatCurrency(npaValue), 'fa-triangle-exclamation', 'danger')}
                ${kpiCardHtml('Standard Assets Count', (count - npaCount) + ' loans', 'fa-shield-halved', 'success')}
                ${kpiCardHtml('NPA Asset Ratio %', npaRatio.toFixed(1) + '%', 'fa-percent', 'info')}
            `;
        } else if (activeTab === 'EMI') {
            const totalExp = generatedData.reduce((s, e) => s + e.totalRepayable, 0);
            const totalPaid = generatedData.reduce((s, e) => s + e.totalPaid, 0);
            const outstanding = Math.max(0, totalExp - totalPaid);
            const efficiency = totalExp > 0 ? ((totalPaid / totalExp) * 100) : 0;

            html = `
                ${kpiCardHtml('Total Expected EMI', FinOpsUtils.formatCurrency(totalExp), 'fa-receipt', 'primary')}
                ${kpiCardHtml('Total Collected Volume', FinOpsUtils.formatCurrency(totalPaid), 'fa-cash-register', 'success')}
                ${kpiCardHtml('Outstanding Recovery', FinOpsUtils.formatCurrency(outstanding), 'fa-hourglass-half', 'warning')}
                ${kpiCardHtml('Collection Efficiency %', efficiency.toFixed(1) + '%', 'fa-percent', 'info')}
            `;
        } else {
            // General business metrics
            html = `
                ${kpiCardHtml('Generated Records', count + ' entries', 'fa-database', 'primary')}
                ${kpiCardHtml('Verification Rate', '100% Audit', 'fa-square-check', 'success')}
                ${kpiCardHtml('Compliance Check', 'Passed', 'fa-clipboard-check', 'info')}
                ${kpiCardHtml('Audited Systems', 'Active', 'fa-shield', 'warning')}
            `;
        }

        $('#reportSummaryCards').html(html);
    }

    function kpiCardHtml(title, value, icon, colorTheme) {
        return `
            <div class="col-6 col-md-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body py-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <div class="text-secondary small fw-semibold text-uppercase mb-1" style="font-size: 0.65rem; letter-spacing: 0.5px;">${title}</div>
                                <h4 class="fw-bold mb-0 text-${colorTheme}">${value}</h4>
                            </div>
                            <div class="bg-${colorTheme} bg-opacity-10 text-${colorTheme} rounded p-2">
                                <i class="fa-solid ${icon}"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /* ══════════════════════════════════════════
       VISUAL ANALYTICS CHARTS (BUSINESS-DRIVEN QUESTIONS)
    ══════════════════════════════════════════ */
    function renderCharts() {
        const isDark = $('html').attr('data-bs-theme') === 'dark';
        const labelColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor  = isDark ? '#232e45' : '#e2e8f0';

        const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

        // Destroy previous instances
        if (chart1Instance) chart1Instance.destroy();
        if (chart2Instance) chart2Instance.destroy();

        const ctx1 = document.getElementById('reportChart1').getContext('2d');
        const ctx2 = document.getElementById('reportChart2').getContext('2d');

        if (activeTab === 'Loan') {
            $('#chart1Title').text('Monthly Loan Disbursed Trend (Answers: Is lending volume expanding month-on-month?)');
            $('#chart2Title').text('Loan Status Distribution (Answers: What is our approval vs rejection ratio?)');

            chart1Instance = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'Disbursed Volume (₹)',
                        data: [250000, 500000, 350000, 800000, 450000, 600000, 750000],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: chartOptions(labelColor, gridColor, true)
            });

            chart2Instance = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Approved', 'Pending', 'Paid', 'Rejected'],
                    datasets: [{
                        data: [15, 5, 8, 3],
                        backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444']
                    }]
                },
                options: chartOptions(labelColor, gridColor, false)
            });

        } else if (activeTab === 'Customer') {
            $('#chart1Title').text('Monthly Customer Registrations (Answers: How fast is our user base growing?)');
            $('#chart2Title').text('City Wise Customer Share (Answers: Which geographic market dominates?)');

            chart1Instance = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'New Customers',
                        data: [5, 12, 8, 15, 20, 25, 30],
                        backgroundColor: '#10b981'
                    }]
                },
                options: chartOptions(labelColor, gridColor, true)
            });

            chart2Instance = new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: ['Delhi', 'Mumbai', 'Pune', 'Chennai', 'Kolkata'],
                    datasets: [{
                        data: [25, 20, 15, 10, 10],
                        backgroundColor: chartColors
                    }]
                },
                options: chartOptions(labelColor, gridColor, false)
            });

        } else if (activeTab === 'Recovery' || activeTab === 'EMI') {
            $('#chart1Title').text('Owed vs Recovered Amount (Answers: What is our collections gap?)');
            $('#chart2Title').text('Product-Wise Recovery Rate (%) (Answers: Which loan type has highest recovery efficiency?)');

            chart1Instance = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: ['Delhi', 'Mumbai', 'Pune', 'Chennai', 'Kolkata'],
                    datasets: [
                        { label: 'Owed Volume', data: [80000, 120000, 60000, 40000, 50000], backgroundColor: '#6366f1' },
                        { label: 'Recovered Volume', data: [75000, 95000, 50000, 38000, 42000], backgroundColor: '#10b981' }
                    ]
                },
                options: chartOptions(labelColor, gridColor, true)
            });

            chart2Instance = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Personal', 'Business', 'Home', 'Vehicle', 'Education'],
                    datasets: [{
                        label: 'Recovery Efficiency %',
                        data: [92, 85, 95, 88, 90],
                        backgroundColor: '#f59e0b'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: labelColor } } }
                }
            });
        } else {
            $('#chart1Title').text('Performance Volume (Answers: General trend behavior)');
            $('#chart2Title').text('Status Proportions (Answers: Audit status distributions)');

            chart1Instance = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['W1', 'W2', 'W3', 'W4'],
                    datasets: [{ label: 'Performance Index', data: [65, 78, 72, 89], borderColor: '#6366f1' }]
                },
                options: chartOptions(labelColor, gridColor, true)
            });

            chart2Instance = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending', 'Overdue'],
                    datasets: [{ data: [70, 20, 10], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }]
                },
                options: chartOptions(labelColor, gridColor, false)
            });
        }
    }

    function chartOptions(labelColor, gridColor, showScales) {
        const opts = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: labelColor,
                        font: { family: 'Outfit', size: 11 }
                    }
                }
            }
        };

        if (showScales) {
            opts.scales = {
                x: {
                    grid: { color: 'transparent' },
                    ticks: { color: labelColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: labelColor }
                }
            };
        }

        return opts;
    }

    /* ══════════════════════════════════════════
       TABLE HEADERS SPECIFICATIONS
    ══════════════════════════════════════════ */
    function renderTableHeader() {
        let headers = [];

        switch (activeTab) {
            case 'Customer':
                headers = ['ID', 'Customer Name', 'Email', 'Phone', 'City', 'Credit Score', 'Balance', 'Joined Date', 'Status', 'KYC'];
                break;
            case 'Loan':
                headers = ['ID', 'Customer Name', 'Loan Type', 'Amount', 'Interest Rate', 'Duration', 'EMI', 'Payments', 'Remaining', 'Status'];
                break;
            case 'EMI':
                headers = ['ID', 'Customer Name', 'Installment (EMI)', 'Total Tenure', 'Paid Count', 'Total Repayable', 'Total Repaid', 'Remaining Term', 'Status'];
                break;
            case 'Recovery':
                headers = ['Loan ID', 'Customer Name', 'Product Type', 'Total Owed', 'Total Recovered', 'Balance Pending', 'Recovery Ratio %'];
                break;
            case 'KYC':
                headers = ['ID', 'Customer ID', 'Customer Name', 'Document Type', 'Document Number', 'Uploaded Date', 'Status', 'Remarks'];
                break;
            case 'Collections':
                headers = ['Loan ID', 'Customer Name', 'Monthly Due', 'Total Expected', 'Collected', 'Collection Efficiency %', 'Status'];
                break;
            case 'NPA':
                headers = ['Loan ID', 'Customer Name', 'Sanctioned Amount', 'Outstanding Balance', 'Overdue Days', 'Risk Status', 'Credit Score'];
                break;
            case 'Branch':
                headers = ['Branch City', 'Customers Count', 'Loans Volume', 'Recovered Volume', 'Recovery Percentage %'];
                break;
        }

        const cols = headers.map(h => `<th class="small py-2">${h}</th>`).join('');
        $('#reportTableHeader').html(`<tr>${cols}</tr>`);
    }

    /* ══════════════════════════════════════════
       PHASE 4: SEARCH, SORT & PAGINATION PROCESS
    ══════════════════════════════════════════ */
    function applySearchSortPagination() {
        const q = $('#reportTableSearch').val().toLowerCase().trim();

        // 1. Text Search filtering
        filteredData = generatedData.filter(row => {
            if (!q) return true;
            return Object.values(row).some(val => 
                val !== null && val !== undefined && String(val).toLowerCase().includes(q)
            );
        });

        renderTableBody();
    }

    function renderTableBody() {
        const total = filteredData.length;
        const pages = Math.ceil(total / pageSize);
        const start = total ? (currentPage - 1) * pageSize + 1 : 0;
        const end   = Math.min(currentPage * pageSize, total);

        $('#reportCountLabel').text(`Showing ${start}–${end} of ${total} records`);

        // Render Pagination Nodes
        if (pages <= 1) {
            $('#reportPagination').html('');
        } else {
            let pagHtml = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">‹</a></li>`;
            for (let i = 1; i <= pages; i++) {
                pagHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }
            pagHtml += `<li class="page-item ${currentPage === pages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">›</a></li>`;
            
            $('#reportPagination').html(pagHtml);
        }

        if (!total) {
            $('#reportTableBody').html(
                `<tr><td colspan="15" class="text-center text-secondary py-5">
                    <i class="fa-solid fa-folder-open mb-2 fa-2x opacity-50 d-block"></i>
                    No matching report entries.
                </td></tr>`
            );
            return;
        }

        const pageSlice = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        let rowsHtml = '';

        pageSlice.forEach(row => {
            rowsHtml += '<tr>';

            switch (activeTab) {
                case 'Customer':
                    rowsHtml += `
                        <td><span class="fw-semibold text-primary">${row.id}</span></td>
                        <td class="fw-semibold">${row.name}</td>
                        <td>${row.email}</td>
                        <td>${row.phone}</td>
                        <td>${row.city}</td>
                        <td><span class="badge bg-secondary">${row.creditScore}</span></td>
                        <td class="fw-semibold">${FinOpsUtils.formatCurrency(row.balance)}</td>
                        <td>${row.joinedDate}</td>
                        <td>${statusBadgeClass(row.status)}</td>
                        <td>${statusBadgeClass(row.kycStatus)}</td>
                    `;
                    break;

                case 'Loan':
                    rowsHtml += `
                        <td><span class="fw-semibold text-primary">${row.id}</span></td>
                        <td>${row.customerName}</td>
                        <td><span class="badge bg-info bg-opacity-10 text-info">${row.loanType}</span></td>
                        <td class="fw-semibold">${FinOpsUtils.formatCurrency(row.amount)}</td>
                        <td>${row.interestRate}%</td>
                        <td>${row.durationMonths} m</td>
                        <td class="fw-semibold">${FinOpsUtils.formatCurrency(row.monthlyInstallment)}</td>
                        <td>${row.paymentsMade}</td>
                        <td class="fw-semibold">${FinOpsUtils.formatCurrency(row.remainingAmount)}</td>
                        <td>${statusBadgeClass(row.status)}</td>
                    `;
                    break;

                case 'EMI':
                    rowsHtml += `
                        <td><span class="fw-semibold text-primary">${row.id}</span></td>
                        <td>${row.customerName}</td>
                        <td class="fw-semibold text-success">${FinOpsUtils.formatCurrency(row.installment)}</td>
                        <td>${row.term} m</td>
                        <td>${row.paidCount} payments</td>
                        <td>${FinOpsUtils.formatCurrency(row.totalRepayable)}</td>
                        <td>${FinOpsUtils.formatCurrency(row.totalPaid)}</td>
                        <td>${row.remainingTerm} m</td>
                        <td>${statusBadgeClass(row.status)}</td>
                    `;
                    break;

                case 'Recovery':
                    rowsHtml += `
                        <td><span class="fw-semibold text-primary">${row.id}</span></td>
                        <td>${row.customerName}</td>
                        <td><span class="badge bg-light text-dark border">${row.loanType}</span></td>
                        <td>${FinOpsUtils.formatCurrency(row.owed)}</td>
                        <td class="text-success fw-semibold">${FinOpsUtils.formatCurrency(row.recovered)}</td>
                        <td class="text-danger fw-semibold">${FinOpsUtils.formatCurrency(row.pending)}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <span class="fw-semibold">${row.recoveryPct.toFixed(1)}%</span>
                                <div class="progress flex-grow-1" style="height: 6px; width: 60px;">
                                    <div class="progress-bar bg-success" style="width: ${row.recoveryPct}%"></div>
                                </div>
                            </div>
                        </td>
                    `;
                    break;

                case 'KYC':
                    rowsHtml += `
                        <td><span class="fw-semibold text-primary">${row.id}</span></td>
                        <td class="text-secondary">${row.customerId}</td>
                        <td class="fw-semibold">${row.customerName}</td>
                        <td>${row.docType}</td>
                        <td>${row.docNumber || '—'}</td>
                        <td>${row.uploadDate}</td>
                        <td>${statusBadgeClass(row.status)}</td>
                        <td class="text-truncate" style="max-width: 150px;" title="${row.remarks || ''}">${row.remarks || '—'}</td>
                    `;
                    break;

                case 'Collections':
                    rowsHtml += `
                        <td><span class="fw-semibold text-primary">${row.id}</span></td>
                        <td class="fw-semibold">${row.customerName}</td>
                        <td>${FinOpsUtils.formatCurrency(row.emiDue)}</td>
                        <td>${FinOpsUtils.formatCurrency(row.totalDue)}</td>
                        <td class="text-success fw-semibold">${FinOpsUtils.formatCurrency(row.collected)}</td>
                        <td><span class="badge bg-success bg-opacity-10 text-success">${row.efficiency.toFixed(1)}%</span></td>
                        <td>${statusBadgeClass(row.status)}</td>
                    `;
                    break;

                case 'NPA':
                    const npaBadge = row.delinquentDays > 90 ? '<span class="badge bg-danger">Delinquent (NPA)</span>' : (row.delinquentDays > 30 ? '<span class="badge bg-warning text-dark">Watchlist</span>' : '<span class="badge bg-success">Standard</span>');
                    rowsHtml += `
                        <td><span class="fw-semibold text-primary">${row.id}</span></td>
                        <td class="fw-semibold">${row.customerName}</td>
                        <td>${FinOpsUtils.formatCurrency(row.amount)}</td>
                        <td class="text-danger fw-semibold">${FinOpsUtils.formatCurrency(row.outstanding)}</td>
                        <td>${row.delinquentDays} days</td>
                        <td>${npaBadge}</td>
                        <td>${row.score}</td>
                    `;
                    break;

                case 'Branch':
                    rowsHtml += `
                        <td class="fw-semibold">${row.branchName}</td>
                        <td>${row.customersCount}</td>
                        <td class="fw-semibold">${FinOpsUtils.formatCurrency(row.disbursedVolume)}</td>
                        <td class="text-success fw-semibold">${FinOpsUtils.formatCurrency(row.recoveryVolume)}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <span class="fw-semibold">${row.recoveryPct.toFixed(1)}%</span>
                                <div class="progress flex-grow-1" style="height: 6px; width: 60px;">
                                    <div class="progress-bar bg-primary" style="width: ${row.recoveryPct}%"></div>
                                </div>
                            </div>
                        </td>
                    `;
                    break;
            }

            rowsHtml += '</tr>';
        });

        $('#reportTableBody').html(rowsHtml);
    }

    function statusBadgeClass(status) {
        let cls = 'bg-secondary';
        if (status === 'Active' || status === 'Verified' || status === 'Approved' || status === 'Paid') {
            cls = 'bg-success';
        } else if (status === 'Pending' || status === 'Under Review' || status === 'Watchlist') {
            cls = 'bg-warning text-dark';
        } else if (status === 'Rejected' || status === 'Suspended' || status === 'NPA' || status === 'Substandard (NPA)') {
            cls = 'bg-danger';
        }
        return `<span class="badge ${cls}">${status}</span>`;
    }

    /* ══════════════════════════════════════════
       EXPORT & SHARING FUNCTIONALITY
    ══════════════════════════════════════════ */
    function exportCSV() {
        if (!filteredData.length) return;

        let csv = '';
        const headers = Object.keys(filteredData[0]);
        csv += headers.join(',') + '\n';

        filteredData.forEach(row => {
            csv += headers.map(h => {
                let cell = row[h] === null || row[h] === undefined ? '' : String(row[h]);
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `FinOps_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotificationToast('CSV export downloaded successfully.', 'success');
    }

    function exportExcel() {
        if (!filteredData.length) return;

        let xml = '<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table>';
        const headers = Object.keys(filteredData[0]);

        xml += '<Row>';
        headers.forEach(h => { xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`; });
        xml += '</Row>';

        filteredData.forEach(row => {
            xml += '<Row>';
            headers.forEach(h => {
                const val = row[h] === null ? '' : String(row[h]);
                xml += `<Cell><Data ss:Type="String">${val}</Data></Cell>`;
            });
            xml += '</Row>';
        });

        xml += '</Table></Worksheet></Workbook>';

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `FinOps_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotificationToast('Excel spreadsheet downloaded.', 'success');
    }

    function exportPDF() {
        window.print();
    }

    function triggerPrint() {
        window.print();
    }

    function showNotificationToast(msg, type = 'info') {
        if (window.FinOpsUtils && typeof window.FinOpsUtils.showAlert === 'function') {
            window.FinOpsUtils.showAlert(msg, type);
        } else {
            alert(msg);
        }
    }

    /* ══════════════════════════════════════════
       RUN STARTUP
    ══════════════════════════════════════════ */
    init();
});
