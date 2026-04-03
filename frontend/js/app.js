const BASE_URL = window.location.origin;

// Initialize state from Storage
let token = localStorage.getItem('token');
let username = localStorage.getItem('username');
let role = localStorage.getItem('role') || 'user'; 
let isLoginMode = true;

// DOM Selectors
const getEl = (id) => document.getElementById(id);

const authSection = getEl('auth-section');
const dashboardSection = getEl('dashboard-section');
const userStatus = getEl('user-status');
const usernameDisplay = getEl('username-display');
const roleDisplay = getEl('role-display');
const viewModeText = getEl('view-mode-text');
const parkingGrid = getEl('parking-grid');
const toastContainer = getEl('toast-container');
const authForm = getEl('auth-form');
const authSubmit = getEl('auth-submit');
const authTitle = getEl('auth-title');
const authSubtitle = getEl('auth-subtitle');
const authToggleText = getEl('auth-toggle-text');
const authToggleLink = getEl('auth-toggle-link');
const roleGroup = getEl('role-group');
const logoutBtn = getEl('logout-btn');

/**
 * Robust Initialization
 */
function init() {
    console.log("Initializing ParkSim OS...");
    
    // Safety check: if token exists but username doesn't, force signout
    if (token && !username) {
        logout();
        return;
    }

    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
}

// ------------------- UI Controller -------------------

function showAuth() {
    if (authSection) authSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (userStatus) userStatus.style.display = 'none';
}

function showDashboard() {
    if (!authSection || !dashboardSection || !userStatus) return;

    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    userStatus.style.display = 'flex';
    
    if (usernameDisplay) usernameDisplay.textContent = username || 'UNKNOWN_NODE';
    if (roleDisplay) roleDisplay.textContent = role === 'admin' ? '[ADMIN_PRIVILEGES]' : '[VIEWER_ONLY]';
    if (viewModeText) viewModeText.textContent = role === 'admin' ? 'SIMULATION (CONTROL_CONNECTED)' : 'SIMULATION (READ_ONLY)';
    
    fetchParkingSpots();
    setupSSE();
}

function logout() {
    localStorage.clear();
    token = null;
    username = null;
    role = 'user';
    showAuth();
    showToast('SYSTEM_EXIT', 'Simulation session ended.', 'success');
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

// ------------------- Authentication -------------------

if (authToggleLink) {
    authToggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            authTitle.textContent = 'SYSTEM_BOOT';
            authSubtitle.textContent = 'Initialize simulation link';
            authSubmit.textContent = 'EXECUTE';
            authToggleText.textContent = "No ID?";
            authToggleLink.textContent = 'CREATE_NEW';
            roleGroup.style.display = 'none';
        } else {
            authTitle.textContent = 'NEW_NODE';
            authSubtitle.textContent = 'Allocate new simulator ID';
            authSubmit.textContent = 'GENERATE';
            authToggleText.textContent = "Have ID?";
            authToggleLink.textContent = 'LOGIN_BACK';
            roleGroup.style.display = 'block';
        }
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const uname = getEl('username').value;
        const pass = getEl('password').value;
        const userRole = getEl('role') ? getEl('role').value : 'user';

        const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

        try {
            const payload = { username: uname, password: pass };
            if (!isLoginMode) payload.role = userRole;

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Identity protocol failed');

            if (isLoginMode) {
                token = data.token;
                username = data.username;
                role = data.role || 'user';
                
                localStorage.setItem('token', token);
                localStorage.setItem('username', username);
                localStorage.setItem('role', role);
                
                showDashboard();
                showToast('UPLINK_SUCCESS', `Welcome back, ${username}`, 'success');
            } else {
                showToast('NODE_REGISTERED', 'Login to activate node.', 'success');
                authToggleLink.click();
            }
        } catch (err) {
            showToast('UPLINK_FAILURE', err.message, 'error');
        }
    });
}

// ------------------- Application Logic -------------------

