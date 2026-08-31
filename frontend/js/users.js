$(document).ready(function () {

    // Render global navigation shell
    FinOpsUtils.renderShell('users');

    let allUsers = [];

    function userBadge(status) {
        const map = {
            ACTIVE: 'success',
            PENDING: 'warning',
            REJECTED: 'danger',
            INACTIVE: 'secondary'
        };
        return `<span class="badge text-bg-${map[status] || 'secondary'}">${status}</span>`;
    }

    function renderUsers() {
        const query = $('#userSearchInput').val().toLowerCase().trim();
        const statusFilter = $('#statusFilter').val();

        const filtered = allUsers.filter(u => {
            const matchesQuery = !query || u.fullName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
            const matchesStatus = !statusFilter || u.status === statusFilter;
            return matchesQuery && matchesStatus;
        });

        if (filtered.length === 0) {
            $('#usersTableBody').html(`
                <tr>
                    <td colspan="7" class="text-center text-secondary py-5">
                        <i class="fa-solid fa-user-slash fs-3 d-block mb-2 opacity-50"></i>
                        No user registrations found matching the filters.
                    </td>
                </tr>
            `);
            return;
        }

        const session = FinOpsStorage.getSession();
        const currentUserRole = session ? FinOpsUtils.getNormalizedRole(session.role) : '';

        $('#usersTableBody').html(filtered.map(u => {
            let actions = '';
            
            if (u.status === 'PENDING') {
                let canApproveThisUser = true;

                // Relationship Managers can only approve Customer registrations
                if (currentUserRole === 'Relationship Manager') {
                    if (u.role !== 'Customer') {
                        canApproveThisUser = false;
                    }
                }

                if (canApproveThisUser) {
                    actions = `
                        <button class="btn btn-outline-success btn-approve-user btn-sm py-1 px-2" data-id="${u.userId}" title="Approve Registration">
                            <i class="fa-solid fa-user-check me-1"></i>Approve
                        </button>
                        <button class="btn btn-outline-danger btn-reject-user btn-sm py-1 px-2" data-id="${u.userId}" title="Reject Registration">
                            <i class="fa-solid fa-user-minus me-1"></i>Reject
                        </button>
                    `;
                } else {
                    actions = `<span class="text-secondary small">Awaiting Admin/Manager Approval</span>`;
                }
            } else {
                actions = `<span class="text-secondary small">—</span>`;
            }

            const formattedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '—';

            return `
                <tr>
                    <td class="ps-3 fw-semibold text-secondary">${u.userId}</td>
                    <td>
                        <div class="fw-semibold small">${u.fullName}</div>
                    </td>
                    <td><code class="small text-secondary">${u.username}</code></td>
                    <td>${FinOpsUtils.roleBadge(u.role)}</td>
                    <td>${userBadge(u.status)}</td>
                    <td class="small text-secondary">${formattedDate}</td>
                    <td class="text-end pe-3">
                        <div class="d-flex justify-content-end gap-1">${actions}</div>
                    </td>
                </tr>
            `;
        }).join(''));
    }

    function loadUsers() {
        fetch('/api/users', {
            method: 'GET',
            credentials: 'same-origin'
        })
        .then(async response => {
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch user registrations.');
            }
            return response.json();
        })
        .then(data => {
            allUsers = data;
            renderUsers();
        })
        .catch(err => {
            window.FinOpsUtils.showAlert(err.message, 'error');
            $('#usersTableBody').html(`
                <tr>
                    <td colspan="7" class="text-center text-danger py-5">
                        <i class="fa-solid fa-triangle-exclamation fs-3 d-block mb-2 opacity-75"></i>
                        Failed to load registrations. ${err.message}
                    </td>
                </tr>
            `);
        });
    }

    // Handles approval/rejection actions
    function handleAction(userId, action) {
        const actionVerb = action === 'APPROVE' ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${actionVerb} this user registration?`)) {
            return;
        }

        fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ userId, action })
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Failed to ${actionVerb} user registration.`);
            }
            window.FinOpsUtils.showAlert(data.message, 'success');
            loadUsers();
        })
        .catch(err => {
            window.FinOpsUtils.showAlert(err.message, 'error');
        });
    }

    $(document).on('click', '.btn-approve-user', function () {
        handleAction($(this).data('id'), 'APPROVE');
    });

    $(document).on('click', '.btn-reject-user', function () {
        handleAction($(this).data('id'), 'REJECT');
    });

    $('#userSearchInput, #statusFilter').on('input change', function () {
        renderUsers();
    });

    // Initial load
    loadUsers();
});
