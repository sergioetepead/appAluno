/**
 * Utilitários para localStorage
 */
class StorageUtils {
    static KEYS = {
        CPF: 'etep_cpf'
    };

    /**
     * Salva CPF no localStorage
     * @param {string} cpf - CPF para salvar
     */
    static saveCPF(cpf) {
        if (cpf) {
            localStorage.setItem(this.KEYS.CPF, cpf);
        }
    }

    /**
     * Recupera CPF do localStorage
     * @returns {string} CPF salvo ou string vazia
     */
    static getCPF() {
        return localStorage.getItem(this.KEYS.CPF) || '';
    }

    /**
     * Recupera CPF limpo (sem formatação)
     * @returns {string} CPF limpo
     */
    static getCleanCPF() {
        const cpf = this.getCPF();
        return CPFUtils.clean(cpf);
    }

    /**
     * Remove CPF do localStorage
     */
    static clearCPF() {
        localStorage.removeItem(this.KEYS.CPF);
    }

    /**
     * Limpa todos os dados do app
     */
    static clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}