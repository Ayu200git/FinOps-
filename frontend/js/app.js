$(document).ready(function () {

    const isLoginPage = window.location.pathname.replace(/\\/g, '/').split('/').pop().match(/^(index\.html|)$/);

    if (!isLoginPage) {
        if (window.FinOpsStorage && !window.FinOpsStorage.getSession()) {
            window.location.href = 'index.html';
            return;
        }
        verifyBackendSession();
        initNavbar();
    } else {
        if (window.FinOpsStorage && window.FinOpsStorage.getSession()) {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    function verifyBackendSession() {
        fetch('/api/session', { credentials: 'same-origin' })
            .then(response => {
                if (!response.ok) throw new Error('Session expired');
                return response.json();
            })
            .then(data => {
                if (!data.authenticated) throw new Error('Session expired');
            })
            .catch(() => {
                sessionStorage.removeItem(FinOpsStorage.KEYS.SESSION);
                window.location.href = 'index.html';
            });
    }

     
    function initNavbar() {
        if (!window.FinOpsStorage) return;
        const session = window.FinOpsStorage.getSession();
        if (session) {
            $('#userNameDisplay').text(session.name);
            $('#userEmailDisplay').text(session.email);
            const initials = session.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            $('#userInitials').text(initials);
            if (window.FinOpsUtils) {
                $('#userRoleBadgeDisplay').html(window.FinOpsUtils.roleBadge(session.role));
            }
        }
        updateNotifications();
    }

    function updateNotifications() {
        if (!window.FinOpsStorage || !window.FinOpsUtils) return;
        const unread = window.FinOpsStorage.getUnreadCount();
        const badge = $('#notifCountBadge');
        if (unread > 0) {
            badge.text(unread).show();
        } else {
            badge.hide();
        }

        const notifs = window.FinOpsStorage.getNotifications().slice(0, 8);
        const listContainer = $('#notifList');
        if (!listContainer.length) return;

        if (!notifs.length) {
            listContainer.html('<div class="text-center text-secondary py-3 small">No notifications</div>');
            return;
        }

        listContainer.html(notifs.map(n => `
            <div class="dropdown-item border-bottom py-2 notif-item ${n.read ? '' : 'fw-semibold bg-light-subtle'}" data-id="${n.id}" style="cursor:pointer;white-space:normal;">
                <div class="d-flex gap-2">
                    <i class="fa-solid ${window.FinOpsUtils.notifIcon(n.type)} mt-1 flex-shrink-0"></i>
                    <div>
                        <div class="small">${n.title}</div>
                        <div class="text-secondary" style="font-size:0.75rem;">${n.message}</div>
                        <div class="text-muted mt-1" style="font-size:0.7rem;">${window.FinOpsUtils.timeAgo(n.time)}</div>
                    </div>
                </div>
            </div>`).join(''));
    }

    /* ── Sidebar (Mobile Toggle) ── */
    $(document).on('click', '#sidebarToggleBtn', e => {
        e.preventDefault();
        $('.col-lg-2').toggleClass('show');
    });

    /* ── Logout ── */
    function doLogout(e) {
        e.preventDefault();
        fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
            .finally(() => {
                sessionStorage.removeItem(FinOpsStorage.KEYS.SESSION);
                window.location.href = 'index.html';
            });
    }
    $(document).on('click', '#globalLogoutBtn, #topbarLogoutBtn', doLogout);

    /* ── Theme Toggle ── */
    $(document).on('click', '#themeQuickToggleBtn', function () {
        if (!window.FinOpsStorage) return;
        const s   = window.FinOpsStorage.getSettings();
        s.theme   = s.theme === 'dark' ? 'light' : 'dark';
        window.FinOpsStorage.saveSettings(s);
        $('html').attr('data-bs-theme', s.theme);
        
         
        const icon = $(this).find('i');
        if (icon.length) {
            if (s.theme === 'dark') icon.removeClass('fa-moon').addClass('fa-sun');
            else                    icon.removeClass('fa-sun').addClass('fa-moon');
        }
        
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: s.theme } }));
    });

     
    $(document).on('click', '.notif-item', function (e) {
        e.stopPropagation();  
        const id = $(this).data('id');
        if (window.FinOpsStorage) {
            window.FinOpsStorage.markNotificationRead(id);
            updateNotifications();
        }
    });

    $(document).on('click', '#markAllReadBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();  
        if (window.FinOpsStorage && window.FinOpsUtils) {
            window.FinOpsStorage.markAllNotificationsRead();
            updateNotifications();
            window.FinOpsUtils.showAlert('All notifications marked as read.', 'success');
        }
    });
});
