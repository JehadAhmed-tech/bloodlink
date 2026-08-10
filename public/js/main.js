/**
 * BloodLink - Core Application Logic
 */

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
    // Update active state on tab buttons
    const tabs = document.querySelectorAll(".filter-tabs .tab-btn");
    tabs.forEach((tab) => tab.classList.remove("active"));
    if (btnElement) {
        btnElement.classList.add("active");
    }

    // Filter card visibility based on data-category attribute or critical class
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

/**
 * Displays the Authentication Modal defaults to Sign In view.
 */
function openModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "flex";
        switchAuthTab("signin");
    }
}

/**
 * Displays the Authentication Modal pre-selected to Register view.
 */
function openRegisterModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "flex";
        switchAuthTab("register");
    }
}

/**
 * Hides the Authentication Modal.
 */
function closeModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.style.display = "none";
    }
}

/**
 * Switches between Sign In and Register forms inside the modal.
 * @param {string} tab - Selected auth tab ('signin' or 'register')
 */
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

/**
 * Handles the click response action on emergency request cards.
 * @param {HTMLElement} btn - Clicked button element
 */
function handleRespond(btn) {
    if (btn.textContent.trim() === "Responded") return;

    btn.textContent = "Responded";
    btn.style.backgroundColor = "#22c55e";
    btn.style.color = "#ffffff";
    btn.disabled = true;

    alert("Thank you for offering help! The requester has been notified, and coordinates will open shortly.");
}

// Donate Now বাটনে ক্লিক করলে রেজিস্ট্রেশন/সাইন-ইন পপআপ ওপেন হবে
const donateBtn = document.querySelector('.btn-donate');

if (donateBtn) {
    donateBtn.addEventListener('click', () => {
        // যদি সাইন-ইন বাটন থাকে, তবে তার ক্লিকে যা ঘটে তা ট্রিগার করবে
        const signInBtn = document.querySelector('.btn-signin'); // বা তোমার সাইন-ইন বাটনের ক্লাস
        if (signInBtn) {
            signInBtn.click();
        }
    });
}

// Requests Popup Open & Close
const requestModal = document.getElementById('request-modal');
const closeRequestBtn = document.getElementById('close-request-modal');

// তোমার রক্তের রিকোয়েস্ট বাটনে এই ক্লাস বা আইডি দিয়ে ক্লিক ইভেন্ট দাও
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('open-request-btn')) {
        requestModal.classList.add('active');
    }
});

if (closeRequestBtn) {
    closeRequestBtn.addEventListener('click', () => {
        requestModal.classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    
    // ১. পপআপ খোলা ও বন্ধের কাজ
    const requestModal = document.getElementById('request-modal');
    const closeRequestBtn = document.getElementById('close-request-modal');

    document.addEventListener('click', (e) => {
        // Post Request বাটনে ক্লিক করলে
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

    // ২. ফর্মে তথ্য দিয়ে Submit দিলে ডাটাবেজে ডাটা পাঠানোর কাজ
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                patient_name: document.getElementById('req-patient-name').value,
                blood_group: document.getElementById('req-blood-group').value,
                hospital: document.getElementById('req-hospital').value,
                contact_number: document.getElementById('req-contact').value,
                bags_needed: parseInt(document.getElementById('req-bags').value)
            };

            try {
                const response = await fetch('/api/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('🎉 ' + data.message); // সফল মেসেজ দেখাবে
                    requestForm.reset(); // ফর্ম ফাঁকা করবে
                    requestModal.classList.remove('active'); // পপআপ বন্ধ করবে
                    
                    // পেজ রিলোড দিলে লাইভ ডাটা দেখাবে
                    location.reload(); 
                } else {
                    alert('❌ ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে!');
            }
        });
    }
});

// ডাটাবেজ থেকে রক্তের রিকোয়েস্টগুলো এনে পেজে দেখানোর ফাংশন
async function loadBloodRequests() {
    try {
        const response = await fetch('/api/requests');
        const data = await response.json();

        if (data.success && data.requests.length > 0) {
            const requestsContainer = document.getElementById('requests-container'); // তোমার HTML-এর রিকোয়েস্ট কার্ডের কন্টেইনার ID
            
            if (requestsContainer) {
                requestsContainer.innerHTML = ''; // আগের ডামি/ফেক ডাটা মুছে ফেলবে

                data.requests.forEach(req => {
                    const card = `
                        <div class="request-card">
                            <div class="card-header">
                                <span class="blood-badge">${req.blood_group}</span>
                                <h4>${req.patient_name}</h4>
                            </div>
                            <div class="card-body">
                                <p>🏥 <strong>হাসপাতাল:</strong> ${req.hospital}</p>
                                <p>🩸 <strong>প্রয়োজন:</strong> ${req.bags_needed} ব্যাগ</p>
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
    alert('সমস্যা: ' + error.message);

    }
}

// পেজ লোড হলেই ফাংশনটি কল হবে
loadBloodRequests();