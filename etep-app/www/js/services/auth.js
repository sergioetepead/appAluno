/**
 * Serviço de Autenticação com sessão persistente
 */
class AuthService {
    static CONFIG = {
        URL: 'https://etepead.jacad.com.br/academico/aluno-v2/login',
        HIDDEN_OPTIONS: 'hidden=yes,location=no,toolbar=no,zoom=no,hardwareback=no',
        VISIBLE_OPTIONS: [
            'location=yes',
            'zoom=no', 
            'hardwareback=yes',
            'toolbar=yes',
            'toolbarposition=top',
            'toolbarcolor=#ffffff',           
            'navigationbuttoncolor=#252e62',  
            'closebuttoncaption=Voltar',      
            'closebuttoncolor=#252e62',       
            'footercolor=#ffffff'             
        ].join(',')
    };

    static hiddenBrowser = null;
    static isAuthenticated = false;
    static savedCredentials = null;

    /**
     * Tenta fazer login oculto no Jacad
     * @param {string} cpf - CPF do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise<boolean>} true se login bem sucedido
     */
    static async validateCredentials(cpf, password) {
        return new Promise((resolve, reject) => {
            if (!window.cordova || !cordova.InAppBrowser) {
                reject(new Error('InAppBrowser não disponível'));
                return;
            }

            console.log('Iniciando validação oculta de credenciais...');

            // SEMPRE limpar sessão anterior
            if (this.hiddenBrowser) {
                this.hiddenBrowser.close();
                this.hiddenBrowser = null;
            }

            // Abrir InAppBrowser oculto para teste
            let testBrowser = cordova.InAppBrowser.open(
                this.CONFIG.URL, 
                '_blank', 
                this.CONFIG.HIDDEN_OPTIONS
            );

            let loginAttempted = false;
            let timeoutId = null;

            // Listener para quando a página carregar
            testBrowser.addEventListener('loadstop', () => {
                if (loginAttempted) return;
                loginAttempted = true;

                console.log('Página carregada, tentando login...');

                // Tentar fazer login
                testBrowser.executeScript({
                    code: `
                        setTimeout(function() {
                            try {
                                // Limpar CPF e preencher
                                var cpfField = document.querySelector('#cpf') || 
                                             document.querySelector('#usuario') || 
                                             document.querySelector('#login') ||
                                             document.querySelector('input[name="cpf"]') ||
                                             document.querySelector('input[name="usuario"]') ||
                                             document.querySelector('input[type="text"]');
                                
                                var passwordField = document.querySelector('#senha') || 
                                                  document.querySelector('#password') || 
                                                  document.querySelector('input[name="senha"]') ||
                                                  document.querySelector('input[name="password"]') ||
                                                  document.querySelector('input[type="password"]');
                                
                                if (cpfField && passwordField) {
                                    cpfField.value = '${CPFUtils.clean(cpf)}';
                                    passwordField.value = '${password}';
                                    
                                    // Tentar clicar no botão
                                    var loginButton = document.querySelector('#btn-login') ||
                                                    document.querySelector('button[type="submit"]') ||
                                                    document.querySelector('input[type="submit"]');
                                    
                                    if (loginButton) {
                                        loginButton.click();
                                        console.log('Formulário submetido');
                                    } else {
                                        var form = document.querySelector('form');
                                        if (form) {
                                            form.submit();
                                        }
                                    }
                                } else {
                                    console.log('Campos de login não encontrados');
                                }
                            } catch(e) {
                                console.log('Erro ao tentar login:', e);
                            }
                        }, 1000);
                    `
                });
            });

            // Listener para mudanças de URL (detectar sucesso/erro)
            testBrowser.addEventListener('loadstart', (event) => {
                const url = event.url;
                console.log('Navegando para:', url);

                // Aguardar carregar e verificar conteúdo da página
                setTimeout(() => {
                    testBrowser.executeScript({
                        code: `
                            // Verificar se ainda está na página de login
                            var isLoginPage = document.querySelector('#cpf') || 
                                            document.querySelector('#usuario') || 
                                            document.querySelector('#login') ||
                                            document.querySelector('input[name="cpf"]') ||
                                            document.querySelector('input[name="usuario"]');
                            
                            // Verificar se há mensagem de erro
                            var errorMessage = document.querySelector('.alert-danger') ||
                                             document.querySelector('.error') ||
                                             document.querySelector('.alert') ||
                                             document.querySelector('[class*="erro"]') ||
                                             document.querySelector('[class*="invalid"]') ||
                                             document.querySelector('[class*="danger"]');
                            
                            // Verificar se há elementos que indicam sucesso de login
                            var hasUserMenu = document.querySelector('.user-menu') ||
                                            document.querySelector('.dropdown-user') ||
                                            document.querySelector('.navbar-user') ||
                                            document.querySelector('[class*="user"]') ||
                                            document.querySelector('.logout') ||
                                            document.querySelector('a[href*="logout"]');
                            
                            var hasPortalContent = document.querySelector('.portal-content') ||
                                                 document.querySelector('.dashboard') ||
                                                 document.querySelector('.main-content') ||
                                                 document.querySelector('#main') ||
                                                 document.querySelector('.content');
                            
                            var result = {
                                url: window.location.href,
                                isLoginPage: !!isLoginPage,
                                hasError: errorMessage ? errorMessage.textContent.trim() : null,
                                hasUserMenu: !!hasUserMenu,
                                hasPortalContent: !!hasPortalContent,
                                title: document.title
                            };
                            
                            JSON.stringify(result);
                        `
                    }, (scriptResult) => {
                        if (scriptResult && scriptResult[0]) {
                            try {
                                const pageInfo = JSON.parse(scriptResult[0]);
                                console.log('Info da página:', pageInfo);
                                
                                // Login bem sucedido: não está mais na página de login E tem elementos do portal
                                if (!pageInfo.isLoginPage && (pageInfo.hasUserMenu || pageInfo.hasPortalContent)) {
                                    console.log('Login bem sucedido!');
                                    AuthService.saveCredentials(cpf, password);
                                    AuthService.isAuthenticated = true;
                                    testBrowser.close();
                                    clearTimeout(timeoutId);
                                    resolve(true);
                                    return;
                                }
                                
                                // Login falhou: ainda na página de login OU há mensagem de erro
                                if (pageInfo.isLoginPage && pageInfo.hasError && loginAttempted) {
                                    console.log('Login falhou:', pageInfo.hasError);
                                    testBrowser.close();
                                    clearTimeout(timeoutId);
                                    resolve(false);
                                    return;
                                }
                                
                                // Se ainda na página de login após 5 segundos do login, considerar falha
                                if (pageInfo.isLoginPage && loginAttempted) {
                                    setTimeout(() => {
                                        console.log('Login falhou: ainda na página de login após 5s');
                                        testBrowser.close();
                                        clearTimeout(timeoutId);
                                        resolve(false);
                                    }, 5000);
                                }
                                
                            } catch (e) {
                                console.log('Erro ao processar info da página:', e);
                            }
                        }
                    });
                }, 2000);
            });

            // Timeout de segurança (30 segundos)
            timeoutId = setTimeout(() => {
                console.log('Timeout na validação de credenciais');
                testBrowser.close();
                reject(new Error('Timeout na validação'));
            }, 30000);

            // Listener para erro
            testBrowser.addEventListener('loaderror', (event) => {
                console.log('Erro ao carregar:', event.message);
                testBrowser.close();
                clearTimeout(timeoutId);
                reject(new Error('Erro de conexão'));
            });
        });
    }

