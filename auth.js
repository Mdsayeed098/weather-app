// ─── Supabase Auth Helper ───────────────────────────────────────────────────
const SUPABASE_URL     = 'https://zudhkkbudzhxvttiyeiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZGhra2J1ZHpoeHZ0dGl5ZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDg4MTIsImV4cCI6MjA5MjU4NDgxMn0.7EBKr0VO1UmlJPIzH-QaXlPNvEYGt9eqrZZlAukgmyw';

if (typeof supabase === 'undefined') {
    console.error('Supabase CDN failed to load.');
}

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

async function signUp(email, password, fullName) {
    return await supabaseClient.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
    });
}

async function signIn(email, password) {
    return await supabaseClient.auth.signInWithPassword({ email, password });
}

async function signOut() {
    return await supabaseClient.auth.signOut();
}

async function resetPassword(email) {
    // Dynamically get the current origin (works for both localhost and Vercel)
    const siteUrl = window.location.origin;
    return await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/login.html`,
    });
}

async function updatePassword(newPassword) {
    return await supabaseClient.auth.updateUser({
        password: newPassword
    });
}
