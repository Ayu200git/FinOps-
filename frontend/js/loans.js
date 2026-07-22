 
$(document).ready(function () {

    FinOpsUtils.renderShell('loans');

    const loanModal   = new bootstrap.Modal('#loanModal');
    const detailPanel = new bootstrap.Offcanvas('#loanDetailCanvas');

    let currentPage = 1;
    const PER_PAGE  = 5;    

    /* ════════════════ STATUS BADGE   ════════════════ */
    function loanBadge(status) {
        const map = {
            Pending: 'warning', 'Under Review': 'primary', Approved: 'success',
            Disbursed: 'info', Rejected: 'danger', Closed: 'dark', Paid: 'secondary'
        };
        return `<span class="badge text-bg-${map[status] || 'secondary'}">${status}</span>`;
    }

    /* ════════════════ LIVE EMI CALCULATOR ════════════════ */
    function recalc() {
        const amt  = parseFloat($('#lAmount').val()) || 0;
        const rate = parseFloat($('#lRate').val())   || 0;
        const dur  = parseInt($('#lDuration').val()) || 12;
        if (amt > 0 && rate > 0) {
            const emi   = parseFloat(FinOpsStorage.calculateEMI(amt, rate, dur));
            const total = emi * dur;
            $('#emiDisplay').text(FinOpsUtils.formatCurrency(emi));
            $('#emiTotal').text(FinOpsUtils.formatCurrency(total));
            $('#emiInterest').text(FinOpsUtils.formatCurrency(total - amt));
        } else {
            $('#emiDisplay, #emiTotal, #emiInterest').text('₹0.00');
        }
        $('#emiDuration').text(dur + ' Months');
    }
    $('#lAmount, #lRate, #lDuration').on('input change', recalc);

    /* ════════════════ DYNAMIC FORM (show fields by loan type) ════════════════ */
    function updateTypeFields() {
        const type = $('#lType').val();
        $('.type-fields').addClass('d-none');
        $(`.type-fields[data-type="${type}"]`).removeClass('d-none');
    }
    $('#lType').on('change', updateTypeFields);

    // Collect the visible type-specific fields into a plain object
    function buildDetails(type) {
        switch (type) {
            case 'Personal':  return { employer: $('#lEmployer').val().trim() };
            case 'Home':      return { propertyValue: parseFloat($('#lPropValue').val()) || 0, downPayment: parseFloat($('#lDownPayment').val()) || 0, propertyAddress: $('#lPropAddress').val().trim() };
            case 'Car':       return { carModel: $('#lCarModel').val().trim(), onRoadPrice: parseFloat($('#lOnRoadPrice').val()) || 0, dealer: $('#lDealer').val().trim() };
            case 'Education': return { college: $('#lCollege').val().trim(), course: $('#lCourse').val().trim(), courseDuration: $('#lCourseDuration').val().trim() };
            case 'Business':  return { businessName: $('#lBizName').val().trim(), annualTurnover: parseFloat($('#lTurnover').val()) || 0, gst: $('#lGst').val().trim() };
            case 'Gold':      return { goldWeight: parseFloat($('#lGoldWeight').val()) || 0, purity: $('#lGoldPurity').val(), item: $('#lGoldItem').val().trim() };
            default:          return {};
        }
    }

    // Pretty labels for showing details in the offcanvas
    const detailLabels = {
        employer: 'Employer', propertyValue: 'Property Value', downPayment: 'Down Payment',
        propertyAddress: 'Property Address', carModel: 'Car Model', onRoadPrice: 'On-road Price',
        dealer: 'Dealer', college: 'College', course: 'Course', courseDuration: 'Course Duration',
        businessName: 'Business Name', annualTurnover: 'Annual Turnover', gst: 'GST Number',
        goldWeight: 'Gold Weight (g)', purity: 'Purity', item: 'Item'
    };

    /* ════════════════ CUSTOMER DROPDOWN + AUTO-FILL ════════════════ */
    function loadCustomerDropdown() {
        const custs = FinOpsStorage.getCustomers().filter(c => c.status === 'Active');
        if (!custs.length) {
            $('#lCustomer').html('<option value="">No active customers</option>');
            return;
        }
        $('#lCustomer').html('<option value="">— Select Customer —</option>' +
            custs.map(c => `<option value="${c.id}">${c.name} (${c.id})</option>`).join(''));
    }

    $('#lCustomer').on('change', function () {
        const c = FinOpsStorage.getCustomer($(this).val());
        if (!c) { $('#lCustInfo').addClass('d-none'); return; }
        $('#lciEmail').text(c.email);
        $('#lciPhone').text(c.phone);
        $('#lciCredit').html(FinOpsUtils.creditScoreBadge(c.creditScore));
        $('#lciStatus').html(`<span class="badge ${c.status === 'Active' ? 'text-bg-success' : 'text-bg-danger'}">${c.status}</span>`);
        $('#lCustInfo').removeClass('d-none');
        $(this).removeClass('is-invalid');
    });

    /* ════════════════ RENDER TABLE ════════════════ */
    function render() {
        const q      = $('#loanSearch').val().toLowerCase().trim();
        const status = $('#loanStatusFilter').val();
        const type   = $('#loanTypeFilter').val();

        const list = FinOpsStorage.getLoans().filter(l => {
            const matchQ = !q || [l.id, l.customerName, l.customerId].some(f => f && f.toLowerCase().includes(q));
            return matchQ && (!status || l.status === status) && (!type || l.loanType === type);
        });

        $('#loanCount').text(list.length);
        const { data, total } = FinOpsUtils.paginate(list, currentPage, PER_PAGE);

        if (!data.length) {
            $('#loanTableBody').html(
                '<tr><td colspan="8" class="text-center text-secondary py-5">' +
                '<i class="fa-solid fa-inbox fs-3 d-block mb-2 opacity-50"></i>' +
                'No loans match your filters.</td></tr>'
            );
        } else {
            const session    = FinOpsStorage.getSession();
            const canApprove = session && (session.role === 'Admin' || session.role === 'Manager');

            $('#loanTableBody').html(data.map(l => {
                 
                let actions = `<button class="btn btn-outline-secondary btn-view" data-id="${l.id}" title="View"><i class="fa-solid fa-eye"></i></button>`;
                if (l.status === 'Pending' || l.status === 'Under Review') {
                    if (canApprove) {
                        actions += `
                            <button class="btn btn-outline-success btn-approve" data-id="${l.id}" title="Approve"><i class="fa-solid fa-check"></i></button>
                            <button class="btn btn-outline-danger btn-reject" data-id="${l.id}" title="Reject"><i class="fa-solid fa-xmark"></i></button>`;
                    }
                } else if (l.status === 'Approved') {
                    actions += `<button class="btn btn-outline-primary btn-pay" data-id="${l.id}" title="Pay EMI"><i class="fa-solid fa-money-bill-wave"></i></button>`;
                }

                return `<tr>
                    <td class="ps-3 small fw-semibold text-secondary">${l.id}</td>
                    <td>
                        <div class="lh-sm">
                            <div class="fw-semibold small">${l.customerName}</div>
                            <div class="text-secondary" style="font-size:.75rem;">${l.customerId}</div>
                        </div>
                    </td>
                    <td><span class="badge rounded-pill text-bg-light border">${l.loanType}</span></td>
                    <td class="text-end small fw-semibold">${FinOpsUtils.formatCurrency(l.amount)}</td>
                    <td class="text-end small fw-semibold text-primary">${FinOpsUtils.formatCurrency(l.monthlyInstallment)}</td>
                    <td>${loanBadge(l.status)}</td>
                    <td class="small text-secondary">${FinOpsUtils.formatDate(l.startDate)}</td>
                    <td class="text-end pe-3">
                        <div class="btn-group btn-group-sm">${actions}</div>
                    </td>
                </tr>`;
            }).join(''));
        }

        FinOpsUtils.renderPagination('loanPagination', { page: currentPage, total }, p => {
            currentPage = p;
            render();
        });
    }

    /* ════════════════ SEARCH + FILTERS ════════════════ */
    $('#loanSearch, #loanStatusFilter, #loanTypeFilter').on('input change', function () {
        currentPage = 1;
        render();
    });

    /* ════════════════ NEW APPLICATION (open modal) ════════════════ */
    $('#btnNewLoan').on('click', function () {
        loadCustomerDropdown();
        $('#loanForm')[0].reset();
        $('#loanForm .is-invalid').removeClass('is-invalid');
        $('#lCustInfo').addClass('d-none');
        $('#lRate').val(FinOpsStorage.getSettings().interestRate || 8.5);
        updateTypeFields();
        recalc();
        loanModal.show();
    });

    /* ════════════════ SAVE (submit → localStorage → refresh) ════════════════ */
    $('#loanForm').on('submit', function (e) {
        e.preventDefault();

        const custId = $('#lCustomer').val();
        const amt    = parseFloat($('#lAmount').val()) || 0;
        const rate   = parseFloat($('#lRate').val())   || 0;
        const type   = $('#lType').val();

        $('#lCustomer').toggleClass('is-invalid', !custId);
        $('#lAmount').toggleClass('is-invalid', amt < 10000);
        $('#lRate').toggleClass('is-invalid', rate <= 0);
        if (!custId || amt < 10000 || rate <= 0) {
            FinOpsUtils.showAlert('Please fix the highlighted fields.', 'warning');
            return;
        }

        const loan = FinOpsStorage.addLoan({
            customerId:     custId,
            loanType:       type,
            purpose:        $('#lPurpose').val().trim(),
            amount:         amt,
            interestRate:   rate,
            durationMonths: parseInt($('#lDuration').val()),
            monthlyIncome:  parseFloat($('#lIncome').val())      || 0,
            existingEMI:    parseFloat($('#lExistingEmi').val()) || 0,
            status:         $('#lStatus').val(),
            details:        buildDetails(type)
        });

        if (loan) {
            const note = loan.status === 'Pending' ? 'Awaiting approval.' : `Status: ${loan.status}.`;
            FinOpsUtils.showAlert(`Loan ${loan.id} filed. ${note}`, 'success');
            loanModal.hide();
            render();
        } else {
            FinOpsUtils.showAlert('Failed to file application.', 'error');
        }
    });

    /* ════════════════ ACTIONS: Approve / Reject / Pay ════════════════ */
    $(document).on('click', '.btn-approve', function () {
        const id = $(this).data('id');
        if (!confirm(`Approve loan ${id}? Funds will be disbursed to the customer account.`)) return;
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
        const res = FinOpsStorage.payInstallment($(this).data('id'));
        if (res.success) {
            const msg = res.loan.status === 'Paid'
                ? `Loan ${res.loan.id} is now fully paid off! 🎉`
                : `EMI recorded. Remaining: ${FinOpsUtils.formatCurrency(res.loan.remainingAmount)}`;
            FinOpsUtils.showAlert(msg, 'success');
            render();
        } else {
            FinOpsUtils.showAlert(res.message, 'error');
        }
    });

    /* ════════════════ VIEW DETAIL (offcanvas) ════════════════ */
    $(document).on('click', '.btn-view', function () {
        const l = FinOpsStorage.getLoan($(this).data('id'));
        if (!l) return;

        const pct     = l.durationMonths ? Math.round(l.paymentsMade / l.durationMonths * 100) : 0;
        const showBar = l.status === 'Approved' || l.status === 'Paid';
        const totalPayable = l.monthlyInstallment * l.durationMonths;

        // Dynamic type-specific rows
        let detailsRows = '';
        if (l.details && Object.keys(l.details).length) {
            detailsRows = Object.entries(l.details)
                .filter(([, v]) => v !== '' && v !== 0 && v != null)
                .map(([k, v]) => {
                    const val = typeof v === 'number' ? FinOpsUtils.formatCurrency(v) : v;
                    return statRow(detailLabels[k] || k, val);
                }).join('');
        }
        if (!detailsRows) detailsRows = '<p class="text-secondary small mb-0">No extra details captured.</p>';

        $('#loanDetailBody').html(`
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 class="mb-0">${l.id}</h6>
                    <div class="text-secondary small">${l.loanType} Loan</div>
                </div>
                ${loanBadge(l.status)}
            </div>

            <div class="border rounded-3 p-2 bg-body-tertiary mb-3">
                <div class="fw-semibold small">${l.customerName}</div>
                <div class="text-secondary" style="font-size:.75rem;">${l.customerId}</div>
            </div>

            <div class="row g-2 mb-3">
                ${statCard('Principal', FinOpsUtils.formatCurrency(l.amount))}
                ${statCard('Monthly EMI', FinOpsUtils.formatCurrency(l.monthlyInstallment))}
                ${statCard('Interest', l.interestRate + '%')}
                ${statCard('Tenure', l.durationMonths + ' months')}
                ${statCard('Total Payable', FinOpsUtils.formatCurrency(totalPayable))}
                ${statCard('Credit Score', l.creditScore || 'N/A')}
            </div>

            ${showBar ? `
            <div class="mb-3">
                <div class="d-flex justify-content-between small">
                    <span class="text-secondary">${pct}% repaid (${l.paymentsMade}/${l.durationMonths})</span>
                    <span>${FinOpsUtils.formatCurrency(l.remainingAmount)} left</span>
                </div>
                <div class="progress mt-1" style="height:6px;"><div class="progress-bar" style="width:${pct}%"></div></div>
            </div>` : ''}

            <p class="small fw-semibold text-secondary text-uppercase mb-2" style="letter-spacing:.5px;">Financial</p>
            ${statRow('Monthly Income', l.monthlyIncome ? FinOpsUtils.formatCurrency(l.monthlyIncome) : '—')}
            ${statRow('Existing EMI', l.existingEMI ? FinOpsUtils.formatCurrency(l.existingEMI) : '—')}
            ${statRow('Purpose', l.purpose || '—')}

            <p class="small fw-semibold text-secondary text-uppercase mt-3 mb-2" style="letter-spacing:.5px;">${l.loanType} Details</p>
            ${detailsRows}

            <p class="small fw-semibold text-secondary text-uppercase mt-3 mb-2" style="letter-spacing:.5px;">Dates</p>
            ${statRow('Application Date', FinOpsUtils.formatDate(l.startDate))}
        `);

        detailPanel.show();
    });

    /* ════════════════ HELPERS ════════════════ */
    function statCard(label, value) {
        return `
            <div class="col-6">
                <div class="border rounded-3 text-center p-2">
                    <small class="text-secondary d-block">${label}</small>
                    <div class="fw-bold small">${value}</div>
                </div>
            </div>`;
    }
    function statRow(label, value) {
        return `
            <div class="d-flex justify-content-between border-bottom py-1 small">
                <span class="text-secondary">${label}</span>
                <span class="fw-semibold text-end">${value}</span>
            </div>`;
    }
 
    if (new URLSearchParams(window.location.search).get('action') === 'new') {
        $('#btnNewLoan').trigger('click');
    }

    render();
});
