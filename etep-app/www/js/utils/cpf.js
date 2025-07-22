/**
 * Utilitários para manipulação de CPF
 */
class CPFUtils {
    /**
     * Remove formatação do CPF (pontos, traços, espaços)
     * @param {string} cpf - CPF formatado
     * @returns {string} CPF limpo só com números
     */
    static clean(cpf) {
        if (!cpf) return '';
        return cpf.replace(/[.\-\s]/g, '');
    }

    /**
     * Formata CPF com pontos e traço
     * @param {string} cpf - CPF sem formatação
     * @returns {string} CPF formatado (xxx.xxx.xxx-xx)
     */
    static format(cpf) {
        if (!cpf) return '';
        const clean = this.clean(cpf);
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Aplica formatação em tempo real em um input
     * @param {HTMLInputElement} input - Campo de input
     */
    static applyMask(input) {
        if (!input) return;
        
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        input.value = value;
    }

    /**
     * Valida se CPF tem formato básico correto (11 dígitos)
     * @param {string} cpf - CPF para validar
     * @returns {boolean} true se tem 11 dígitos
     */
    static isValidLength(cpf) {
        const clean = this.clean(cpf);
        return clean.length === 11;
    }
}