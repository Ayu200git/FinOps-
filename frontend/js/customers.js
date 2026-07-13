/**
 * customers.js — Bootstrap-native rendering
 */
$(document).ready(function () {
    FinOpsUtils.renderShell('customers');
    const modal = new bootstrap.Modal('#custModal');
    let currentPage = 1;
    const PER_PAGE  = 10;

    function render() {
        const q      = $('#custSearch').val().toLowerCase().trim();
        const status = $('#custStatusFilter').val();
        const kyc    = $('#custKycFilter').val();

        let list = FinOpsStorage.getCustomers().filter(c => {
            const matchQ = !q || [c.id, c.name, c.email, c.phone, c.city].some(f => f && f.toLowerCase().includes(q));
            return matchQ && (!status || c.status === status) && (!kyc || c.kycStatus === kyc);
        });

        $('#custCount').text(list.length);
        const { data, total } = FinOpsUtils.paginate(list, currentPage, PER_PAGE);

        if (!data.length) {
            $('#custTableBody').html('<tr><td colspan="9" class="text-center text-secondary py-4">No customers match your filters.</td></tr>');
        } else {
            $('#custTableBody').html(data.map(c => {
                const initials = c.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                const statusBadge = c.status === 'Active' ? 'text-bg-success' : 'text-bg-danger';
                return `<tr>
                    <td class="small fw-semibold">${c.id}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="bg-primary bg-opacity-10 text-primary rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                 style="width:30px;height:30px;font-size:0.7rem;">${initials}</div>
                            <div>
                                <div class="fw-semibold small">${c.name}</div>
                                <div class="text-secondary" style="font-size:0.72rem;">${c.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="small">${c.city || '—'}</td>
                    <td>${FinOpsUtils.creditScoreBadge(c.creditScore)}</td>
                    <td>${FinOpsUtils.kycBadge(c.kycStatus)}</td>
                    <td><span class="badge ${statusBadge}">${c.status}</span></td>
                    <td class="small fw-semibold">${FinOpsUtils.formatCurrency(c.balance)}</td>
                    <td class="small text-secondary">${FinOpsUtils.formatDate(c.joinedDate)}</td>
                    <td class="text-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary btn-view" data-id="${c.id}" title="View"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn btn-outline-secondary btn-edit" data-id="${c.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-outline-danger btn-del" data-id="${c.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
            }).join(''));
        }
        FinOpsUtils.renderPagination('custPagination', { page: currentPage, total }, p => { currentPage = p; render(); });
    }

    $('#custSearch, #custStatusFilter, #custKycFilter').on('input change', () => { currentPage = 1; render(); });

    $('#btnNewCustomer').on('click', () => {
        $('#custForm')[0].reset(); $('#editCustId').val('');
        $('#custModalTitle').text('New Customer');
        modal.show();
    });

    $(document).on('click', '.btn-edit', function () {
        const c = FinOpsStorage.getCustomer($(this).data('id'));
        if (!c) return;
        $('#editCustId').val(c.id); $('#custModalTitle').text('Edit — ' + c.id);
        $('#fName').val(c.name); $('#fEmail').val(c.email); $('#fPhone').val(c.phone);
        $('#fDob').val(c.dob); $('#fAddress').val(c.address); $('#fCity').val(c.city);
        $('#fPincode').val(c.pincode); $('#fCreditScore').val(c.creditScore);
        $('#fBalance').val(c.balance); $('#fStatus').val(c.status); $('#fKycStatus').val(c.kycStatus);
        modal.show();
    });

    $(document).on('click', '.btn-del', function () {
        const id = $(this).data('id');
        const c  = FinOpsStorage.getCustomer(id);
        if (!c || !confirm(`Delete ${c.name} (${c.id})?\nLinked loans and KYC records will also be removed.`)) return;
        FinOpsStorage.deleteCustomer(id);
        FinOpsUtils.showAlert(`Customer ${c.name} deleted.`, 'success');
        render();
    });

    $('#custForm').on('submit', function (e) {
        e.preventDefault();
        const id   = $('#editCustId').val();
        const data = {
            name: $('#fName').val().trim(), email: $('#fEmail').val().trim(), phone: $('#fPhone').val().trim(),
            dob: $('#fDob').val(), address: $('#fAddress').val().trim(), city: $('#fCity').val().trim(),
            pincode: $('#fPincode').val().trim(), creditScore: parseInt($('#fCreditScore').val()) || 0,
            balance: parseFloat($('#fBalance').val()) || 0,
            status: $('#fStatus').val(), kycStatus: $('#fKycStatus').val()
        };
        if (!data.name || !data.email || !data.phone) { FinOpsUtils.showAlert('Name, Email, Phone are required.', 'warning'); return; }
        if (id) { FinOpsStorage.updateCustomer(id, data); FinOpsUtils.showAlert(`${id} updated.`, 'success'); }
        else    { const nc = FinOpsStorage.addCustomer(data); FinOpsUtils.showAlert(`${nc.id} created.`, 'success'); }
        modal.hide(); render();
    });

    /* ── Detail Panel ── */
    $(document).on('click', '.btn-view', function () {
        const c     = FinOpsStorage.getCustomer($(this).data('id'));
        if (!c) return;
        const loans   = FinOpsStorage.getLoans().filter(l => l.customerId === c.id);
        const kycDocs = FinOpsStorage.getKYCForCustomer(c.id);
        const initials = c.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

        const loansHtml = loans.length ? loans.map(l => {
            const pct = l.durationMonths ? Math.round(l.paymentsMade / l.durationMonths * 100) : 0;
            return `<div class="card border-0 bg-body-secondary mb-2">
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="small fw-semibold">${l.id}</span>
                        ${FinOpsUtils.loanStatusBadge(l.status)}
                    </div>
                    <div class="d-flex justify-content-between text-secondary" style="font-size:0.75rem;">
                        <span>${FinOpsUtils.formatCurrency(l.amount)} · ${l.loanType}</span>
                        <span>${l.interestRate}% · ${l.durationMonths}m</span>
                    </div>
                    ${l.status==='Approved'||l.status==='Paid' ? `
                    <div class="mt-2">
                        <div class="d-flex justify-content-between" style="font-size:0.7rem;"><span class="text-secondary">${pct}% repaid</span><span>${FinOpsUtils.formatCurrency(l.remainingAmount)} left</span></div>
                        <div class="progress progress-thin mt-1"><div class="progress-bar" style="width:${pct}%"></div></div>
                    </div>` : ''}
                </div>
            </div>`;
        }).join('') : '<p class="text-secondary small text-center py-2">No loans on record.</p>';

        const kycHtml = kycDocs.length ? kycDocs.map(k => `
            <div class="d-flex justify-content-between align-items-center p-2 rounded border mb-1" style="font-size:0.8rem;">
                <div><div class="fw-semibold">${k.documentType}</div><div class="text-secondary">${k.documentNumber||'—'}</div></div>
                ${FinOpsUtils.kycBadge(k.status)}
            </div>`).join('') : '<p class="text-secondary small text-center py-2">No KYC documents.</p>';

        $('#custDetailBody').html(`
            <div class="text-center mb-3">
                <div class="bg-primary bg-opacity-10 text-primary fw-bold rounded-3 d-inline-flex align-items-center justify-content-center mb-2"
                     style="width:56px;height:56px;font-size:1.4rem;">${initials}</div>
                <h6 class="mb-0">${c.name}</h6>
                <div class="text-secondary small">${c.email}</div>
                <div class="text-secondary small">${c.phone}</div>
                <div class="mt-2 d-flex gap-2 justify-content-center">${FinOpsUtils.kycBadge(c.kycStatus)} <span class="badge ${c.status==='Active'?'text-bg-success':'text-bg-danger'}">${c.status}</span></div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-6"><div class="card border-0 bg-body-secondary text-center p-2"><small class="text-secondary">Balance</small><div class="fw-bold small">${FinOpsUtils.formatCurrency(c.balance)}</div></div></div>
                <div class="col-6"><div class="card border-0 bg-body-secondary text-center p-2"><small class="text-secondary">Credit Score</small><div class="fw-bold small">${c.creditScore||'N/A'}</div></div></div>
                <div class="col-6"><div class="card border-0 bg-body-secondary text-center p-2"><small class="text-secondary">City</small><div class="fw-bold small">${c.city||'—'}</div></div></div>
                <div class="col-6"><div class="card border-0 bg-body-secondary text-center p-2"><small class="text-secondary">Joined</small><div class="fw-bold small">${FinOpsUtils.formatDate(c.joinedDate)}</div></div></div>
            </div>
            <p class="small fw-semibold text-secondary text-uppercase mb-2" style="letter-spacing:0.5px;">Loans (${loans.length})</p>
            ${loansHtml}
            <p class="small fw-semibold text-secondary text-uppercase mt-3 mb-2" style="letter-spacing:0.5px;">KYC Documents (${kycDocs.length})</p>
            ${kycHtml}
        `);
        $('#custDetailPanel').addClass('open');
        $('#panelOverlay').addClass('open');
    });

    function closePanel() { $('#custDetailPanel').removeClass('open'); $('#panelOverlay').removeClass('open'); }
    $('#closePanelBtn, #panelOverlay').on('click', closePanel);

    if (new URLSearchParams(window.location.search).get('action') === 'new') $('#btnNewCustomer').click();
    render();
});