    /**
     * Salva credenciais temporariamente (apenas em memória)
     */
    static saveCredentials(cpf, password) {
        this.savedCredentials = {
            cpf: CPFUtils.clean(cpf),
            password: password
        };
        console.log('Credenciais salvas em memória');
    }

    /**
     * Cria novo browser com auto-login das credenciais salvas
     */
    static showAuthenticatedBrowser() {
        if (this.isAuthenticated && this.savedCredentials) {
            console.log('Criando novo browser com auto-login...');
            
            // SEMPRE criar novo browser para evitar problemas de referência
            const newBrowser = cordova.InAppBrowser.open(
                this.CONFIG.URL,
                '_blank',
                this.CONFIG.VISIBLE_OPTIONS
            );

            // Auto-login quando carregar
            newBrowser.addEventListener('loadstop', () => {
                console.log('Fazendo auto-login no novo browser...');
                newBrowser.executeScript({
                    code: `
                        setTimeout(function() {
                            try {
                                var cpfField = document.querySelector('#cpf') || 
                                             document.querySelector('#usuario') || 
                                             document.querySelector('#login') ||
                                             document.querySelector('input[name="cpf"]') ||
                                             document.querySelector('input[name="usuario"]') ||
                                             document.querySelector('input[type="text"]');
                                
                                var passwordField = document.querySelector('#senha') || 
                                                  document.querySelector('#password') || 
                                                  document.querySelector('input[name="senha"]') ||
                                                  document.querySelector('input[name="password"]') ||
                                                  document.querySelector('input[type="password"]');
                                
                                if (cpfField && passwordField) {
                                    cpfField.value = '${this.savedCredentials.cpf}';
                                    passwordField.value = '${this.savedCredentials.password}';
                                    
                                    var loginButton = document.querySelector('#btn-login') ||
                                                    document.querySelector('button[type="submit"]') ||
                                                    document.querySelector('input[type="submit"]');
                                    
                                    if (loginButton) {
                                        loginButton.click();
                                        console.log('Auto-login executado');
                                    }
                                }
                            } catch(e) {
                                console.log('Erro no auto-login:', e);
                            }
                        }, 800);
                    `
                });
            });

            return newBrowser;
        }
        
        console.log('Não foi possível criar browser: authenticated=', this.isAuthenticated, 'credentials=', !!this.savedCredentials);
        return null;
    }

    /**
     * Esconde o browser (mantém sessão ativa)
     */
    static hideBrowser() {
        if (this.hiddenBrowser) {
            this.hiddenBrowser.hide();
        }
    }

    /**
     * Limpa sessão e credenciais
     */
    static cleanup() {
        if (this.hiddenBrowser) {
            this.hiddenBrowser.close();
            this.hiddenBrowser = null;
        }
        this.isAuthenticated = false;
        this.savedCredentials = null;
        console.log('Sessão e credenciais limpas');
    }

    /**
     * Verifica se está autenticado
     */
    static isLoggedIn() {
        return this.isAuthenticated && this.savedCredentials !== null;
    }
}