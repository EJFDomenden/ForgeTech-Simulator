// ==========================================
// 1. SUPABASE INITIALIZATION & TEST
// ==========================================
const VITE_SUPABASE_URL = 'https://ugikcueacvxshchdwzgy.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnaWtjdWVhY3Z4c2hjaGR3emd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDMwMDYsImV4cCI6MjA5MTkxOTAwNn0.y2E_GWhVTBtShcbMXYUFX1pcNE0xDYiX2nHMEZ8J5Fg';

let supabaseClient = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
} else {
    console.error('❌ Supabase library failed to load from CDN');
}

// Database Connection Confirmation
async function confirmConnection() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
        .from('test_table')
        .select('*');

    if (error) {
        console.error('❌ Connection failed:', error.message);
    } else {
        console.log('✅ Supabase is connected! Retrieved data:', data);
    }
}
confirmConnection();

// ==========================================
// 2. SESSION CHECK
// ==========================================
window.addEventListener('load', async () => {
    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'index.html';
        }
    }
});

// ==========================================
// 3. DOM ELEMENTS & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    const signupForm = document.getElementById('frm_signup')
    const loginForm = document.getElementById('frm_login');

    // Grab UI Toggle buttons
    const goSignupBtn = document.getElementById('go-to-signup');
    const goLoginBtn = document.getElementById('go-to-login');

    // --- UI TOGGLES ---
    if (goSignupBtn && goLoginBtn) {
        goSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('grp_login').classList.remove('active');
            document.getElementById('grp_signup').classList.add('active');
            // Clear all error messages when switching views
            document.querySelectorAll('#error-message').forEach(msg => msg.innerText = '');
        });

        goLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('grp_signup').classList.remove('active');
            document.getElementById('grp_login').classList.add('active');
            document.querySelectorAll('#error-message').forEach(msg => msg.innerText = '');
        });
    }

    // --- FORM SUBMISSION LOGIC ---
    
    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            console.log("Logging in...");

            // Grab elements specific to THIS form
            const emailInp = loginForm.querySelector('.inp_email');
            const passInp = loginForm.querySelector('.inp_password');
            const errorMsg = loginForm.parentElement.querySelector('#error-message');

            let errors = getLoginFormErrors(emailInp, passInp);

            if (errors.length > 0) {
                errorMsg.innerText = errors.join(". ");
                return;
            }

            const { error } = await supabaseClient.auth.signInWithPassword({
                email: emailInp.value,
                password: passInp.value
            });

            if (error) {
                errorMsg.innerText = error.message;
            } else {
                window.location.href = '/index.html';
            }
        });
    }
   
    // Handle Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            console.log("Signing up...");

            // Grab elements specific to THIS form
            const emailInp = signupForm.querySelector('.inp_email');
            const passInp = signupForm.querySelector('.inp_password');
            const repeatInp = signupForm.querySelector('.inp_repeatpassword');
            const errorMsg = signupForm.parentElement.querySelector('#error-message');

            let errors = getSignupFormErrors(emailInp, passInp, repeatInp);

            if (errors.length > 0) {
                errorMsg.innerText = errors.join(". ");
                return;
            }

            // Database interaction via supabaseClient
            const { data, error } = await supabaseClient.auth.signUp({
                email: emailInp.value,
                password: passInp.value,
            });

            if (error) {
                errorMsg.innerText = error.message;
            } else {
                alert("Account created! Redirecting to dashboard...");
                window.location.href = '/index.html';
            }
        });
    }

    // --- VALIDATION FUNCTIONS ---
    // We now pass the entire input element so we can check its value AND highlight it
    function getSignupFormErrors(emailInp, passInp, repeatInp) {
        let errors = [];
        const email = emailInp.value;
        const password = passInp.value;
        const repeatPassword = repeatInp.value;

        if (email === '' || email == null) {
            errors.push('Email is required');
            emailInp.parentElement.classList.add('incorrect');
        }
        if (password === '' || password == null) {
            errors.push('Password is required');
            passInp.parentElement.classList.add('incorrect');
        } else if (password.length < 8) {
            errors.push('Password must have at least 8 characters');
            passInp.parentElement.classList.add('incorrect');
        }
        if (password !== repeatPassword) {
            errors.push('Passwords do not match');
            passInp.parentElement.classList.add('incorrect');
            repeatInp.parentElement.classList.add('incorrect');
        }

        return errors;
    }

    function getLoginFormErrors(emailInp, passInp) {
        let errors = [];
        const email = emailInp.value;
        const password = passInp.value;

        if (email === '' || email == null) {
            errors.push('Email is required');
            emailInp.parentElement.classList.add('incorrect');
        }
        if (password === '' || password == null) {
            errors.push('Password is required');
            passInp.parentElement.classList.add('incorrect');
        }

        return errors;
    }

    // --- CLEAR ERRORS ON TYPING ---
    // Grab all inputs globally, then clear their specific container's errors
    const allInputs = document.querySelectorAll('input');
    
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.parentElement.classList.contains('incorrect')) {
                input.parentElement.classList.remove('incorrect');
                // Find the specific error message for the view we are currently typing in
                const errorMsg = input.closest('.view').querySelector('#error-message');
                if (errorMsg) errorMsg.innerText = '';
            }
        });
    });

});