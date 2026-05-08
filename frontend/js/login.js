const loginForm = document.querySelector('#loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) {
    return alert('Please enter email and password');
  }

  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      alert('user logged in successfully');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      alert('unauthorized! acceess deneild');
    }

  } catch (err) {
    console.error(err);
    alert('server deneild');
  }
});