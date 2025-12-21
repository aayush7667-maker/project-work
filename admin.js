// Enhanced Admin Portal JavaScript
class AdminPortal {
    constructor() {
        this.state = {
            user: null,
            scholarships: [],
            applications: [],
            contacts: [],
            users: [],
            currentTab: 'dashboard'
        };
        
        this.API = 'api.php';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.initializeClock();
        this.loadInitialData();
    }

    checkAuth() {
        const user = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
        if (user) {
            this.state.user = JSON.parse(user);
            if (this.state.user.role !== 'admin') {
                this.showToast('Admin access required', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            this.showDashboard();
            this.initializeTabs(); // Initialize tabs after showing dashboard
        } else {
            this.showLogin();
        }
    }

    showDashboard() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'grid';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        this.updateUserInfo();
        this.loadStats();
    }

    showLogin() {
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
    }

    initializeTabs() {
        // Hide all tabs first
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Show only the dashboard tab initially
        const dashboardTab = document.getElementById('dashboardTab');
        if (dashboardTab) {
            dashboardTab.style.display = 'block';
            dashboardTab.classList.add('active');
        }
        
        // Make sure other tabs are hidden
        ['scholarshipsTab', 'applicationsTab', 'contactsTab', 'usersTab', 'settingsTab'].forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) {
                tab.style.display = 'none';
                tab.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        // Admin login
        document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => this.handleAdminLogin(e));
        
        // Logout
        document.getElementById('adminLogoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(link.dataset.tab);
            });
        });
        
        // Add scholarship button
        document.getElementById('addScholarshipBtn')?.addEventListener('click', () => {
            this.showAddScholarshipModal();
        });
        
        // Refresh stats
        document.getElementById('refreshStats')?.addEventListener('click', () => {
            this.loadStats();
            this.showToast('Stats refreshed', 'success');
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        });
        
        // Cancel buttons
        document.getElementById('cancelScholarshipModal')?.addEventListener('click', () => {
            document.getElementById('addScholarshipModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        // Scholarship form
        document.getElementById('scholarshipForm')?.addEventListener('submit', (e) => this.handleAddScholarship(e));
        
        // Search and filters
        document.getElementById('searchScholarships')?.addEventListener('input', (e) => this.searchScholarships(e));
        document.getElementById('filterScholarshipType')?.addEventListener('change', (e) => this.filterScholarships(e));
        document.getElementById('filterScholarshipStatus')?.addEventListener('change', (e) => this.filterScholarships(e));
        document.getElementById('filterApplicationStatus')?.addEventListener('change', (e) => this.filterApplications(e));
        
        // View all buttons
        document.getElementById('viewAllActivity')?.addEventListener('click', () => {
            this.switchTab('applications');
        });
        
        document.getElementById('viewAllApplications')?.addEventListener('click', () => {
            this.switchTab('applications');
        });
        
        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const input = toggle.previousElementSibling;
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
                document.body.style.overflow = 'auto';
            }
        });
    }

    initializeClock() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const timeDisplay = document.getElementById('timeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = `${dateString} • ${timeString}`;
            }
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const rememberMe = document.getElementById('rememberMeAdmin')?.checked;
        
        // Validation
        if (!email || !password) {
            this.showToast('Please enter email and password', 'error');
            return;
        }
        
        // Show loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        submitBtn.disabled = true;
        
        try {
            // API call for admin login
            const response = await fetch(`${this.API}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success && result.user.role === 'admin') {
                this.state.user = result.user;
                
                // Store admin user
                if (rememberMe) {
                    localStorage.setItem('admin_user', JSON.stringify(result.user));
                } else {
                    sessionStorage.setItem('admin_user', JSON.stringify(result.user));
                }
                
                this.showToast('Welcome, Administrator!', 'success');
                this.showDashboard();
                this.initializeTabs(); // Initialize tabs after login
                e.target.reset();
                
            } else {
                // Fallback to demo credentials
                if (email === 'admin@scholarnepal.com' && password === 'admin123') {
                    this.state.user = {
                        id: 1,
                        name: 'Administrator',
                        email: 'admin@scholarnepal.com',
                        role: 'admin'
                    };
                    
                    if (rememberMe) {
                        localStorage.setItem('admin_user', JSON.stringify(this.state.user));
                    } else {
                        sessionStorage.setItem('admin_user', JSON.stringify(this.state.user));
                    }
                    
                    this.showToast('Welcome, Administrator!', 'success');
                    this.showDashboard();
                    this.initializeTabs(); // Initialize tabs after login
                    e.target.reset();
                } else {
                    throw new Error(result.message || 'Invalid admin credentials');
                }
            }
            
        } catch (error) {
            this.showToast(error.message || 'Invalid admin credentials', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    handleLogout() {
        localStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_user');
        this.state.user = null;
        this.showLogin();
        this.showToast('Logged out successfully', 'info');
    }

    switchTab(tab) {
        this.state.currentTab = tab;
        
        // Update active sidebar link
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.tab === tab) {
                link.classList.add('active');
                
                // Smooth scroll to top of main content
                document.querySelector('.admin-main').scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
        
        // Hide all tabs first with proper display management
        document.querySelectorAll('.admin-tab').forEach(tabElement => {
            tabElement.style.display = 'none';
            tabElement.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(`${tab}Tab`);
        if (targetTab) {
            targetTab.style.display = 'block';
            // Add a small delay before adding active class for animation
            setTimeout(() => {
                targetTab.classList.add('active');
            }, 10);
            
            // Load data for the tab
            this.loadTabData(tab);
        }
    }

    loadTabData(tab) {
        switch(tab) {
            case 'dashboard':
                this.loadStats();
                break;
            case 'scholarships':
                this.loadScholarships();
                break;
            case 'applications':
                this.loadApplications();
                break;
            case 'contacts':
                this.loadContacts();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'settings':
                // Settings tab doesn't need data loading
                break;
        }
    }

    updateUserInfo() {
        if (!this.state.user) return;
        
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        
        if (adminName) adminName.textContent = this.state.user.name;
        if (adminEmail) adminEmail.textContent = this.state.user.email;
        
        // Create avatar with initials
        const avatar = document.getElementById('adminAvatar');
        if (avatar && this.state.user.name) {
            const initials = this.state.user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            avatar.innerHTML = `<span>${initials}</span>`;
        }
    }

    async loadInitialData() {
        await Promise.all([
            this.loadStats(),
            this.loadScholarships(),
            this.loadApplications(),
            this.loadContacts(),
            this.loadUsers()
        ]);
    }

    loadStats() {
        // Update stats with animation
        this.animateCounter('totalScholarships', this.state.scholarships.length);
        this.animateCounter('totalApplications', this.state.applications.length);
        this.animateCounter('pendingApplications', this.state.applications.filter(a => a.status === 'pending').length);
        this.animateCounter('totalUsers', this.state.users.length);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        
        gsap.to(element, {
            duration: 1,
            innerHTML: targetValue,
            roundProps: 'innerHTML',
            ease: 'power2.out'
        });
    }

    async loadScholarships() {
        try {
            const response = await fetch(`${this.API}?action=getAllScholarships`);
            const result = await response.json();
            
            if (result.success) {
                this.state.scholarships = result.scholarships;
                this.renderScholarships();
            }
        } catch (error) {
            console.error('Error loading scholarships:', error);
            // Use sample data if API fails
            this.state.scholarships = this.getSampleScholarships();
            this.renderScholarships();
        }
    }

    getSampleScholarships() {
        return [
            {
                id: 1,
                title: 'National Science Scholarship 2024',
                scholarship_type: 'Government',
                amount: 150000,
                deadline: '2024-06-30',
                description: 'For students pursuing science and technology degrees',
                eligibility: 'Nepali citizen, minimum GPA 3.0',
                admin_name: 'Ministry of Education',
                status: 'active',
                applications_count: 8,
                created_at: '2024-01-15'
            },
            {
                id: 2,
                title: 'Women in Technology Grant',
                scholarship_type: 'Private',
                amount: 100000,
                deadline: '2024-05-15',
                description: 'Supporting women in STEM fields',
                eligibility: 'Female students in technology programs',
                admin_name: 'TechForAll Foundation',
                status: 'active',
                applications_count: 15,
                created_at: '2024-02-01'
            },
            {
                id: 3,
                title: 'Rural Development Scholarship',
                scholarship_type: 'NGO',
                amount: 75000,
                deadline: '2024-04-30',
                description: 'For students from rural areas',
                eligibility: 'Students from designated rural districts',
                admin_name: 'Nepal Development Fund',
                status: 'active',
                applications_count: 7,
                created_at: '2024-01-20'
            }
        ];
    }

    renderScholarships() {
        const container = document.getElementById('scholarshipsTableBody');
        if (!container) return;
        
        const searchTerm = document.getElementById('searchScholarships')?.value.toLowerCase() || '';
        const filterType = document.getElementById('filterScholarshipType')?.value || 'all';
        const filterStatus = document.getElementById('filterScholarshipStatus')?.value || 'all';
        
        let scholarships = this.state.scholarships.filter(s => {
            const matchesSearch = s.title.toLowerCase().includes(searchTerm) ||
                                 s.description.toLowerCase().includes(searchTerm);
            const matchesType = filterType === 'all' || s.scholarship_type === filterType;
            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            
            return matchesSearch && matchesType && matchesStatus;
        });
        
        if (scholarships.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-search"></i>
                        <div>No scholarships found</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = scholarships.map(s => `
            <tr data-id="${s.id}">
                <td>
                    <strong>${s.title}</strong>
                    <div class="text-small">${s.description.substring(0, 60)}...</div>
                </td>
                <td><span class="card-type">${s.scholarship_type}</span></td>
                <td><strong>NPR ${s.amount.toLocaleString()}</strong></td>
                <td>${this.formatDate(s.deadline)}</td>
                <td>${s.applications_count || 0}</td>
                <td><span class="status-badge status-${s.status}">${s.status.toUpperCase()}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="adminPortal.viewScholarship(${s.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="adminPortal.editScholarship(${s.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="adminPortal.deleteScholarship(${s.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadApplications() {
        if (!this.state.user) return;
        
        try {
            const response = await fetch(`${this.API}?action=getScholarshipApplications&admin_id=${this.state.user.id}`);
            const result = await response.json();
            
            if (result.success) {
                this.state.applications = result.applications;
                this.renderApplications();
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            // Use sample applications
            this.state.applications = this.getSampleApplications();
            this.renderApplications();
        }
    }

    getSampleApplications() {
        return [
            {
                id: 1,
                student_name: 'John Doe',
                student_email: 'john@example.com',
                scholarship_title: 'National Science Scholarship',
                applied_at: '2024-02-15',
                status: 'pending',
                message: 'I am very interested in this scholarship for my research in renewable energy.',
                phone: '+977 9841000001',
                education: 'MSc in Environmental Science',
                skills: 'Research, Data Analysis, Report Writing'
            },
            {
                id: 2,
                student_name: 'Jane Smith',
                student_email: 'jane@example.com',
                scholarship_title: 'Women in Technology Grant',
                applied_at: '2024-02-14',
                status: 'accepted',
                message: 'As a female computer science student, this grant will help me pursue my Masters degree.',
                phone: '+977 9841000002',
                education: 'BSc in Computer Science',
                skills: 'Programming, Web Development, Machine Learning'
            },
            {
                id: 3,
                student_name: 'Robert Johnson',
                student_email: 'robert@example.com',
                scholarship_title: 'Rural Development Scholarship',
                applied_at: '2024-02-13',
                status: 'rejected',
                message: 'I come from a rural background and need support for my engineering studies.',
                phone: '+977 9841000003',
                education: 'B.E. in Civil Engineering',
                skills: 'AutoCAD, Project Management, Structural Analysis'
            }
        ];
    }

    renderApplications() {
        const container = document.getElementById('applicationsTableBody');
        if (!container) return;
        
        const filterStatus = document.getElementById('filterApplicationStatus')?.value || 'all';
        
        let applications = this.state.applications;
        if (filterStatus !== 'all') {
            applications = applications.filter(app => app.status === filterStatus);
        }
        
        if (applications.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <div>No applications found</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = applications.map(app => `
            <tr data-id="${app.id}">
                <td>
                    <strong>${app.student_name}</strong>
                    <div class="text-small">ID: ${app.id}</div>
                </td>
                <td>${app.scholarship_title}</td>
                <td>${app.student_email}</td>
                <td>${this.formatDate(app.applied_at)}</td>
                <td><span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="adminPortal.viewApplication(${app.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="adminPortal.updateApplicationStatus(${app.id}, 'accepted')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="adminPortal.updateApplicationStatus(${app.id}, 'rejected')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadContacts() {
        try {
            const response = await fetch(`${this.API}?action=getContacts`);
            const result = await response.json();
            
            if (result.success) {
                this.state.contacts = result.contacts;
                this.renderContacts();
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            // Use sample contacts
            this.state.contacts = this.getSampleContacts();
            this.renderContacts();
        }
    }

    getSampleContacts() {
        return [
            {
                id: 1,
                name: 'Sarah Williams',
                email: 'sarah@example.com',
                phone: '+977 9841XXXXXX',
                message: 'I would like to know more about the application process.',
                created_at: '2024-02-12'
            },
            {
                id: 2,
                name: 'Michael Brown',
                email: 'michael@example.com',
                phone: '+977 9813XXXXXX',
                message: 'Can international students apply for these scholarships?',
                created_at: '2024-02-10'
            }
        ];
    }

    renderContacts() {
        const container = document.getElementById('contactsTableBody');
        if (!container) return;
        
        if (this.state.contacts.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-comments"></i>
                        <div>No contact inquiries</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = this.state.contacts.map(contact => `
            <tr data-id="${contact.id}">
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.phone}</td>
                <td>${contact.message.substring(0, 50)}...</td>
                <td>${this.formatDate(contact.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="adminPortal.viewContact(${contact.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="adminPortal.deleteContact(${contact.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadUsers() {
        // This would typically come from an API
        // For now, use sample data
        this.state.users = [
            {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                role: 'student',
                joined: '2024-01-15',
                status: 'active'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'student',
                joined: '2024-01-20',
                status: 'active'
            },
            {
                id: 3,
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'admin',
                joined: '2024-01-01',
                status: 'active'
            }
        ];
        
        this.renderUsers();
    }

    renderUsers() {
        const container = document.getElementById('usersTableBody');
        if (!container) return;
        
        if (this.state.users.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-users"></i>
                        <div>No users found</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = this.state.users.map(user => `
            <tr data-id="${user.id}">
                <td>
                    <strong>${user.name}</strong>
                    <div class="text-small">ID: ${user.id}</div>
                </td>
                <td>${user.email}</td>
                <td><span class="role-badge role-${user.role}">${user.role.toUpperCase()}</span></td>
                <td>${this.formatDate(user.joined)}</td>
                <td><span class="status-badge status-${user.status}">${user.status.toUpperCase()}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="adminPortal.viewUser(${user.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="adminPortal.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showAddScholarshipModal() {
        const modal = document.getElementById('addScholarshipModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    async handleAddScholarship(e) {
        e.preventDefault();
        
        if (!this.state.user) return;
        
        const form = e.target;
        const title = form.querySelector('#scholarshipTitle').value;
        const type = form.querySelector('#scholarshipType').value;
        const amount = form.querySelector('#scholarshipAmount').value;
        const deadline = form.querySelector('#scholarshipDeadline').value;
        const description = form.querySelector('#scholarshipDescription').value;
        const eligibility = form.querySelector('#scholarshipEligibility').value;
        const status = form.querySelector('#scholarshipStatus').value;
        
        // Validation
        if (!title || !amount || !deadline || !eligibility) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        try {
            // API call would go here
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create new scholarship
            const newScholarship = {
                id: Date.now(),
                title,
                scholarship_type: type,
                amount: parseInt(amount),
                deadline,
                description,
                eligibility,
                status,
                admin_name: this.state.user.name,
                applications_count: 0,
                created_at: new Date().toISOString()
            };
            
            this.state.scholarships.unshift(newScholarship);
            
            this.showToast('Scholarship added successfully!', 'success');
            form.reset();
            
            const modal = document.getElementById('addScholarshipModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            
            // Update UI
            this.loadStats();
            this.renderScholarships();
            
        } catch (error) {
            this.showToast('Failed to add scholarship', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    viewScholarship(id) {
        const scholarship = this.state.scholarships.find(s => s.id === id);
        if (!scholarship) return;
        
        this.showToast(`Viewing: ${scholarship.title}`, 'info');
        // In a real app, this would open a detailed view modal
    }

    editScholarship(id) {
        const scholarship = this.state.scholarships.find(s => s.id === id);
        if (!scholarship) return;
        
        // Pre-fill the add scholarship form with existing data
        const form = document.getElementById('scholarshipForm');
        if (form) {
            form.querySelector('#scholarshipTitle').value = scholarship.title;
            form.querySelector('#scholarshipType').value = scholarship.scholarship_type;
            form.querySelector('#scholarshipAmount').value = scholarship.amount;
            form.querySelector('#scholarshipDeadline').value = scholarship.deadline.split('T')[0];
            form.querySelector('#scholarshipDescription').value = scholarship.description || '';
            form.querySelector('#scholarshipEligibility').value = scholarship.eligibility;
            form.querySelector('#scholarshipStatus').value = scholarship.status;
            
            // Change button text
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Scholarship';
            
            // Store scholarship ID
            form.dataset.editId = id;
            
            // Show modal
            this.showAddScholarshipModal();
        }
        
        this.showToast(`Editing: ${scholarship.title}`, 'info');
    }

    deleteScholarship(id) {
        if (confirm('Are you sure you want to delete this scholarship?')) {
            this.state.scholarships = this.state.scholarships.filter(s => s.id !== id);
            this.showToast('Scholarship deleted successfully', 'success');
            this.renderScholarships();
            this.loadStats();
        }
    }

    viewApplication(id) {
        const application = this.state.applications.find(a => a.id === id);
        if (!application) return;
        
        const modal = document.getElementById('viewApplicationModal');
        const body = document.getElementById('applicationModalBody');
        
        if (!modal || !body) return;
        
        body.innerHTML = `
            <div class="application-details">
                <div class="detail-group">
                    <h3>Student Information</h3>
                    <p><strong>Name:</strong> ${application.student_name}</p>
                    <p><strong>Email:</strong> ${application.student_email}</p>
                    <p><strong>Phone:</strong> ${application.phone || 'N/A'}</p>
                    <p><strong>Education:</strong> ${application.education || 'N/A'}</p>
                    <p><strong>Skills:</strong> ${application.skills || 'N/A'}</p>
                </div>
                
                <div class="detail-group">
                    <h3>Scholarship</h3>
                    <p><strong>Applied for:</strong> ${application.scholarship_title}</p>
                    <p><strong>Applied on:</strong> ${this.formatDate(application.applied_at)}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${application.status}">${application.status.toUpperCase()}</span></p>
                </div>
                
                <div class="detail-group">
                    <h3>Application Message</h3>
                    <div class="message-box">
                        ${application.message || 'No message provided.'}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="adminPortal.updateApplicationStatus(${application.id}, 'accepted')">
                        <i class="fas fa-check"></i> Accept Application
                    </button>
                    <button class="btn btn-danger" onclick="adminPortal.updateApplicationStatus(${application.id}, 'rejected')">
                        <i class="fas fa-times"></i> Reject Application
                    </button>
                    <button class="btn btn-outline" onclick="adminPortal.closeModal('viewApplicationModal')">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    updateApplicationStatus(id, status) {
        const application = this.state.applications.find(a => a.id === id);
        if (!application) return;
        
        application.status = status;
        this.showToast(`Application ${status} successfully`, 'success');
        
        // Close modal if open
        this.closeModal('viewApplicationModal');
        
        // Update UI
        this.renderApplications();
        this.loadStats();
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    viewContact(id) {
        const contact = this.state.contacts.find(c => c.id === id);
        if (!contact) return;
        
        this.showToast(`Viewing contact from: ${contact.name}`, 'info');
        // In a real app, this would open a view modal
    }

    deleteContact(id) {
        if (confirm('Are you sure you want to delete this contact?')) {
            this.state.contacts = this.state.contacts.filter(c => c.id !== id);
            this.showToast('Contact deleted successfully', 'success');
            this.renderContacts();
        }
    }

    viewUser(id) {
        const user = this.state.users.find(u => u.id === id);
        if (!user) return;
        
        this.showToast(`Viewing user: ${user.name}`, 'info');
    }

    editUser(id) {
        const user = this.state.users.find(u => u.id === id);
        if (!user) return;
        
        this.showToast(`Editing user: ${user.name}`, 'info');
    }

    searchScholarships(e) {
        this.renderScholarships();
    }

    filterScholarships(e) {
        this.renderScholarships();
    }

    filterApplications(e) {
        this.renderApplications();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }
}

// Initialize admin portal
let adminPortal;

document.addEventListener('DOMContentLoaded', () => {
    adminPortal = new AdminPortal();
    window.adminPortal = adminPortal;
});
