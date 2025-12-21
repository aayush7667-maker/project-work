// Enhanced Student Portal JavaScript
class StudentPortal {
    constructor() {
        this.state = {
            user: null,
            scholarships: [],
            applications: [],
            profile: null,
            filters: {
                type: 'all',
                search: '',
                sort: 'newest',
                eligibility: 'all'
            },
            pagination: {
                currentPage: 1,
                itemsPerPage: 6,
                totalItems: 0
            }
        };
        
        this.API = 'api.php';
        this.init();
    }

    async init() {
        await this.checkAuth();
        if (this.state.user) {
            this.setupEventListeners();
            this.initializeAnimations();
            this.loadInitialData();
        }
    }

    async checkAuth() {
        try {
            console.log('StudentPortal: Checking authentication...');
            
            // Check for user in localStorage
            const userData = localStorage.getItem('user');
            const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
            
            console.log('StudentPortal: User data:', userData);
            console.log('StudentPortal: Is authenticated:', isAuthenticated);
            
            if (userData && isAuthenticated) {
                const user = JSON.parse(userData);
                console.log('StudentPortal: Parsed user:', user);
                
                // Check if user has student role
                if (user.role && user.role === 'student') {
                    this.state.user = user;
                    console.log('StudentPortal: User authenticated as student');
                    this.showDashboard();
                    return;
                } else {
                    console.log('StudentPortal: User is not a student, role:', user.role);
                    this.showToast('Please login as student to access this portal', 'error');
                }
            } else {
                console.log('StudentPortal: No valid authentication found');
            }
            
            // If we get here, authentication failed
            console.log('StudentPortal: Authentication failed, redirecting to index.html');
            this.redirectToIndex();
            
        } catch (error) {
            console.error('StudentPortal: Error checking auth:', error);
            this.showToast('Authentication error. Please login again.', 'error');
            this.redirectToIndex();
        }
    }

    redirectToIndex() {
        // Clear any invalid auth data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        
        // Redirect to index after delay
        setTimeout(() => {
            console.log('StudentPortal: Redirecting to index.html');
            window.location.href = 'index.html';
        }, 2000);
    }

    showDashboard() {
        console.log('StudentPortal: Showing dashboard');
        // Update UI for logged in student
        this.updateUserInfo();
        this.switchTab('dashboard');
        
        // Animate welcome banner
        gsap.from('.welcome-banner', {
            duration: 1,
            y: 50,
            opacity: 0,
            ease: 'power3.out'
        });
    }

    showLogin() {
        console.log('StudentPortal: Redirecting to login');
        window.location.href = 'index.html';
    }

