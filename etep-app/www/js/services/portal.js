/**
 * Serviço para gerenciar o Portal do Aluno
 */
class PortalService {
    static CONFIG = {
        URL: 'https://etepead.jacad.com.br/academico/aluno-v2/login',
        BROWSER_OPTIONS: [
            'location=yes',
            'zoom=no', 
            'hardwareback=yes',
            'toolbar=yes',
            'toolbarposition=top',
            'toolbarcolor=#ffffff',           // Barra branca
            'navigationbuttoncolor=#252e62',  // Botões azul (cor do CSS)
            'closebuttoncaption=Voltar',      // Texto do botão
            'closebuttoncolor=#252e62',       // Cor do botão voltar
            'footercolor=#ffffff'             // Footer branco
        ].join(',')
    };

    /**
     * Abre o portal do aluno no InAppBrowser
     * @param {Function} onError - Callback para fallback se InAppBrowser não estiver disponível
     */
    static open(onError) {
        if (window.cordova && cordova.InAppBrowser) {
            console.log('Abrindo InAppBrowser personalizado:', this.CONFIG.URL);
            const ref = cordova.InAppBrowser.open(this.CONFIG.URL, '_blank', this.CONFIG.BROWSER_OPTIONS);
            
            // Auto-preencher CPF quando a página carregar
            ref.addEventListener('loadstop', () => {
                this.autoFillCPF(ref);
            });

            return ref;
        } else {
            console.log('Cordova não disponível, usando fallback');
            if (onError) onError();
            return null;
        }
    }

    /**
     * Preenche automaticamente o CPF e senha no formulário de login e clica em acessar
     * @param {Object} ref - Referência do InAppBrowser
     */
    static autoFillCPF(ref) {
        const cleanCPF = StorageUtils.getCleanCPF();
        if (!cleanCPF) return;

        console.log('Auto-preenchendo CPF e senha:', cleanCPF);
        ref.executeScript({
            code: `
                // Aguardar um pouco para garantir que a página carregou
                setTimeout(function() {
                    try {
                        console.log('Iniciando auto-preenchimento...');
                        
                        // Tentar diferentes seletores comuns para CPF/usuário
                        var cpfField = document.querySelector('#cpf') || 
                                     document.querySelector('#usuario') || 
                                     document.querySelector('#login') ||
                                     document.querySelector('input[name="cpf"]') ||
                                     document.querySelector('input[name="usuario"]') ||
                                     document.querySelector('input[name="login"]') ||
                                     document.querySelector('input[type="text"]');
                        
                        // Tentar diferentes seletores comuns para senha
                        var passwordField = document.querySelector('#senha') || 
                                          document.querySelector('#password') || 
                                          document.querySelector('input[name="senha"]') ||
                                          document.querySelector('input[name="password"]') ||
                                          document.querySelector('input[type="password"]');
                        
                        // Tentar diferentes seletores para botão de login
                        var loginButton = document.querySelector('#btn-login') ||           // JACAD específico
                                        document.querySelector('#acessar') ||
                                        document.querySelector('#login') ||
                                        document.querySelector('#entrar') ||
                                        document.querySelector('button[type="submit"]') ||
                                        document.querySelector('input[type="submit"]') ||
                                        document.querySelector('button:contains("Acessar")') ||
                                        document.querySelector('button:contains("Entrar")') ||
                                        document.querySelector('button:contains("Login")');
                        
                        if (cpfField) {
                            cpfField.value = '${cleanCPF}';
                            console.log('CPF preenchido:', '${cleanCPF}');
                        } else {
                            console.log('Campo CPF não encontrado');
                        }
                        
                        if (passwordField) {
                            passwordField.value = '20031985';
                            console.log('Senha preenchida');
                        } else {
                            console.log('Campo senha não encontrado');
                        }
                        
                        // Aguardar mais um pouco e tentar clicar no botão
                        setTimeout(function() {
                            // DEBUG: Listar todos os botões disponíveis
                            var allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
                            console.log('=== BOTÕES ENCONTRADOS ===');
                            for(var i = 0; i < allButtons.length; i++) {
                                var btn = allButtons[i];
                                console.log('Botão ' + i + ':', {
                                    tag: btn.tagName,
                                    id: btn.id,
                                    class: btn.className,
                                    text: btn.textContent || btn.value,
                                    type: btn.type
                                });
                            }
                            console.log('========================');
                            
                            if (loginButton) {
                                loginButton.click();
                                console.log('Botão de login clicado automaticamente');
                            } else {
                                console.log('Botão de login não encontrado, tentando submit do formulário...');
                                // Tentar submit do primeiro formulário encontrado
                                var form = document.querySelector('form');
                                if (form) {
                                    form.submit();
                                    console.log('Formulário submetido automaticamente');
                                }
                            }
                        }, 200);  // Reduzido de 500ms para 200ms
                        
                    } catch(e) {
                        console.log('Erro ao preencher formulário:', e);
                    }
                }, 800);  // Reduzido de 1500ms para 800ms
            `
        }, (result) => {
            console.log('Script de auto-login executado');
        });
    }
}