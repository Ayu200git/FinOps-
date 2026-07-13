/**
 * kyc.js — FinOps Portal
 * KYC Document management: list, upload, verify, reject.
 */
$(document).ready(function () {
    FinOpsUtils.renderShell('kyc');
    const uploadModal = new bootstrap.Modal('#kycModal');
    const rejectModal = new bootstrap.Modal('#rejectModal');
    const docTypeIcons = { 'Aadhaar Card':'fa-id-card', 'PAN Card':'fa-credit-card', 'Passport':'fa-passport', 'Voter ID':'fa-vote-yea', 'Driving License':'fa-car', 'Bank Statement':'fa-file-invoice-dollar', 'Salary Slip':'fa-file-lines', 'default':'fa-file-alt' };
    const session = FinOpsStorage.getSession();
    const canVerify = session && (session.role === 'Admin' || session.role === 'Manager');

    /* ── Load Customer Dropdown ── */
    function loadCustomerDropdown() {
        const custs = FinOpsStorage.getCustomers();
        $('#kycCustomer').html('<option value="">— Select Customer —</option>' + custs.map(c => `<option value="${c.id}">${c.name} (${c.id})</option>`).join(''));
    }

    /* ── Render Grid ── */
    function render() {
        const q      = $('#kycSearch').val().toLowerCase().trim();
        const status = $('#kycStatusFilter').val();
        const type   = $('#kycTypeFilter').val();
        const custs  = {};
        FinOpsStorage.getCustomers().forEach(c => custs[c.id] = c);

        let docs = FinOpsStorage.getKYCDocs().filter(d => {
            const cust = custs[d.customerId];
            const name = cust ? cust.name.toLowerCase() : '';
            const matchQ = !q || name.includes(q) || d.customerId.toLowerCase().includes(q) || d.documentType.toLowerCase().includes(q);
            return matchQ && (!status || d.status === status) && (!type || d.documentType === type);
        });

        // Stats
        const all     = FinOpsStorage.getKYCDocs();
        $('#statTotal').text(all.length);
        $('#statVerified').text(all.filter(d=>d.status==='Verified').length);
        $('#statPending').text(all.filter(d=>d.status==='Pending').length);
        $('#statRejected').text(all.filter(d=>d.status==='Rejected').length);

        if (!docs.length) {
            $('#kycGrid').html('<div class="col-12 text-center text-secondary py-5">No documents match your filters.</div>');
            return;
        }

        const icon = t => docTypeIcons[t] || docTypeIcons.default;
        const statusColor = { Verified:'var(--success)', Pending:'var(--warning)', Rejected:'var(--danger)' };
        const statusSoftBg = { Verified:'var(--success-soft)', Pending:'var(--warning-soft)', Rejected:'var(--danger-soft)' };

        $('#kycGrid').html(docs.map(d => {
            const cust = custs[d.customerId];
            const custName = cust ? cust.name : d.customerId;
            let actions = '';
            if (d.status === 'Pending' && canVerify) {
                actions = `
                    <button class="btn btn-success btn-sm action-sm me-1 btn-verify" data-id="${d.id}"><i class="fa-solid fa-check me-1"></i>Verify</button>
                    <button class="btn btn-danger btn-sm action-sm btn-reject-doc" data-id="${d.id}"><i class="fa-solid fa-xmark me-1"></i>Reject</button>`;
            } else if (d.status === 'Pending') {
                actions = `<span class="text-secondary fs-8">Awaiting manager review</span>`;
            } else {
                actions = `<button class="btn btn-secondary btn-sm action-sm btn-del-doc" data-id="${d.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>`;
            }

            return `<div class="col-md-6 col-xl-4">
                <div class="kyc-card">
                    <div class="kyc-card-header">
                        <div class="d-flex align-items-center gap-2">
                            <div class="doc-icon" style="background:${statusSoftBg[d.status]};color:${statusColor[d.status]};">
                                <i class="fa-solid ${icon(d.documentType)}"></i>
                            </div>
                            <div>
                                <div class="fw-600 fs-7" style="color:var(--text-primary);">${d.documentType}</div>
                                <div class="fs-8 text-secondary">${d.documentNumber || 'No number'}</div>
                            </div>
                        </div>
                        ${FinOpsUtils.kycBadge(d.status)}
                    </div>
                    <div class="kyc-card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <div class="fs-8 text-secondary">Customer</div>
                            <div class="fs-8 fw-600" style="color:var(--text-primary);">${custName}</div>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <div class="fs-8 text-secondary">Uploaded</div>
                            <div class="fs-8">${FinOpsUtils.formatDate(d.uploadDate)}</div>
                        </div>
                        ${d.verifiedDate ? `<div class="d-flex justify-content-between mb-2"><div class="fs-8 text-secondary">Reviewed</div><div class="fs-8">${FinOpsUtils.formatDate(d.verifiedDate)}</div></div>` : ''}
                        ${d.remarks ? `<div class="mt-2 p-2 rounded fs-8 text-secondary" style="background:var(--danger-soft);border-radius:6px;"><i class="fa-solid fa-circle-exclamation me-1" style="color:var(--danger);"></i>${d.remarks}</div>` : ''}
                        <div class="mt-3 d-flex justify-content-between align-items-center">
                            <a href="${d.fileUrl||'#'}" target="_blank" class="btn btn-secondary btn-sm action-sm"><i class="fa-solid fa-eye me-1"></i>Preview</a>
                            <div>${actions}</div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join(''));
    }

    /* ── Filters ── */
    $('#kycSearch, #kycStatusFilter, #kycTypeFilter').on('input change', render);

    /* ── Upload Button ── */
    $('#btnUploadKyc').on('click', () => { loadCustomerDropdown(); $('#kycForm')[0].reset(); uploadModal.show(); });

    /* ── File area click ── */
    $(document).on('click', '.upload-area', () => $('#kycFile').click());

    /* ── Upload Submit ── */
    $('#kycForm').on('submit', function (e) {
        e.preventDefault();
        const custId = $('#kycCustomer').val();
        const type   = $('#kycDocType').val();
        if (!custId || !type) { FinOpsUtils.showAlert('Select customer and document type.', 'warning'); return; }
        const doc = FinOpsStorage.addKYCDoc({ customerId: custId, documentType: type, documentNumber: $('#kycDocNum').val().trim(), fileUrl: 'assets/documents/sample_doc.pdf' });
        FinOpsUtils.showAlert(`Document ${doc.id} uploaded and pending verification.`, 'success');
        uploadModal.hide();
        render();
    });

    /* ── Verify ── */
    $(document).on('click', '.btn-verify', function () {
        const id = $(this).data('id');
        if (!confirm(`Mark document ${id} as Verified?`)) return;
        FinOpsStorage.updateKYCStatus(id, 'Verified');
        FinOpsUtils.showAlert(`Document ${id} verified successfully.`, 'success');
        render();
    });

    /* ── Reject (open remarks modal) ── */
    $(document).on('click', '.btn-reject-doc', function () {
        $('#rejectDocId').val($(this).data('id'));
        $('#rejectRemarks').val('');
        rejectModal.show();
    });

    $('#btnConfirmReject').on('click', function () {
        const id      = $('#rejectDocId').val();
        const remarks = $('#rejectRemarks').val().trim();
        if (!remarks) { FinOpsUtils.showAlert('Please enter a rejection reason.', 'warning'); return; }
        FinOpsStorage.updateKYCStatus(id, 'Rejected', remarks);
        FinOpsUtils.showAlert(`Document ${id} rejected.`, 'warning');
        rejectModal.hide();
        render();
    });

    /* ── Delete ── */
    $(document).on('click', '.btn-del-doc', function () {
        if (!confirm('Delete this KYC document?')) return;
        FinOpsStorage.deleteKYCDoc($(this).data('id'));
        FinOpsUtils.showAlert('Document deleted.', 'success');
        render();
    });

    render();
});
