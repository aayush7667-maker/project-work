// Main Website JavaScript for index.html
class MainWebsite {
    constructor() {
        this.state = {
            user: null,
            scholarships: [],
            applications: [],
            filteredScholarships: [],
            currentPage: 1,
            itemsPerPage: 6,
            searchTerm: '',
            activeFilter: 'all'
        };
        
        this.API = 'api.php';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.initializeAnimations();
        this.loadScholarships();
    }

    checkAuth() {
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (user) {
            this.state.user = JSON.parse(user);
            this.showMainUI();
        } else {
            this.showAuthUI();
        }
    }

    showMainUI() {
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userMenu').style.display = 'flex';
        document.getElementById('profileLink').style.display = 'block';
        
        // Update user info
        if (this.state.user) {
            document.getElementById('userName').textContent = this.state.user.name;
            document.getElementById('profileName').textContent = this.state.user.name;
            document.getElementById('profileEmail').textContent = this.state.user.email;
            
            // Create avatar with initials
            const avatar = document.getElementById('userAvatar');
            if (avatar) {
                const initials = this.state.user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                avatar.innerHTML = `<span>${initials}</span>`;
            }
        }
    }

    showAuthUI() {
        document.getElementById('authButtons').style.display = 'flex';
        document.getElementById('userMenu').style.display = 'none';
        document.getElementById('profileLink').style.display = 'none';
    }

