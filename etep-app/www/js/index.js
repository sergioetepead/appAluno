/**
 * Aplicação principal - apenas lógica de UI e navegação
 */
class ETEPApp {
    constructor() {
        this.currentScreen = 'home';
        this.version = '1.0.0';  // Padrão, será sobrescrito pelo version.json
        this.build = 1;          // Padrão, será sobrescrito pelo version.json
    }

    init() {
        this.setupEventListeners();
        this.loadVersionInfo();
    }

    setupEventListeners() {
        const cpfInput = document.getElementById('cpf-input');
        const passwordInput = document.getElementById('password-input');
        const loginBtn = document.getElementById('login-btn');
        const portalBtn = document.getElementById('portal-btn');
        const backBtn = document.getElementById('back-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLoginSubmit());
        }

        if (cpfInput) {
            cpfInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    passwordInput?.focus();
                }
            });

            cpfInput.addEventListener('input', (e) => {
                CPFUtils.applyMask(e.target);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLoginSubmit();
                }
            });
        }

        if (portalBtn) {
            portalBtn.addEventListener('click', () => this.navigateToPortal());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.navigateToMenu());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        document.addEventListener('backbutton', () => this.handleBackButton(), false);
    }

    async handleLoginSubmit() {
        const cpfInput = document.getElementById('cpf-input');
        const passwordInput = document.getElementById('password-input');
        const cpf = cpfInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (cpf.length === 0) {
            this.showAlert('Por favor, digite seu CPF.');
            cpfInput.focus();
            return;
        }
        
        if (password.length === 0) {
            this.showAlert('Por favor, digite sua senha.');
            passwordInput.focus();
            return;
        }
        
        // Mostrar loading
        this.showLoading(true);
        
        try {
            console.log('Tentando validar credenciais...');
            const isValid = await AuthService.validateCredentials(cpf, password);
            
            if (isValid) {
                console.log('Credenciais válidas! Navegando para menu...');
                StorageUtils.saveCPF(cpf);
                this.showLoading(false);
                this.navigateToMenu();
            } else {
                console.log('Credenciais inválidas');
                this.showLoading(false);
                this.showAlert('CPF ou senha incorretos. Tente novamente.');
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Erro na validação:', error);
            this.showLoading(false);
            this.showAlert('Erro de conexão. Verifique sua internet e tente novamente.');
        }
    }

    showLoading(show) {
        const loadingContainer = document.getElementById('loading-container');
        const inputContainer = document.querySelector('.input-container');
        
        if (show) {
            loadingContainer?.classList.remove('hidden');
            if (inputContainer) inputContainer.style.opacity = '0.5';
        } else {
            loadingContainer?.classList.add('hidden');
            if (inputContainer) inputContainer.style.opacity = '1';
        }
    }

    loadVersionInfo() {
        fetch('version.json')
            .then(response => response.json())
            .then(data => {
                this.version = data.version;
                this.build = data.build;
                this.updateVersionDisplay();
            })
            .catch(() => {
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
        console.log('navigateToPortal chamado');
        console.log('AuthService.isLoggedIn():', AuthService.isLoggedIn());
        
        if (AuthService.isLoggedIn()) {
            console.log('Usuário autenticado, tentando mostrar portal...');
            const browserRef = AuthService.showAuthenticatedBrowser();
            
            if (browserRef) {
                console.log('Browser reference obtida, configurando listeners...');
                // Listener para quando fechar o browser
                browserRef.addEventListener('exit', () => {
                    console.log('Portal fechado pelo usuário');
                });
                
                browserRef.addEventListener('loadstop', () => {
                    console.log('Portal carregado com sucesso');
                });
                
                browserRef.addEventListener('loaderror', (event) => {
                    console.log('Erro ao carregar portal:', event);
                });
            } else {
                console.log('Falha ao obter browser reference');
                this.showAlert('Erro ao abrir portal. Tente fazer login novamente.');
            }
        } else {
            console.log('Não autenticado, redirecionando para home');
            this.showAlert('Sessão expirada. Faça login novamente.');
            this.handleLogout();
        }
    }

    handleLogout() {
        // Limpar sessão de autenticação
        AuthService.cleanup();
        
        // Limpar CPF salvo e voltar para home
        StorageUtils.clearCPF();
        
        // Limpar campos na home
        const cpfInput = document.getElementById('cpf-input');
        const passwordInput = document.getElementById('password-input');
        if (cpfInput) cpfInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        // Navegar para home
        this.navigateToScreen('home');
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