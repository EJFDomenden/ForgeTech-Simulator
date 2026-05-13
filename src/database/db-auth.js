// Call method for Database Connection Confirmation
async function confirmConnection() {
  const { data, error } = await supabaseClient
    .from('test_table')
    .select('*');

  if (error) {
    console.error('❌ Connection failed for db-auth:', error.message);
  } else {
    console.log('✅ Supabase is connected to db-auth! Retrieved data:', data);
  }
} confirmConnection();

//Process of account form session
// 1. Check if already logged in. If yes, kick them to the dashboard.
window.addEventListener('load', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
    }
});

// 2. Simple UI toggles to switch between Login and Signup forms on this page
document.getElementById('go-to-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-signup').classList.add('active');
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('view-signup').classList.remove('active');
    document.getElementById('view-login').classList.add('active');
});

// 3. Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        errorEl.textContent = error.message;
    } else {
        // Token is automatically saved to localStorage. Redirect to main app.
        window.location.href = 'index.html';
    }
});

// 4. Handle Signup
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errorEl = document.getElementById('signup-error');

    if (password !== confirm) {
        errorEl.textContent = "Passwords do not match.";
        return;
    }

    const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        errorEl.textContent = error.message;
    } else {
        alert("Account created! Redirecting to dashboard...");
        window.location.href = 'index.html';
    }
});