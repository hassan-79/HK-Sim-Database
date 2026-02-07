document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phoneInput');
    const searchBtn = document.getElementById('searchBtn');
    const requestOtpBtn = document.getElementById('requestOtpBtn');
    const pinInput = document.getElementById('pinInput');
    const unlockBtn = document.getElementById('unlockBtn');
    const popupOverlay = document.getElementById('popupOverlay');

    // Generate OTP Function (Fixed Path)
    if (requestOtpBtn) {
        requestOtpBtn.addEventListener('click', async () => {
            requestOtpBtn.disabled = true;
            requestOtpBtn.innerText = "Generating...";
            try {
                const response = await fetch('/api/generate-otp', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    alert("Code Created! Admin se raabta karein.");
                    requestOtpBtn.innerText = "Code Sent!";
                }
            } catch (err) {
                alert("Server error!");
                requestOtpBtn.disabled = false;
                requestOtpBtn.innerText = "Request Access Code";
            }
        });
    }

    // Verify OTP Function
    if (unlockBtn) {
        unlockBtn.addEventListener('click', async () => {
            const code = pinInput.value;
            try {
                const response = await fetch('/api/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('hk_sim_unlocked', 'true');
                    popupOverlay.classList.add('hidden');
                    phoneInput.disabled = false;
                    searchBtn.disabled = false;
                } else {
                    alert("Ghalat Code!");
                }
            } catch (err) {
                alert("Verification failed!");
            }
        });
    }

    // Search Function logic yahan aayegi...
});