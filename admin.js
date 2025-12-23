// Admin Portal - FINAL VERSION
class AdminPortal {
    constructor() {
        this.state = {
            user: null,
            scholarships: [],
            applications: [],
            contacts: [],
            users: []
        };
        this.API_URL = 'api.php';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.initClock();
    }

    checkAuth() {
        const userData = localStorage.getItem('scholarship_user');
        if (userData) {
            try {
                this.state.user = JSON.parse(userData);
                if (this.state.user.role === 'admin') {
                    this.showDashboard();
                } else {
                    this.showToast('Admin access required', 'error');
                    setTimeout(() => window.location.href = 'index.html', 2000);
                }
            } catch (e) {
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginSection').classList.add('active');
        document.getElementById('dashboardSection').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginSection').classList.remove('active');
        document.getElementById('dashboardSection').classList.add('active');
        this.updateUserInfo();
        this.loadAllData();
    }

    updateUserInfo() {
        if (!this.state.user) return;
        
        document.getElementById('adminName').textContent = this.state.user.name;
        document.getElementById('adminEmail').textContent = this.state.user.email;
        
        const avatar = document.getElementById('adminAvatar');
        const initials = this.state.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        avatar.innerHTML = `<span>${initials}</span>`;
    }

    setupEventListeners() {
        // Login
        document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Logout
        document.getElementById('adminLogoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(link.dataset.tab);
            });
        });
        
        // Add scholarship
        document.getElementById('addScholarshipBtn')?.addEventListener('click', () => {
            this.showModal('addScholarshipModal');
        });
        
        // Scholarship form
        document.getElementById('scholarshipForm')?.addEventListener('submit', (e) => this.handleScholarshipSubmit(e));
        
