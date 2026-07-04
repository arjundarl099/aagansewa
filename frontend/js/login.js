const loginForm = document.querySelector('#loginForm');

function getRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ? payload.role.toLowerCase() : null;
  } catch {
    return null;
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    return alert('Please enter email and password');
  }

  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      localStorage.setItem('token', data.token);

      // Prefer the role the backend sent directly; fall back to decoding
      // the JWT if it's missing for some reason.
      const role = (data.role || getRoleFromToken(data.token) || '').toLowerCase();

      alert('Logged in successfully');
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = 'admindashboard.html';
        } else if (role === 'provider') {
          window.location.href = 'providerdashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 1000);
    } else if (res.status === 401) {
      alert('Incorrect email or password');
    } else {
      alert(data.message || `Login failed (${res.status})`);
    }

  } catch (err) {
    console.error(err);
    alert('Could not connect to the server');
  }
});