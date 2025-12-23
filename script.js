let state = {
    user: null,
    scholarships: [],
    editingId: null
};

const API = 'api.php';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupListeners();
});

function checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
        state.user = JSON.parse(user);
        showMain();
        loadScholarships();
    } else {
        showAuth();
    }
}

function showMain() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
}

function showAuth() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

function setupListeners() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.onclick = () => switchTab(tab.dataset.tab);
    });

    document.getElementById('registerFormElement').onsubmit = handleRegister;
    document.getElementById('loginFormElement').onsubmit = handleLogin;
    document.getElementById('scholarshipForm').onsubmit = handleScholarship;
    
    document.getElementById('logoutBtn').onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        state.user = null;
        showAuth();
        toast('Logged out!', 'success');
    };
}

function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

async function api(action, data) {
    try {
        const res = await fetch(`${API}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        return { success: false, message: 'Network error' };
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        email: form.email.value,
        password: form.password.value,
        confirm_password: form.confirm_password.value
    };

    if (data.password !== data.confirm_password) {
        return toast('Passwords do not match!', 'error');
    }

    const btn = form.querySelector('button');
    btn.textContent = 'Registering...';
    btn.disabled = true;

    const result = await api('register', data);
    
    btn.textContent = 'Register';
    btn.disabled = false;

    if (result.success) {
        toast(result.message, 'success');
        form.reset();
        switchTab('login');
    } else {
        toast(result.message, 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        email: form.email.value,
        password: form.password.value
    };

    const btn = form.querySelector('button');
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    const result = await api('login', data);
    
    btn.textContent = 'Login';
    btn.disabled = false;

    if (result.success) {
        state.user = result.user;
        localStorage.setItem('user', JSON.stringify(result.user));
        toast(result.message, 'success');
        form.reset();
        showMain();
        loadScholarships();
    } else {
        toast(result.message, 'error');
    }
}

async function loadScholarships() {
    if (!state.user) return;
    
    const result = await api('getScholarships', { user_id: state.user.id });
    
    if (result.success) {
        state.scholarships = result.scholarships;
        renderScholarships();
    }
}

async function handleScholarship(e) {
    e.preventDefault();
    if (!state.user) return;

    const form = e.target;
    const data = {
        user_id: state.user.id,
        student_name: form.studentName.value,
        scholarship_type: form.scholarshipType.value,
        eligibility: form.eligibility.value,
        deadline: form.deadline.value,
        amount: form.amount.value
    };

    let result;
    if (state.editingId) {
        data.id = state.editingId;
        result = await api('updateScholarship', data);
        state.editingId = null;
        document.getElementById('formTitle').textContent = 'Add New Scholarship';
        document.getElementById('submitBtn').textContent = 'Add Scholarship';
    } else {
        result = await api('createScholarship', data);
    }

    if (result.success) {
        toast(result.message, 'success');
        form.reset();
        loadScholarships();
    } else {
        toast(result.message, 'error');
    }
}

function editScholarship(s) {
    state.editingId = s.id;
    document.getElementById('studentName').value = s.student_name;
    document.getElementById('scholarshipType').value = s.scholarship_type;
    document.getElementById('eligibility').value = s.eligibility;
    document.getElementById('deadline').value = s.deadline;
    document.getElementById('amount').value = s.amount;
    document.getElementById('formTitle').textContent = 'Edit Scholarship';
    document.getElementById('submitBtn').textContent = 'Update Scholarship';
    scrollToForm();
}

async function deleteScholarship(id) {
    if (!confirm('Delete this scholarship?')) return;
    
    const result = await api('deleteScholarship', { id });
    
    if (result.success) {
        toast(result.message, 'success');
        loadScholarships();
    } else {
        toast(result.message, 'error');
    }
}

function renderScholarships() {
    const container = document.getElementById('scholarshipsList');
    
    if (state.scholarships.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No scholarships yet. Add one above!</p></div>';
        return;
    }

    container.innerHTML = state.scholarships.map(s => `
        <div class="scholarship-card">
            <h3>${s.student_name}</h3>
            <p><strong>Type:</strong> ${s.scholarship_type}</p>
            <p><strong>Eligibility:</strong> ${s.eligibility}</p>
            <p><strong>Deadline:</strong> ${new Date(s.deadline).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> NPR ${s.amount}</p>
            <div class="card-actions">
                <button class="btn btn-edit" onclick='editScholarship(${JSON.stringify(s)})'>Edit</button>
                <button class="btn btn-delete" onclick="deleteScholarship(${s.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function scrollToForm() {
    document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
}

function toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}