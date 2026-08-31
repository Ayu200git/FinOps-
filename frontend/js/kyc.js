$(document).ready(function () {
  /*  STATE  */
  const DOC_TYPES = ["Aadhaar Card", "PAN Card", "Photo", "Salary Slip"];

  let allKycs = [];
  let custRows = [];
  let filtered = [];
  let currentPage = 1;
  const PER_PAGE = 10;

  const $uploadModal = new bootstrap.Modal("#uploadKycModal");
  const $viewModal = new bootstrap.Modal("#viewKycModal");
  const $rejectModal = new bootstrap.Modal("#rejectKycModal");

  /*  init() */
  function init() {
    FinOpsStorage.checkAuth();
    if (window.FinOpsUtils) {
      window.FinOpsUtils.renderShell("kyc");
    }
    loadKycs();
    renderKycs();
    updateStats();
    bindEvents();
    populateCustomerDropdown();
  }

  /* loadKycs() */
  function loadKycs() {
    allKycs = FinOpsStorage.getKYCDocs();

    const custMap = {};
    FinOpsStorage.getCustomers().forEach((c) => {
      custMap[c.id] = c;
    });

    const groups = {};
    allKycs.forEach((k) => {
      if (!groups[k.customerId]) {
        groups[k.customerId] = {
          customerId: k.customerId,
          cust: custMap[k.customerId] || { name: k.customerId, email: "" },
          docs: {},
        };
      }

      const existing = groups[k.customerId].docs[k.documentType];
      if (!existing || k.uploadDate > existing.uploadDate) {
        groups[k.customerId].docs[k.documentType] = k;
      }
    });

    custRows = Object.values(groups);
    filtered = [...custRows];
  }

  /* renderKycs*/

  function renderKycs() {
    if (!filtered.length) {
      $("#kycTableBody").html(
        `<tr><td colspan="8" class="text-center text-secondary py-5">
                    <i class="fa-solid fa-folder-open fa-2x mb-2 d-block opacity-50"></i>
                    No KYC records found.
                </td></tr>`,
      );
      renderPagination();
      return;
    }

    const start = (currentPage - 1) * PER_PAGE;
    const page = filtered.slice(start, start + PER_PAGE);

    const session = FinOpsStorage.getSession();
    const userRole = session
      ? FinOpsUtils.getNormalizedRole(session.role)
      : "Customer";
    const canVerify = userRole === "Admin" || userRole === "Branch Officer";

    const rows = page.map((row) => {
      const { customerId, cust, docs } = row;
      const initials = (cust.name || "UN")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const allDocs = Object.values(docs);
      let overallStatus = "Pending";
      if (allDocs.length && allDocs.every((d) => d.status === "Verified"))
        overallStatus = "Verified";
      else if (allDocs.some((d) => d.status === "Rejected"))
        overallStatus = "Rejected";

      const avatarColor =
        { Verified: "success", Pending: "warning", Rejected: "danger" }[
          overallStatus
        ] || "secondary";

      const colBadges = DOC_TYPES.map((type) => {
        const doc = docs[type];
        if (!doc)
          return `<td class="text-center"><span class="badge text-bg-secondary">— Missing</span></td>`;
        if (doc.status === "Verified")
          return `<td class="text-center"><span class="badge text-bg-success">✔ Verified</span></td>`;
        if (doc.status === "Rejected")
          return `<td class="text-center"><span class="badge text-bg-danger">✘ Rejected</span></td>`;
        return `<td class="text-center"><span class="badge text-bg-warning">⏳ Pending</span></td>`;
      }).join("");

      const pendingDoc = allDocs.find((d) => d.status === "Pending");
      const actionDocId = pendingDoc
        ? pendingDoc.id
        : allDocs[0]
          ? allDocs[0].id
          : "";

      let actionBtns = `<button class="btn btn-outline-secondary btn-view" data-cust="${customerId}" title="View All Docs"><i class="fa-solid fa-eye"></i></button>`;

      if (canVerify) {
        actionBtns += `
                    <button class="btn btn-outline-success btn-verify" data-id="${actionDocId}" ${!pendingDoc ? "disabled" : ""} title="Verify Pending Doc"><i class="fa-solid fa-check"></i></button>
                    <button class="btn btn-outline-danger btn-reject" data-id="${actionDocId}" ${!pendingDoc ? "disabled" : ""} title="Reject Pending Doc"><i class="fa-solid fa-xmark"></i></button>`;
      }

      return `<tr>
                <td class="ps-3">
                    <span class="fw-semibold small text-primary">${customerId}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="bg-${avatarColor} bg-opacity-10 text-${avatarColor} rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                             style="width:30px;height:30px;font-size:0.72rem;">${initials}</div>
                        <div>
                            <div class="fw-semibold small">${cust.name}</div>
                            <div class="text-secondary" style="font-size:0.72rem;">${cust.email || ""}</div>
                        </div>
                    </div>
                </td>
                ${colBadges}
                <td class="text-center">${statusBadge(overallStatus)}</td>
                <td class="text-end pe-3">
                    <div class="d-flex align-items-center justify-content-end gap-1">
                        <button class="btn btn-sm btn-outline-secondary btn-view" data-cust="${customerId}" title="View KYC Details">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        ${canVerify ? `
                        <button class="btn btn-sm btn-outline-success btn-verify" data-id="${actionDocId}" ${!pendingDoc ? "disabled" : ""} title="Verify Document">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-reject" data-id="${actionDocId}" ${!pendingDoc ? "disabled" : ""} title="Reject Document">
                            <i class="fa-solid fa-xmark"></i>
                        </button>` : ''}
                    </div>
                </td>
            </tr>`;
    });

    $("#kycTableBody").html(rows.join(""));
    renderPagination();
  }

  function updateStats() {
    const all = FinOpsStorage.getKYCDocs();
    const verified = all.filter((k) => k.status === "Verified").length;
    const pending = all.filter((k) => k.status === "Pending").length;
    const rejected = all.filter((k) => k.status === "Rejected").length;

    $("#statTotal").text(all.length);
    $("#statVerified").text(verified);
    $("#statPending").text(pending);
    $("#statRejected").text(rejected);
  }

  /* Search / Filter */
  function applyFilters() {
    const q = $("#tableKycSearch").val().toLowerCase().trim();
    const status = $("#kycStatusFilter").val();
    const doc = $("#kycDocFilter").val();

    filtered = custRows.filter((row) => {
      const { customerId, cust, docs } = row;

      const matchQ =
        !q ||
        customerId.toLowerCase().includes(q) ||
        (cust.name || "").toLowerCase().includes(q) ||
        (cust.email || "").toLowerCase().includes(q);

      const allDocs = Object.values(docs);
      let overallStatus = "Pending";
      if (allDocs.length && allDocs.every((d) => d.status === "Verified"))
        overallStatus = "Verified";
      else if (allDocs.some((d) => d.status === "Rejected"))
        overallStatus = "Rejected";
      const matchStatus = !status || overallStatus === status;

      const matchDoc = !doc || !!docs[doc];

      return matchQ && matchStatus && matchDoc;
    });

    currentPage = 1;
    renderKycs();
    updateStats();
  }

  /* bindEvents
       
      */
  function bindEvents() {
    // Live search
    $("#tableKycSearch, #kycSearch").on("input", function () {
      $("#tableKycSearch, #kycSearch").val($(this).val());
      applyFilters();
    });

    $("#kycStatusFilter, #kycDocFilter").on("change", applyFilters);

    $("#btnUploadKyc").on("click", function () {
      resetForm();
      $uploadModal.show();
    });

    $("#kycUploadForm").on("submit", function (e) {
      e.preventDefault();
      uploadKyc();
    });

    $(document).on("click", ".btn-view", function () {
      viewKyc($(this).data("cust"));
    });

    $(document).on("click", ".btn-verify:not([disabled])", function () {
      verifyKyc($(this).data("id"));
    });

    $(document).on("click", ".btn-reject:not([disabled])", function () {
      openRejectModal($(this).data("id"));
    });

    $("#btnConfirmReject").on("click", rejectKyc);

    // Pagination
    $(document).on("click", ".page-link[data-page]", function (e) {
      e.preventDefault();
      currentPage = parseInt($(this).data("page"));
      renderKycs();
    });

    // Logout
    $("#topbarLogoutBtn").on("click", function (e) {
      e.preventDefault();
      FinOpsStorage.logout();
    });

    // Theme Toggle
    $("#themeQuickToggleBtn").on("click", function () {
      const theme =
        $("html").attr("data-bs-theme") === "dark" ? "light" : "dark";
      $("html").attr("data-bs-theme", theme);
      $(this).find("i").toggleClass("fa-moon fa-sun");
    });
  }

  function uploadKyc() {
    const custId = $("#kycCustomer").val();
    if (!custId) {
      showToast("Please select a customer.", "warning");
      return;
    }

    const docs = [
      {
        type: "Aadhaar Card",
        num: $("#kycAadhaarNum").val().trim(),
        file: $("#kycAadhaarFile")[0].files[0],
      },
      {
        type: "PAN Card",
        num: $("#kycPanNum").val().trim(),
        file: $("#kycPanFile")[0].files[0],
      },
      { type: "Photo", num: "", file: $("#kycPhotoFile")[0].files[0] },
      { type: "Salary Slip", num: "", file: $("#kycSalaryFile")[0].files[0] },
    ];

    // At least one doc must be provided
    const toSave = docs.filter((d) => d.num || d.file);
    if (!toSave.length) {
      showToast("Please provide at least one document.", "warning");
      return;
    }

    toSave.forEach((d) => {
      saveKyc({
        customerId: custId,
        documentType: d.type,
        documentNumber: d.num,
        remarks: $("#kycRemarks").val().trim(),
        fileUrl: d.file ? d.file.name : "assets/documents/sample_doc.pdf",
      });
    });

    $uploadModal.hide();
    showToast(
      `${toSave.length} document(s) uploaded. Pending verification.`,
      "success",
    );
    refresh();
  }

  function saveKyc(data) {
    return FinOpsStorage.addKYCDoc(data);
  }

  function viewKyc(customerId) {
    const cust = FinOpsStorage.getCustomer(customerId) || {
      name: customerId,
      email: "",
    };
    const docs = FinOpsStorage.getKYCDocs().filter(
      (k) => k.customerId === customerId,
    );

    if (!docs.length) {
      showToast("No documents found for this customer.", "warning");
      return;
    }

    const docRows = docs
      .map(
        (doc) => `
            <tr>
                <td><span class="small fw-semibold">${doc.id}</span></td>
                <td class="small">${doc.documentType}</td>
                <td class="small text-secondary">${doc.documentNumber || "—"}</td>
                <td class="small">${doc.uploadDate || "—"}</td>
                <td>${statusBadge(doc.status)}</td>
                <td>
                    <a href="${doc.fileUrl || "#"}" class="btn btn-outline-secondary btn-sm py-0 px-1" target="_blank" title="Download / Preview">
                        <i class="fa-solid fa-download" style="font-size:0.7rem;"></i>
                    </a>
                </td>
            </tr>`,
      )
      .join("");

    const html = `
            <div class="mb-3 pb-2 border-bottom">
                <div class="fw-bold">${cust.name}</div>
                <div class="text-secondary small">${customerId} · ${cust.email || ""}</div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-bordered align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="small">ID</th>
                            <th class="small">Type</th>
                            <th class="small">Number</th>
                            <th class="small">Uploaded</th>
                            <th class="small">Status</th>
                            <th class="small">File</th>
                        </tr>
                    </thead>
                    <tbody>${docRows}</tbody>
                </table>
            </div>`;

    $("#kycDetailBody").html(html);
    $viewModal.show();
  }

  function verifyKyc(id) {
    if (!id) return;
    if (!confirm(`Mark document ${id} as Verified?`)) return;

    FinOpsStorage.updateKYCStatus(id, "Verified");
    showToast(`Document ${id} verified ✔`, "success");
    refresh();
  }

  function openRejectModal(id) {
    if (!id) return;
    $("#rejectKycId").val(id);
    $("#rejectKycRemarks").val("");
    $rejectModal.show();
  }

  function rejectKyc() {
    const id = $("#rejectKycId").val();
    const remarks = $("#rejectKycRemarks").val().trim();

    if (!remarks) {
      showToast("Please enter a rejection reason.", "warning");
      return;
    }

    FinOpsStorage.updateKYCStatus(id, "Rejected", remarks);
    $rejectModal.hide();
    showToast(`Document ${id} rejected.`, "danger");
    refresh();
  }

  function resetForm() {
    $("#kycUploadForm")[0].reset();
  }

  function refresh() {
    loadKycs();
    applyFilters();
    updateStats();
  }

  /* 
       HELPERS
    */

  function populateCustomerDropdown() {
    const opts = FinOpsStorage.getCustomers()
      .map((c) => `<option value="${c.id}">${c.id} — ${c.name}</option>`)
      .join("");
    $("#kycCustomer").html(
      '<option value="">— Select Customer —</option>' + opts,
    );
  }

  // Bootstrap status badge
  function statusBadge(status) {
    const map = {
      Verified: "text-bg-success",
      Pending: "text-bg-warning",
      Rejected: "text-bg-danger",
    };
    return `<span class="badge ${map[status] || "text-bg-secondary"}">${status || "Unknown"}</span>`;
  }

  // Pagination controls
  function renderPagination() {
    const total = filtered.length;
    const pages = Math.ceil(total / PER_PAGE);
    const start = total ? (currentPage - 1) * PER_PAGE + 1 : 0;
    const end = Math.min(currentPage * PER_PAGE, total);

    $("#kycCountLabel").text(`Showing ${start}–${end} of ${total} customers`);

    if (pages <= 1) {
      $("#kycPagination").html("");
      return;
    }

    let html = `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                      <a class="page-link" href="#" data-page="${currentPage - 1}">‹</a></li>`;

    for (let p = 1; p <= pages; p++) {
      html += `<li class="page-item ${p === currentPage ? "active" : ""}">
                       <a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
    }

    html += `<li class="page-item ${currentPage === pages ? "disabled" : ""}">
                   <a class="page-link" href="#" data-page="${currentPage + 1}">›</a></li>`;

    $("#kycPagination").html(html);
  }

  function showToast(message, type = "info") {
    const icons = {
      success: "fa-circle-check",
      warning: "fa-triangle-exclamation",
      danger: "fa-circle-xmark",
      info: "fa-circle-info",
    };

    if (!$("#toastContainer").length) {
      $("body").append(
        '<div id="toastContainer" style="position:fixed;top:70px;right:20px;z-index:9999;min-width:300px;max-width:400px;"></div>',
      );
    }

    const id = "toast-" + Date.now();
    const el =
      $(`<div id="${id}" class="alert alert-${type} alert-dismissible d-flex align-items-center gap-2 shadow mb-2" role="alert">
                          <i class="fa-solid ${icons[type] || icons.info}"></i>
                          <span class="flex-grow-1 small">${message}</span>
                          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                       </div>`);

    $("#toastContainer").append(el);
    setTimeout(() => el.alert("close"), 4000);
  }

  init();
});
