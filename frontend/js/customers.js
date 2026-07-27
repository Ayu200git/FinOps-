 
$(document).ready(function () {

     
    FinOpsUtils.renderShell('customers');

    
    const custModal   = new bootstrap.Modal('#custModal');
    const detailPanel = new bootstrap.Offcanvas('#custDetailCanvas');

    // ── Pagination  ──
    let currentPage = 1;
    const PER_PAGE  = 4;    

    /* ════════════════ RENDER TABLE ════════════════ */
    function render() {
        const q      = $('#custSearch').val().toLowerCase().trim();
        const status = $('#custStatusFilter').val();
        const kyc    = $('#custKycFilter').val();

        const list = FinOpsStorage.getCustomers().filter(c => {
            const matchQ = !q || [c.id, c.name, c.email, c.phone, c.city]
                .some(f => f && f.toLowerCase().includes(q));
            return matchQ && (!status || c.status === status) && (!kyc || c.kycStatus === kyc);
        });

        $('#custCount').text(list.length);

        const { data, total } = FinOpsUtils.paginate(list, currentPage, PER_PAGE);

        if (!data.length) {
            $('#custTableBody').html(
                '<tr><td colspan="9" class="text-center text-secondary py-5">' +
                '<i class="fa-solid fa-inbox fs-3 d-block mb-2 opacity-50"></i>' +
                'No customers match your filters.</td></tr>'
            );
        } else {
            const session  = FinOpsStorage.getSession();
            const userRole = session ? FinOpsUtils.getNormalizedRole(session.role) : 'Customer';
            const canDelete = (userRole === 'Admin');
            const canEdit = (userRole === 'Admin' || userRole === 'Relationship Manager');

            $('#custTableBody').html(data.map(c => {
                const initials    = getInitials(c.name);
                const statusBadge = c.status === 'Active' ? 'text-bg-success' : 'text-bg-danger';

                let actionBtns = `<button class="btn btn-outline-secondary btn-view" data-id="${c.id}" title="View Details"><i class="fa-solid fa-eye"></i></button>`;
                if (canEdit) {
                    actionBtns += `<button class="btn btn-outline-primary btn-edit" data-id="${c.id}" title="Edit Info"><i class="fa-solid fa-pen"></i></button>`;
                }
                if (canDelete) {
                    actionBtns += `<button class="btn btn-outline-danger btn-del" data-id="${c.id}" title="Delete Record"><i class="fa-solid fa-trash"></i></button>`;
                }

                return `
                <tr>
                    <td class="ps-3 small fw-semibold text-secondary">${c.id}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-semibold flex-shrink-0"
                                 style="width:38px;height:38px;font-size:.8rem;">${initials}</div>
                            <div class="lh-sm">
                                <div class="fw-semibold small">${c.name}</div>
                                <div class="text-secondary" style="font-size:.75rem;">${c.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="small">${c.city || '—'}</td>
                    <td>${FinOpsUtils.creditScoreBadge(c.creditScore)}</td>
                    <td>${FinOpsUtils.kycBadge(c.kycStatus)}</td>
                    <td><span class="badge ${statusBadge}">${c.status}</span></td>
                    <td class="text-end small fw-semibold">${FinOpsUtils.formatCurrency(c.balance)}</td>
                    <td class="small text-secondary">${FinOpsUtils.formatDate(c.joinedDate)}</td>
                    <td class="text-end pe-3">
                        <div class="btn-group btn-group-sm">
                            ${actionBtns}
                        </div>
                    </td>
                </tr>`;
            }).join(''));
        }

        FinOpsUtils.renderPagination('custPagination', { page: currentPage, total }, p => {
            currentPage = p;
            render();
        });
    }

     
    $('#custSearch, #custStatusFilter, #custKycFilter').on('input change', function () {
        currentPage = 1;
        render();
    });

    /* Add profile in new window modal*/
    $('#btnNewCustomer').on('click', function () {
        resetForm();
        $('#editCustId').val('');
        $('#custModalTitle').html('<i class="fa-solid fa-user-plus text-primary me-2"></i>New Customer');
        custModal.show();
    });

    /* ════════════════ EDIT  ════════════════ */
    $(document).on('click', '.btn-edit', function () {
        const c = FinOpsStorage.getCustomer($(this).data('id'));
        if (!c) return;

        const openModal = () => {
            resetForm();
            $('#editCustId').val(c.id);
            $('#custModalTitle').html(`<i class="fa-solid fa-user-pen text-primary me-2"></i>Edit — ${c.id}`);
            $('#fName').val(c.name);         $('#fEmail').val(c.email);       $('#fPhone').val(c.phone);
            $('#fDob').val(c.dob);           $('#fCity').val(c.city);         $('#fPincode').val(c.pincode);
            $('#fCreditScore').val(c.creditScore);  $('#fBalance').val(c.balance);
            $('#fStatus').val(c.status);     $('#fKycStatus').val(c.kycStatus);  $('#fAddress').val(c.address);
            custModal.show();
        };

        
        const canvasEl = document.getElementById('custDetailCanvas');
        if (canvasEl.classList.contains('show')) {
            canvasEl.addEventListener('hidden.bs.offcanvas', openModal, { once: true });
            detailPanel.hide();
        } else {
            openModal();
        }
    });

    /* ════════════════ SAVE  ════════════════ */
    $('#custForm').on('submit', function (e) {
        e.preventDefault();

        const name  = $('#fName').val().trim();
        const email = $('#fEmail').val().trim();
        const phone = $('#fPhone').val().trim();

         
        toggleInvalid('#fName',  !name);
        toggleInvalid('#fEmail', !email || !isValidEmail(email));
        toggleInvalid('#fPhone', !phone);
        if (!name || !email || !isValidEmail(email) || !phone) {
            FinOpsUtils.showAlert('Please fix the highlighted fields.', 'warning');
            return;
        }

        const data = {
            name, email, phone,
            dob:         $('#fDob').val(),
            city:        $('#fCity').val().trim(),
            pincode:     $('#fPincode').val().trim(),
            address:     $('#fAddress').val().trim(),
            creditScore: parseInt($('#fCreditScore').val()) || 0,
            balance:     parseFloat($('#fBalance').val())    || 0,
            status:      $('#fStatus').val(),
            kycStatus:   $('#fKycStatus').val()
        };

        const id = $('#editCustId').val();
        if (id) {
            FinOpsStorage.updateCustomer(id, data);
            FinOpsUtils.showAlert(`Customer ${id} updated.`, 'success');
        } else {
            const nc = FinOpsStorage.addCustomer(data);
            FinOpsUtils.showAlert(`Customer ${nc.id} created.`, 'success');
        }

        custModal.hide();
        render();
    });

    /* ════════════════ DELETE ════════════════ */
    $(document).on('click', '.btn-del', function () {
        const id = $(this).data('id');
        const c  = FinOpsStorage.getCustomer(id);
        if (!c) return;
        if (!confirm(`Delete ${c.name} (${c.id})?\nLinked loans and KYC records will also be removed.`)) return;
        FinOpsStorage.deleteCustomer(id);
        FinOpsUtils.showAlert(`Customer ${c.name} deleted.`, 'success');

         
        const remaining = FinOpsStorage.getCustomers().length;
        const maxPage   = Math.max(1, Math.ceil(remaining / PER_PAGE));
        if (currentPage > maxPage) currentPage = maxPage;
        render();
    });

    /* ════════════════ VIEW DETAIL ════════════════ */
    $(document).on('click', '.btn-view', function () {
        const c = FinOpsStorage.getCustomer($(this).data('id'));
        if (!c) return;

        const loans    = FinOpsStorage.getLoans().filter(l => l.customerId === c.id);
        const kycDocs  = FinOpsStorage.getKYCForCustomer(c.id);
        const initials = getInitials(c.name);

        const loansHtml = loans.length ? loans.map(l => {
            const pct = l.durationMonths ? Math.round(l.paymentsMade / l.durationMonths * 100) : 0;
            const showBar = l.status === 'Approved' || l.status === 'Paid';
            return `
            <div class="border rounded-3 p-2 mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="small fw-semibold">${l.id}</span>
                    ${FinOpsUtils.loanStatusBadge(l.status)}
                </div>
                <div class="d-flex justify-content-between text-secondary" style="font-size:.75rem;">
                    <span>${FinOpsUtils.formatCurrency(l.amount)} · ${l.loanType}</span>
                    <span>${l.interestRate}% · ${l.durationMonths}m</span>
                </div>
                ${showBar ? `
                <div class="mt-2">
                    <div class="d-flex justify-content-between" style="font-size:.7rem;">
                        <span class="text-secondary">${pct}% repaid</span>
                        <span>${FinOpsUtils.formatCurrency(l.remainingAmount)} left</span>
                    </div>
                    <div class="progress mt-1" style="height:5px;">
                        <div class="progress-bar" style="width:${pct}%"></div>
                    </div>
                </div>` : ''}
            </div>`;
        }).join('') : '<p class="text-secondary small text-center py-2 mb-0">No loans on record.</p>';

        const kycHtml = kycDocs.length ? kycDocs.map(k => `
            <div class="d-flex justify-content-between align-items-center border rounded-3 p-2 mb-1">
                <div class="lh-sm">
                    <div class="fw-semibold small">${k.documentType}</div>
                    <div class="text-secondary" style="font-size:.75rem;">${k.documentNumber || '—'}</div>
                </div>
                ${FinOpsUtils.kycBadge(k.status)}
            </div>`).join('') : '<p class="text-secondary small text-center py-2 mb-0">No KYC documents.</p>';

        $('#custDetailBody').html(`
            <div class="text-center mb-3">
                <div class="rounded-4 bg-primary-subtle text-primary fw-bold d-inline-flex align-items-center justify-content-center mb-2"
                     style="width:60px;height:60px;font-size:1.5rem;">${initials}</div>
                <h6 class="mb-0">${c.name}</h6>
                <div class="text-secondary small">${c.email}</div>
                <div class="text-secondary small">${c.phone}</div>
                <div class="mt-2 d-flex gap-2 justify-content-center">
                    ${FinOpsUtils.kycBadge(c.kycStatus)}
                    <span class="badge ${c.status === 'Active' ? 'text-bg-success' : 'text-bg-danger'}">${c.status}</span>
                </div>
            </div>

            <div class="row g-2 mb-3">
                ${detailStat('Balance', FinOpsUtils.formatCurrency(c.balance))}
                ${detailStat('Credit Score', c.creditScore || 'N/A')}
                ${detailStat('City', c.city || '—')}
                ${detailStat('Joined', FinOpsUtils.formatDate(c.joinedDate))}
            </div>

            <p class="small fw-semibold text-secondary text-uppercase mb-2" style="letter-spacing:.5px;">Loans (${loans.length})</p>
            ${loansHtml}

            <p class="small fw-semibold text-secondary text-uppercase mt-3 mb-2" style="letter-spacing:.5px;">KYC Documents (${kycDocs.length})</p>
            ${kycHtml}

            <button class="btn btn-outline-primary btn-sm w-100 mt-3 btn-edit" data-id="${c.id}">
                <i class="fa-solid fa-pen me-2"></i>Edit Customer
            </button>
        `);

        detailPanel.show();
    });

    /* ════════════════ HELPERS ════════════════ */
    function getInitials(name) {
        return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }

    function detailStat(label, value) {
        return `
            <div class="col-6">
                <div class="border rounded-3 text-center p-2">
                    <small class="text-secondary d-block">${label}</small>
                    <div class="fw-bold small">${value}</div>
                </div>
            </div>`;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function toggleInvalid(selector, isInvalid) {
        $(selector).toggleClass('is-invalid', isInvalid);
    }

    function resetForm() {
        $('#custForm')[0].reset();
        $('#custForm .is-invalid').removeClass('is-invalid');
    }

     
    $('#fName, #fEmail, #fPhone').on('input', function () {
        $(this).removeClass('is-invalid');
    });

    
    if (new URLSearchParams(window.location.search).get('action') === 'new') {
        $('#btnNewCustomer').trigger('click');
    }

    render();
});
