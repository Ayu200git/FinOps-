 

const FinOpsStorage = {

    KEYS: {
        USERS:         'finops_users',
        SESSION:       'finops_session',
        CUSTOMERS:     'finops_customers',
        LOANS:         'finops_loans',
        KYC:           'finops_kyc',
        ACTIVITY_LOGS: 'finops_activity_logs',
        NOTIFICATIONS: 'finops_notifications',
        SETTINGS:      'finops_settings'
    },
 
    init() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify([
                { id: 'USR-001', email: 'admin@finops.com',      password: 'admin123',   name: 'Ayush Sharma',    role: 'Admin',       department: 'Management',     lastLogin: '2026-07-12' },
                { id: 'USR-002', email: 'clerk@finops.com',      password: 'clerk123',   name: 'Rahul Verma',     role: 'Clerk',       department: 'Operations',     lastLogin: '2026-07-11' },
                { id: 'USR-003', email: 'manager@finops.com',    password: 'manager123', name: 'Priya Mehta',     role: 'Manager',     department: 'Credit',         lastLogin: '2026-07-10' }
            ]));
        }

        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
                currency: '₹', interestRate: 8.5, theme: 'dark',
                companyName: 'FinOps Prime', maxLoanAmount: 5000000,
                minLoanAmount: 10000, loanTenureMax: 360,
                supportEmail: 'support@finops.com'
            }));
        }

        if (!localStorage.getItem(this.KEYS.CUSTOMERS)) {
            localStorage.setItem(this.KEYS.CUSTOMERS, JSON.stringify([
                { id: 'CUST-1001', name: 'Arjun Kapoor',    email: 'arjun.k@mail.com',   phone: '+91 98765-43210', dob: '1990-05-12', address: '14, Nehru Nagar, Delhi', city: 'Delhi',     pincode: '110001', status: 'Active',    kycStatus: 'Verified',  joinedDate: '2026-01-10', balance: 540000.00,  creditScore: 780 },
                { id: 'CUST-1002', name: 'Sneha Joshi',     email: 'sneha.j@mail.com',    phone: '+91 87654-32109', dob: '1985-08-25', address: '22, MG Road, Pune',     city: 'Pune',      pincode: '411001', status: 'Active',    kycStatus: 'Verified',  joinedDate: '2026-02-14', balance: 1285000.00, creditScore: 820 },
                { id: 'CUST-1003', name: 'Vikram Singh',    email: 'vikram.s@mail.com',   phone: '+91 76543-21098', dob: '1992-11-03', address: '5, Ring Road, Mumbai',  city: 'Mumbai',    pincode: '400001', status: 'Active',    kycStatus: 'Pending',   joinedDate: '2026-03-22', balance: 0.00,       creditScore: 650 },
                { id: 'CUST-1004', name: 'Meera Nair',      email: 'meera.n@mail.com',    phone: '+91 65432-10987', dob: '1988-03-17', address: '8, Park Ave, Chennai', city: 'Chennai',   pincode: '600001', status: 'Suspended', kycStatus: 'Rejected',  joinedDate: '2026-04-05', balance: 120000.00,  creditScore: 510 },
                { id: 'CUST-1005', name: 'Rohan Das',       email: 'rohan.d@mail.com',    phone: '+91 54321-09876', dob: '1995-07-29', address: '33, Salt Lake, Kolkata',city: 'Kolkata',   pincode: '700091', status: 'Active',    kycStatus: 'Verified',  joinedDate: '2026-05-18', balance: 820000.00,  creditScore: 755 },
                { id: 'CUST-1006', name: 'Anjali Patel',    email: 'anjali.p@mail.com',   phone: '+91 43210-98765', dob: '1993-12-08', address: '7, CG Road, Ahmedabad', city: 'Ahmedabad', pincode: '380001', status: 'Active',    kycStatus: 'Verified',  joinedDate: '2026-06-01', balance: 250000.00,  creditScore: 800 }
            ]));
        }

        if (!localStorage.getItem(this.KEYS.LOANS)) {
            localStorage.setItem(this.KEYS.LOANS, JSON.stringify([
                { id: 'LOAN-2001', customerId: 'CUST-1001', customerName: 'Arjun Kapoor',  loanType: 'Personal',  amount: 500000,   interestRate: 7.5, durationMonths: 36, monthlyInstallment: 15564.17, status: 'Approved',  startDate: '2026-01-15', paymentsMade: 6,  remainingAmount: 405432.00, purpose: 'Home Renovation',  createdBy: 'USR-002', approvedBy: 'USR-003' },
                { id: 'LOAN-2002', customerId: 'CUST-1002', customerName: 'Sneha Joshi',   loanType: 'Business',  amount: 1000000,  interestRate: 9.0, durationMonths: 60, monthlyInstallment: 20758.00, status: 'Approved',  startDate: '2026-03-01', paymentsMade: 4,  remainingAmount: 916968.00, purpose: 'Business Expansion', createdBy: 'USR-002', approvedBy: 'USR-001' },
                { id: 'LOAN-2003', customerId: 'CUST-1005', customerName: 'Rohan Das',     loanType: 'Vehicle',   amount: 350000,   interestRate: 8.5, durationMonths: 48, monthlyInstallment: 8668.00,  status: 'Pending',   startDate: '2026-07-01', paymentsMade: 0,  remainingAmount: 350000.00, purpose: 'Car Purchase',     createdBy: 'USR-002', approvedBy: null },
                { id: 'LOAN-2004', customerId: 'CUST-1004', customerName: 'Meera Nair',    loanType: 'Personal',  amount: 200000,   interestRate: 11.0, durationMonths: 24, monthlyInstallment: 9306.00, status: 'Rejected',  startDate: '2026-04-10', paymentsMade: 0,  remainingAmount: 200000.00, purpose: 'Medical',          createdBy: 'USR-002', approvedBy: 'USR-003' },
                { id: 'LOAN-2005', customerId: 'CUST-1006', customerName: 'Anjali Patel',  loanType: 'Home',      amount: 2500000,  interestRate: 8.0, durationMonths: 240, monthlyInstallment: 20921.00, status: 'Under Review', startDate: '2026-06-15', paymentsMade: 0, remainingAmount: 2500000.00, purpose: 'Home Purchase',   createdBy: 'USR-002', approvedBy: null },
                { id: 'LOAN-2006', customerId: 'CUST-1001', customerName: 'Arjun Kapoor',  loanType: 'Education', amount: 150000,   interestRate: 6.5, durationMonths: 24, monthlyInstallment: 6683.00,  status: 'Paid',      startDate: '2025-07-01', paymentsMade: 24, remainingAmount: 0.00,      purpose: 'Education',        createdBy: 'USR-002', approvedBy: 'USR-001' }
            ]));
        }

        if (!localStorage.getItem(this.KEYS.KYC)) {
            localStorage.setItem(this.KEYS.KYC, JSON.stringify([
                { id: 'KYC-3001', customerId: 'CUST-1001', documentType: 'Aadhaar Card',   documentNumber: 'XXXX-XXXX-1234', status: 'Verified',  uploadDate: '2026-01-08', verifiedDate: '2026-01-09', fileUrl: 'assets/documents/sample_doc.pdf', remarks: 'Document clear and valid.' },
                { id: 'KYC-3002', customerId: 'CUST-1001', documentType: 'PAN Card',        documentNumber: 'ABCDE1234F',     status: 'Verified',  uploadDate: '2026-01-08', verifiedDate: '2026-01-09', fileUrl: 'assets/documents/sample_doc.pdf', remarks: 'PAN verified.' },
                { id: 'KYC-3003', customerId: 'CUST-1002', documentType: 'Aadhaar Card',   documentNumber: 'XXXX-XXXX-5678', status: 'Verified',  uploadDate: '2026-02-12', verifiedDate: '2026-02-13', fileUrl: 'assets/documents/sample_doc.pdf', remarks: '' },
                { id: 'KYC-3004', customerId: 'CUST-1002', documentType: 'Passport',        documentNumber: 'P1234567',       status: 'Verified',  uploadDate: '2026-02-12', verifiedDate: '2026-02-13', fileUrl: 'assets/documents/sample_doc.pdf', remarks: '' },
                { id: 'KYC-3005', customerId: 'CUST-1003', documentType: 'Voter ID',        documentNumber: 'VOT-XYZ-001',    status: 'Pending',   uploadDate: '2026-03-20', verifiedDate: null,         fileUrl: 'assets/documents/sample_doc.pdf', remarks: 'Awaiting manual review.' },
                { id: 'KYC-3006', customerId: 'CUST-1004', documentType: 'Driving License', documentNumber: 'DL-1420260001',  status: 'Rejected',  uploadDate: '2026-04-03', verifiedDate: '2026-04-04', fileUrl: 'assets/documents/sample_doc.pdf', remarks: 'Blurred image, re-upload required.' },
                { id: 'KYC-3007', customerId: 'CUST-1005', documentType: 'Aadhaar Card',   documentNumber: 'XXXX-XXXX-9012', status: 'Verified',  uploadDate: '2026-05-16', verifiedDate: '2026-05-17', fileUrl: 'assets/documents/sample_doc.pdf', remarks: '' },
                { id: 'KYC-3008', customerId: 'CUST-1006', documentType: 'PAN Card',        documentNumber: 'XYZAB9876Q',     status: 'Verified',  uploadDate: '2026-05-30', verifiedDate: '2026-05-31', fileUrl: 'assets/documents/sample_doc.pdf', remarks: '' }
            ]));
        }

        if (!localStorage.getItem(this.KEYS.NOTIFICATIONS)) {
            localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify([
                { id: 'NOTIF-001', type: 'warning', title: 'Loan Under Review',   message: 'Loan LOAN-2005 by Anjali Patel needs credit review.',   time: '2026-07-12T09:00:00', read: false },
                { id: 'NOTIF-002', type: 'success', title: 'KYC Verified',        message: 'KYC for customer CUST-1006 has been verified.',          time: '2026-07-11T14:30:00', read: false },
                { id: 'NOTIF-003', type: 'danger',  title: 'KYC Rejected',        message: 'KYC document for CUST-1004 rejected. Re-upload needed.', time: '2026-07-10T11:00:00', read: true  },
                { id: 'NOTIF-004', type: 'info',    title: 'Pending Decision',     message: 'Loan LOAN-2003 by Rohan Das is pending approval.',       time: '2026-07-09T16:45:00', read: true  }
            ]));
        }

        if (!localStorage.getItem(this.KEYS.ACTIVITY_LOGS)) {
            localStorage.setItem(this.KEYS.ACTIVITY_LOGS, JSON.stringify([
                { id: 'LOG-001', userId: 'USR-001', userName: 'Ayush Sharma',  action: 'LOGIN',           module: 'Auth',      description: 'Admin logged in.',                timestamp: '2026-07-12T09:00:00' },
                { id: 'LOG-002', userId: 'USR-002', userName: 'Rahul Verma',   action: 'CREATE',          module: 'Customers', description: 'Created customer CUST-1006.',      timestamp: '2026-07-11T10:15:00' },
                { id: 'LOG-003', userId: 'USR-003', userName: 'Priya Mehta',   action: 'APPROVE',         module: 'Loans',     description: 'Approved LOAN-2002.',              timestamp: '2026-07-10T14:00:00' },
                { id: 'LOG-004', userId: 'USR-002', userName: 'Rahul Verma',   action: 'KYC_UPLOAD',      module: 'KYC',       description: 'Uploaded KYC for CUST-1006.',      timestamp: '2026-07-09T11:30:00' },
                { id: 'LOG-005', userId: 'USR-003', userName: 'Priya Mehta',   action: 'REJECT',          module: 'Loans',     description: 'Rejected LOAN-2004.',              timestamp: '2026-07-08T15:20:00' }
            ]));
        }
    },

     
    login(email, password) {
        const users = JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
        const user  = users.find(u => u.email === email && u.password === password);
        if (user) {
            const session = { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department, loginTime: new Date().toISOString() };
            sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
 
            user.lastLogin = new Date().toISOString().split('T')[0];
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
            this.addActivityLog(session.id, session.name, 'LOGIN', 'Auth', `User ${session.name} logged in.`);
            return { success: true, user: session };
        }
        return { success: false, message: 'Invalid credentials.' };
    },

    logout() {
        const s = this.getSession();
        if (s) this.addActivityLog(s.id, s.name, 'LOGOUT', 'Auth', `User ${s.name} logged out.`);
        sessionStorage.removeItem(this.KEYS.SESSION);
        window.location.href = 'index.html';
    },

    getSession() {
        try { return JSON.parse(sessionStorage.getItem(this.KEYS.SESSION)); } catch { return null; }
    },

    checkAuth() {
        if (!this.getSession()) window.location.href = 'index.html';
    },

    hasRole(...roles) {
        const s = this.getSession();
        return s && roles.includes(s.role);
    },
 
    getCustomers()        { return JSON.parse(localStorage.getItem(this.KEYS.CUSTOMERS)) || []; },
    saveCustomers(data)   { localStorage.setItem(this.KEYS.CUSTOMERS, JSON.stringify(data)); },
    getCustomer(id)       { return this.getCustomers().find(c => c.id === id) || null; },

    addCustomer(data) {
        const list  = this.getCustomers();
        const ids   = list.map(c => parseInt(c.id.split('-')[1]));
        const next  = ids.length ? Math.max(...ids) + 1 : 1001;
        const obj   = { id: `CUST-${next}`, ...data, balance: parseFloat(data.balance) || 0, joinedDate: data.joinedDate || new Date().toISOString().split('T')[0], kycStatus: data.kycStatus || 'Pending', creditScore: parseInt(data.creditScore) || 0 };
        list.push(obj);
        this.saveCustomers(list);
        const s = this.getSession();
        if (s) this.addActivityLog(s.id, s.name, 'CREATE', 'Customers', `Created customer ${obj.id}.`);
        return obj;
    },

    updateCustomer(id, data) {
        const list = this.getCustomers();
        const i    = list.findIndex(c => c.id === id);
        if (i === -1) return null;
        list[i] = { ...list[i], ...data };
        this.saveCustomers(list);
        if (data.name) {
            const loans = this.getLoans().map(l => l.customerId === id ? { ...l, customerName: data.name } : l);
            this.saveLoans(loans);
        }
        const s = this.getSession();
        if (s) this.addActivityLog(s.id, s.name, 'UPDATE', 'Customers', `Updated customer ${id}.`);
        return list[i];
    },

    deleteCustomer(id) {
        let list = this.getCustomers();
        const i  = list.findIndex(c => c.id === id);
        if (i === -1) return false;
        list.splice(i, 1);
        this.saveCustomers(list);
        this.saveLoans(this.getLoans().filter(l => l.customerId !== id));
        this.saveKYC(this.getKYCDocs().filter(k => k.customerId !== id));
        const s = this.getSession();
        if (s) this.addActivityLog(s.id, s.name, 'DELETE', 'Customers', `Deleted customer ${id}.`);
        return true;
    },
 
    getLoans()        { return JSON.parse(localStorage.getItem(this.KEYS.LOANS)) || []; },
    saveLoans(data)   { localStorage.setItem(this.KEYS.LOANS, JSON.stringify(data)); },
    getLoan(id)       { return this.getLoans().find(l => l.id === id) || null; },

    calculateEMI(principal, annualRate, months) {
        const r = (annualRate / 12) / 100;
        if (r === 0) return (principal / months).toFixed(2);
        return ((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)).toFixed(2);
    },

    addLoan(data) {
        const list   = this.getLoans();
        const ids    = list.map(l => parseInt(l.id.split('-')[1]));
        const next   = ids.length ? Math.max(...ids) + 1 : 2001;
        const cust   = this.getCustomer(data.customerId);
        if (!cust) return null;
        const s      = this.getSession();
        const amt    = parseFloat(data.amount);
        const rate   = parseFloat(data.interestRate);
        const dur    = parseInt(data.durationMonths);
        const obj    = { id: `LOAN-${next}`, customerId: data.customerId, customerName: cust.name, loanType: data.loanType || 'Personal', amount: amt, interestRate: rate, durationMonths: dur, monthlyInstallment: parseFloat(this.calculateEMI(amt, rate, dur)), status: 'Pending', startDate: data.startDate || new Date().toISOString().split('T')[0], paymentsMade: 0, remainingAmount: amt, purpose: data.purpose || '', createdBy: s ? s.id : 'USR-001', approvedBy: null };
        list.push(obj);
        this.saveLoans(list);
        if (s) this.addActivityLog(s.id, s.name, 'CREATE', 'Loans', `Filed loan application ${obj.id}.`);
        this.addNotification('info', 'New Loan Filed', `Loan ${obj.id} for ${cust.name} filed and pending review.`);
        return obj;
    },

    updateLoanStatus(id, newStatus) {
        const list = this.getLoans();
        const i    = list.findIndex(l => l.id === id);
        if (i === -1) return null;
        list[i].status = newStatus;
        const s = this.getSession();
        if (newStatus === 'Approved') {
            list[i].approvedBy = s ? s.id : null;
            const cust = this.getCustomer(list[i].customerId);
            if (cust) this.updateCustomer(list[i].customerId, { balance: cust.balance + list[i].amount });
            this.addNotification('success', 'Loan Approved', `Loan ${id} approved and amount disbursed.`);
        }
        if (newStatus === 'Rejected') {
            this.addNotification('danger', 'Loan Rejected', `Loan ${id} was rejected.`);
        }
        this.saveLoans(list);
        if (s) this.addActivityLog(s.id, s.name, newStatus === 'Approved' ? 'APPROVE' : 'REJECT', 'Loans', `${newStatus} loan ${id}.`);
        return list[i];
    },

    payInstallment(id) {
        const list = this.getLoans();
        const i    = list.findIndex(l => l.id === id);
        if (i === -1) return { success: false, message: 'Loan not found.' };
        const loan = list[i];
        if (loan.status !== 'Approved') return { success: false, message: 'Only approved loans can be paid.' };
        if (loan.remainingAmount <= 0)   return { success: false, message: 'Loan already fully repaid.' };
        const pay = Math.min(loan.monthlyInstallment, loan.remainingAmount);
        loan.paymentsMade++;
        loan.remainingAmount = parseFloat((loan.remainingAmount - pay).toFixed(2));
        if (loan.remainingAmount <= 0) { loan.status = 'Paid'; loan.remainingAmount = 0; }
        const cust = this.getCustomer(loan.customerId);
        if (cust) this.updateCustomer(loan.customerId, { balance: parseFloat((cust.balance - pay).toFixed(2)) });
        this.saveLoans(list);
        const s = this.getSession();
        if (s) this.addActivityLog(s.id, s.name, 'PAYMENT', 'Loans', `Installment of ₹${pay.toLocaleString()} recorded for ${id}.`);
        return { success: true, loan };
    },
 
    getKYCDocs()        { return JSON.parse(localStorage.getItem(this.KEYS.KYC)) || []; },
    saveKYC(data)       { localStorage.setItem(this.KEYS.KYC, JSON.stringify(data)); },
    getKYCForCustomer(customerId) { return this.getKYCDocs().filter(k => k.customerId === customerId); },

    addKYCDoc(data) {
        const list = this.getKYCDocs();
        const ids  = list.map(k => parseInt(k.id.split('-')[1]));
        const next = ids.length ? Math.max(...ids) + 1 : 3001;
        const obj  = { id: `KYC-${next}`, customerId: data.customerId, documentType: data.documentType, documentNumber: data.documentNumber || '', status: 'Pending', uploadDate: new Date().toISOString().split('T')[0], verifiedDate: null, fileUrl: data.fileUrl || '', remarks: '' };
        list.push(obj);
        this.saveKYC(list);
        const s = this.getSession();
        if (s) this.addActivityLog(s.id, s.name, 'KYC_UPLOAD', 'KYC', `Uploaded ${data.documentType} for ${data.customerId}.`);
        return obj;
    },

    updateKYCStatus(id, newStatus, remarks = '') {
        const list = this.getKYCDocs();
        const i    = list.findIndex(k => k.id === id);
        if (i === -1) return null;
        list[i].status = newStatus;
        list[i].remarks = remarks;
        list[i].verifiedDate = newStatus !== 'Pending' ? new Date().toISOString().split('T')[0] : null;
        this.saveKYC(list);
 
        const custDocs = list.filter(k => k.customerId === list[i].customerId);
        let overallKyc = 'Pending';
        if (custDocs.every(k => k.status === 'Verified'))          overallKyc = 'Verified';
        else if (custDocs.some(k => k.status === 'Rejected'))      overallKyc = 'Rejected';
        const cust = this.getCustomer(list[i].customerId);
        if (cust) this.updateCustomer(list[i].customerId, { kycStatus: overallKyc });

        const s = this.getSession();
        if (s) this.addActivityLog(s.id, s.name, `KYC_${newStatus.toUpperCase()}`, 'KYC', `KYC ${id} set to ${newStatus}.`);
        if (newStatus === 'Verified') this.addNotification('success', 'KYC Verified', `Document ${id} verified successfully.`);
        if (newStatus === 'Rejected') this.addNotification('danger', 'KYC Rejected', `Document ${id} was rejected. ${remarks}`);
        return list[i];
    },

    deleteKYCDoc(id) {
        const list = this.getKYCDocs();
        const i    = list.findIndex(k => k.id === id);
        if (i === -1) return false;
        list.splice(i, 1);
        this.saveKYC(list);
        return true;
    },

     
    getNotifications()          { return JSON.parse(localStorage.getItem(this.KEYS.NOTIFICATIONS)) || []; },
    saveNotifications(data)     { localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify(data)); },
    getUnreadCount()            { return this.getNotifications().filter(n => !n.read).length; },

    addNotification(type, title, message) {
        const list = this.getNotifications();
        const ids  = list.map(n => parseInt(n.id.split('-')[1]));
        const next = ids.length ? Math.max(...ids) + 1 : 1;
        list.unshift({ id: `NOTIF-${String(next).padStart(3,'0')}`, type, title, message, time: new Date().toISOString(), read: false });
        if (list.length > 50) list.pop(); // keep last 50
        this.saveNotifications(list);
    },

    markNotificationRead(id) {
        const list = this.getNotifications();
        const n    = list.find(n => n.id === id);
        if (n) { n.read = true; this.saveNotifications(list); }
    },

    markAllNotificationsRead() {
        const list = this.getNotifications().map(n => ({ ...n, read: true }));
        this.saveNotifications(list);
    },
 
    getActivityLogs()       { return JSON.parse(localStorage.getItem(this.KEYS.ACTIVITY_LOGS)) || []; },

    addActivityLog(userId, userName, action, module, description) {
        const list = this.getActivityLogs();
        const next = list.length + 1;
        list.unshift({ id: `LOG-${String(next).padStart(3,'0')}`, userId, userName, action, module, description, timestamp: new Date().toISOString() });
        if (list.length > 200) list.pop();
        localStorage.setItem(this.KEYS.ACTIVITY_LOGS, JSON.stringify(list));
    },

    
    getSettings()       { return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS)) || {}; },
    saveSettings(data)  { localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data)); },
 
    resetDatabase() {
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        this.init();
    }
};

FinOpsStorage.init();
window.FinOpsStorage = FinOpsStorage;
