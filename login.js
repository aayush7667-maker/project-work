// Enhanced Login JavaScript
class LoginSystem {
    constructor() {
        this.API = 'api.php';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkRememberedUser();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Form submissions
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Role selection
        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', () => this.selectRole(option));
        });
        
        // Password toggle
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.togglePassword(toggle));
        });
        
        // Social login buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleSocialLogin(btn.dataset.provider));
        });
        
        // Remember me checkbox
        document.getElementById('rememberMe')?.addEventListener('change', (e) => {
            localStorage.setItem('rememberLogin', e.target.checked);
        });
    }

    initializeAnimations() {
        // Add floating animation to background shapes
        const shapes = document.querySelectorAll('.bg-shape');
        shapes.forEach((shape, index) => {
            shape.style.animationDelay = `${index * 5}s`;
        });
        
        // Add typing effect to tagline
        const tagline = document.querySelector('.login-tagline');
        if (tagline) {
            const text = tagline.textContent;
            tagline.textContent = '';
            this.typeWriter(tagline, text, 0);
        }
    }

    typeWriter(element, text, i) {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(() => this.typeWriter(element, text, i), 50);
        }
    }

    switchTab(tab) {
        // Update active tab
        document.querySelectorAll('.login-tab').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Show/hide forms
        document.querySelectorAll('.login-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}Form`).classList.add('active');
        
        // Reset forms
        if (tab === 'login') {
            document.getElementById('loginForm').reset();
        } else {
            document.getElementById('registerForm').reset();
        }
        
        // Add animation
        const activeForm = document.getElementById(`${tab}Form`);
        activeForm.style.animation = 'formSlideIn 0.4s ease';
        setTimeout(() => {
            activeForm.style.animation = '';
        }, 400);
    }

    selectRole(option) {
        // Remove selected class from all options
        document.querySelectorAll('.role-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Update hidden input value
        const roleInput = document.getElementById('userRole');
        if (roleInput) {
            roleInput.value = option.dataset.role;
        }
    }

    togglePassword(toggle) {
        const input = toggle.previousElementSibling;
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
        
        // Add bounce animation
        toggle.style.animation = 'bounce 0.3s ease';
        setTimeout(() => {
            toggle.style.animation = '';
        }, 300);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        // At least 6 characters
        return password.length >= 6;
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('#loginEmail').value.trim();
        const password = form.querySelector('#loginPassword').value;
        const rememberMe = form.querySelector('#rememberMe')?.checked || false;
        
        // Validation
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address', form);
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showError('Password must be at least 6 characters', form);
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('.login-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loader-spinner"></div>';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Real API call would go here
            const response = await fetch(`${this.API}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store user data
                if (rememberMe) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                } else {
                    sessionStorage.setItem('user', JSON.stringify(result.user));
                }
                
                this.showSuccess('Login successful! Redirecting...', form);
                
                // Redirect based on role
                setTimeout(() => {
                    if (result.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'student.html';
                    }
                }, 1500);
                
            } else {
                this.showError(result.message || 'Invalid credentials', form);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.', form);
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('#registerName').value.trim();
        const email = form.querySelector('#registerEmail').value.trim();
        const password = form.querySelector('#registerPassword').value;
        const confirmPassword = form.querySelector('#confirmPassword').value;
        const role = form.querySelector('#userRole')?.value || 'student';
        const terms = form.querySelector('#acceptTerms')?.checked;
        
        // Validation
        if (!name || name.length < 2) {
            this.showError('Please enter a valid name', form);
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address', form);
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showError('Password must be at least 6 characters', form);
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match', form);
            return;
        }
        
        if (role === 'admin' && !this.validateAdminCode(form.querySelector('#adminCode')?.value)) {
            this.showError('Invalid admin code', form);
            return;
        }
        
        if (!terms) {
            this.showError('Please accept the terms and conditions', form);
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('.login-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loader-spinner"></div>';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Real API call would go here
            const response = await fetch(`${this.API}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, confirm_password: confirmPassword, role })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Registration successful! Redirecting to login...', form);
                
                // Switch to login tab after delay
                setTimeout(() => {
                    this.switchTab('login');
                    form.reset();
                }, 2000);
                
            } else {
                this.showError(result.message || 'Registration failed', form);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please try again.', form);
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateAdminCode(code) {
        // Simple admin code validation
        const validCodes = ['ADMIN2024', 'SCHOLARSHIP', 'NEPAL123'];
        return validCodes.includes(code?.toUpperCase());
    }

    handleSocialLogin(provider) {
        // Simulate social login
        const providers = {
            google: { name: 'Google', color: '#EA4335' },
            facebook: { name: 'Facebook', color: '#1877F2' }
        };
        
        const providerInfo = providers[provider];
        if (!providerInfo) return;
        
        // Show loading state on the button
        const button = document.querySelector(`.social-btn.${provider}`);
        const originalHTML = button.innerHTML;
        button.innerHTML = '<div class="loader-spinner"></div>';
        button.disabled = true;
        
        // Simulate social login process
        setTimeout(() => {
            // Reset button
            button.innerHTML = originalHTML;
            button.disabled = false;
            
            // Show message
            this.showMessage(`Continuing with ${providerInfo.name}...`, 'info');
        }, 2000);
    }

    checkRememberedUser() {
        const rememberLogin = localStorage.getItem('rememberLogin') === 'true';
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (rememberLogin && user) {
            try {
                const userData = JSON.parse(user);
                document.getElementById('loginEmail').value = userData.email;
                document.getElementById('rememberMe').checked = true;
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }

    showError(message, form) {
        // Remove any existing error messages
        this.removeMessages(form);
        
        // Create error element
        const errorEl = document.createElement('div');
        errorEl.className = 'login-error';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        // Insert at the beginning of the form
        form.insertBefore(errorEl, form.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
        
        // Add shake animation to form
        form.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
    }

    showSuccess(message, form) {
        // Remove any existing messages
        this.removeMessages(form);
        
        // Create success element
        const successEl = document.createElement('div');
        successEl.className = 'login-success';
        successEl.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Insert at the beginning of the form
        form.insertBefore(successEl, form.firstChild);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            successEl.remove();
        }, 3000);
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `login-${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to document body
        document.body.appendChild(messageEl);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    removeMessages(form) {
        const messages = form.querySelectorAll('.login-error, .login-success');
        messages.forEach(msg => msg.remove());
    }

    // Utility function to check authentication status
    static checkAuth(requiredRole = null) {
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (!user) {
            return null;
        }
        
        try {
            const userData = JSON.parse(user);
            
            if (requiredRole && userData.role !== requiredRole) {
                return null;
            }
            
            return userData;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    // Utility function to logout
    static logout() {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        localStorage.removeItem('rememberLogin');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

// Initialize login system
let loginSystem;

document.addEventListener('DOMContentLoaded', () => {
    loginSystem = new LoginSystem();
    window.loginSystem = loginSystem;
});

// Export utility functions
window.LoginSystem = LoginSystem;