async function fetchParkingSpots() {
    try {
        const response = await fetch(`${BASE_URL}/parking`);
        if (!response.ok) throw new Error('Data flow interrupted');
        const spots = await response.json();
        renderParkingSpots(spots);
    } catch (err) {
        showToast('DATALINK_ERROR', err.message, 'error');
    }
}

function renderParkingSpots(spots) {
    if (!parkingGrid) return;
    parkingGrid.innerHTML = '';
    
    spots.forEach(spot => {
        const isFree = spot.status === 'Free';
        const newStatus = isFree ? 'Occupied' : 'Free';
        const actionText = isFree ? 'SET_OCCUPIED' : 'SET_FREE';
        const stateClass = isFree ? 'free' : 'occupied';
        const displayStatus = isFree ? 'AVAILABLE' : 'BUSY';

        const el = document.createElement('div');
        el.className = `pixel-slot ${stateClass}`;
        
        // Context-aware controls
        const controlHtml = role === 'admin' 
            ? `<div class="controls">
                <button class="pixel-btn sm primary" onclick="toggleSpot(${spot.id}, '${newStatus}')">
                    ${actionText}
                </button>
               </div>`
            : '';

        el.innerHTML = `
            <div class="slot-header">
                <span class="slot-id">ID_${spot.id}</span>
                <div class="indicator-box"></div>
            </div>
            <p class="slot-location">${spot.location}</p>
            <span class="slot-status-text">LNK: ${displayStatus}</span>
            ${controlHtml}
        `;
        parkingGrid.appendChild(el);
    });
}

window.toggleSpot = async (id, newStatus) => {
    if (role !== 'admin' || !token) return; 
    try {
        const response = await fetch(`${BASE_URL}/parking/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Update failed');
        }
        
        // Immediate data refresh
        fetchParkingSpots();
    } catch (err) {
        showToast('CMD_FAILURE', err.message, 'error');
    }
};

// ------------------- Real-time Notifications (SSE) -------------------

let eventSource = null;

function setupSSE() {
    if (eventSource) {
        console.log("[SSE] Closing existing connection...");
        eventSource.close();
    }
    
    console.log("[SSE] Attempting uplink to simulation feed...");
    eventSource = new EventSource(`${BASE_URL}/notification/stream`);
    
    eventSource.onopen = () => {
        console.log("[SSE] Uplink established. Live updates ACTIVE.");
    };

    eventSource.onmessage = (event) => {
        console.log("[SSE] Data Received:", event.data);
        try {
            const data = JSON.parse(event.data);
            
            // Priority: Alert on status changes
            if (data.event === 'spot_freed') {
                console.log(`[SIM_ULINK] SPOT FREE alert for ${data.location || 'Unknown'}`);
                showToast('SYSTEM_ALERT: NODE_AVAILABLE', `Sector at ${data.location || 'Unknown'} is now FREE!`, 'success');
                fetchParkingSpots();
            } else if (data.event === 'spot_busy') {
                console.log(`[SIM_ULINK] SPOT BUSY alert for ${data.location || 'Unknown'}`);
                showToast('SYSTEM_ALERT: NODE_BUSY', `Sector at ${data.location || 'Unknown'} is now OCCUPIED.`, 'error');
                fetchParkingSpots();
            } else if (data.event === 'update' || data.event === 'connected') {
                // General refresh sync
                fetchParkingSpots();
            }
        } catch(e) {
            console.error("[SSE] Data Parsing Error:", e);
        }
    };

    eventSource.onerror = (err) => {
        console.error("[SSE] Uplink interrupted. Re-initializing in 5s...", err);
        eventSource.close();
        setTimeout(setupSSE, 5000);
    };
}

// ------------------- Notification UI -------------------

function showToast(title, message, type='success') {
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Auto-disposal
    const timer = setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 5000);

    toast.onclick = () => {
        clearTimeout(timer);
        toast.remove();
    };

    toast.innerHTML = `
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    toastContainer.appendChild(toast);
}

// Run Simulation
window.onload = init;
