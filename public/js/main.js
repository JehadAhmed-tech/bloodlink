/**
 * BloodLink - Core Application Logic
 */

// Live Backend Base URL
const API_BASE_URL = 'https://bloodlink-2d1x.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    // Initialize default page view state
    showPage("home");

    // Close auth modal when clicking on the overlay background
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) {
                closeModal();
            }
        });
    }

    // Attach listener to dropdown filter for dynamic updates
    const bloodSelect = document.querySelector(".blood-group-select");
    if (bloodSelect) {
        bloodSelect.addEventListener("change", (e) => {
            filterByBloodGroup(e.target.value);
        });
    }

    // Sign In & Register Form Submissions
    setupAuthFormListeners();
});

/* ================= PAGE NAVIGATION ================= */

/**
 * Switches views between Home, Requests, and My Donor pages.
 * @param {string} pageId - Target page identifier ('home', 'requests', 'mydonor')
 */
function showPage(pageId) {
    const pages = ["home", "requests", "mydonor"];

    pages.forEach((id) => {
        const pageElement = document.getElementById(`page-${id}`);
        const navElement = document.getElementById(`nav-${id}`);

        if (pageElement) {
            pageElement.style.display = id === pageId ? "block" : "none";
        }

        if (navElement) {
            if (id === pageId) {
                navElement.classList.add("active");
            } else {
                navElement.classList.remove("active");
            }
        }
    });

    // Scroll back to top when switching pages
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================= REQUEST FILTERS ================= */

/**
 * Filters request cards by urgency category (All, Critical, Urgent, Moderate).
 * @param {string} category - Priority status filter
 * @param {HTMLElement} btnElement - Active button element
 */
function filterRequests(category, btnElement) {
    const tabs = document.querySelectorAll(".filter-tabs .tab-btn");
    tabs.forEach((tab) => tab.classList.remove("active"));
    if (btnElement) {
        btnElement.classList.add("active");
    }

    const cards = document.querySelectorAll("#page-requests .cards-grid .req-card");

    cards.forEach((card) => {
        const isCritical = card.classList.contains("critical");
        const cardCategory = card.getAttribute("data-category") || (isCritical ? "critical" : "moderate");

        if (category === "all" || cardCategory === category) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

/**
 * Filters request cards by blood group dropdown selection.
 * @param {string} selectedGroup - Selected blood type (e.g., 'A+', 'O-')
 */
function filterByBloodGroup(selectedGroup) {
    const cards = document.querySelectorAll("#page-requests .cards-grid .req-card");

    cards.forEach((card) => {
        const bloodBadge = card.querySelector(".blood-badge");
        const bloodGroup = bloodBadge ? bloodBadge.textContent.trim() : "";

        if (selectedGroup === "All Blood Groups" || bloodGroup === selectedGroup) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

/* ================= AUTH MODAL & TABS ================= */

function openModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "flex";
        switchAuthTab("signin");
    }
}

function openRegisterModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "flex";
        switchAuthTab("register");
    }
}

function closeModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "none";
    }
}

function switchAuthTab(tab) {
    const formSignin = document.getElementById("form-signin");
    const formRegister = document.getElementById("form-register");
    const tabSigninBtn = document.getElementById("tab-signin-btn");
    const tabRegisterBtn = document.getElementById("tab-register-btn");

    if (tab === "signin") {
        if (formSignin) formSignin.style.display = "block";
        if (formRegister) formRegister.style.display = "none";
        if (tabSigninBtn) tabSigninBtn.classList.add("active");
        if (tabRegisterBtn) tabRegisterBtn.classList.remove("active");
    } else if (tab === "register") {
        if (formSignin) formSignin.style.display = "none";
        if (formRegister) formRegister.style.display = "block";
        if (tabSigninBtn) tabSigninBtn.classList.remove("active");
        if (tabRegisterBtn) tabRegisterBtn.classList.add("active");
    }
}

/* ================= USER ACTIONS ================= */

function handleRespond(btn) {
    if (btn.textContent.trim() === "Responded") return;

    btn.textContent = "Responded";
    btn.style.backgroundColor = "#22c55e";
    btn.style.color = "#ffffff";
    btn.disabled = true;

    alert("Thank you for offering help! The requester has been notified, and coordinates will open shortly.");
}

// Donate Now Button
const donateBtn = document.querySelector('.btn-donate');
if (donateBtn) {
    donateBtn.addEventListener('click', () => {
        // সরাসরি পোস্ট রিকোয়েস্ট (রক্ত চাওয়ার) ফর্ম খুলবে
        if (typeof openRequestModal === 'function') {
            openRequestModal();
        } else if (typeof openModal === 'function') {
            openModal();
        }
    });
}

// Request Popup and Form Logic
document.addEventListener('DOMContentLoaded', () => {
    const requestModal = document.getElementById('request-modal');
    const closeRequestBtn = document.getElementById('close-request-modal');

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('open-request-btn') || e.target.id === 'post-request-nav-btn') {
            e.preventDefault();
            if (requestModal) {
                requestModal.classList.add('active');
            }
        }
    });

    if (closeRequestBtn) {
        closeRequestBtn.addEventListener('click', () => {
            requestModal.classList.remove('active');
        });
    }

    // Submit Request Form
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                patient_name: document.getElementById('req-patient-name') ? document.getElementById('req-patient-name').value : '',
                blood_group: document.getElementById('req-blood-group') ? document.getElementById('req-blood-group').value : '',
                hospital: document.getElementById('req-hospital') ? document.getElementById('req-hospital').value : '',
                contact_number: document.getElementById('req-contact') ? document.getElementById('req-contact').value : '',
                bags_needed: document.getElementById('req-bags') ? parseInt(document.getElementById('req-bags').value) : 1
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/requests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    alert('🎉 ' + (data.message || 'রিকোয়েস্ট সফলভাবে জমা হয়েছে!'));
                    requestForm.reset();
                    if (requestModal) requestModal.classList.remove('active');
                    location.reload();
                } else {
                    alert('❌ ' + (data.message || 'সমস্যা হয়েছে!'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে! নেটওয়ার্ক চেক করুন।');
            }
        });
    }
});

