// Main Application JavaScript
class ScholarshipPortal {
    constructor() {
        this.state = {
            user: null,
            scholarships: [],
            filteredScholarships: [],
            activeFilter: 'all',
            currentSlide: 0,
            itemsPerSlide: 3,
            visibleCards: 3
        };
        this.isModalOpen = false;
        this.init();
    }

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        this.initialize3DCube();
        this.initializeParticles();
        this.loadScholarships();
        this.setupAnimations();
        this.updateVisibleCards();
        window.addEventListener('resize', () => this.updateVisibleCards());
    }

    setupEventListeners() {
        // Auth buttons
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('login');
        });
        
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAuthModal('register');
        });

        document.getElementById('closeAuth')?.addEventListener('click', () => this.hideAuthModal());

        // Auth Tabs logic
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthTab(tab.dataset.tab);
            });
        });

        // Scholarship Slider Controls
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextSlide());
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevSlide());

        // Scholarship Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.state.activeFilter = btn.dataset.filter;
                this.filterScholarships();
            });
        });

        // Search input
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Close modal on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) this.hideAuthModal();
        });

        // Login/Register forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const input = toggle.parentElement.querySelector('input');
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
    }

    updateVisibleCards() {
        const width = window.innerWidth;
        if (width < 480) {
            this.state.visibleCards = 1;
        } else if (width < 768) {
            this.state.visibleCards = 2;
        } else {
            this.state.visibleCards = 3;
        }
        this.renderScholarships();
    }

    showAuthModal(tab) {
        const modal = document.getElementById('authModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.isModalOpen = true;
        this.switchAuthTab(tab);
        
        gsap.fromTo('.modal-content', 
            { opacity: 0, scale: 0.85, y: 30 }, 
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power4.out" }
        );
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        gsap.to('.modal-content', {
            opacity: 0, scale: 0.9, y: 20, duration: 0.3,
            onComplete: () => {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
                this.isModalOpen = false;
            }
        });
    }

    switchAuthTab(tab) {
        const forms = document.querySelectorAll('.auth-form');
        const tabs = document.querySelectorAll('.auth-tab');
        
        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabs.forEach(t => {
            if (t.dataset.tab === tab) {
                t.classList.add('active');
            }
        });
        
        // Update forms
        forms.forEach(f => {
            f.style.display = 'none';
            if (f.id === `${tab}Form`) {
                f.style.display = 'block';
                gsap.fromTo(f, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4 });
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('#loginEmail').value.trim();
        const password = form.querySelector('#loginPassword').value;
        const rememberMe = form.querySelector('#rememberMe')?.checked;

        console.log('Login attempt:', { email, password, rememberMe });

        // Validate required fields
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        // Simple email validation
        if (!email.includes('@')) {
            this.showToast('Please enter a valid email', 'error');
            return;
        }

        try {
            // Show loading state
            const submitBtn = form.querySelector('.btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            submitBtn.disabled = true;

            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, always create a student user
            const userName = email.split('@')[0];
            const user = {
                id: Date.now(),
                name: userName.charAt(0).toUpperCase() + userName.slice(1) || 'Student User',
                email: email,
                role: 'student',
                createdAt: new Date().toISOString()
            };
            
            console.log('Creating user:', user);
            
            // Store user in localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isAuthenticated', 'true');
            
            // Update state
            this.state.user = user;
            
            this.showToast('Login successful! Redirecting to student panel...', 'success');
            
            // Clear form
            form.reset();
            this.hideAuthModal();
            
            // Update UI immediately
            this.updateAuthUI();
            
            // Redirect after short delay
            setTimeout(() => {
                console.log('Redirecting to student.html');
                window.location.href = 'student.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please try again.', 'error');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('.btn-primary');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                submitBtn.disabled = false;
            }
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('#regName').value.trim();
        const email = form.querySelector('#regEmail').value.trim();
        const password = form.querySelector('#regPassword').value;
        const confirmPassword = form.querySelector('#regConfirmPassword').value;

        console.log('Register attempt:', { name, email, password, confirmPassword });

        // Validate required fields
        if (!name || !email || !password || !confirmPassword) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('Passwords do not match!', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Simple email validation
        if (!email.includes('@')) {
            this.showToast('Please enter a valid email', 'error');
            return;
        }

        try {
            // Show loading state
            const submitBtn = form.querySelector('.btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, always create a student user
            const user = {
                id: Date.now(),
                name: name,
                email: email,
                role: 'student',
                createdAt: new Date().toISOString()
            };
            
            console.log('Creating user:', user);
            
            // Store user in localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isAuthenticated', 'true');
            
            // Update state
            this.state.user = user;
            
            this.showToast('Registration successful! Redirecting to student panel...', 'success');
            
            // Clear form
            form.reset();
            this.hideAuthModal();
            
            // Update UI immediately
            this.updateAuthUI();
            
            // Redirect after short delay
            setTimeout(() => {
                console.log('Redirecting to student.html');
                window.location.href = 'student.html';
            }, 1500);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'error');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('.btn-primary');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                submitBtn.disabled = false;
            }
        }
    }

    handleLogout() {
        console.log('Logging out...');
        // Clear all authentication data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('user');
        
        // Update state
        this.state.user = null;
        
        // Update UI
        this.updateAuthUI();
        
        this.showToast('Logged out successfully!', 'success');
        
        // Reload page to reset any state
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    updateAuthUI() {
        console.log('Updating auth UI, user:', this.state.user);
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (this.state.user) {
            // User is logged in
            console.log('User is logged in, showing user menu');
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userName) userName.textContent = this.state.user.name;
            
            // Update avatar with initials
            if (userAvatar) {
                const initials = this.state.user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                userAvatar.innerHTML = `<span>${initials}</span>`;
                console.log('Avatar initials:', initials);
            }
        } else {
            // User is not logged in
            console.log('User is not logged in, showing auth buttons');
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    async loadScholarships() {
        console.log('Loading scholarships...');
        try {
            // Dummy data for scholarships
            this.state.scholarships = [
                { id: 1, title: 'National Science Scholarship', type: 'Government', amount: '150,000', deadline: '2024-06-30', description: 'For students pursuing science and technology degrees' },
                { id: 2, title: 'Women in Tech Grant', type: 'Private', amount: '100,000', deadline: '2024-05-15', description: 'Supporting women in STEM fields' },
                { id: 3, title: 'Rural Development Fund', type: 'NGO', amount: '75,000', deadline: '2024-04-30', description: 'For students from rural areas' },
                { id: 4, title: 'Engineering Excellence', type: 'Private', amount: '200,000', deadline: '2024-07-31', description: 'For outstanding engineering students' },
                { id: 5, title: 'Medical Research Grant', type: 'Government', amount: '125,000', deadline: '2024-05-31', description: 'For medical students involved in research' },
                { id: 6, title: 'Arts & Culture Merit', type: 'NGO', amount: '60,000', deadline: '2024-04-15', description: 'Supporting arts and culture students' },
                { id: 7, title: 'Computer Science Fellowship', type: 'Private', amount: '180,000', deadline: '2024-08-15', description: 'For exceptional CS students' },
                { id: 8, title: 'Environmental Studies Award', type: 'Government', amount: '90,000', deadline: '2024-06-30', description: 'For environmental science students' },
                { id: 9, title: 'Business Leadership Grant', type: 'Private', amount: '120,000', deadline: '2024-07-31', description: 'For aspiring business leaders' }
            ];
            console.log('Scholarships loaded:', this.state.scholarships.length);
            this.filterScholarships();
        } catch (error) {
            console.error('Error loading scholarships:', error);
            this.state.scholarships = [];
            this.filterScholarships();
        }
    }

    filterScholarships() {
        console.log('Filtering scholarships, active filter:', this.state.activeFilter);
        this.state.filteredScholarships = this.state.scholarships.filter(s => 
            this.state.activeFilter === 'all' || s.type.toLowerCase() === this.state.activeFilter.toLowerCase()
        );
        console.log('Filtered scholarships:', this.state.filteredScholarships.length);
        this.state.currentSlide = 0;
        this.renderScholarships();
        this.updatePagination();
    }

    handleSearch(searchTerm) {
        console.log('Searching for:', searchTerm);
        if (searchTerm.trim() === '') {
            this.filterScholarships();
            return;
        }
        
        this.state.filteredScholarships = this.state.scholarships.filter(s => 
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.state.currentSlide = 0;
        this.renderScholarships();
        this.updatePagination();
    }

    renderScholarships() {
        const list = document.getElementById('scholarshipsList');
        if (!list) {
            console.error('Scholarships list element not found!');
            return;
        }

        console.log('Rendering scholarships:', this.state.filteredScholarships.length);
        
        if (this.state.filteredScholarships.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No scholarships found</h3>
                    <p>Try changing your search or filter criteria</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.state.filteredScholarships.map((s, index) => {
            const isActive = index === this.state.currentSlide;
            const daysLeft = this.getDaysLeft(s.deadline);
            
            return `
                <div class="scholarship-card ${isActive ? 'active' : ''}" data-index="${index}">
                    <div class="card-header">
                        <span class="card-type">${s.type}</span>
                        <span class="card-amount">NPR ${s.amount}</span>
                    </div>
                    <h3 class="card-title">${s.title}</h3>
                    <p class="card-description">${s.description}</p>
                    
                    <div class="card-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <div>
                                <div class="detail-label">Deadline</div>
                                <div class="detail-value">${new Date(s.deadline).toLocaleDateString()}</div>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <div class="detail-label">Days Left</div>
                                <div class="detail-value">${daysLeft} days</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <div class="deadline">
                            <i class="fas fa-hourglass-half"></i>
                            <span>${this.getDaysLeft(s.deadline)} days left</span>
                        </div>
                        <button class="btn btn-primary apply-btn" data-id="${s.id}">
                            <i class="fas fa-paper-plane"></i>
                            Apply Now
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add click event to non-active cards
        list.querySelectorAll('.scholarship-card:not(.active)').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.goToSlide(index);
            });
        });

        // Add click event to apply buttons
        list.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                const scholarshipId = parseInt(btn.dataset.id);
                this.applyForScholarship(scholarshipId);
            });
        });
    }

    updatePagination() {
        const dotsContainer = document.getElementById('paginationDots');
        if (!dotsContainer) {
            console.warn('Pagination dots container not found');
            return;
        }
        
        const totalSlides = Math.max(1, Math.ceil(this.state.filteredScholarships.length / this.state.visibleCards));
        console.log('Total slides:', totalSlides);
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = `pagination-dot ${i === this.state.currentSlide ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goToSlide(i * this.state.visibleCards));
            dotsContainer.appendChild(dot);
        }
    }

    nextSlide() {
        const maxSlide = Math.max(0, this.state.filteredScholarships.length - this.state.visibleCards);
        console.log('Next slide - current:', this.state.currentSlide, 'max:', maxSlide);
        if (this.state.currentSlide < maxSlide) {
            this.state.currentSlide++;
            this.renderScholarships();
            this.updatePagination();
            this.updateSliderPosition();
        }
    }

    prevSlide() {
        console.log('Prev slide - current:', this.state.currentSlide);
        if (this.state.currentSlide > 0) {
            this.state.currentSlide--;
            this.renderScholarships();
            this.updatePagination();
            this.updateSliderPosition();
        }
    }

    goToSlide(index) {
        const maxSlide = Math.max(0, this.state.filteredScholarships.length - this.state.visibleCards);
        this.state.currentSlide = Math.min(
            Math.max(0, index),
            maxSlide
        );
        console.log('Go to slide:', index, 'set to:', this.state.currentSlide);
        this.renderScholarships();
        this.updatePagination();
        this.updateSliderPosition();
    }

    updateSliderPosition() {
        const list = document.getElementById('scholarshipsList');
        if (!list) return;
        
        const cardWidth = 350; // Fixed width from CSS
        const gap = 30;
        const scrollAmount = this.state.currentSlide * (cardWidth + gap);
        
        console.log('Updating slider position:', scrollAmount);
        
        gsap.to(list, {
            scrollLeft: scrollAmount,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    getDaysLeft(deadline) {
        try {
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 0;
        } catch (error) {
            console.error('Error calculating days left:', error);
            return 0;
        }
    }

    applyForScholarship(id) {
        console.log('Applying for scholarship:', id);
        if (!this.state.user) {
            this.showToast('Please login to apply for scholarships', 'error');
            this.showAuthModal('login');
            return;
        }
        
        this.showToast('Redirecting to scholarship application...', 'success');
        setTimeout(() => {
            window.location.href = `student.html?apply=${id}`;
        }, 1000);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.error('Toast container not found');
            return;
        }
        
        console.log('Showing toast:', message, type);
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
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

    checkAuth() {
        try {
            const user = localStorage.getItem('user');
            const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
            
            console.log('Checking auth - user:', user, 'isAuthenticated:', isAuthenticated);
            
            if (user && isAuthenticated) {
                this.state.user = JSON.parse(user);
                console.log('User found:', this.state.user);
            } else {
                // Clear any stale data
                localStorage.removeItem('user');
                localStorage.removeItem('isAuthenticated');
                this.state.user = null;
                console.log('No user found, cleared storage');
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            this.state.user = null;
        } finally {
            this.updateAuthUI();
        }
    }

    // Helper Visual Initializations
    initialize3DCube() {
        const cube = document.querySelector('.cube-container');
        if (!cube) {
            console.warn('3D cube element not found');
            return;
        }
        let rX = 0, rY = 0;
        const animate = () => { 
            rX += 0.3; 
            rY += 0.5; 
            cube.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`; 
            requestAnimationFrame(animate); 
        };
        animate();
    }

    initializeParticles() {
        const container = document.querySelector('.particles-container');
        if (!container) {
            console.warn('Particles container not found');
            return;
        }
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.cssText = `position:absolute;width:3px;height:3px;background:#667eea;border-radius:50%;top:${Math.random()*100}%;left:${Math.random()*100}%;opacity:0.2;`;
            container.appendChild(p);
        }
    }

    setupAnimations() {
        // Floating cards
        const card1 = document.querySelector('.card-1');
        const card2 = document.querySelector('.card-2');
        const card3 = document.querySelector('.card-3');
        
        if (card1) {
            gsap.to(card1, { x: -70, y: -40, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
        }
        if (card2) {
            gsap.to(card2, { x: 70, y: -20, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5 });
        }
        if (card3) {
            gsap.to(card3, { y: -60, duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 });
        }
        
        // Animate stats counter
        document.querySelectorAll('.stat-number').forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count')) || 0;
            gsap.to(stat, {
                duration: 2,
                innerHTML: target,
                roundProps: 'innerHTML',
                ease: 'power2.out',
                delay: 1.5
            });
        });
    }
}

// Create global instance
let scholarshipPortal;
document.addEventListener('DOMContentLoaded', () => { 
    console.log('DOM loaded, initializing ScholarshipPortal');
    scholarshipPortal = new ScholarshipPortal();
    window.scholarshipPortal = scholarshipPortal;
    
    // Make applyForScholarship available globally
    window.applyForScholarship = function(id) {
        scholarshipPortal.applyForScholarship(id);
    };
});
