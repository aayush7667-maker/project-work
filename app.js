// Main Landing Page JavaScript - FINAL VERSION
class ScholarshipPortal {
    constructor() {
        this.state = {
            user: null,
            scholarships: []
        };
        this.API_URL = 'api.php';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.initAnimations();
        this.loadScholarships();
    }

    checkAuth() {
        const userData = localStorage.getItem('scholarship_user');
        if (userData) {
            try {
                this.state.user = JSON.parse(userData);
                this.updateAuthUI();
            } catch (e) {
                localStorage.removeItem('scholarship_user');
            }
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (this.state.user) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            userName.textContent = this.state.user.name;
            
            const initials = this.state.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            userAvatar.innerHTML = `<span>${initials}</span>`;
        } else {
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Auth modals
        document.getElementById('showLogin')?.addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('showRegister')?.addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('closeAuth')?.addEventListener('click', () => this.hideAuthModal());
        
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.tab));
        });
        
        // Forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Explore button
        document.getElementById('exploreBtn')?.addEventListener('click', () => {
            document.getElementById('scholarships')?.scrollIntoView({ behavior: 'smooth' });
        });
        
        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterScholarships(btn.dataset.filter);
            });
        });
        
        // Search
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchScholarships(e.target.value);
        });
        
        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                input.type = input.type === 'password' ? 'text' : 'password';
                btn.querySelector('i').className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        });
    }

    initAnimations() {
        // Stats counter
        document.querySelectorAll('.stat-number').forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = target;
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 30);
        });
        
        // 3D Cube
        const cube = document.querySelector('.cube-container');
        if (cube) {
            let rx = 0, ry = 0;
            const animate = () => {
                rx += 0.3;
                ry += 0.5;
                cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    showAuthModal(tab) {
        document.getElementById('authModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.switchAuthTab(tab);
    }

    hideAuthModal() {
        document.getElementById('authModal').classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('loginForm')?.reset();
        document.getElementById('registerForm')?.reset();
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showToast('Please fill all fields', 'error');
            return;
        }
        
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        btn.disabled = true;
        
        try {
            const response = await fetch(`${this.API_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.state.user = result.user;
                localStorage.setItem('scholarship_user', JSON.stringify(result.user));
                
                this.showToast('Login successful!', 'success');
                this.hideAuthModal();
                this.updateAuthUI();
                
                // Redirect based on role
                setTimeout(() => {
                    if (result.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'student.html';
                    }
                }, 1500);
            } else {
                this.showToast(result.message || 'Invalid credentials', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (!name || !email || !password || !confirmPassword) {
            this.showToast('Please fill all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        btn.disabled = true;
        
        try {
            const response = await fetch(`${this.API_URL}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role: 'student' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Registration successful! Please login.', 'success');
                e.target.reset();
                this.switchAuthTab('login');
            } else {
                this.showToast(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    handleLogout() {
        localStorage.removeItem('scholarship_user');
        this.state.user = null;
        this.updateAuthUI();
        this.showToast('Logged out successfully', 'success');
    }

    async loadScholarships() {
        try {
            const response = await fetch(`${this.API_URL}?action=getAllScholarships`, {
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
        }
    }

    renderScholarships(filter = 'all', search = '') {
        const container = document.getElementById('scholarshipsList');
        if (!container) return;
        
        let scholarships = this.state.scholarships;
        
        // Apply filters
        if (filter !== 'all') {
            scholarships = scholarships.filter(s => 
                s.scholarship_type.toLowerCase() === filter.toLowerCase()
            );
        }
        
        // Apply search
        if (search) {
            scholarships = scholarships.filter(s => 
                s.title.toLowerCase().includes(search.toLowerCase()) ||
                s.description.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        if (scholarships.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No scholarships found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = scholarships.map(s => `
            <div class="scholarship-card">
                <div class="card-header">
                    <span class="card-type">${s.scholarship_type}</span>
                    <span class="card-amount">NPR ${Number(s.amount).toLocaleString()}</span>
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
                        <i class="fas fa-user-tie"></i>
                        <div>
                            <div class="detail-label">Provider</div>
                            <div class="detail-value">${s.admin_name}</div>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="deadline">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${this.getDaysLeft(s.deadline)} days left</span>
                    </div>
                    <button class="btn btn-primary" onclick="scholarshipPortal.applyScholarship(${s.id})">
                        <i class="fas fa-paper-plane"></i> Apply Now
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterScholarships(filter) {
        const search = document.getElementById('searchInput')?.value || '';
        this.renderScholarships(filter, search);
    }

    searchScholarships(search) {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        this.renderScholarships(activeFilter, search);
    }

    applyScholarship(id) {
        if (!this.state.user) {
            this.showToast('Please login to apply', 'error');
            this.showAuthModal('login');
            return;
        }
        
        if (this.state.user.role === 'admin') {
            this.showToast('Admins cannot apply for scholarships', 'error');
            return;
        }
        
        window.location.href = `student.html?scholarship=${id}`;
    }

    getDaysLeft(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - today;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
let scholarshipPortal;
document.addEventListener('DOMContentLoaded', () => {
    scholarshipPortal = new ScholarshipPortal();
    window.scholarshipPortal = scholarshipPortal;
});