// Setup Signin & Register Handlers
function setupAuthFormListeners() {
    const signinForm = document.getElementById("form-signin");
    const registerForm = document.getElementById("form-register");

    if (signinForm) {
        signinForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = signinForm.querySelector('input[type="email"]')?.value || '';
            const password = signinForm.querySelector('input[type="password"]')?.value || '';

            try {
                const response = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (data.success) {
                    alert('🎉 সফলভাবে সাইন-ইন করেছেন!');
                    closeModal();
                    location.reload();
                } else {
                    alert('❌ ' + (data.message || 'সাইন-ইন ব্যর্থ হয়েছে!'));
                }
            } catch (err) {
                console.error(err);
                alert('সাইন-ইন করতে সমস্যা হয়েছে!');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputs = registerForm.querySelectorAll('input, select');
            const formData = {};
            inputs.forEach(input => {
                if (input.name || input.id) {
                    const key = input.name || input.id;
                    formData[key] = input.value;
                }
            });

            try {
                const response = await fetch(`${API_BASE_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (data.success) {
                    alert('🎉 অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');
                    closeModal();
                    location.reload();
                } else {
                    alert('❌ ' + (data.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে!'));
                }
            } catch (err) {
                console.error(err);
                alert('রেজিস্ট্রেশন করতে সমস্যা হয়েছে!');
            }
        });
    }
}

// Load Blood Requests From Database
async function loadBloodRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/requests`);
        const data = await response.json();

        if (data.success && data.requests && data.requests.length > 0) {
            const requestsContainer = document.getElementById('requests-container');

            if (requestsContainer) {
                requestsContainer.innerHTML = '';

                data.requests.forEach(req => {
                    const card = `
                        <div class="request-card">
                            <div class="card-header">
                                <span class="blood-badge">${req.blood_group}</span>
                                <h4>${req.patient_name}</h4>
                            </div>
                            <div class="card-body">
                                <p>🏥 <strong>হাসপাতাল:</strong> ${req.hospital}</p>
                                <p>🩸 <strong>প্রয়োজন:</strong> ${req.bags_needed} ব্যাগ</p>
                                <p>📞 <strong>যোগাযোগ:</strong> ${req.contact_number}</p>
                            </div>
                        </div>
                    `;
                    requestsContainer.innerHTML += card;
                });
            }
        }
    } catch (error) {
        console.error('Error Details:', error);
    }
}

// Load requests when page loads
loadBloodRequests();

// ১. লগইন চেক এবং ইউজারের নাম দেখানো
(function checkUserLogin() {
    var loggedUser = localStorage.getItem('user');

    if (!loggedUser) {
        window.location.href = '/login.html';
    } else {
        try {
            var user = JSON.parse(loggedUser);
            if (user && user.name) {
                var userInfoEl = document.getElementById('userInfo');
                if (userInfoEl) {
                    userInfoEl.innerText = 'Hello, ' + user.name;
                }
            }
        } catch (e) {
            console.error('User parse error:', e);
        }
    }
})();

// ২. লগআউট ফাংশন
function logoutUser() {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}