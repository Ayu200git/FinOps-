 
$(document).ready(function () {
     
    const settings = window.FinOpsStorage ? window.FinOpsStorage.getSettings() : {};
    const theme = settings.theme || 'dark';
    $('html').attr('data-bs-theme', theme);
    $('#themeQuickToggleBtn i').removeClass('fa-moon fa-sun').addClass(theme === 'dark' ? 'fa-sun' : 'fa-moon');

    let chartCash = null, chartType = null;

    function getChartColors() {
        const dark = $('html').attr('data-bs-theme') === 'dark';
        return {
            grid:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            tick:   dark ? '#adb5bd' : '#6c757d',
            border: dark ? '#2d3748' : '#dee2e6'
        };
    }

    function load() {
        const loans     = FinOpsStorage.getLoans();
        const customers = FinOpsStorage.getCustomers();

        const approved       = loans.filter(l => l.status === 'Approved');
        const pending        = loans.filter(l => l.status === 'Pending' || l.status === 'Under Review');
        const totalPortfolio = approved.reduce((s, l) => s + l.remainingAmount, 0);
        const totalRepaid    = loans.reduce((s, l) => s + l.paymentsMade * l.monthlyInstallment, 0);
        const active         = customers.filter(c => c.status === 'Active').length;

        $('#kpiTotalPortfolio').text(FinOpsUtils.formatCurrency(totalPortfolio));
        $('#kpiPortfolioSub').text(approved.length + ' active agreements');

        $('#kpiCustomers').text(customers.length);
        $('#kpiCustomerSub').text(active + ' active · ' + (customers.length - active) + ' suspended');

        $('#kpiRepayments').text(FinOpsUtils.formatCurrency(totalRepaid));
        $('#kpiRepaymentSub').text(loans.reduce((s, l) => s + l.paymentsMade, 0) + ' installments collected');

        $('#kpiPending').text(pending.length);
        $('#kpiPendingSub').text('awaiting decision');

        renderCharts(loans);
        renderActivityLog();
    }

    function renderCharts(loans) {
        const c = getChartColors();

        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
        const disb   = [500000, 1000000, 0, 200000, 350000, 2500000, 0];
        const recov  = [0, 93492, 124784, 211600, 280000, 340000, 420000];

        if (chartCash) chartCash.destroy();
        chartCash = new Chart(document.getElementById('cashFlowChart'), {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    { label: 'Disbursed (₹)', data: disb, backgroundColor: 'rgba(13,110,253,0.6)', borderColor: '#0d6efd', borderWidth: 1, borderRadius: 4, yAxisID: 'y' },
                    { label: 'Recovered (₹)', data: recov, type: 'line', borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.08)', fill: true, borderWidth: 2, tension: 0.3, pointRadius: 3, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: c.tick, font: { size: 11 } } } },
                scales: {
                    x:  { grid: { color: 'transparent' }, ticks: { color: c.tick, font: { size: 11 } } },
                    y:  { grid: { color: c.grid }, ticks: { color: c.tick, callback: v => '₹' + (v / 100000).toFixed(0) + 'L' } },
                    y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: c.tick, callback: v => '₹' + (v / 100000).toFixed(0) + 'L' } }
                }
            }
        });

        
        const byType = {};
        loans.forEach(l => {
            const type = l.loanType || 'Personal';
            byType[type] = (byType[type] || 0) + l.amount;
        });
        const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#0dcaf0'];

        if (chartType) chartType.destroy();
        chartType = new Chart(document.getElementById('loanTypeChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(byType),
                datasets: [{ data: Object.values(byType), backgroundColor: colors, borderWidth: 2, borderColor: 'transparent' }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, cutout: '65%' }
        });

        $('#loanTypeLegend').html(Object.keys(byType).map((k, i) => `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="d-flex align-items-center gap-2">
                    <span class="rounded-circle d-inline-block" style="width:8px;height:8px;background:${colors[i]};"></span>
                    <span class="small text-secondary">${k}</span>
                </div>
                <span class="small fw-semibold">${FinOpsUtils.formatCurrency(byType[k])}</span>
            </div>`).join(''));
    }

    function renderActivityLog() {
        const logs = FinOpsStorage.getActivityLogs().slice(0, 5);
        const actionBadge = {
            LOGIN:'primary', CREATE:'success', UPDATE:'warning', DELETE:'danger',
            APPROVE:'success', REJECT:'danger', PAYMENT:'info',
            KYC_UPLOAD:'info', LOGOUT:'secondary'
        };
        if (!logs.length) {
            $('#activityTableBody').html('<tr><td colspan="4" class="text-center text-secondary py-3">No activity yet.</td></tr>');
            return;
        }
        $('#activityTableBody').html(logs.map(log => `
            <tr>
                <td class="fw-semibold small">${log.userName}</td>
                <td><span class="badge text-bg-${actionBadge[log.action] || 'secondary'}">${log.action}</span></td>
                <td><span class="text-secondary small">${log.module}</span></td>
                <td><span class="text-secondary small">${FinOpsUtils.timeAgo(log.timestamp)}</span></td>
            </tr>`).join(''));
    }

    window.addEventListener('themeChanged', () => renderCharts(FinOpsStorage.getLoans()));
    load();
});
