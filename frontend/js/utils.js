/**
 * utils.js — FinOps Portal
 * Formatters, Bootstrap-native shell renderer, pagination, badge helpers.
 */

const FinOpsUtils = {

    // ─── Formatters ───────────────────────────────
    formatCurrency(amount) {
        const s = window.FinOpsStorage ? window.FinOpsStorage.getSettings() : { currency: '₹' };
        return (s.currency || '₹') + parseFloat(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    },

    formatDate(str) {
        if (!str) return '—';
        return new Date(str).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatDateTime(str) {
        if (!str) return '—';
        return new Date(str).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    timeAgo(str) {
        if (!str) return '';
        const diff = (Date.now() - new Date(str)) / 1000;
        if (diff < 60)    return 'just now';
        if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
    },

    // ─── Toast Alerts (Bootstrap Toast) ──────────
    showAlert(message, type = 'success') {
        const id  = 'toast-' + Date.now();
        const map = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
        const bg  = type === 'error' ? 'danger' : type;
        const html = `
            <div id="${id}" class="toast align-items-center text-bg-${bg} border-0" role="alert" aria-live="assertive">
                <div class="d-flex">
                    <div class="toast-body fw-medium">
                        <i class="fa-solid ${map[type] || 'fa-circle-check'} me-2"></i>${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`;
        let c = $('.toast-container');
        if (!c.length) {
            $('body').append('<div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:9999"></div>');
            c = $('.toast-container');
        }
        c.append(html);
        const el = document.getElementById(id);
        new bootstrap.Toast(el, { delay: 4500 }).show();
        el.addEventListener('hidden.bs.toast', () => el.remove());
    },

    // ─── Pagination ────────────────────────────────
    paginate(arr, page, perPage = 10) {
        const total = Math.ceil(arr.length / perPage);
        const start = (page - 1) * perPage;
        return { data: arr.slice(start, start + perPage), total, page, perPage };
    },

    renderPagination(containerId, paginationObj, onPageChange) {
        const { page, total } = paginationObj;
        if (total <= 1) { $(`#${containerId}`).html(''); return; }
        let html = `<nav aria-label="Page navigation"><ul class="pagination pagination-sm mb-0">`;
        html += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">‹</a></li>`;
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || Math.abs(i - page) <= 1) {
                html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            } else if (Math.abs(i - page) === 2) {
                html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
            }
        }
        html += `<li class="page-item ${page === total ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">›</a></li>`;
        html += `</ul></nav>`;
        $(`#${containerId}`).html(html);
        $(`#${containerId} .page-link`).on('click', function (e) {
            e.preventDefault();
            const p = parseInt($(this).data('page'));
            if (p && p !== page) onPageChange(p);
        });
    },

    // ─── Status Badges (Bootstrap) ─────────────────
    creditScoreBadge(score) {
        if (score >= 750) return `<span class="badge text-bg-success">Excellent (${score})</span>`;
        if (score >= 650) return `<span class="badge text-bg-warning">Good (${score})</span>`;
        if (score >= 550) return `<span class="badge text-bg-info">Fair (${score})</span>`;
        return `<span class="badge text-bg-danger">Poor (${score})</span>`;
    },

    kycBadge(status) {
        const map = { Verified: 'success', Pending: 'warning', Rejected: 'danger' };
        return `<span class="badge text-bg-${map[status] || 'secondary'}">${status || 'Unknown'}</span>`;
    },

    loanStatusBadge(status) {
        const map = { Approved: 'success', Pending: 'warning', Paid: 'info', Rejected: 'danger', 'Under Review': 'primary' };
        return `<span class="badge text-bg-${map[status] || 'secondary'}">${status}</span>`;
    },

    notifIcon(type) {
        const map = { success: 'fa-circle-check text-success', warning: 'fa-triangle-exclamation text-warning', danger: 'fa-circle-xmark text-danger', info: 'fa-circle-info text-info' };
        return map[type] || 'fa-bell text-secondary';
    },

    // ─── Role Permissions Matrix ──────────────────
    ROLE_PERMISSIONS: {
        'Admin': {
            pages: ['dashboard', 'customers', 'loans', 'kyc', 'reports', 'settings', 'users'],
            label: 'System Admin',
            badgeClass: 'text-bg-danger'
        },
        'Branch Manager': {
            pages: ['dashboard', 'customers', 'loans', 'kyc', 'reports', 'users'],
            label: 'Branch Manager',
            badgeClass: 'text-bg-primary'
        },
        'Branch Officer': {
            pages: ['dashboard', 'customers', 'loans', 'kyc', 'reports'],
            label: 'Branch Officer',
            badgeClass: 'text-bg-info'
        },
        'Relationship Manager': {
            pages: ['dashboard', 'customers', 'loans', 'kyc', 'users'],
            label: 'Relationship Manager',
            badgeClass: 'text-bg-warning'
        },
        'Customer': {
            pages: ['dashboard', 'customers', 'loans', 'kyc'],
            label: 'Customer',
            badgeClass: 'text-bg-success'
        }
    },

    getNormalizedRole(rawRole) {
        if (!rawRole) return 'Customer';
        if (rawRole === 'Clerk') return 'Branch Officer';
        if (rawRole === 'Manager') return 'Branch Manager';
        return rawRole;
    },

    roleBadge(role) {
        const norm = this.getNormalizedRole(role);
        const perm = this.ROLE_PERMISSIONS[norm] || { label: norm, badgeClass: 'text-bg-secondary' };
        return `<span class="badge ${perm.badgeClass}">${perm.label}</span>`;
    },

    canAccess(role, pageKey) {
        const norm = this.getNormalizedRole(role);
        const perm = this.ROLE_PERMISSIONS[norm];
        if (!perm) return false;
        return perm.pages.includes(pageKey);
    },

    // ─── Sidebar & Topbar (Bootstrap-native) ───────
    renderShell(activePage) {
        const session  = window.FinOpsStorage ? window.FinOpsStorage.getSession()  : null;
        const settings = window.FinOpsStorage ? window.FinOpsStorage.getSettings() : {};
        const theme    = settings.theme || 'dark';
        const userRole = session ? this.getNormalizedRole(session.role) : 'Customer';

        // Page level access check
        if (activePage && !this.canAccess(userRole, activePage)) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Apply Bootstrap theme via data-bs-theme on <html>
        $('html').attr('data-bs-theme', theme);

        const allNavItems = [
            { key: 'dashboard', icon: 'fa-gauge-high',         label: 'Dashboard',         href: 'dashboard.html' },
            { key: 'customers', icon: 'fa-users',               label: 'Customers',         href: 'customers.html' },
            { key: 'loans',     icon: 'fa-hand-holding-dollar', label: 'Loan Applications', href: 'loans.html'     },
            { key: 'kyc',       icon: 'fa-folder-open',         label: 'KYC Documents',     href: 'kyc.html'       },
            { key: 'users',     icon: 'fa-user-shield',         label: 'User Management',   href: 'users.html'     },
            { key: 'reports',   icon: 'fa-chart-bar',           label: 'Reports Center',    href: 'reports.html'   },
            { key: 'settings',  icon: 'fa-sliders',             label: 'Settings Center',   href: 'settings.html'  }
        ];

        // Filter navigation items by role
        const navItems = allNavItems.filter(item => this.canAccess(userRole, item.key));

        const navHtml = navItems.map(n => `
            <li class="nav-item">
                <a class="nav-link ${activePage === n.key ? 'active fw-semibold' : 'text-secondary'} d-flex align-items-center gap-2 px-3 py-2 rounded"
                   href="${n.href}">
                    <i class="fa-solid ${n.icon} fa-fw"></i>
                    <span>${n.label}</span>
                </a>
            </li>`).join('');

        const initials = session ? session.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'GU';
        const unread = window.FinOpsStorage ? window.FinOpsStorage.getUnreadCount() : 0;

        $('#sidebar-wrapper').html(`
            <!-- Brand -->
            <div class="d-flex align-items-center gap-2 px-3 py-3 border-bottom">
                <div class="bg-primary rounded-2 d-flex align-items-center justify-content-center text-white flex-shrink-0"
                     style="width:36px;height:36px;">
                    <i class="fa-solid fa-landmark"></i>
                </div>
                <span class="fw-bold fs-6">${settings.companyName || 'FinOps'}</span>
                <button class="btn btn-sm btn-link text-secondary ms-auto d-md-none p-0" id="sidebarCloseBtn">
                    <i class="fa-solid fa-xmark fs-5"></i>
                </button>
            </div>

            <!-- Navigation -->
            <div class="px-2 py-3 flex-grow-1 overflow-y-auto">
                <small class="text-uppercase text-secondary ms-3 fw-semibold" style="font-size:0.65rem;letter-spacing:1px;">Main Menu</small>
                <ul class="nav flex-column mt-2">${navHtml}</ul>
            </div>

            <!-- User Footer -->
            <div class="border-top p-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                         style="width:34px;height:34px;font-size:0.8rem;">
                        ${initials}
                    </div>
                    <div class="overflow-hidden">
                        <div class="fw-semibold text-truncate" style="font-size:0.82rem;">${session ? session.name : 'Guest'}</div>
                        <small class="text-secondary">${session ? session.role : ''}</small>
                    </div>
                    <button class="btn btn-sm btn-link text-danger ms-auto p-0" id="globalLogoutBtn" title="Logout">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>
        `);

        const pageTitles = {
            dashboard: 'Operations Overview', customers: 'Customer Management',
            loans: 'Loan Applications', kyc: 'KYC Documents',
            reports: 'Analytics & Reports', settings: 'System Settings'
        };

        $('#topbar-wrapper').html(`
            <nav class="navbar border-bottom px-3 px-md-4" style="height:60px;">
                <div class="d-flex align-items-center gap-3 flex-grow-1">
                    <button class="btn btn-sm btn-outline-secondary d-md-none" id="sidebarToggleBtn">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <div>
                        <span class="fw-bold">${pageTitles[activePage] || 'Portal'}</span>
                        <small class="text-secondary d-none d-lg-inline ms-2">
                            · ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short', year:'numeric' })}
                        </small>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <!-- Notification Bell -->
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary position-relative" data-bs-toggle="dropdown" data-bs-auto-close="outside" id="notifBellBtn">
                            <i class="fa-solid fa-bell"></i>
                            ${unread > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:0.6rem;">${unread}</span>` : ''}
                        </button>
                        <div class="dropdown-menu dropdown-menu-end p-0 shadow" style="width:300px;max-height:380px;overflow-y:auto;" id="notifDropdown">
                            <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                                <strong class="small">Notifications</strong>
                                <a href="#" class="small text-decoration-none" id="markAllReadBtn">Mark all read</a>
                            </div>
                            <div id="notifList"></div>
                        </div>
                    </div>

                    <!-- Theme Toggle -->
                    <button class="btn btn-sm btn-outline-secondary" id="themeQuickToggleBtn" title="Toggle Theme">
                        <i class="fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
                    </button>

                    <!-- User Dropdown -->
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                 style="width:26px;height:26px;font-size:0.7rem;">${initials}</div>
                            <span class="d-none d-md-inline small fw-medium">${session ? session.name : 'User'}</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow">
                            <li><h6 class="dropdown-header small">${session ? session.email : ''}</h6></li>
                            <li><a class="dropdown-item small" href="settings.html"><i class="fa-solid fa-sliders me-2 text-secondary"></i>Settings</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item small text-danger" href="#" id="topbarLogoutBtn"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
                        </ul>
                    </div>
                </div>
            </nav>
        `);

        this._renderNotifList();
    },

    _renderNotifList() {
        if (!window.FinOpsStorage) return;
        const notifs = window.FinOpsStorage.getNotifications().slice(0, 8);
        if (!notifs.length) {
            $('#notifList').html('<div class="text-center text-secondary py-3 small">No notifications</div>');
            return;
        }
        $('#notifList').html(notifs.map(n => `
            <div class="dropdown-item border-bottom py-2 notif-item ${n.read ? '' : 'fw-semibold'}" data-id="${n.id}" style="cursor:pointer;white-space:normal;">
                <div class="d-flex gap-2">
                    <i class="fa-solid ${this.notifIcon(n.type)} mt-1 flex-shrink-0"></i>
                    <div>
                        <div class="small">${n.title}</div>
                        <div class="text-secondary" style="font-size:0.75rem;">${n.message}</div>
                        <div class="text-muted mt-1" style="font-size:0.7rem;">${this.timeAgo(n.time)}</div>
                    </div>
                </div>
            </div>`).join(''));
    }
};

window.FinOpsUtils = FinOpsUtils;
