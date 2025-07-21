class ETEPApp {
    constructor() {
        this.currentScreen = 'home';
        this.version = '1.0.0';
        this.build = 1;
    }

    init() {
        this.setupEventListeners();
        this.loadStoredCPF();
        this.loadVersionInfo();
    }

    setupEventListeners() {
        const cpfInput = document.getElementById('cpf-input');
        const confirmBtn = document.getElementById('confirm-btn');
        const portalBtn = document.getElementById('portal-btn');
        const backBtn = document.getElementById('back-btn');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.handleCPFSubmit());
        }

        if (cpfInput) {
            cpfInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCPFSubmit();
                }
            });

            cpfInput.addEventListener('input', (e) => {
                this.formatCPF(e.target);
            });
        }

        if (portalBtn) {
            portalBtn.addEventListener('click', () => this.navigateToPortal());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.navigateToMenu());
        }

        document.addEventListener('backbutton', () => this.handleBackButton(), false);
    }

    formatCPF(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        input.value = value;
    }

    handleCPFSubmit() {
        const cpfInput = document.getElementById('cpf-input');
        const cpf = cpfInput.value.trim();
        
        if (cpf.length > 0) {
            this.storeCPF(cpf);
            this.navigateToMenu();
        } else {
            this.showAlert('Por favor, digite um CPF válido.');
            cpfInput.focus();
        }
    }

    storeCPF(cpf) {
        localStorage.setItem('etep_cpf', cpf);
    }

    loadStoredCPF() {
        const storedCPF = localStorage.getItem('etep_cpf');
        const cpfInput = document.getElementById('cpf-input');
        if (storedCPF && cpfInput) {
            cpfInput.value = storedCPF;
        }
    }

    loadVersionInfo() {
        // Tentar carregar versão do arquivo JSON
        fetch('version.json')
            .then(response => response.json())
            .then(data => {
                this.version = data.version;
                this.build = data.build;
                this.updateVersionDisplay();
            })
            .catch(() => {
                // Se falhar, usar versão padrão
                this.updateVersionDisplay();
            });
    }
    
    updateVersionDisplay() {
        const versionEl = document.getElementById('version-display');
        if (versionEl) {
            versionEl.textContent = `v${this.version} (${this.build})`;
        }
    }

    navigateToScreen(screenId) {
        const currentScreenEl = document.querySelector('.screen.active');
        const targetScreenEl = document.getElementById(screenId + '-screen');
        
        if (currentScreenEl) {
            currentScreenEl.classList.remove('active');
        }
        
        if (targetScreenEl) {
            targetScreenEl.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    navigateToMenu() {
        this.navigateToScreen('menu');
    }

    navigateToPortal() {
        // InAppBrowser com barra personalizada
        const url = 'https://etepead.jacad.com.br/academico/aluno-v2/login';
        const target = '_blank';
        const options = 'location=no,zoom=no,hardwareback=yes,toolbar=yes,closebuttoncaption=Voltar';
        
        if (window.cordova && cordova.InAppBrowser) {
            console.log('Abrindo InAppBrowser:', url);
            cordova.InAppBrowser.open(url, target, options);
        } else {
            console.log('Cordova não disponível, usando fallback');
            this.navigateToScreen('portal');
        }
    }

    handleBackButton() {
        if (this.currentScreen === 'portal') {
            this.navigateToMenu();
        } else if (this.currentScreen === 'menu') {
            this.navigateToScreen('home');
        } else {
            if (navigator.app) {
                navigator.app.exitApp();
            }
        }
    }

    showAlert(message) {
        if (navigator.notification) {
            navigator.notification.alert(message, null, 'Portal ETEP', 'OK');
        } else {
            alert(message);
        }
    }
}

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    
    window.etepApp = new ETEPApp();
    window.etepApp.init();
    
    console.log('Portal ETEP App initialized');
}