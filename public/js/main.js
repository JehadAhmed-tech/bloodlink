/**
 * BloodLink - Core Application Logic
 * Fixed version: navigation, auth persistence, request modal, donor search,
 * request loading, filters and My Donor profile.
 */

const API_BASE_URL = window.location.origin;

function getLoggedUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
        console.error('User parse error:', error);
        return null;
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ================= PAGE NAVIGATION ================= */
function showPage(pageId) {
    const pages = ['home', 'requests', 'mydonor'];

    pages.forEach((id) => {
        const page = document.getElementById(`page-${id}`);
        const nav = document.getElementById(`nav-${id}`);

        if (page) page.style.display = id === pageId ? 'block' : 'none';
        if (nav) nav.classList.toggle('active', id === pageId);
    });

    if (pageId === 'requests') loadBloodRequests();
    if (pageId === 'mydonor') loadMyDonorProfile();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================= AUTH MODAL ================= */
function openModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchAuthTab('signin');
}

function openRegisterModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchAuthTab('register');
}

function closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function switchAuthTab(tab) {
    const signin = document.getElementById('form-signin');
    const register = document.getElementById('form-register');
    const signinBtn = document.getElementById('tab-signin-btn');
    const registerBtn = document.getElementById('tab-register-btn');

    const isSignin = tab === 'signin';
    if (signin) signin.style.display = isSignin ? 'flex' : 'none';
    if (register) register.style.display = isSignin ? 'none' : 'flex';
    if (signinBtn) signinBtn.classList.toggle('active', isSignin);
    if (registerBtn) registerBtn.classList.toggle('active', !isSignin);
}

/* ================= REQUEST MODAL ================= */
function openRequestModal() {
    const modal = document.getElementById('request-modal');
    if (modal) modal.classList.add('active');
}

function closeRequestModal() {
    const modal = document.getElementById('request-modal');
    if (modal) modal.classList.remove('active');
}

/* ================= REQUEST FILTERS ================= */
function filterRequests(category, btnElement) {
    document.querySelectorAll('.filter-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    document.querySelectorAll('#page-requests .req-card').forEach(card => {
        const categoryFromData = card.dataset.category;
        const categoryFromClass = card.classList.contains('critical') ? 'critical' : null;
        const cardCategory = categoryFromData || categoryFromClass || 'moderate';
        card.style.display = category === 'all' || cardCategory === category ? '' : 'none';
    });
}

function filterByBloodGroup(selectedGroup) {
    document.querySelectorAll('#page-requests .cards-grid .req-card').forEach(card => {
        const badge = card.querySelector('.blood-badge');
        const group = badge ? badge.textContent.trim() : '';
        card.style.display = selectedGroup === 'All Blood Groups' || group === selectedGroup ? '' : 'none';
    });
}

