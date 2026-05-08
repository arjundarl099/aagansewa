const registerForm = document.querySelector('#registerForm');

const pushDataToDatabase = async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  if (!username || !email || !password) {
    return alert("Please enter username, email, and password");
  }

  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: username, email, password, role }),
    });

    const data = await res.json();
    console.log(data);

    if (data.success) {
      alert("Registration successful!");
    } else {
      alert(data.message || "Registration failed");
    }

  } catch (error) {
    console.error(error);
    alert("Error connecting to server");
  }
};

registerForm.addEventListener('submit', pushDataToDatabase);