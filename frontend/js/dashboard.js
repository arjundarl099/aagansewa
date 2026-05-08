const container = document.getElementById('card-container');
const logOutBtn = document.getElementById('logoutBtn');
const gotoProvider = (e) => {
    const card = e.target.closest('.service-card');
    if (!card) return;
    const service = card.dataset.service;
    window.location.href = `provider.html?service=${service}`;
};

// Log out function
const logOuting = () => {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        
    }
};

container.addEventListener('click', gotoProvider);
logOutBtn.addEventListener('click', logOuting);

// Load logged-in user info
const loadUser = async () => {
    const greetUser = document.getElementById('greeting');

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const res = await fetch('http://localhost:8000/api/v1/auth/Me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ← send token in header
            }
        });

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error('Failed to load user');

        greetUser.textContent = `Hi, ${data.data.name}`;

    } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        window.location.href = "index.html";
    
    }
};

window.addEventListener('DOMContentLoaded', loadUser);