    setupEventListeners() {
        // Auth buttons
        document.getElementById('showLogin')?.addEventListener('click', () => this.showAuthModal());
        document.getElementById('showRegister')?.addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('closeAuth')?.addEventListener('click', () => this.hideAuthModal());
        
        // Auth forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.tab));
        });
        
        // Role selection
        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', () => this.selectRole(option));
        });
        
        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => this.togglePassword(btn));
        });
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Profile
        document.getElementById('profileLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfileSection();
        });
        
        document.getElementById('cancelProfile')?.addEventListener('click', () => {
            this.hideProfileSection();
        });
        
        document.getElementById('profileForm')?.addEventListener('submit', (e) => this.handleProfileSave(e));
        
        // Quick actions
        document.getElementById('exploreBtn')?.addEventListener('click', () => {
            document.getElementById('scholarships')?.scrollIntoView({ behavior: 'smooth' });
        });
        
        document.getElementById('howItWorks')?.addEventListener('click', () => {
            this.showHowItWorks();
        });
        
        // Search and filter
        document.getElementById('searchInput')?.addEventListener('input', (e) => this.handleSearch(e));
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.activeFilter = btn.dataset.filter;
                this.filterScholarships();
            });
        });
        
        // Load more
        document.getElementById('loadMore')?.addEventListener('click', () => this.loadMoreScholarships());
        
        // Modal close events
        document.getElementById('closeApplication')?.addEventListener('click', () => this.closeApplicationModal());
        document.getElementById('cancelApplication')?.addEventListener('click', () => this.closeApplicationModal());
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) {
                this.hideAuthModal();
            }
            if (e.target.classList.contains('application-modal')) {
                this.closeApplicationModal();
            }
        });
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAuthModal();
                this.closeApplicationModal();
            }
        });
    }

    initializeAnimations() {
        // Animate hero stats counter
        document.querySelectorAll('.stat-number').forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count')) || 0;
            gsap.to(stat, {
                duration: 2,
                innerHTML: target,
                roundProps: 'innerHTML',
                ease: 'power2.out',
                delay: 1.5,
                onUpdate: function() {
                    stat.innerHTML = Math.floor(this.targets()[0].innerHTML);
                }
            });
        });
        
        // Scroll animations
        gsap.utils.toArray('.scholarship-card').forEach(card => {
            ScrollTrigger.create({
                trigger: card,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(card, {
                        duration: 0.6,
                        opacity: 1,
                        y: 0,
                        ease: 'power2.out'
                    });
                }
            });
        });
    }

    showAuthModal(defaultTab = 'login') {
        const modal = document.getElementById('authModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set default tab
        this.switchAuthTab(defaultTab);
        
        // Animate modal in
        gsap.from('.auth-modal .modal-content', {
            duration: 0.4,
            scale: 0.9,
            opacity: 0,
            ease: 'back.out(1.7)'
        });
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset forms
        document.getElementById('loginForm')?.reset();
        document.getElementById('registerForm')?.reset();
        
        // Reset role selection
        document.querySelectorAll('.role-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.getElementById('adminCodeGroup').style.display = 'none';
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
        
        // Animate form transition
        const activeForm = document.getElementById(`${tab}Form`);
        gsap.from(activeForm, {
            duration: 0.3,
            x: tab === 'login' ? -30 : 30,
            opacity: 0,
            ease: 'power2.out'
        });
    }

    selectRole(option) {
        // Remove selected class from all options
        document.querySelectorAll('.role-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Show/hide admin code field
        const adminCodeGroup = document.getElementById('adminCodeGroup');
        if (option.dataset.role === 'admin') {
            adminCodeGroup.style.display = 'block';
            gsap.from(adminCodeGroup, {
                duration: 0.3,
                height: 0,
                opacity: 0,
                ease: 'power2.out'
            });
        } else {
            adminCodeGroup.style.display = 'none';
        }
    }

    togglePassword(button) {
        const input = button.closest('.input-group').querySelector('input[type="password"], input[type="text"]');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
        
        // Add animation
        gsap.fromTo(button, 
            { scale: 1 },
            { 
                scale: 1.2,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            }
        );
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('#loginEmail').value;
        const password = form.querySelector('#loginPassword').value;
        const rememberMe = form.querySelector('#rememberMe')?.checked;
        
        // Validate email
        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Signing In...';
        submitBtn.disabled = true;
        
        try {
            const result = await this.api('login', { email, password });
            
            if (result.success) {
                this.state.user = result.user;
                
                // Store user data based on remember me
                if (rememberMe) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                } else {
                    sessionStorage.setItem('user', JSON.stringify(result.user));
                }
                
                this.showToast('Welcome back, ' + result.user.name + '!', 'success');
                
                // Animate success
                gsap.fromTo(submitBtn, 
                    { scale: 1 },
                    { 
                        scale: 1.1, 
                        backgroundColor: '#10b981',
                        duration: 0.3,
                        onComplete: () => {
                            this.hideAuthModal();
                            this.showMainUI();
                            this.loadUserData();
                        }
                    }
                );
                
            } else {
                this.showToast(result.message || 'Invalid credentials', 'error');
                
                // Shake animation for error
                gsap.fromTo(form, 
                    { x: 0 },
                    { 
                        x: 10,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 5,
                        ease: 'power1.out'
                    }
                );
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const name = form.querySelector('#regName').value;
        const email = form.querySelector('#regEmail').value;
        const password = form.querySelector('#regPassword').value;
        const confirmPassword = form.querySelector('#regConfirmPassword').value;
        const role = document.querySelector('.role-option.selected')?.dataset.role || 'student';
        const adminCode = role === 'admin' ? form.querySelector('#adminCode')?.value : null;
        const acceptTerms = form.querySelector('#acceptTerms')?.checked;
        
        // Validation
        if (!name || name.length < 2) {
            this.showToast('Please enter a valid name', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        
        if (role === 'admin' && (!adminCode || adminCode !== 'ADMIN2024')) {
            this.showToast('Invalid admin code', 'error');
            return;
        }
        
        if (!acceptTerms) {
            this.showToast('Please accept the terms and conditions', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Creating Account...';
        submitBtn.disabled = true;
        
        try {
            const result = await this.api('register', {
                name, email, password, confirm_password: confirmPassword, role
            });
            
            if (result.success) {
                this.showToast('Account created successfully!', 'success');
                form.reset();
                this.switchAuthTab('login');
                
                // Animate success
                gsap.fromTo(submitBtn, 
                    { scale: 1 },
                    { 
                        scale: 1.1,
                        backgroundColor: '#10b981',
                        duration: 0.2,
                        yoyo: true,
                        repeat: 1,
                        ease: 'power2.out'
                    }
                );
                
            } else {
                this.showToast(result.message || 'Registration failed', 'error');
                
                // Shake animation for error
                gsap.fromTo(form, 
                    { x: 0 },
                    { 
                        x: 10,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 5,
                        ease: 'power1.out'
                    }
                );
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    handleLogout() {
        // Animate logout
        gsap.to(document.body, {
            opacity: 0.8,
            duration: 0.3,
            onComplete: () => {
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                this.state.user = null;
                this.showAuthUI();
                
                // Reset animation
                gsap.set(document.body, { opacity: 1 });
                
                this.showToast('Logged out successfully', 'info');
            }
        });
    }

    async loadScholarships() {
        this.showLoading('scholarshipsList', 'Loading scholarships...');
        
        try {
            const result = await this.api('getAllScholarships');
            
            if (result.success) {
                this.state.scholarships = result.scholarships;
                this.state.filteredScholarships = [...result.scholarships];
                this.renderScholarships();
                
                // Animate cards in
                setTimeout(() => {
                    gsap.from('.scholarship-card', {
                        duration: 0.6,
                        y: 50,
                        opacity: 0,
                        stagger: 0.1,
                        ease: 'power3.out'
                    });
                }, 100);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading scholarships:', error);
            document.getElementById('scholarshipsList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Unable to load scholarships</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }

    renderScholarships() {
        const container = document.getElementById('scholarshipsList');
        
        if (!this.state.filteredScholarships.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No scholarships found</h3>
                    <p>Try changing your search or filter criteria</p>
                </div>
            `;
            return;
        }
        
        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const endIndex = startIndex + this.state.itemsPerPage;
        const scholarshipsToShow = this.state.filteredScholarships.slice(startIndex, endIndex);
        
        container.innerHTML = scholarshipsToShow.map(scholarship => `
            <div class="scholarship-card" data-id="${scholarship.id}">
                <div class="card-header">
                    <span class="card-type">${scholarship.scholarship_type}</span>
                    <span class="card-amount">NPR ${scholarship.amount}</span>
                </div>
                
                <h3 class="card-title">${scholarship.title}</h3>
                
                <p class="card-description">${scholarship.description || 'No description available.'}</p>
                
                <div class="card-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar-alt"></i>
                        <div>
                            <div class="detail-label">Deadline</div>
                            <div class="detail-value">${new Date(scholarship.deadline).toLocaleDateString()}</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <i class="fas fa-user-check"></i>
                        <div>
                            <div class="detail-label">Eligibility</div>
                            <div class="detail-value">${scholarship.eligibility.substring(0, 30)}...</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <i class="fas fa-user-tie"></i>
                        <div>
                            <div class="detail-label">Posted By</div>
                            <div class="detail-value">${scholarship.admin_name || 'Admin'}</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <div class="detail-label">Posted</div>
                            <div class="detail-value">${this.timeAgo(new Date(scholarship.created_at))}</div>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="deadline">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${this.daysUntilDeadline(scholarship.deadline)} days left</span>
                    </div>
                    <button class="btn-apply" onclick="mainWebsite.openApplicationModal(${scholarship.id})">
                        <i class="fas fa-paper-plane"></i>
                        Apply Now
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update load more button visibility
        const loadMoreBtn = document.getElementById('loadMore');
        if (loadMoreBtn) {
            if (endIndex >= this.state.filteredScholarships.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'flex';
            }
        }
    }

    filterScholarships() {
        this.state.filteredScholarships = this.state.scholarships.filter(scholarship => {
            const matchesFilter = this.state.activeFilter === 'all' || 
                                 scholarship.scholarship_type.toLowerCase() === this.state.activeFilter;
            
            const matchesSearch = scholarship.title.toLowerCase().includes(this.state.searchTerm.toLowerCase()) ||
                                scholarship.description.toLowerCase().includes(this.state.searchTerm.toLowerCase());
            
            return matchesFilter && matchesSearch;
        });
        
        this.state.currentPage = 1;
        this.renderScholarships();
    }

    handleSearch(e) {
        this.state.searchTerm = e.target.value;
        this.filterScholarships();
    }

    loadMoreScholarships() {
        this.state.currentPage++;
        this.renderScholarships();
        
        // Animate new cards
        const cards = document.querySelectorAll('.scholarship-card');
        const newCards = Array.from(cards).slice(-this.state.itemsPerPage);
        
        gsap.from(newCards, {
            duration: 0.6,
            y: 50,
            opacity: 0,
            stagger: 0.1,
            ease: 'power3.out'
        });
        
        // Scroll to new cards
        if (newCards[0]) {
            newCards[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    async openApplicationModal(scholarshipId) {
        if (!this.state.user) {
            this.showToast('Please login to apply', 'error');
            this.showAuthModal();
            return;
        }
        
        const scholarship = this.state.scholarships.find(s => s.id == scholarshipId);
        if (!scholarship) return;
        
        // Check if already applied
        const existingApplication = this.state.applications.find(app => 
            app.scholarship_id == scholarshipId
        );
        
        if (existingApplication) {
            this.showToast('You have already applied for this scholarship', 'warning');
            return;
        }
        
        // Update modal content
        document.getElementById('scholarshipPreview').innerHTML = `
            <h4>${scholarship.title}</h4>
            <p><strong>Amount:</strong> NPR ${scholarship.amount}</p>
            <p><strong>Deadline:</strong> ${new Date(scholarship.deadline).toLocaleDateString()}</p>
            <p><strong>Type:</strong> ${scholarship.scholarship_type}</p>
        `;
        
        // Show modal
        const modal = document.getElementById('applicationModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Store scholarship ID
        modal.dataset.scholarshipId = scholarshipId;
        
        // Setup form submission
        const form = document.getElementById('applicationForm');
        form.onsubmit = (e) => this.submitApplication(e, scholarshipId);
        
        // Animate modal in
        gsap.from('.application-modal .modal-container', {
            duration: 0.4,
            scale: 0.9,
            opacity: 0,
            ease: 'back.out(1.7)'
        });
    }

    closeApplicationModal() {
        const modal = document.getElementById('applicationModal');
        
        // Animate modal out
        gsap.to('.application-modal .modal-container', {
            duration: 0.3,
            scale: 0.9,
            opacity: 0,
            ease: 'power2.in',
            onComplete: () => {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
                modal.removeAttribute('data-scholarship-id');
                
                // Reset form
                document.getElementById('applicationForm').reset();
            }
        });
    }

    async submitApplication(e, scholarshipId) {
        e.preventDefault();
        
        const message = document.getElementById('applicationMessage').value;
        
        if (!message.trim()) {
            this.showToast('Please provide an application message', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('.btn-apply');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        try {
            const result = await this.api('applyScholarship', {
                scholarship_id: scholarshipId,
                student_id: this.state.user.id,
                message: message
            });
            
            if (result.success) {
                this.showToast('Application submitted successfully!', 'success');
                this.closeApplicationModal();
                
                // Load applications to update count
                this.loadApplications();
            } else {
                this.showToast(result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error submitting application:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showProfileSection() {
        document.getElementById('scholarships').style.display = 'none';
        document.getElementById('profileSection').style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Animate profile section
        gsap.from('.profile-section > *', {
            duration: 0.6,
            y: 30,
            opacity: 0,
            stagger: 0.1,
            ease: 'power3.out'
        });
        
        // Load profile data
        this.loadProfile();
        this.loadApplications();
    }

    hideProfileSection() {
        document.getElementById('profileSection').style.display = 'none';
        document.getElementById('scholarships').style.display = 'block';
    }

    async loadProfile() {
        if (!this.state.user) return;
        
        try {
            const result = await this.api('getProfile', { user_id: this.state.user.id });
            
            if (result.success && result.profile) {
                // Populate form
                document.getElementById('phone').value = result.profile.phone || '';
                document.getElementById('address').value = result.profile.address || '';
                document.getElementById('education').value = result.profile.education || '';
                document.getElementById('skills').value = result.profile.skills || '';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async handleProfileSave(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('.btn-save');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        const data = {
            user_id: this.state.user.id,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            education: document.getElementById('education').value,
            skills: document.getElementById('skills').value
        };
        
        try {
            const result = await this.api('saveProfile', data);
            
            if (result.success) {
                this.showToast('Profile saved successfully!', 'success');
                
                // Animate success
                gsap.fromTo(submitBtn, 
                    { scale: 1 },
                    { 
                        scale: 1.1,
                        backgroundColor: '#10b981',
                        duration: 0.2,
                        yoyo: true,
                        repeat: 1
                    }
                );
            } else {
                this.showToast('Failed to save profile', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadApplications() {
        if (!this.state.user) return;
        
        try {
            const result = await this.api('getMyApplications', { student_id: this.state.user.id });
            
            if (result.success) {
                this.state.applications = result.applications;
                this.updateApplicationStats();
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    }

    updateApplicationStats() {
        const appliedCount = this.state.applications.length;
        const pendingCount = this.state.applications.filter(a => a.status === 'pending').length;
        const acceptedCount = this.state.applications.filter(a => a.status === 'accepted').length;
        
        document.getElementById('appliedCount').textContent = appliedCount;
        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('acceptedCount').textContent = acceptedCount;
        
        // Animate stat counters
        gsap.to('#appliedCount', {
            duration: 1,
            innerHTML: appliedCount,
            roundProps: 'innerHTML',
            ease: 'power2.out'
        });
        
        gsap.to('#pendingCount', {
            duration: 1,
            innerHTML: pendingCount,
            roundProps: 'innerHTML',
            ease: 'power2.out'
        });
        
        gsap.to('#acceptedCount', {
            duration: 1,
            innerHTML: acceptedCount,
            roundProps: 'innerHTML',
            ease: 'power2.out'
        });
    }

    async loadUserData() {
        await Promise.all([
            this.loadProfile(),
            this.loadApplications()
        ]);
    }

    showHowItWorks() {
        this.showToast('How It Works section coming soon!', 'info');
        // This would typically open a modal or scroll to a section
    }

    // Utility Methods
    async api(action, data = {}) {
        try {
            const response = await fetch(`${this.API}?action=${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                message: 'Network error. Please check your connection.'
            };
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>${message}</h3>
                    <p>Please wait while we fetch the latest data</p>
                </div>
            `;
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        
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

    timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
        
        return 'Just now';
    }

    daysUntilDeadline(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
}

// Initialize main website
let mainWebsite;

document.addEventListener('DOMContentLoaded', () => {
    mainWebsite = new MainWebsite();
    window.mainWebsite = mainWebsite;
    
    // Export functions for inline onclick handlers
    window.openApplicationModal = (id) => mainWebsite.openApplicationModal(id);
    window.closeApplicationModal = () => mainWebsite.closeApplicationModal();
});