    setupEventListeners() {
        console.log('StudentPortal: Setting up event listeners');
        
        // Navigation
        document.querySelectorAll('.student-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.closest('.student-nav-link').dataset.tab || 'dashboard';
                console.log('StudentPortal: Switching to tab:', tab);
                this.switchTab(tab);
            });
        });
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('StudentPortal: Logout clicked');
                this.logout();
            });
        } else {
            console.error('StudentPortal: Logout button not found');
        }
        
        // Quick Actions
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                console.log('StudentPortal: Quick action:', action);
                this.handleQuickAction(action);
            });
        });
        
        // Scholarships
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }
        
        const filterType = document.getElementById('filterType');
        if (filterType) {
            filterType.addEventListener('change', (e) => this.handleFilter(e));
        }
        
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => this.handleSort(e));
        }
        
        const filterEligibility = document.getElementById('filterEligibility');
        if (filterEligibility) {
            filterEligibility.addEventListener('change', (e) => this.handleEligibilityFilter(e));
        }
        
        // Applications
        const filterApplicationStatus = document.getElementById('filterApplicationStatus');
        if (filterApplicationStatus) {
            filterApplicationStatus.addEventListener('change', (e) => this.filterApplications(e));
        }
        
        // Profile
        const studentProfileForm = document.getElementById('studentProfileForm');
        if (studentProfileForm) {
            studentProfileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }
        
        const accountSettingsForm = document.getElementById('accountSettingsForm');
        if (accountSettingsForm) {
            accountSettingsForm.addEventListener('submit', (e) => this.changePassword(e));
        }
        
        // Modals
        const closeApplicationModal = document.getElementById('closeApplicationModal');
        if (closeApplicationModal) {
            closeApplicationModal.addEventListener('click', () => this.closeModal('applicationModal'));
        }
        
        const cancelApplication = document.getElementById('cancelApplication');
        if (cancelApplication) {
            cancelApplication.addEventListener('click', () => this.closeModal('applicationModal'));
        }
        
        const closeViewModal = document.getElementById('closeViewModal');
        if (closeViewModal) {
            closeViewModal.addEventListener('click', () => this.closeModal('viewScholarshipModal'));
        }
        
        // Application form
        const applicationForm = document.getElementById('applicationForm');
        if (applicationForm) {
            applicationForm.addEventListener('submit', (e) => this.submitApplication(e));
        }
        
        // File upload
        const documentUpload = document.getElementById('documentUpload');
        if (documentUpload) {
            documentUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Load more
        const loadMoreScholarships = document.getElementById('loadMoreScholarships');
        if (loadMoreScholarships) {
            loadMoreScholarships.addEventListener('click', () => this.loadMoreScholarships());
        }
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('student-modal')) {
                e.target.classList.remove('active');
            }
        });
        
        // Close modals on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('applicationModal');
                this.closeModal('viewScholarshipModal');
            }
        });
        
        console.log('StudentPortal: Event listeners setup complete');
    }

    initializeAnimations() {
        console.log('StudentPortal: Initializing animations');
        // Animate stat cards
        gsap.utils.toArray('.student-stat-card').forEach((card, i) => {
            gsap.from(card, {
                duration: 0.8,
                y: 30,
                opacity: 0,
                delay: i * 0.1,
                ease: 'power3.out'
            });
        });
        
        // Animate quick actions
        gsap.utils.toArray('.quick-action-card').forEach((card, i) => {
            gsap.from(card, {
                duration: 0.8,
                y: 30,
                opacity: 0,
                delay: i * 0.1 + 0.3,
                ease: 'power3.out'
            });
        });
    }

    async loadInitialData() {
        console.log('StudentPortal: Loading initial data');
        try {
            await Promise.all([
                this.loadScholarships(),
                this.loadApplications(),
                this.loadProfile()
            ]);
            
            this.updateDashboardStats();
            this.renderUpcomingDeadlines();
            this.renderRecentActivity();
            
            console.log('StudentPortal: Initial data loaded successfully');
        } catch (error) {
            console.error('StudentPortal: Error loading initial data:', error);
            this.showToast('Failed to load data', 'error');
        }
    }

    switchTab(tab) {
        console.log('StudentPortal: Switching to tab:', tab);
        // Update active navigation
        document.querySelectorAll('.student-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-tab="${tab}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Hide all sections
        document.querySelectorAll('.student-tab-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${tab}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Animate section in
            gsap.from(targetSection, {
                duration: 0.5,
                opacity: 0,
                y: 20,
                ease: 'power3.out'
            });
            
            // Load data for the tab
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
    }

    handleQuickAction(action) {
        console.log('StudentPortal: Handling quick action:', action);
        switch(action) {
            case 'search':
                this.switchTab('scholarships');
                break;
            case 'apply':
                this.showApplicationModal(1); // Example scholarship ID
                break;
            case 'track':
                this.switchTab('applications');
                break;
            case 'profile':
                this.switchTab('profile');
                break;
        }
    }

    async loadScholarships() {
        console.log('StudentPortal: Loading scholarships');
        try {
            // Use sample data for now
            this.state.scholarships = this.getSampleScholarships();
            this.state.pagination.totalItems = this.state.scholarships.length;
            this.renderScholarships();
            console.log('StudentPortal: Scholarships loaded:', this.state.scholarships.length);
        } catch (error) {
            console.error('StudentPortal: Error loading scholarships:', error);
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
                created_at: '2024-01-20'
            },
            {
                id: 4,
                title: 'Engineering Excellence Award',
                scholarship_type: 'Private',
                amount: 200000,
                deadline: '2024-07-31',
                description: 'For outstanding engineering students',
                eligibility: 'Engineering students with GPA 3.5+',
                admin_name: 'Engineering Association of Nepal',
                created_at: '2024-02-10'
            },
            {
                id: 5,
                title: 'Medical Research Grant',
                scholarship_type: 'Government',
                amount: 125000,
                deadline: '2024-05-31',
                description: 'For medical students involved in research',
                eligibility: 'Medical students with research proposals',
                admin_name: 'Department of Health',
                created_at: '2024-01-25'
            },
            {
                id: 6,
                title: 'Arts & Culture Merit Scholarship',
                scholarship_type: 'NGO',
                amount: 60000,
                deadline: '2024-04-15',
                description: 'Supporting arts and culture students',
                eligibility: 'Arts students with portfolio',
                admin_name: 'Cultural Heritage Trust',
                created_at: '2024-02-05'
            }
        ];
    }

    renderScholarships() {
        console.log('StudentPortal: Rendering scholarships');
        const container = document.getElementById('studentScholarshipsGrid');
        if (!container) {
            console.error('StudentPortal: Scholarships grid container not found');
            return;
        }
        
        let scholarships = [...this.state.scholarships];
        
        // Apply filters
        if (this.state.filters.type !== 'all') {
            scholarships = scholarships.filter(s => 
                s.scholarship_type.toLowerCase() === this.state.filters.type.toLowerCase()
            );
        }
        
        if (this.state.filters.search) {
            const searchTerm = this.state.filters.search.toLowerCase();
            scholarships = scholarships.filter(s => 
                s.title.toLowerCase().includes(searchTerm) ||
                s.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply sorting
        scholarships.sort((a, b) => {
            switch (this.state.filters.sort) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'deadline':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'amount':
                    return b.amount - a.amount;
                default:
                    return 0;
            }
        });
        
        // Apply pagination
        const startIndex = (this.state.pagination.currentPage - 1) * this.state.pagination.itemsPerPage;
        const endIndex = startIndex + this.state.pagination.itemsPerPage;
        const paginatedScholarships = scholarships.slice(startIndex, endIndex);
        
        if (paginatedScholarships.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No scholarships found</h3>
                    <p>Try changing your search criteria</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = paginatedScholarships.map(scholarship => {
            const daysLeft = this.daysUntilDeadline(scholarship.deadline);
            const isEligible = this.checkEligibility(scholarship);
            
            return `
                <div class="student-scholarship-card" data-id="${scholarship.id}">
                    <span class="scholarship-badge">${scholarship.scholarship_type}</span>
                    
                    <div class="scholarship-header">
                        <div>
                            <h3 class="scholarship-title">${scholarship.title}</h3>
                            <div class="scholarship-meta">
                                <span><i class="fas fa-user-tie"></i> ${scholarship.admin_name}</span>
                            </div>
                        </div>
                        <div class="scholarship-amount">NPR ${scholarship.amount.toLocaleString()}</div>
                    </div>
                    
                    <p class="scholarship-description">${scholarship.description}</p>
                    
                    <div class="scholarship-details">
                        <div class="detail-item">
                            <div class="detail-icon">
                                <i class="fas fa-calendar"></i>
                            </div>
                            <div class="detail-content">
                                <div class="detail-label">Deadline</div>
                                <div class="detail-value">${this.formatDate(scholarship.deadline)}</div>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <div class="detail-content">
                                <div class="detail-label">Eligibility</div>
                                <div class="detail-value">${scholarship.eligibility.substring(0, 40)}...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="deadline-warning">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${daysLeft} days remaining</span>
                    </div>
                    
                    <div class="scholarship-footer">
                        <button class="btn btn-outline btn-view" onclick="studentPortal.viewScholarship(${scholarship.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn btn-primary btn-apply" 
                                onclick="studentPortal.applyForScholarship(${scholarship.id})"
                                ${!isEligible ? 'disabled' : ''}>
                            <i class="fas fa-paper-plane"></i> Apply Now
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Animate cards in
        gsap.from('.student-scholarship-card', {
            duration: 0.6,
            y: 30,
            opacity: 0,
            stagger: 0.1,
            ease: 'power3.out'
        });
        
        // Update load more button
        this.updateLoadMoreButton(scholarships.length);
    }

    checkEligibility(scholarship) {
        // This is a simplified eligibility check
        // In a real app, this would check the student's profile against the scholarship requirements
        return true;
    }

    viewScholarship(id) {
        console.log('StudentPortal: Viewing scholarship:', id);
        const scholarship = this.state.scholarships.find(s => s.id === id);
        if (!scholarship) return;
        
        const modal = document.getElementById('viewScholarshipModal');
        const title = document.getElementById('scholarshipModalTitle');
        const content = document.getElementById('scholarshipDetailsModal');
        
        title.textContent = scholarship.title;
        
        const daysLeft = this.daysUntilDeadline(scholarship.deadline);
        
        content.innerHTML = `
            <div class="scholarship-preview">
                <div class="preview-header">
                    <span class="scholarship-badge">${scholarship.scholarship_type}</span>
                    <div class="scholarship-amount-large">NPR ${scholarship.amount.toLocaleString()}</div>
                </div>
                
                <div class="preview-details">
                    <div class="detail-group">
                        <h4><i class="fas fa-calendar"></i> Deadline</h4>
                        <p>${this.formatDate(scholarship.deadline)} (${daysLeft} days left)</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4><i class="fas fa-user-tie"></i> Provider</h4>
                        <p>${scholarship.admin_name}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4><i class="fas fa-clock"></i> Posted</h4>
                        <p>${this.formatDate(scholarship.created_at)}</p>
                    </div>
                </div>
                
                <div class="detail-group">
                    <h4><i class="fas fa-graduation-cap"></i> Eligibility Criteria</h4>
                    <p>${scholarship.eligibility}</p>
                </div>
                
                <div class="detail-group">
                    <h4><i class="fas fa-file-alt"></i> Description</h4>
                    <p>${scholarship.description}</p>
                </div>
                
                <div class="detail-group">
                    <h4><i class="fas fa-info-circle"></i> Application Process</h4>
                    <p>Submit your application through this portal before the deadline. You'll need to provide your personal information, academic records, and a statement of purpose.</p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="studentPortal.applyForScholarship(${scholarship.id})">
                    <i class="fas fa-paper-plane"></i> Apply Now
                </button>
                <button class="btn btn-outline" onclick="studentPortal.closeModal('viewScholarshipModal')">
                    Close
                </button>
            </div>
        `;
        
        modal.classList.add('active');
    }

    applyForScholarship(id) {
        console.log('StudentPortal: Applying for scholarship:', id);
        if (!this.state.user) {
            this.showToast('Please login to apply', 'error');
            return;
        }
        
        // Check if already applied
        const existingApplication = this.state.applications.find(app => 
            app.scholarship_id === id
        );
        
        if (existingApplication) {
            this.showToast('You have already applied for this scholarship', 'warning');
            return;
        }
        
        const scholarship = this.state.scholarships.find(s => s.id === id);
        if (!scholarship) return;
        
        const modal = document.getElementById('applicationModal');
        const preview = document.getElementById('scholarshipPreview');
        
        // Store scholarship ID on modal
        modal.dataset.scholarshipId = id;
        
        preview.innerHTML = `
            <h4>${scholarship.title}</h4>
            <div class="preview-details">
                <p><strong>Amount:</strong> NPR ${scholarship.amount.toLocaleString()}</p>
                <p><strong>Deadline:</strong> ${this.formatDate(scholarship.deadline)}</p>
                <p><strong>Type:</strong> ${scholarship.scholarship_type}</p>
            </div>
        `;
        
        modal.classList.add('active');
    }

    async submitApplication(e) {
        e.preventDefault();
        console.log('StudentPortal: Submitting application');
        
        const modal = document.getElementById('applicationModal');
        const scholarshipId = modal.dataset.scholarshipId;
        const message = document.getElementById('applicationMessage').value;
        
        if (!message.trim()) {
            this.showToast('Please provide an application message', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Create new application
            const newApplication = {
                id: Date.now(),
                scholarship_id: scholarshipId,
                title: this.state.scholarships.find(s => s.id == scholarshipId)?.title || 'Scholarship',
                applied_at: new Date().toISOString(),
                status: 'pending'
            };
            
            this.state.applications.unshift(newApplication);
            
            this.showToast('Application submitted successfully!', 'success');
            this.closeModal('applicationModal');
            
            // Reset form
            e.target.reset();
            
            // Update UI
            this.updateDashboardStats();
            this.renderApplications();
            this.renderRecentActivity();
            
        } catch (error) {
            this.showToast('Failed to submit application', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadApplications() {
        if (!this.state.user) return;
        
        console.log('StudentPortal: Loading applications');
        try {
            // Use sample applications for now
            this.state.applications = this.getSampleApplications();
        } catch (error) {
            console.error('StudentPortal: Error loading applications:', error);
            // Use sample applications
            this.state.applications = this.getSampleApplications();
        }
    }

    getSampleApplications() {
        return [
            {
                id: 1,
                scholarship_id: 1,
                title: 'National Science Scholarship 2024',
                amount: 150000,
                applied_at: '2024-02-15',
                status: 'pending',
                message: 'I am very interested in this scholarship for my research'
            },
            {
                id: 2,
                scholarship_id: 2,
                title: 'Women in Technology Grant',
                amount: 100000,
                applied_at: '2024-02-10',
                status: 'accepted',
                message: 'As a female computer science student, this grant will help my studies'
            },
            {
                id: 3,
                scholarship_id: 3,
                title: 'Rural Development Scholarship',
                amount: 75000,
                applied_at: '2024-02-05',
                status: 'rejected',
                message: 'I come from a rural background and need support'
            }
        ];
    }

    renderApplications() {
        console.log('StudentPortal: Rendering applications');
        const container = document.getElementById('studentApplicationsGrid');
        if (!container) return;
        
        const filterStatus = document.getElementById('filterApplicationStatus')?.value || 'all';
        let applications = [...this.state.applications];
        
        if (filterStatus !== 'all') {
            applications = applications.filter(app => app.status === filterStatus);
        }
        
        if (applications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3>No applications found</h3>
                    <p>${filterStatus === 'all' ? 'Apply for scholarships to see them here' : `No ${filterStatus} applications`}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = applications.map(app => {
            const statusClass = `status-${app.status}`;
            const statusIcon = app.status === 'accepted' ? 'fa-check-circle' : 
                              app.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';
            
            return `
                <div class="application-card" data-id="${app.id}">
                    <div class="application-header">
                        <h4>${app.title}</h4>
                        <span class="application-status ${statusClass}">
                            <i class="fas ${statusIcon}"></i>
                            ${app.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="application-details">
                        <div class="detail-row">
                            <span><i class="fas fa-money-bill-wave"></i> Amount:</span>
                            <span>NPR ${app.amount?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span><i class="fas fa-calendar"></i> Applied:</span>
                            <span>${this.formatDate(app.applied_at)}</span>
                        </div>
                        <div class="detail-row">
                            <span><i class="fas fa-clock"></i> Status:</span>
                            <span>${this.getStatusText(app.status)}</span>
                        </div>
                    </div>
                    
                    ${app.message ? `
                        <div class="application-message">
                            <p><strong>Your message:</strong> ${app.message.substring(0, 100)}...</p>
                        </div>
                    ` : ''}
                    
                    <div class="application-actions">
                        <button class="btn btn-outline btn-sm" onclick="studentPortal.viewApplication(${app.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${app.status === 'pending' ? `
                            <button class="btn btn-outline btn-sm" onclick="studentPortal.withdrawApplication(${app.id})">
                                <i class="fas fa-trash"></i> Withdraw
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Under Review',
            'accepted': 'Accepted',
            'rejected': 'Not Selected'
        };
        return statusMap[status] || status;
    }

    viewApplication(id) {
        const application = this.state.applications.find(app => app.id === id);
        if (!application) return;
        
        this.showToast(`Viewing application for: ${application.title}`, 'info');
        // In a real app, this would open a detailed view modal
    }

    withdrawApplication(id) {
        if (confirm('Are you sure you want to withdraw this application?')) {
            this.state.applications = this.state.applications.filter(app => app.id !== id);
            this.showToast('Application withdrawn', 'success');
            this.renderApplications();
            this.updateDashboardStats();
        }
    }

    async loadProfile() {
        if (!this.state.user) return;
        
        console.log('StudentPortal: Loading profile');
        try {
            // Use default profile for demo
            this.state.profile = {
                phone: '+977 9841000000',
                address: 'Kathmandu, Nepal',
                education: 'Master\'s Degree',
                skills: 'Programming, Research, Leadership'
            };
        } catch (error) {
            console.error('StudentPortal: Error loading profile:', error);
            // Use default profile
            this.state.profile = {
                phone: '+977 9841000000',
                address: 'Kathmandu, Nepal',
                education: 'Master\'s Degree',
                skills: 'Programming, Research, Leadership'
            };
        }
    }

    renderProfile() {
        if (!this.state.user) return;
        
        console.log('StudentPortal: Rendering profile');
        // Update profile information
        document.getElementById('studentProfileName').textContent = this.state.user.name;
        document.getElementById('studentProfileEmail').textContent = this.state.user.email;
        
        // Create avatar initials
        const avatar = document.getElementById('studentProfileAvatar');
        if (avatar && this.state.user.name) {
            const initials = this.state.user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            avatar.innerHTML = `<span>${initials}</span><div class="avatar-status"></div>`;
        }
        
        // Fill profile form if profile exists
        if (this.state.profile) {
            const form = document.getElementById('studentProfileForm');
            form.querySelector('#profileName').value = this.state.user.name;
            form.querySelector('#profileEmail').value = this.state.user.email;
            form.querySelector('#profilePhone').value = this.state.profile.phone || '';
            form.querySelector('#profileAddress').value = this.state.profile.address || '';
            form.querySelector('#profileEducation').value = this.state.profile.education || '';
            form.querySelector('#profileSkills').value = this.state.profile.skills || '';
        }
    }

    async saveProfile(e) {
        e.preventDefault();
        
        if (!this.state.user) return;
        
        console.log('StudentPortal: Saving profile');
        const form = e.target;
        const data = {
            user_id: this.state.user.id,
            phone: form.querySelector('#profilePhone').value,
            address: form.querySelector('#profileAddress').value,
            education: form.querySelector('#profileEducation').value,
            skills: form.querySelector('#profileSkills').value
        };
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.state.profile = { ...this.state.profile, ...data };
            this.showToast('Profile saved successfully!', 'success');
            
        } catch (error) {
            this.showToast('Failed to save profile', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async changePassword(e) {
        e.preventDefault();
        
        console.log('StudentPortal: Changing password');
        const form = e.target;
        const currentPassword = form.querySelector('#currentPassword').value;
        const newPassword = form.querySelector('#newPassword').value;
        const confirmPassword = form.querySelector('#confirmPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Please fill in all password fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showToast('Password updated successfully!', 'success');
            form.reset();
            
        } catch (error) {
            this.showToast('Failed to update password', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    updateDashboardStats() {
        console.log('StudentPortal: Updating dashboard stats');
        const applied = this.state.applications.length;
        const pending = this.state.applications.filter(app => app.status === 'pending').length;
        const accepted = this.state.applications.filter(app => app.status === 'accepted').length;
        const available = this.state.scholarships.filter(s => 
            new Date(s.deadline) > new Date()
        ).length;
        
        // Update counters with animation
        this.animateCounter('totalApplied', applied);
        this.animateCounter('pendingApplications', pending);
        this.animateCounter('acceptedApplications', accepted);
        this.animateCounter('availableScholarships', available);
        
        // Update welcome message
        if (this.state.user) {
            document.getElementById('welcomeMessage').textContent = `Welcome back, ${this.state.user.name}!`;
        }
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

    renderUpcomingDeadlines() {
        console.log('StudentPortal: Rendering upcoming deadlines');
        const container = document.getElementById('upcomingDeadlines');
        if (!container) return;
        
        const upcoming = this.state.scholarships
            .filter(s => new Date(s.deadline) > new Date())
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5);
        
        if (upcoming.length === 0) {
            container.innerHTML = '<p class="text-gray">No upcoming deadlines</p>';
            return;
        }
        
        container.innerHTML = upcoming.map(s => `
            <div class="deadline-item">
                <div class="deadline-info">
                    <h4>${s.title}</h4>
                    <p class="deadline-date">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDate(s.deadline)} (${this.daysUntilDeadline(s.deadline)} days)
                    </p>
                </div>
                <button class="btn btn-outline btn-sm" onclick="studentPortal.applyForScholarship(${s.id})">
                    Apply
                </button>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        console.log('StudentPortal: Rendering recent activity');
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const activities = [
            {
                icon: 'fa-paper-plane',
                text: 'Applied for National Science Scholarship',
                time: '2 days ago',
                color: 'blue'
            },
            {
                icon: 'fa-check-circle',
                text: 'Application accepted for Women in Tech Grant',
                time: '5 days ago',
                color: 'green'
            },
            {
                icon: 'fa-user-edit',
                text: 'Updated your profile information',
                time: '1 week ago',
                color: 'purple'
            }
        ];
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: rgba(var(--${activity.color}-rgb), 0.1); color: var(--${activity.color});">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    handleSearch(e) {
        this.state.filters.search = e.target.value;
        this.state.pagination.currentPage = 1;
        this.renderScholarships();
    }

    handleFilter(e) {
        this.state.filters.type = e.target.value;
        this.state.pagination.currentPage = 1;
        this.renderScholarships();
    }

    handleSort(e) {
        this.state.filters.sort = e.target.value;
        this.renderScholarships();
    }

    handleEligibilityFilter(e) {
        this.state.filters.eligibility = e.target.value;
        this.state.pagination.currentPage = 1;
        this.renderScholarships();
    }

    filterApplications(e) {
        this.renderApplications();
    }

    loadMoreScholarships() {
        this.state.pagination.currentPage++;
        this.renderScholarships();
    }

    updateLoadMoreButton(totalItems) {
        const button = document.getElementById('loadMoreScholarships');
        if (!button) return;
        
        const itemsShown = this.state.pagination.currentPage * this.state.pagination.itemsPerPage;
        
        if (itemsShown >= totalItems) {
            button.style.display = 'none';
        } else {
            button.style.display = 'flex';
        }
    }

    handleFileUpload(e) {
        const files = Array.from(e.target.files);
        const fileList = document.getElementById('fileList');
        
        if (files.length === 0) return;
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <button type="button" class="file-remove">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
            
            // Add remove functionality
            fileItem.querySelector('.file-remove').addEventListener('click', () => {
                fileItem.remove();
            });
        });
        
        // Reset input
        e.target.value = '';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            
            // Reset form if it's application modal
            if (modalId === 'applicationModal') {
                document.getElementById('applicationForm').reset();
                document.getElementById('fileList').innerHTML = '';
            }
        }
    }

    updateUserInfo() {
        if (!this.state.user) return;
        
        console.log('StudentPortal: Updating user info');
        document.getElementById('studentName').textContent = this.state.user.name;
        
        // Create avatar with initials
        const avatar = document.getElementById('studentAvatar');
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

    logout() {
        console.log('StudentPortal: Logging out');
        
        // Clear all authentication data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('user');
        
        this.state.user = null;
        this.showToast('Logged out successfully', 'info');
        
        // Redirect to index page after logout
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    }

    daysUntilDeadline(deadline) {
        try {
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 0;
        } catch (error) {
            console.error('Error calculating days until deadline:', error);
            return 0;
        }
    }

    showToast(message, type = 'info') {
        console.log('StudentPortal: Showing toast:', message, type);
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

// Initialize student portal
let studentPortal;

document.addEventListener('DOMContentLoaded', () => {
    console.log('StudentPortal: DOM loaded, initializing...');
    studentPortal = new StudentPortal();
    window.studentPortal = studentPortal;
});
