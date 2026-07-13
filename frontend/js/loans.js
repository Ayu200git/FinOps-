/**
 * loans.js — FinOps Portal
 */
$(document).ready(function () {
    FinOpsUtils.renderShell('loans');
    const modal = new bootstrap.Modal('#loanModal');
    let currentPage = 1;
    const PER_PAGE  = 10;

    /* ── Live EMI Calculator ── */
    function recalc() {
        const amt  = parseFloat($('#lAmount').val()) || 0;
        const rate = parseFloat($('#lRate').val())   || 0;
        const dur  = parseInt($('#lDuration').val())  || 12;
        if (amt > 0 && rate > 0) {
            const emi   = parseFloat(FinOpsStorage.calculateEMI(amt, rate, dur));
            const total = emi * dur;
            $('#emiDisplay').text(FinOpsUtils.formatCurrency(emi));
            $('#emiTotal').text(FinOpsUtils.formatCurrency(total));
            $('#emiInterest').text(FinOpsUtils.formatCurrency(total - amt));
        } else {
            $('#emiDisplay').text('₹0.00');
            $('#emiTotal').text('₹0.00');
            $('#emiInterest').text('₹0.00');
        }
        $('#emiDuration').text(dur + ' Months');
    }
    $('#lAmount, #lRate, #lDuration').on('input change', recalc);

    /* ── Populate Customer Dropdown ── */
    function loadCustomerDropdown() {
        const custs = FinOpsStorage.getCustomers().filter(c => c.status === 'Active');
        if (!custs.length) { $('#lCustomer').html('<option value="">No active customers</option>'); return; }
        $('#lCustomer').html('<option value="">— Select Customer —</option>' + custs.map(c => `<option value="${c.id}">${c.name} (${c.id})</option>`).join(''));
    }

    /* ── Render Table ── */
    function render() {
        const q      = $('#loanSearch').val().toLowerCase().trim();
        const status = $('#loanStatusFilter').val();
        const type   = $('#loanTypeFilter').val();

        let list = FinOpsStorage.getLoans().filter(l => {
            const matchQ = !q || [l.id, l.customerName, l.customerId].some(f => f && f.toLowerCase().includes(q));
            return matchQ && (!status || l.status === status) && (!type || l.loanType === type);
        });

        $('#loanCount').text(list.length);
        const { data, total } = FinOpsUtils.paginate(list, currentPage, PER_PAGE);

        if (!data.length) { $('#loanTableBody').html('<tr><td colspan="9" class="text-center py-4 text-secondary">No loans match your filters.</td></tr>'); }
        else {
            $('#loanTableBody').html(data.map(l => {
                const pct = l.durationMonths ? Math.round(l.paymentsMade / l.durationMonths * 100) : 0;
                const progressHtml = (l.status === 'Approved' || l.status === 'Paid') ? `
                    <div class="fs-8 text-secondary mb-1">${pct}% (${l.paymentsMade}/${l.durationMonths})</div>
                    <div class="loan-progress" style="width:120px"><div class="bar" style="width:${pct}%"></div></div>` : '—';

                // Role-based actions
                const session = FinOpsStorage.getSession();
                const canApprove = session && (session.role === 'Admin' || session.role === 'Manager');
                let actions = '';
                if (l.status === 'Pending' || l.status === 'Under Review') {
                    if (canApprove) actions += `<button class="btn btn-success action-sm me-1 btn-approve" data-id="${l.id}"><i class="fa-solid fa-check me-1"></i>Approve</button><button class="btn btn-danger action-sm btn-reject" data-id="${l.id}"><i class="fa-solid fa-xmark me-1"></i>Reject</button>`;
                    else actions = `<span class="text-secondary fs-8">Awaiting Manager</span>`;
                } else if (l.status === 'Approved') {
                    actions = `<button class="btn btn-primary action-sm btn-pay" data-id="${l.id}"><i class="fa-solid fa-money-bill-wave me-1"></i>Pay EMI</button>`;
                } else {
                    actions = `<span class="text-secondary fs-8">No actions</span>`;
                }

                return `<tr>
                    <td><span class="fw-600 fs-8" style="color:var(--text-primary);">${l.id}</span></td>
                    <td><div class="fs-7 fw-600" style="color:var(--text-primary);">${l.customerName}</div><div class="fs-8 text-secondary">${l.customerId}</div></td>
                    <td><span class="badge bg-info-soft">${l.loanType}</span></td>
                    <td class="fw-600" style="color:var(--text-primary);">${FinOpsUtils.formatCurrency(l.amount)}</td>
                    <td class="fs-8 text-secondary">${l.interestRate}% / ${l.durationMonths}m</td>
                    <td class="fw-600" style="color:var(--primary);">${FinOpsUtils.formatCurrency(l.monthlyInstallment)}</td>
                    <td>${progressHtml}</td>
                    <td>${FinOpsUtils.loanStatusBadge(l.status)}</td>
                    <td class="text-end">${actions}</td>
                </tr>`;
            }).join(''));
        }
        FinOpsUtils.renderPagination('loanPagination', { page: currentPage, total }, p => { currentPage = p; render(); });
    }

    /* ── Filters ── */
    $('#loanSearch, #loanStatusFilter, #loanTypeFilter').on('input change', () => { currentPage = 1; render(); });

    /* ── New Loan Button ── */
    $('#btnNewLoan').on('click', () => {
        loadCustomerDropdown();
        $('#loanForm')[0].reset();
        const s = FinOpsStorage.getSettings();
        $('#lRate').val(s.interestRate || 8.5);
        recalc();
        modal.show();
    });

    /* ── Actions ── */
    $(document).on('click', '.btn-approve', function () {
        const id = $(this).data('id');
        if (!confirm(`Approve loan ${id}? Funds will be disbursed to customer account.`)) return;
        FinOpsStorage.updateLoanStatus(id, 'Approved');
        FinOpsUtils.showAlert(`Loan ${id} approved and disbursed.`, 'success');
        render();
    });

    $(document).on('click', '.btn-reject', function () {
        const id = $(this).data('id');
        if (!confirm(`Reject loan ${id}?`)) return;
        FinOpsStorage.updateLoanStatus(id, 'Rejected');
        FinOpsUtils.showAlert(`Loan ${id} rejected.`, 'warning');
        render();
    });

    $(document).on('click', '.btn-pay', function () {
        const id  = $(this).data('id');
        const res = FinOpsStorage.payInstallment(id);
        if (res.success) {
            const msg = res.loan.status === 'Paid' ? `Loan ${id} is now FULLY PAID OFF! 🎉` : `EMI recorded for ${id}. Remaining: ${FinOpsUtils.formatCurrency(res.loan.remainingAmount)}`;
            FinOpsUtils.showAlert(msg, 'success');
            render();
        } else {
            FinOpsUtils.showAlert(res.message, 'error');
        }
    });

    /* ── Form Submit ── */
    $('#loanForm').on('submit', function (e) {
        e.preventDefault();
        const custId = $('#lCustomer').val();
        const amt    = parseFloat($('#lAmount').val()) || 0;
        const rate   = parseFloat($('#lRate').val())   || 0;
        if (!custId) { FinOpsUtils.showAlert('Select a customer.', 'warning'); return; }
        if (amt < 10000) { FinOpsUtils.showAlert('Minimum loan amount is ₹10,000.', 'warning'); return; }
        if (rate <= 0)   { FinOpsUtils.showAlert('Interest rate must be positive.', 'warning'); return; }

        const loan = FinOpsStorage.addLoan({ customerId: custId, loanType: $('#lType').val(), purpose: $('#lPurpose').val(), amount: amt, interestRate: rate, durationMonths: parseInt($('#lDuration').val()) });
        if (loan) { FinOpsUtils.showAlert(`Loan ${loan.id} filed. Awaiting approval.`, 'success'); modal.hide(); render(); }
        else { FinOpsUtils.showAlert('Failed to file application.', 'error'); }
    });

    if (new URLSearchParams(window.location.search).get('action') === 'new') $('#btnNewLoan').click();
    render();
});
