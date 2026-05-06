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
    if (viewModeText) viewModeText.textContent = role === 'admin' ? 'SIMULATION (CONTROL_CONNECTED)' : 'SIMULATION (INTERACTIVE)';
    
    const adminControls = getEl('admin-controls');
    if (adminControls) {
        adminControls.style.display = role === 'admin' ? 'flex' : 'none';
    }
    
    logActivity(`> [SYSTEM] Uplink established for user: ${username}`, 'system');
    
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
        const response = await fetch(`${BASE_URL}/parking`, { cache: 'no-store' });
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
    
    let total = spots.length;
    let free = 0;
    let busy = 0;
    
    spots.forEach(spot => {
        const isFree = spot.status === 'Free';
        if (isFree) free++; else busy++;
        
        const stateClass = isFree ? 'free' : 'occupied';
        const displayStatus = isFree ? 'AVAILABLE' : 'BUSY';

        const el = document.createElement('div');
        el.className = `pixel-slot ${stateClass}`;
        
        let controlHtml = '';
        let ownerHtml = '';
        
        if (spot.claimed_by) {
            let plateStr = spot.vehicle_plate ? ` [${spot.vehicle_plate}]` : '';
            ownerHtml = `<span class="slot-owner-text">CLAIMED BY: ${spot.claimed_by}${plateStr}</span>`;
            if (spot.expires_at) {
                ownerHtml += `<br><span class="slot-timer-text" data-expires="${spot.expires_at}" style="font-size: 0.8rem; color: #FF9800; margin-top: 5px; display: inline-block;"></span>`;
            }
        } else {
            ownerHtml = `<span class="slot-owner-text" style="visibility:hidden">UNCLAIMED</span>`;
        }
        
        if (role === 'admin') {
            const actionText = isFree ? 'OCCUPY' : 'FORCE EVICT';
            const btnClass = isFree ? 'primary' : 'danger';
            const newStatus = isFree ? 'Occupied' : 'Free';
            controlHtml = `
                <div class="controls">
                    <button class="pixel-btn sm ${btnClass}" onclick="toggleSpot(${spot.id}, '${newStatus}')">
                        ${actionText}
                    </button>
                </div>
            `;
        } else {
            // User Mode
            if (isFree) {
                controlHtml = `
                    <div class="controls">
                        <button class="pixel-btn sm primary" onclick="toggleSpot(${spot.id}, 'Occupied')">
                            CLAIM SPOT
                        </button>
                    </div>
                `;
            } else if (spot.claimed_by === username) {
                controlHtml = `
                    <div class="controls">
                        <button class="pixel-btn sm" onclick="toggleSpot(${spot.id}, 'Free')">
                            RELEASE
                        </button>
                    </div>
                `;
            }
        }

        el.innerHTML = `
            <div class="slot-header">
                <span class="slot-id">ID_${spot.id}</span>
                <div class="indicator-box"></div>
            </div>
            <p class="slot-location">${spot.location}</p>
            <span class="slot-status-text">LNK: ${displayStatus}</span>
            ${ownerHtml}
            ${controlHtml}
        `;
        parkingGrid.appendChild(el);
    });
    
    // Update Analytics
    const statTotal = getEl('stat-total');
    const statFree = getEl('stat-free');
    const statBusy = getEl('stat-busy');
    if (statTotal) statTotal.textContent = total;
    if (statFree) statFree.textContent = free;
    if (statBusy) statBusy.textContent = busy;
}

window.toggleSpot = async (id, newStatus) => {
    if (!token) return; 
    try {
        const payload = { status: newStatus };
        if (newStatus === 'Occupied') {
            payload.claimedBy = role === 'admin' ? 'ADMIN' : username;
            const plate = prompt("Enter Vehicle License Plate (optional):", "MH-01-AB-1234");
            if (plate === null) return; // User cancelled
            payload.vehiclePlate = plate.toUpperCase();
        }
        
        const response = await fetch(`${BASE_URL}/parking/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
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

// Admin Controls
const btnResetAll = getEl('btn-reset-all');
if (btnResetAll) {
    btnResetAll.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to RESET ALL spots?')) return;
        try {
            await fetch(`${BASE_URL}/parking/reset`, { method: 'PUT' });
            fetchParkingSpots();
            logActivity('> [SYSTEM] Executed GLOBAL RESET override.', 'system');
        } catch (err) {
            showToast('RESET_FAILURE', err.message, 'error');
        }
    });
}

const addSpotForm = getEl('add-spot-form');
if (addSpotForm) {
    addSpotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const locInput = getEl('new-spot-name');
        if (!locInput || !locInput.value) return;
        
        try {
            await fetch(`${BASE_URL}/parking/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location: locInput.value })
            });
            locInput.value = '';
            fetchParkingSpots();
        } catch (err) {
            showToast('ADD_FAILURE', err.message, 'error');
        }
    });
}

// ------------------- Real-time Notifications (SSE) -------------------

let eventSource = null;

function logActivity(msg, type = 'system') {
    const feed = getEl('feed-content');
    if (!feed) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${msg}`;
    feed.appendChild(entry);
    feed.scrollTop = feed.scrollHeight;
}

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
                logActivity(`> ${data.message}`, 'success');
                fetchParkingSpots();
            } else if (data.event === 'spot_busy') {
                logActivity(`> ${data.message}`, 'alert');
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
        logActivity('> [ERROR] Uplink interrupted. Re-initializing...', 'alert');
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

// Global Timer Update
setInterval(() => {
    document.querySelectorAll('.slot-timer-text').forEach(el => {
        const expiresAt = parseInt(el.getAttribute('data-expires'));
        if (!expiresAt) return;
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        if (remaining > 0) {
            el.textContent = `EXPIRES IN: ${remaining}s`;
            el.style.color = remaining <= 10 ? '#F44336' : '#FF9800';
        } else {
            el.textContent = 'EXPIRED';
        }
    });
}, 1000);

// Run Simulation
window.onload = init;
