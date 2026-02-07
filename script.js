document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phoneInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    // Popup Elements
    const popupOverlay = document.getElementById('popupOverlay');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const telegramBtn = document.getElementById('telegramBtn');
    const unlockBtn = document.getElementById('unlockBtn');
    const pinInput = document.getElementById('pinInput');
    const requestOtpBtn = document.getElementById('requestOtpBtn');
    const otpMsg = document.getElementById('otpMsg');

    // Check for Persistent Login
    if (localStorage.getItem('hk_sim_unlocked') === 'true') {
        if (popupOverlay) popupOverlay.classList.add('hidden');
        phoneInput.disabled = false;
        searchBtn.disabled = false;
        return; // Exit initialization if already unlocked
    }

    // Show popup on load
    if (popupOverlay) {
        popupOverlay.classList.remove('hidden');
    }

    // Disable search initially
    phoneInput.disabled = true;
    searchBtn.disabled = true;

    let waClicked = false;
    let tgClicked = false;
    let pinValid = false;

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            waClicked = true;
            checkUnlock();
        });
    }

    if (telegramBtn) {
        telegramBtn.addEventListener('click', () => {
            tgClicked = true;
            checkUnlock();
        });
    }

    // Request OTP Button Logic
    if (requestOtpBtn) {
        requestOtpBtn.addEventListener('click', async () => {
            requestOtpBtn.disabled = true;
            requestOtpBtn.textContent = "Requesting...";
            
            try {
                const res = await fetch('/api/generate-otp', { method: 'POST' });
                const data = await res.json();
                
                if (data.success) {
                    otpMsg.textContent = "Code Sent to Admin DB! Contact Admin.";
                    otpMsg.classList.remove('hidden');
                    otpMsg.style.color = "var(--primary-color)";
                } else {
                    otpMsg.textContent = "Failed to generate code.";
                    otpMsg.classList.remove('hidden');
                    otpMsg.style.color = "red";
                }
            } catch (err) {
                console.error(err);
                otpMsg.textContent = "Error requesting code.";
                otpMsg.classList.remove('hidden');
            } finally {
                requestOtpBtn.disabled = false;
                requestOtpBtn.textContent = "Request Access Code";
            }
        });
    }

    // Pin Verification Logic
    if (pinInput) {
        pinInput.addEventListener('input', async () => {
            const code = pinInput.value.trim();
            if (code.length === 6) {
                // Verify with backend
                try {
                    const res = await fetch('/api/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code })
                    });
                    const data = await res.json();

                    if (data.success) {
                        pinValid = true;
                        pinInput.style.borderColor = "var(--primary-color)";
                        pinInput.style.color = "var(--primary-color)";
                        
                        // Persistent Login
                        localStorage.setItem('hk_sim_unlocked', 'true');
                        
                        checkUnlock();
                    } else {
                        pinValid = false;
                        pinInput.style.borderColor = "#ff003c";
                        pinInput.style.color = "#ff003c";
                        checkUnlock();
                    }
                } catch (err) {
                    console.error("Verification error", err);
                }
            } else {
                pinValid = false;
                pinInput.style.borderColor = "#444";
                pinInput.style.color = "var(--text-color)";
                checkUnlock();
            }
        });
    }

    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
            popupOverlay.classList.add('hidden');
            // Enable search
            phoneInput.disabled = false;
            searchBtn.disabled = false;
            phoneInput.focus();
        });
    }

    function checkUnlock() {
        // Require at least one channel to be clicked OR correct pin
        if (waClicked || tgClicked || pinValid) {
            unlockBtn.disabled = false;
            unlockBtn.classList.add('active');
            unlockBtn.textContent = "Unlock Database";
        } else {
            // Re-lock if criteria not met (though logic mostly adds up)
            unlockBtn.disabled = true;
            unlockBtn.classList.remove('active');
            unlockBtn.textContent = "Continue to Database";
        }
    }

    searchBtn.addEventListener('click', searchNumber);
    phoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchNumber();
    });

    async function searchNumber() {
        const number = phoneInput.value.trim();
        
        if (!number) {
            showError('Please enter a mobile number');
            return;
        }

        // Basic validation (optional, can be adjusted based on requirements)
        // Allowing basic formats for now
        
        showLoading(true);
        hideError();
        resultContainer.innerHTML = '';
        resultContainer.classList.add('hidden');

        try {
            // Local Backend API
            const apiUrl = `/api/search?number=${encodeURIComponent(number)}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                displayResults(data.data);
            } else {
                showError('No record found for this number.');
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to fetch data. Please try again later or check your internet connection.');
        } finally {
            showLoading(false);
        }
    }

    function displayResults(data) {
        resultContainer.innerHTML = '';
        
        // Normalize data to an array if it's a single object
        const items = Array.isArray(data) ? data : [data];

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            
            // Create a header for the card if there are multiple results
            if (items.length > 1) {
                const header = document.createElement('h3');
                header.textContent = `Record #${index + 1}`;
                header.style.marginBottom = '15px';
                header.style.color = 'var(--secondary-color)';
                card.appendChild(header);
            }

            // Iterate through keys and display them
            for (const [key, value] of Object.entries(item)) {
                // Skip empty values or technical keys if necessary
                if (value === null || value === '') continue;

                const row = document.createElement('div');
                row.className = 'result-row';

                const label = document.createElement('div');
                label.className = 'label';
                // Format key: replace underscores with spaces and capitalize
                label.textContent = key.replace(/_/g, ' ').toUpperCase();

                const valDiv = document.createElement('div');
                valDiv.className = 'value';
                valDiv.textContent = value;

                row.appendChild(label);
                row.appendChild(valDiv);
                card.appendChild(row);
            }

            resultContainer.appendChild(card);
        });

        resultContainer.classList.remove('hidden');
    }

    function showLoading(show) {
        if (show) {
            loadingDiv.classList.remove('hidden');
            searchBtn.disabled = true;
        } else {
            loadingDiv.classList.add('hidden');
            searchBtn.disabled = false;
        }
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    function hideError() {
        errorDiv.classList.add('hidden');
    }
});