        // Modal close
        document.querySelectorAll('.modal-close, #cancelScholarshipModal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Refresh
        document.getElementById('refreshStats')?.addEventListener('click', () => {
            this.loadAllData();
            this.showToast('Data refreshed', 'success');
        });
        
        // Filters
        document.getElementById('searchScholarships')?.addEventListener('input', () => this.renderScholarships());
        document.getElementById('filterScholarshipType')?.addEventListener('change', () => this.renderScholarships());
        document.getElementById('filterScholarshipStatus')?.addEventListener('change', () => this.renderScholarships());
        document.getElementById('filterApplicationStatus')?.addEventListener('change', () => this.renderApplications());
        
        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                input.type = input.type === 'password' ? 'text' : 'password';
                btn.querySelector('i').className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        });
    }

    initClock() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const timeDisplay = document.getElementById('timeDisplay');
            if (timeDisplay) timeDisplay.textContent = timeString;
        };
        updateTime();
        setInterval(updateTime, 60000);
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminLoginEmail').value.trim();
        const password = document.getElementById('adminLoginPassword').value;
        
        if (!email || !password) {
            this.showToast('Please enter email and password', 'error');
            return;
        }
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        
        try {
            const response = await fetch(`${this.API_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success && result.user.role === 'admin') {
                this.state.user = result.user;
                localStorage.setItem('scholarship_user', JSON.stringify(result.user));
                this.showToast('Welcome, Administrator!', 'success');
                this.showDashboard();
                e.target.reset();
            } else if (result.success && result.user.role !== 'admin') {
                this.showToast('Admin access only', 'error');
            } else {
                this.showToast(result.message || 'Invalid admin credentials', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Network error. Please check if api.php exists', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login as Admin';
        }
    }

    handleLogout() {
        localStorage.removeItem('scholarship_user');
        this.state.user = null;
        this.showLogin();
        this.showToast('Logged out successfully', 'success');
    }

    switchTab(tab) {
        // Update sidebar
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tab);
        });
        
        // Update tabs
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        const targetTab = document.getElementById(`${tab}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            this.loadTabData(tab);
        }
    }

    loadTabData(tab) {
        switch(tab) {
            case 'scholarships':
                this.renderScholarships();
                break;
            case 'applications':
                this.renderApplications();
                break;
            case 'contacts':
                this.renderContacts();
                break;
            case 'users':
                this.renderUsers();
                break;
        }
    }

    async loadAllData() {
        await Promise.all([
            this.loadScholarships(),
            this.loadApplications(),
            this.loadContacts(),
            this.loadUsers()
        ]);
        this.updateStats();
    }

    async loadScholarships() {
        try {
            const response = await fetch(`${this.API_URL}?action=getMyScholarships`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                this.state.scholarships = result.scholarships;
                this.renderScholarships();
            }
        } catch (error) {
            console.error('Error loading scholarships:', error);
            this.state.scholarships = [];
            this.renderScholarships();
        }
    }

    async loadApplications() {
        try {
            const response = await fetch(`${this.API_URL}?action=getScholarshipApplications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                this.state.applications = result.applications;
                this.renderApplications();
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            this.state.applications = [];
            this.renderApplications();
        }
    }

    async loadContacts() {
        try {
            const response = await fetch(`${this.API_URL}?action=getContacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                this.state.contacts = result.contacts;
                this.renderContacts();
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            this.state.contacts = [];
            this.renderContacts();
        }
    }

    async loadUsers() {
        try {
            const response = await fetch(`${this.API_URL}?action=getUsers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                this.state.users = result.users;
                this.renderUsers();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.state.users = [];
            this.renderUsers();
        }
    }

    updateStats() {
        document.getElementById('totalScholarships').textContent = this.state.scholarships.length;
        document.getElementById('totalApplications').textContent = this.state.applications.length;
        document.getElementById('pendingApplications').textContent = this.state.applications.filter(a => a.status === 'pending').length;
        document.getElementById('totalUsers').textContent = this.state.users.length;
    }

    renderScholarships() {
        const tbody = document.getElementById('scholarshipsTableBody');
        if (!tbody) return;
        
        const search = (document.getElementById('searchScholarships')?.value || '').toLowerCase();
        const filterType = document.getElementById('filterScholarshipType')?.value || 'all';
        const filterStatus = document.getElementById('filterScholarshipStatus')?.value || 'all';
        
        let scholarships = this.state.scholarships.filter(s => {
            const matchSearch = s.title.toLowerCase().includes(search);
            const matchType = filterType === 'all' || s.scholarship_type === filterType;
            const matchStatus = filterStatus === 'all' || s.status === filterStatus;
            return matchSearch && matchType && matchStatus;
        });
        
        if (scholarships.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No scholarships found</td></tr>';
            return;
        }
        
        tbody.innerHTML = scholarships.map(s => `
            <tr>
                <td><strong>${s.title}</strong></td>
                <td><span class="card-type">${s.scholarship_type}</span></td>
                <td><strong>NPR ${Number(s.amount).toLocaleString()}</strong></td>
                <td>${this.formatDate(s.deadline)}</td>
                <td>${s.applications_count || 0}</td>
                <td><span class="status-badge status-${s.status}">${s.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-action btn-edit" onclick="adminPortal.editScholarship(${s.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="adminPortal.deleteScholarship(${s.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderApplications() {
        const tbody = document.getElementById('applicationsTableBody');
        if (!tbody) return;
        
        const filterStatus = document.getElementById('filterApplicationStatus')?.value || 'all';
        let applications = this.state.applications;
        
        if (filterStatus !== 'all') {
            applications = applications.filter(a => a.status === filterStatus);
        }
        
        if (applications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No applications found</td></tr>';
            return;
        }
        
        tbody.innerHTML = applications.map(app => `
            <tr>
                <td><strong>${app.student_name}</strong></td>
                <td>${app.scholarship_title}</td>
                <td>${app.student_email}</td>
                <td>${this.formatDate(app.applied_at)}</td>
                <td><span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-action btn-view" onclick="adminPortal.viewApplication(${app.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${app.status === 'pending' ? `
                        <button class="btn-action btn-edit" onclick="adminPortal.updateStatus(${app.id}, 'accepted')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="adminPortal.updateStatus(${app.id}, 'rejected')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    renderContacts() {
        const tbody = document.getElementById('contactsTableBody');
        if (!tbody) return;
        
        if (this.state.contacts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No contacts found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.state.contacts.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.email}</td>
                <td>${c.phone || 'N/A'}</td>
                <td>${(c.address || '').substring(0, 50)}...</td>
                <td>${this.formatDate(c.created_at)}</td>
                <td>
                    <button class="btn-action btn-delete" onclick="adminPortal.deleteContact(${c.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (this.state.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.state.users.map(u => `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="role-badge role-${u.role}">${u.role.toUpperCase()}</span></td>
                <td>${this.formatDate(u.created_at)}</td>
                <td><span class="status-badge status-active">Active</span></td>
            </tr>
        `).join('');
    }

    async handleScholarshipSubmit(e) {
        e.preventDefault();
        
        const data = {
            title: document.getElementById('scholarshipTitle').value,
            scholarship_type: document.getElementById('scholarshipType').value,
            amount: document.getElementById('scholarshipAmount').value,
            deadline: document.getElementById('scholarshipDeadline').value,
            description: document.getElementById('scholarshipDescription').value,
            eligibility: document.getElementById('scholarshipEligibility').value,
            status: document.getElementById('scholarshipStatus').value
        };
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        try {
            const response = await fetch(`${this.API_URL}?action=createScholarship`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Scholarship created successfully!', 'success');
                e.target.reset();
                this.closeAllModals();
                await this.loadScholarships();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save Scholarship';
        }
    }

    editScholarship(id) {
        const scholarship = this.state.scholarships.find(s => s.id === id);
        if (!scholarship) return;
        this.showToast(`Edit feature for: ${scholarship.title}`, 'info');
    }

    async deleteScholarship(id) {
        if (!confirm('Delete this scholarship?')) return;
        
        try {
            const response = await fetch(`${this.API_URL}?action=deleteScholarship`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Scholarship deleted!', 'success');
                await this.loadScholarships();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('Failed to delete', 'error');
        }
    }

    viewApplication(id) {
        const app = this.state.applications.find(a => a.id === id);
        if (!app) return;
        this.showToast(`Viewing application from ${app.student_name}`, 'info');
    }

    async updateStatus(id, status) {
        try {
            const response = await fetch(`${this.API_URL}?action=updateApplicationStatus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Application ${status}!`, 'success');
                await this.loadApplications();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('Failed to update status', 'error');
        }
    }

    async deleteContact(id) {
        if (!confirm('Delete this contact?')) return;
        
        try {
            const response = await fetch(`${this.API_URL}?action=deleteContact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Contact deleted!', 'success');
                await this.loadContacts();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('Failed to delete', 'error');
        }
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    }
}

// Initialize
let adminPortal;
document.addEventListener('DOMContentLoaded', () => {
    adminPortal = new AdminPortal();
    window.adminPortal = adminPortal;
});