/* ================= DONOR SEARCH ================= */
async function searchDonors() {
    const groupEl = document.getElementById('donorBloodGroup');
    const locationEl = document.getElementById('donorLocation');
    const resultEl = document.getElementById('donorSearchResults');

    if (!groupEl || !locationEl || !resultEl) return;

    const selectedGroup = groupEl.value.trim();
    const locationQuery = locationEl.value.trim().toLowerCase();

    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="donor-search-loading">Searching donors...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/donors`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Could not load donors');
        }

        const donors = Array.isArray(data.donors) ? data.donors : [];
        const matched = donors.filter(donor => {
            const bloodOk = !selectedGroup || selectedGroup === 'Blood Group' || donor.blood_group === selectedGroup;
            const location = String(donor.location || '').toLowerCase();
            const locationOk = !locationQuery || location.includes(locationQuery);
            return bloodOk && locationOk;
        });

        if (!matched.length) {
            resultEl.innerHTML = `
                <div class="donor-search-empty">
                    <strong>No donors found.</strong>
                    <span>Try another blood group or location.</span>
                </div>`;
            return;
        }

        resultEl.innerHTML = `
            <div class="donor-search-header">
                🩸 ${matched.length} donor${matched.length === 1 ? '' : 's'} found
            </div>
            <div class="donor-results-grid">
                ${matched.map(donor => `
                    <div class="donor-result-card">
                        <div class="donor-result-top">
                            <div class="blood-badge">${escapeHtml(donor.blood_group || 'N/A')}</div>
                            <div>
                                <h3>${escapeHtml(donor.name || 'Unknown Donor')}</h3>
                                <p>${escapeHtml(donor.location || 'Location not provided')}</p>
                            </div>
                        </div>
                        <div class="donor-result-info">
                            <span>📞 ${escapeHtml(donor.phone || 'Phone not provided')}</span>
                            <span>✉️ ${escapeHtml(donor.email || 'Email not provided')}</span>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    } catch (error) {
        console.error('Donor Search Error:', error);
        resultEl.innerHTML = '<div class="donor-search-empty">❌ Donor search failed. Please try again.</div>';
    }
}

/* ================= REQUESTS ================= */
async function submitBloodRequest(event) {
    event.preventDefault();

    const form = document.getElementById('request-form');
    const modal = document.getElementById('request-modal');
    if (!form) return;

    const payload = {
        patient_name: document.getElementById('req-patient-name')?.value.trim(),
        blood_group: document.getElementById('req-blood-group')?.value,
        hospital: document.getElementById('req-hospital')?.value.trim(),
        contact_number: document.getElementById('req-contact')?.value.trim(),
        bags_needed: Number(document.getElementById('req-bags')?.value || 1)
    };

    if (!payload.patient_name || !payload.blood_group || !payload.hospital || !payload.contact_number || payload.bags_needed < 1) {
        alert('Please fill in all blood request fields correctly.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Request could not be saved');
        }

        alert('🎉 Blood request posted successfully!');
        form.reset();
        closeRequestModal();
        await loadBloodRequests();
        showPage('requests');
    } catch (error) {
        console.error('Request submit error:', error);
        alert(`❌ ${error.message || 'Could not post the request.'}`);
    }
}

async function loadBloodRequests() {
    const container = document.getElementById('requests-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/requests`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load requests');

        const requests = Array.isArray(data.requests) ? data.requests : [];
        if (!requests.length) {
            container.innerHTML = '<div class="empty-msg">No blood requests found.</div>';
            updateRequestStats([]);
            return;
        }

        container.innerHTML = requests.map(req => `
            <div class="req-card dynamic-request-card" data-category="${escapeHtml((req.urgency || 'moderate').toLowerCase())}" data-request-id="${escapeHtml(req.id)}">
                <div class="card-top">
                    <div class="blood-badge">${escapeHtml(req.blood_group || 'N/A')}</div>
                    <div class="details">
                        <h3>${escapeHtml(req.patient_name || 'Patient')}</h3>
                        <span>${escapeHtml(req.hospital || req.hospital_location || 'Hospital not provided')}</span>
                    </div>
                    <span class="badge-tag ${escapeHtml((req.urgency || 'urgent').toLowerCase())}">${escapeHtml(String(req.urgency || 'URGENT').toUpperCase())}</span>
                </div>
                <div class="progress-info">
                    <span>Blood bags needed</span>
                    <span class="count red">${escapeHtml(req.bags_needed || 0)}</span>
                </div>
                <div class="progress-bar"><div class="fill" style="width: ${Math.min(100, Math.round((Number(req.bags_collected || 0) / Math.max(1, Number(req.bags_needed || 1))) * 100))}%;"></div></div>
                <div class="card-footer">
                    <span class="time">${req.created_at ? new Date(req.created_at + 'Z').toLocaleString() : 'Recently'}</span>
                    <button class="btn-respond" onclick="handleRespond(this)">Respond</button>
                </div>
            </div>
        `).join('');

        updateRequestStats(requests);
    } catch (error) {
        console.error('Load requests error:', error);
        container.innerHTML = '<div class="empty-msg">❌ Could not load blood requests.</div>';
    }
}

function updateRequestStats(requests) {
    const stats = document.querySelectorAll('#page-requests .req-stat-card .num');
    const critical = requests.filter(r => String(r.urgency || '').toLowerCase() === 'critical').length;
    const urgent = requests.filter(r => String(r.urgency || '').toLowerCase() === 'urgent').length;
    if (stats.length >= 1) stats[0].textContent = requests.length;
    if (stats.length >= 2) stats[1].textContent = critical;
    if (stats.length >= 3) stats[2].textContent = urgent;
}

/* ================= AUTH ================= */
function setupAuthFormListeners() {
    const signinForm = document.getElementById('form-signin');
    const registerForm = document.getElementById('form-register');

    if (signinForm && !signinForm.dataset.bound) {
        signinForm.dataset.bound = '1';
        signinForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = signinForm.querySelector('input[type="email"]')?.value.trim();
            const password = signinForm.querySelector('input[type="password"]')?.value;

            try {
                const response = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (!response.ok || !data.success || !data.user) {
                    throw new Error(data.message || 'Sign in failed');
                }

                // IMPORTANT: persist the logged-in user so index.html does not redirect to login.
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('🎉 Sign in successful!');
                closeModal();
                updateUserUI();
                loadMyDonorProfile();
            } catch (error) {
                console.error('Sign in error:', error);
                alert(`❌ ${error.message || 'Sign in failed.'}`);
            }
        });
    }

    if (registerForm && !registerForm.dataset.bound) {
        registerForm.dataset.bound = '1';
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = Object.fromEntries(new FormData(registerForm).entries());

            try {
                const response = await fetch(`${API_BASE_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Registration failed');
                }

                alert('🎉 Account created successfully! Now sign in with your email and password.');
                registerForm.reset();
                switchAuthTab('signin');
            } catch (error) {
                console.error('Registration error:', error);
                alert(`❌ ${error.message || 'Registration failed.'}`);
            }
        });
    }
}

/* ================= MY DONOR ================= */
function loadMyDonorProfile() {
    const user = getLoggedUser();
    if (!user) return;

    const nameEl = document.querySelector('.name-badge-row h2');
    const groupEl = document.querySelector('.blood-group-tag');
    const locationEl = document.querySelector('.location-text');

    if (nameEl) nameEl.textContent = user.name || 'BloodLink User';
    if (groupEl) groupEl.textContent = `${user.blood_group || 'N/A'} Donor`;
    if (locationEl) locationEl.textContent = `${user.location && user.location !== 'N/A' ? user.location : 'Location not provided'} · BloodLink member`;
    const availabilityToggle = document.querySelector('.availability-card input[type="checkbox"]');
    if (availabilityToggle && typeof user.is_available !== 'undefined') {
        availabilityToggle.checked = Boolean(user.is_available);
    }
}

function updateUserUI() {
    const user = getLoggedUser();
    const userInfo = document.getElementById('userInfo');
    if (userInfo) userInfo.textContent = user?.name ? `Hello, ${user.name}` : '';
    loadMyDonorProfile();
}

function logoutUser() {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

/* ================= RESPOND ================= */
async function handleRespond(btn) {
    if (!btn || btn.disabled) return;

    const card = btn.closest('[data-request-id]');
    const requestId = card?.dataset.requestId;
    const user = getLoggedUser();

    if (!requestId) {
        alert('Request id is missing.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donor_id: user?.id || null })
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not record response.');

        btn.textContent = 'Responded';
        btn.style.backgroundColor = '#22c55e';
        btn.style.color = '#fff';
        btn.disabled = true;
        alert('Thank you for offering help! Your response has been recorded.');
    } catch (error) {
        console.error('Respond error:', error);
        alert(`❌ ${error.message || 'Could not respond to this request.'}`);
    }
}

/* ================= INITIALIZATION ================= */
document.addEventListener('DOMContentLoaded', () => {
    // Search
    document.getElementById('donorSearchBtn')?.addEventListener('click', searchDonors);
    document.getElementById('donorLocation')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') searchDonors();
    });

    // Request modal
    document.getElementById('post-request-nav-btn')?.addEventListener('click', event => {
        event.preventDefault();
        openRequestModal();
    });
    document.getElementById('close-request-modal')?.addEventListener('click', closeRequestModal);
    document.getElementById('request-form')?.addEventListener('submit', submitBloodRequest);
    document.getElementById('request-modal')?.addEventListener('click', event => {
        if (event.target.id === 'request-modal') closeRequestModal();
    });

    // Auth modal
    document.getElementById('authModal')?.addEventListener('click', event => {
        if (event.target.id === 'authModal') closeModal();
    });

    // Request-page blood group filter
    document.querySelector('.blood-group-select')?.addEventListener('change', event => {
        filterByBloodGroup(event.target.value);
    });

    setupAuthFormListeners();
    updateUserUI();

    // Persist donor availability from My Donor page.
    const availabilityToggle = document.querySelector('.availability-card input[type="checkbox"]');
    availabilityToggle?.addEventListener('change', async event => {
        const user = getLoggedUser();
        if (!user?.id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/donors/${user.id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ available: event.target.checked })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'Could not update availability.');
            localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
            console.error('Availability update error:', error);
            event.target.checked = !event.target.checked;
            alert(`❌ ${error.message || 'Could not update availability.'}`);
        }
    });

    loadBloodRequests();
    showPage('home');
});

// Keep the existing HTML inline login protection, but also make the UI update safely.
(function checkUserLogin() {
    const loggedUser = getLoggedUser();
    if (!loggedUser && !window.location.pathname.endsWith('/login.html')) {
        // The main page requires authentication in the current project.
        window.location.href = '/login.html';
    }
})();
