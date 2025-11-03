// Configuration
// Auto-detect API URL based on environment
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168') || window.location.hostname.includes('172.')
    ? 'http://172.18.8.179:3000'  // Local development
    : '';  // Production (same domain)

const CONFIG = {
    API_URL: `${API_BASE}/api/emergency-alert`,
    VALIDATE_URL: `${API_BASE}/api/validate-user`
};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const alertScreen = document.getElementById('alertScreen');
const computingId = document.getElementById('computingId');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');
const staffName = document.getElementById('staffName');
const displayComputingId = document.getElementById('displayComputingId');
const locationType = document.getElementById('locationType');
const garrettFields = document.getElementById('garrettFields');
const garrettFloor = document.getElementById('garrettFloor');
const garrettRoom = document.getElementById('garrettRoom');
const onGroundsFields = document.getElementById('onGroundsFields');
const buildingName = document.getElementById('buildingName');
const buildingRoom = document.getElementById('buildingRoom');
const locationSelect = document.getElementById('location');
const notes = document.getElementById('notes');
const emergencyBtn = document.getElementById('emergencyBtn');
const logoutBtn = document.getElementById('logoutBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmText = document.getElementById('confirmText');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');
const alertMessage = document.getElementById('alertMessage');

// State
let isAuthenticated = false;
let isSending = false;
let currentUser = null;

// Check if already logged in (using sessionStorage)
const savedUser = sessionStorage.getItem('battenUser');
if (savedUser) {
    currentUser = JSON.parse(savedUser);
    isAuthenticated = true;
    showAlertScreen();
}

// Event Listeners
computingId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

loginBtn.addEventListener('click', handleLogin);
emergencyBtn.addEventListener('click', handleEmergencyClick);
logoutBtn.addEventListener('click', handleLogout);
cancelBtn.addEventListener('click', hideModal);
confirmBtn.addEventListener('click', sendAlert);
locationType.addEventListener('change', handleLocationTypeChange);

// Location Functions
function handleLocationTypeChange() {
    const type = locationType.value;
    garrettFields.style.display = 'none';
    onGroundsFields.style.display = 'none';
    garrettFloor.value = '';
    garrettRoom.value = '';
    buildingName.value = '';
    buildingRoom.value = '';
    locationSelect.value = '';

    if (type === 'garrett') {
        garrettFields.style.display = 'block';
    } else if (type === 'ongrounds') {
        onGroundsFields.style.display = 'block';
    } else if (type === 'remote') {
        locationSelect.value = 'Remote';
    }
}

function buildLocationString() {
    const type = locationType.value;
    if (type === 'garrett') {
        const floor = garrettFloor.value;
        const room = garrettRoom.value;
        if (!floor || !room) return null;
        return `Garrett Hall - ${floor} - Room ${room}`;
    } else if (type === 'ongrounds') {
        const building = buildingName.value.trim();
        const room = buildingRoom.value.trim();
        if (!building || !room) return null;
        return `${building} - Room ${room}`;
    } else if (type === 'remote') {
        return 'Remote';
    }
    return null;
}

// Functions
async function handleLogin() {
    const uid = computingId.value.trim().toLowerCase();

    if (!uid) {
        showLoginAlert('Please enter your computing ID.', 'error');
        return;
    }

    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span> Validating...';

    try {
        const response = await fetch(CONFIG.VALIDATE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ computingId: uid })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentUser = data.user;
            isAuthenticated = true;
            sessionStorage.setItem('battenUser', JSON.stringify(currentUser));
            computingId.value = '';
            showAlertScreen();
        } else {
            showLoginAlert(data.error || 'Not authorized. Computing ID not found.', 'error');
            computingId.value = '';
            computingId.focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginAlert('Connection error. Please check that the server is running.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login';
    }
}

function showLoginAlert(message, type) {
    loginMessage.innerHTML = `<div class="alert-message alert-${type}">${message}</div>`;
    setTimeout(() => {
        loginMessage.innerHTML = '';
    }, 5000);
}

function showAlertScreen() {
    loginScreen.classList.remove('active');
    alertScreen.classList.add('active');

    // Populate user info
    if (currentUser) {
        staffName.value = currentUser.name;
        displayComputingId.textContent = currentUser.uid;
    }
}

function showLoginScreen() {
    alertScreen.classList.remove('active');
    loginScreen.classList.add('active');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        isAuthenticated = false;
        currentUser = null;
        sessionStorage.removeItem('battenUser');
        clearForm();
        showLoginScreen();
    }
}

function handleEmergencyClick() {
    if (isSending) return;

    if (!currentUser) {
        showAlert('Session expired. Please login again.', 'error');
        handleLogout();
        return;
    }

    if (!locationType.value) {
        showAlert('Please select a location type.', 'error');
        return;
    }

    const locationStr = buildLocationString();
    if (!locationStr) {
        showAlert('Please complete all required location fields.', 'error');
        return;
    }

    locationSelect.value = locationStr;
    confirmText.textContent = `This will record your location as: ${locationStr}`;
    confirmModal.classList.add('active');
}

function hideModal() {
    confirmModal.classList.remove('active');
}

async function sendAlert() {
    hideModal();

    if (isSending || !currentUser) return;
    isSending = true;

    // Disable button and show loading
    emergencyBtn.disabled = true;
    emergencyBtn.innerHTML = '<span class="spinner"></span> Sending...';

    try {
        const payload = {
            computingId: currentUser.uid,
            name: currentUser.name,
            location: locationSelect.value,
            notes: notes.value.trim(),
            timestamp: new Date().toISOString()
        };

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            showAlert('✓ Location check-in successful! Your location has been recorded.', 'success');

            // Clear location and notes
            locationType.value = '';
            handleLocationTypeChange();
            notes.value = '';

            // Vibrate if supported
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }

            console.log('Alert sent successfully:', result);
        } else {
            throw new Error(`Server responded with ${response.status}`);
        }
    } catch (error) {
        console.error('Error recording check-in:', error);
        showAlert('Failed to record your location. Please try again.', 'error');
    } finally {
        isSending = false;
        emergencyBtn.disabled = false;
        emergencyBtn.innerHTML = '✓ CHECK IN - REPORT LOCATION';
    }
}

function showAlert(message, type) {
    alertMessage.innerHTML = `<div class="alert-message alert-${type}">${message}</div>`;

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            alertMessage.innerHTML = '';
        }, 5000);
    }
}

function clearForm() {
    locationType.value = '';
    garrettFloor.value = '';
    garrettRoom.value = '';
    buildingName.value = '';
    buildingRoom.value = '';
    notes.value = '';
    alertMessage.innerHTML = '';
    handleLocationTypeChange();
}

// Close modal when clicking outside
confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        hideModal();
    }
});

// Prevent accidental back navigation
window.addEventListener('beforeunload', (e) => {
    if (isAuthenticated) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Service Worker registration for PWA (if you add one later)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
    });
}
