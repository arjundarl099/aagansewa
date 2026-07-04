const registerForm = document.querySelector('#registerForm');

const pushDataToDatabase = async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  if (!username || !email || !password) {
    return alert('Please enter username, email, and password');
  }

  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: username, email, password, role }),
    });

    const data = await res.json().catch(() => ({}));

    // Check the HTTP status too, not just data.success — a validation error
    // or server error may not include a `success` field at all.
    if (res.ok && data.success) {
      alert('Registration successful!');
      window.location.href = 'login.html';
    } else {
      alert(data.message || `Registration failed (${res.status})`);
    }

  } catch (error) {
    console.error(error);
    alert('Error connecting to server');
  }
};

registerForm.addEventListener('submit', pushDataToDatabase);