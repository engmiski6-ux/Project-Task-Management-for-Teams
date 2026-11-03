/**
 * Login / Register — no demo account helpers on screen
 */
document.addEventListener('DOMContentLoaded', async () => {
  API.init();

  const session = await API.getSession();
  if (session) {
    window.location.href = 'app.html';
    return;
  }

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const errorEl = document.getElementById('auth-error');

  function showError(msg) {
    errorEl.textContent = msg || '';
    errorEl.classList.toggle('hidden', !msg);
  }

  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    showError('');
  });

  tabRegister?.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    showError('');
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value;
      await API.login(identifier, password);
      window.location.href = 'app.html';
    } catch (err) {
      showError(err.message || 'Login failed');
      btn.disabled = false;
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const btn = registerForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await API.register({
        full_name: document.getElementById('reg-name').value.trim(),
        username: document.getElementById('reg-username').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
      });
      window.location.href = 'app.html';
    } catch (err) {
      showError(err.message || 'Registration failed');
      btn.disabled = false;
    }
  });
});
