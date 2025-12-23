// Student Portal - FINAL COMPLETE WORKING VERSION
class StudentPortal {
    constructor() {
        this.state = {
            user: null,
            scholarships: [],
            applications: [],
            profile: null
        };
        this.API_URL = 'api.php';
        this.init();
    }

    async init() {
        await this.checkAuth();
        if (this.state.user) {
            this.setupEventListeners();
            await this.loadAllData();
        }
    }

    async checkAuth() {
        const userData = localStorage.getItem('scholarship_user');
        if (userData) {
            try {
                this.state.user = JSON.parse(userData);
                if (this.state.user.role === 'student') {
                    this.showDashboard();
                } else {
                    alert('Student access only');
                    window.location.href = 'index.html';
                }
            } catch (e) {
                alert('Please login first');
                window.location.href = 'index.html';
            }
        } else {
            alert('Please login first');
            window.location.href = 'index.html';
        }
    }

    showDashboard() {
        this.updateUserInfo();
        this.switchTab('dashboard');
    }

    updateUserInfo() {
        if (!this.state.user) return;
        
        const studentName = document.getElementById('studentName');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const studentAvatar = document.getElementById('studentAvatar');
        
        if (studentName) studentName.textContent = this.state.user.name;
        if (welcomeMessage) welcomeMessage.textContent = `Welcome back, ${this.state.user.name}!`;
        
        if (studentAvatar) {
            const initials = this.state.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            studentAvatar.innerHTML = `<span>${initials}</span>`;
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.student-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(link.dataset.tab);
            });
        });
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Search and filters
        const searchInput = document.getElementById('searchInput');
        const filterType = document.getElementById('filterType');
        const sortBy = document.getElementById('sortBy');
        const filterApplicationStatus = document.getElementById('filterApplicationStatus');
        
        if (searchInput) searchInput.addEventListener('input', () => this.renderScholarships());
        if (filterType) filterType.addEventListener('change', () => this.renderScholarships());
        if (sortBy) sortBy.addEventListener('change', () => this.renderScholarships());
        if (filterApplicationStatus) filterApplicationStatus.addEventListener('change', () => this.renderApplications());
        
        // Profile form
        const profileForm = document.getElementById('studentProfileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }
        
        // Application modal
        const closeModal = document.getElementById('closeApplicationModal');
        const cancelApp = document.getElementById('cancelApplication');
        const appForm = document.getElementById('applicationForm');
        
        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        if (cancelApp) cancelApp.addEventListener('click', () => this.closeModal());
        if (appForm) appForm.addEventListener('submit', (e) => this.submitApplication(e));
    }

    switchTab(tab) {
        // Update navigation
        document.querySelectorAll('.student-nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tab);
        });
        
        // Update sections
        document.querySelectorAll('.student-tab-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${tab}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
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
            case 'profile':
                this.renderProfile();
                break;
        }
    }

    async loadAllData() {
        await Promise.all([
            this.loadScholarships(),
            this.loadApplications(),
            this.loadProfile()
        ]);
        this.updateStats();
    }

    async loadScholarships() {
        try {
            const response = await fetch(`${this.API_URL}?action=getAllScholarships`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                this.state.scholarships = result.scholarships || [];
                this.renderScholarships();
            }
        } catch (error) {
            console.error('Error loading scholarships:', error);
            alert('Failed to load scholarships. Please refresh the page.');
        }
    }

    async loadApplications() {
        try {
            const response = await fetch(`${this.API_URL}?action=getMyApplications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: this.state.user.id })
            });
            const result = await response.json();
            if (result.success) {
                this.state.applications = result.applications || [];
                this.renderApplications();
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    }

    async loadProfile() {
        try {
            const response = await fetch(`${this.API_URL}?action=getProfile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: this.state.user.id })
            });
            const result = await response.json();
            if (result.success) {
                this.state.profile = result.profile;
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    renderScholarships() {
        const container = document.getElementById('studentScholarshipsGrid');
        if (!container) return;
        
        const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const filterType = document.getElementById('filterType')?.value || 'all';
        const sortBy = document.getElementById('sortBy')?.value || 'newest';
        
        let scholarships = this.state.scholarships.filter(s => {
            const matchSearch = s.title.toLowerCase().includes(search) || (s.description || '').toLowerCase().includes(search);
            const matchType = filterType === 'all' || s.scholarship_type === filterType;
            return matchSearch && matchType;
        });
        
        // Sort
        scholarships.sort((a, b) => {
            switch (sortBy) {
                case 'newest': return new Date(b.created_at) - new Date(a.created_at);
                case 'deadline': return new Date(a.deadline) - new Date(b.deadline);
                case 'amount': return b.amount - a.amount;
                default: return 0;
            }
        });
        
        if (scholarships.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No scholarships found</h3></div>';
            return;
        }
        
        container.innerHTML = scholarships.map(s => {
            const hasApplied = this.state.applications.some(app => app.scholarship_id == s.id);
            const daysLeft = this.getDaysLeft(s.deadline);
            
            return `
                <div class="student-scholarship-card">
                    <span class="scholarship-badge">${s.scholarship_type}</span>
                    
                    <div class="scholarship-header">
                        <div>
                            <h3 class="scholarship-title">${s.title}</h3>
                            <div class="scholarship-meta">
                                <span><i class="fas fa-user-tie"></i> ${s.admin_name || 'Admin'}</span>
                            </div>
                        </div>
                        <div class="scholarship-amount">NPR ${Number(s.amount).toLocaleString()}</div>
                    </div>
                    
                    <p class="scholarship-description">${s.description || 'No description'}</p>
                    
                    <div class="scholarship-details">
                        <div class="detail-item">
                            <div class="detail-icon"><i class="fas fa-calendar"></i></div>
                            <div class="detail-content">
                                <div class="detail-label">Deadline</div>
                                <div class="detail-value">${this.formatDate(s.deadline)}</div>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon"><i class="fas fa-clock"></i></div>
                            <div class="detail-content">
                                <div class="detail-label">Days Left</div>
                                <div class="detail-value">${daysLeft}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scholarship-footer">
                        <button class="btn btn-primary" 
                                onclick="studentPortal.applyScholarship(${s.id})"
                                ${hasApplied ? 'disabled' : ''}>
                            <i class="fas fa-${hasApplied ? 'check' : 'paper-plane'}"></i>
                            ${hasApplied ? 'Applied' : 'Apply Now'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderApplications() {
        const container = document.getElementById('studentApplicationsGrid');
        if (!container) return;
        
        const filterStatus = document.getElementById('filterApplicationStatus')?.value || 'all';
        let applications = this.state.applications;
        
        if (filterStatus !== 'all') {
            applications = applications.filter(a => a.status === filterStatus);
        }
        
        if (applications.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-file-alt"></i><h3>No applications found</h3></div>';
            return;
        }
        
        container.innerHTML = applications.map(app => {
            const statusIcon = app.status === 'accepted' ? 'fa-check-circle' : 
                              app.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';
            
            return `
                <div class="application-card">
                    <div class="application-header">
                        <h4>${app.title}</h4>
                        <span class="application-status status-${app.status}">
                            <i class="fas ${statusIcon}"></i>
                            ${app.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="application-details">
                        <div class="detail-row">
                            <span><i class="fas fa-money-bill-wave"></i> Amount:</span>
                            <span>NPR ${Number(app.amount).toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span><i class="fas fa-calendar"></i> Applied:</span>
                            <span>${this.formatDate(app.applied_at)}</span>
                        </div>
                    </div>
                    
                    ${app.status === 'pending' ? `
                        <div class="application-actions">
                            <button class="btn btn-outline btn-sm" onclick="studentPortal.withdrawApplication(${app.id})">
                                <i class="fas fa-trash"></i> Withdraw
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderProfile() {
        if (!this.state.user) return;
        
        const profileName = document.getElementById('studentProfileName');
        const profileEmail = document.getElementById('studentProfileEmail');
        const profileAvatar = document.getElementById('studentProfileAvatar');
        
        if (profileName) profileName.textContent = this.state.user.name;
        if (profileEmail) profileEmail.textContent = this.state.user.email;
        
        if (profileAvatar) {
            const initials = this.state.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            profileAvatar.innerHTML = `<span>${initials}</span>`;
        }
        
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const phoneInput = document.getElementById('profilePhone');
        const addressInput = document.getElementById('profileAddress');
        const educationInput = document.getElementById('profileEducation');
        const skillsInput = document.getElementById('profileSkills');
        
        if (nameInput) nameInput.value = this.state.user.name;
        if (emailInput) emailInput.value = this.state.user.email;
        
        if (this.state.profile) {
            if (phoneInput) phoneInput.value = this.state.profile.phone || '';
            if (addressInput) addressInput.value = this.state.profile.address || '';
            if (educationInput) educationInput.value = this.state.profile.education || '';
            if (skillsInput) skillsInput.value = this.state.profile.skills || '';
        }
    }

    applyScholarship(id) {
        const hasApplied = this.state.applications.some(app => app.scholarship_id == id);
        if (hasApplied) {
            alert('You have already applied to this scholarship');
            return;
        }
        
        const scholarship = this.state.scholarships.find(s => s.id == id);
        if (!scholarship) return;
        
        const modal = document.getElementById('applicationModal');
        const preview = document.getElementById('scholarshipPreview');
        
        modal.dataset.scholarshipId = id;
        
        if (preview) {
            preview.innerHTML = `
                <h4>${scholarship.title}</h4>
                <div class="preview-details">
                    <p><strong>Amount:</strong> NPR ${Number(scholarship.amount).toLocaleString()}</p>
                    <p><strong>Deadline:</strong> ${this.formatDate(scholarship.deadline)}</p>
                    <p><strong>Type:</strong> ${scholarship.scholarship_type}</p>
                </div>
            `;
        }
        
        if (modal) modal.classList.add('active');
    }

    async submitApplication(e) {
        e.preventDefault();
        
        const modal = document.getElementById('applicationModal');
        const scholarshipId = parseInt(modal.dataset.scholarshipId);
        const messageInput = document.getElementById('applicationMessage');
        const message = messageInput ? messageInput.value : '';
        
        if (!message.trim()) {
            alert('Please provide a message');
            return;
        }
        
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        }
        
        try {
            const response = await fetch(`${this.API_URL}?action=applyScholarship`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    scholarship_id: scholarshipId,
                    student_id: this.state.user.id,
                    message: message 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Application submitted successfully!');
                this.closeModal();
                e.target.reset();
                await this.loadApplications();
                this.updateStats();
                this.renderScholarships();
            } else {
                alert(result.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Network error. Please try again.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
            }
        }
    }

    async withdrawApplication(id) {
        if (!confirm('Are you sure you want to withdraw this application?')) return;
        
        try {
            const response = await fetch(`${this.API_URL}?action=withdrawApplication`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: id,
                    student_id: this.state.user.id 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Application withdrawn successfully');
                await this.loadApplications();
                this.updateStats();
                this.renderScholarships();
            } else {
                alert(result.message || 'Failed to withdraw application');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    async saveProfile(e) {
        e.preventDefault();
        
        const phoneInput = document.getElementById('profilePhone');
        const addressInput = document.getElementById('profileAddress');
        const educationInput = document.getElementById('profileEducation');
        const skillsInput = document.getElementById('profileSkills');
        
        const data = {
            user_id: this.state.user.id,
            phone: phoneInput ? phoneInput.value : '',
            address: addressInput ? addressInput.value : '',
            education: educationInput ? educationInput.value : '',
            skills: skillsInput ? skillsInput.value : ''
        };
        
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }
        
        try {
            const response = await fetch(`${this.API_URL}?action=saveProfile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Profile saved successfully!');
                await this.loadProfile();
            } else {
                alert(result.message || 'Failed to save profile');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Network error. Please try again.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Save Profile';
            }
        }
    }

    updateStats() {
        const totalApplied = document.getElementById('totalApplied');
        const pendingApplications = document.getElementById('pendingApplications');
        const acceptedApplications = document.getElementById('acceptedApplications');
        const availableScholarships = document.getElementById('availableScholarships');
        
        if (totalApplied) totalApplied.textContent = this.state.applications.length;
        if (pendingApplications) pendingApplications.textContent = this.state.applications.filter(a => a.status === 'pending').length;
        if (acceptedApplications) acceptedApplications.textContent = this.state.applications.filter(a => a.status === 'accepted').length;
        if (availableScholarships) availableScholarships.textContent = this.state.scholarships.length;
    }

    logout() {
        localStorage.removeItem('scholarship_user');
        alert('Logged out successfully');
        window.location.href = 'index.html';
    }

    closeModal() {
        const modal = document.getElementById('applicationModal');
        const form = document.getElementById('applicationForm');
        
        if (modal) modal.classList.remove('active');
        if (form) form.reset();
    }

    getDaysLeft(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - today;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// Initialize
let studentPortal;
document.addEventListener('DOMContentLoaded', () => {
    studentPortal = new StudentPortal();
    window.studentPortal = studentPortal;
});