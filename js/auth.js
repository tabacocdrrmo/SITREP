// Login gate + authenticated proxy helper for the SITREP app.
// Only admin/operator accounts may use SIT REP. All data calls go through the
// sitrep-data edge function, so the Apps Script URL never reaches this app.

const { createClient } = supabase;
const supabaseClient = createClient(
    "https://lwlpftfaxtvhdvmxcvtm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bHBmdGZheHR2aGR2bXhjdnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Nzk5NzksImV4cCI6MjA5OTA1NTk3OX0.gAv_Yh3n-y6KlWq1kpa5XFojrQfqRDQnutv1t8IwU1U"
);

const ALLOWED_ROLES = ["admin", "operator"];

function usernameToEmail(username) {
    return username
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .toLowerCase() + '@placeholder.com';
}

// Calls the sitrep-data edge function (admin/operator only). Throws when the
// session is missing, expired, or the role is not allowed.
async function invokeSitrepData(action, body) {
    const { data, error } = await supabaseClient.functions.invoke("sitrep-data", {
        body: { action: action, ...(body || {}) }
    });
    if (error) {
        const status = (error.context && error.context.status) || 0;
        if (status === 401 || status === 403) {
            await supabaseClient.auth.signOut();
            throw new Error("Your session is no longer authorized. Please log in again.");
        }
        throw error;
    }
    return data;
}

async function currentRole(userId) {
    const { data, error } = await supabaseClient
        .from("accounts")
        .select("role")
        .eq("auth_user_id", userId)
        .maybeSingle();
    if (error || !data) return "";
    return data.role || "";
}

const LOGIN_CSS = `
#sitrepLoginOverlay{position:fixed;inset:0;background:#fff;z-index:9999;align-items:center;justify-content:center;padding:16px}
#sitrepLoginCard{width:100%;max-width:340px;text-align:center}
#sitrepLoginCard img{width:76px;height:76px;object-fit:contain}
#sitrepLoginCard .office-name{font-size:13px;font-weight:bold;letter-spacing:1px;margin-top:6px}
#sitrepLoginCard .office-title{font-size:11px;color:#333}
#sitrepLoginCard form{margin-top:18px;text-align:left}
#sitrepLoginCard label{display:block;font-size:12px;margin:8px 0 2px}
#sitrepLoginCard input{width:100%;height:34px;font-size:14px;padding:4px 8px;border:1px solid #777;border-radius:4px;background:#fff;font-family:inherit}
#sitrepLoginCard .login-error{color:#c00;font-size:12px;min-height:16px;margin:6px 0}
#sitrepLoginCard .login-btn{width:100%;height:36px;border:1px solid #111;background:#111;color:#fff;font-size:14px;font-weight:bold;border-radius:4px;cursor:pointer;margin-top:6px}
#sitrepLoginCard .login-btn:disabled{opacity:.6}
body.login-locked .form-container, body.login-locked #reportModal{display:none!important}
#sitrepLogout{position:fixed;top:8px;right:8px;z-index:9000;border:1px solid #777;background:#fff;color:#111;font-size:12px;padding:4px 10px;border-radius:4px;cursor:pointer}`;

function loginOverlayHTML() {
    return `
    <div id="sitrepLoginOverlay" style="display:none">
        <div id="sitrepLoginCard">
            <img src="CDRRMO Logo.png" alt="CDRRMO Logo" onerror="this.style.display='none'">
            <div class="office-name">TABACO CITY CDRRMO</div>
            <div class="office-title">Situation Report Log</div>
            <form id="sitrepLoginForm" novalidate>
                <label for="sitrepUsername">Username</label>
                <input id="sitrepUsername" type="text" autocomplete="username">
                <label for="sitrepPassword">Password</label>
                <input id="sitrepPassword" type="password" autocomplete="current-password">
                <div id="sitrepLoginError" class="login-error"></div>
                <button type="submit" id="sitrepLoginBtn" class="login-btn">Log In</button>
            </form>
        </div>
    </div>`;
}

function showLogin() {
    document.body.classList.add("login-locked");
    const overlay = document.getElementById("sitrepLoginOverlay");
    if (overlay) overlay.style.display = "flex";
    const username = document.getElementById("sitrepUsername");
    if (username) username.focus();
}

function hideLogin() {
    document.body.classList.remove("login-locked");
    const overlay = document.getElementById("sitrepLoginOverlay");
    if (overlay) overlay.style.display = "none";
}

async function handleLoginSubmit(ev) {
    ev.preventDefault();
    const userIn = document.getElementById("sitrepUsername").value.trim();
    const passIn = document.getElementById("sitrepPassword").value;
    const errEl = document.getElementById("sitrepLoginError");
    const btn = document.getElementById("sitrepLoginBtn");
    if (!userIn || !passIn) {
        errEl.textContent = "Enter your username and password.";
        return;
    }
    btn.disabled = true;
    errEl.textContent = "";
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: usernameToEmail(userIn),
            password: passIn
        });
        if (authError) {
            errEl.textContent = "Invalid username or password.";
            btn.disabled = false;
            return;
        }
        const role = await currentRole(authData.user.id);
        if (ALLOWED_ROLES.indexOf(role) === -1) {
            await supabaseClient.auth.signOut();
            errEl.textContent = "This account is not authorized to use SIT REP. Contact an administrator.";
            btn.disabled = false;
            return;
        }
        onAuthorized();
    } catch (err) {
        errEl.textContent = "Login failed: " + (err && err.message || err);
        btn.disabled = false;
    }
}

function onAuthorized() {
    hideLogin();
    if (!document.getElementById("sitrepLogout")) {
        const b = document.createElement("button");
        b.id = "sitrepLogout";
        b.textContent = "Log out";
        b.onclick = logout;
        document.body.appendChild(b);
    }
    if (typeof window.onLoginReady === "function") {
        try { window.onLoginReady(); } catch (err) { console.error("onLoginReady error:", err); }
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    const b = document.getElementById("sitrepLogout");
    if (b) b.remove();
    showLogin();
}

async function initLogin() {
    const style = document.createElement("style");
    style.textContent = LOGIN_CSS;
    document.head.appendChild(style);

    const wrap = document.createElement("div");
    wrap.innerHTML = loginOverlayHTML();
    document.body.appendChild(wrap.firstElementChild);
    document.getElementById("sitrepLoginForm").addEventListener("submit", handleLoginSubmit);

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const role = await currentRole(session.user.id);
        if (ALLOWED_ROLES.indexOf(role) !== -1) {
            onAuthorized();
            return;
        }
        await supabaseClient.auth.signOut();
    }
    showLogin();
}

document.addEventListener("DOMContentLoaded", initLogin);