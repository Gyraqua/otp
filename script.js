document.addEventListener('DOMContentLoaded', () => {
    // --- COMBINED SPLASH & BACKGROUND LOGIC ---
    const canvas = document.getElementById('matrix-canvas');
    const appContainer = document.getElementById('app-container');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const rainDrops = [];

    for (let x = 0; x < columns; x++) {
        rainDrops[x] = 1;
    }

    let matrixInterval;

    // Function to draw the matrix effect
    // We pass in the fade factor to control the density
    const drawMatrix = (fadeFactor) => {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeFactor})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < rainDrops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

            if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                rainDrops[i] = 0;
            }
            rainDrops[i]++;
        }
    };

    // --- PHASE 1: SPLASH SCREEN ---
    // Fast and dense effect
    matrixInterval = setInterval(() => drawMatrix(0.05), 30);

    // --- PHASE 2: TRANSITION TO AMBIENT ---
    setTimeout(() => {
        // Fade in the main app
        appContainer.classList.add('visible');

        // Stop the old interval
        clearInterval(matrixInterval);
        
        // Start the new, permanent, slower, and sparser background effect
        matrixInterval = setInterval(() => drawMatrix(0.1), 70);
    }, 4000); // 4 second splash screen


    // --- MAIN APP LOGIC ---
    const initialAccounts = [
        { name: 'GitHub_ROOT', secret: 'MBHAQHVJWBDIDHOF' },
        { name: 'Discord_ADMIN', secret: 'JBSWY3DPEHPK3PXP' },
        { name: 'Google_SYS', secret: 'GEZDGNBVGY3TQOJQ' },
        { name: 'Amazon_AWS', secret: 'MFZWIZLBNRXXE43F' },
        { name: 'Microsoft_AZURE', secret: 'NRSW45DFOJZG63JA' },
        { name: 'Facebook_META', secret: 'ONSWG4TFORZGS4ZA' }
    ];

    const tableBody = document.getElementById('otp-table-body');
    const timerEl = document.getElementById('timer');
    const addAccountBtn = document.getElementById('add-account-btn');
    const accountNameInput = document.getElementById('account-name-input');
    const secretKeyInput = document.getElementById('secret-key-input');
    const errorMsg = document.getElementById('error-msg');

    let allAccounts = [];

    function getUserAccounts() {
        const savedAccounts = localStorage.getItem('userOtpAccounts');
        return savedAccounts ? JSON.parse(savedAccounts) : [];
    }

    function saveUserAccounts(accounts) {
        localStorage.setItem('userOtpAccounts', JSON.stringify(accounts));
    }

    function renderTable() {
        tableBody.innerHTML = '';
        allAccounts.forEach((account, index) => {
            const row = document.createElement('tr');
            const isUserAccount = index >= initialAccounts.length;
            const userAccountIndex = index - initialAccounts.length;
            row.innerHTML = `
                <td>${account.name}</td>
                <td class="secret-key-cell">${account.secret}</td>
                <td class="otp-code" data-secret="${account.secret}">------</td>
                <td>
                    ${isUserAccount ? `<button class="delete-btn" data-index="${userAccountIndex}">DELETE_NODE</button>` : 'CORE'}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function updateAllOtps() {
        const epoch = Math.floor(Date.now() / 1000);
        const timeRemaining = 30 - (epoch % 30);
        timerEl.textContent = `${timeRemaining}s`;

        const otpCells = document.querySelectorAll('.otp-code');
        
        if (timeRemaining === 30) {
            otpCells.forEach(cell => {
                cell.classList.add('flash');
                setTimeout(() => cell.classList.remove('flash'), 500);
            });
        }

        otpCells.forEach(cell => {
            const secret = cell.getAttribute('data-secret');
            try {
                const totp = new OTPAuth.TOTP({
                    secret: OTPAuth.Secret.fromBase32(secret),
                    algorithm: 'SHA1',
                    digits: 6,
                    period: 30
                });
                const token = totp.generate();
                cell.textContent = token;
            } catch (e) {
                cell.textContent = "ERROR";
                cell.style.color = "#cf6679";
            }
        });
    }

    function loadAndRender() {
        const userAccounts = getUserAccounts();
        allAccounts = [...initialAccounts, ...userAccounts];
        renderTable();
        updateAllOtps();
    }

    addAccountBtn.addEventListener('click', () => {
        const name = accountNameInput.value.trim();
        const secret = secretKeyInput.value.trim().toUpperCase().replace(/\s/g, '');
        if (!name || !secret) {
            errorMsg.textContent = ">> ERROR: ALIAS AND PAYLOAD REQUIRED";
            return;
        }
        try {
            new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) });
        } catch (e) {
            errorMsg.textContent = ">> ERROR: PAYLOAD CORRUPTED. CHECK BASE32 FORMAT.";
            return;
        }
        const userAccounts = getUserAccounts();
        userAccounts.push({ name, secret });
        saveUserAccounts(userAccounts);
        accountNameInput.value = '';
        secretKeyInput.value = '';
        errorMsg.textContent = '';
        loadAndRender();
    });

    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const indexToDelete = parseInt(event.target.getAttribute('data-index'), 10);
            const userAccounts = getUserAccounts();
            userAccounts.splice(indexToDelete, 1);
            saveUserAccounts(userAccounts);
            loadAndRender();
        }
    });

    loadAndRender();
    setInterval(updateAllOtps, 1000);
});