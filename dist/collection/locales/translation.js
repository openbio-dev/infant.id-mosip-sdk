import ptBR from './pt';
import enUS from './en';
export var TranslationUtils;
(function (TranslationUtils) {
    let locale = 'pt';
    let currentTranlation = ptBR;
    async function setLocale(value) {
        locale = value;
    }
    TranslationUtils.setLocale = setLocale;
    async function fetchTranslations() {
        let translation = null;
        switch (locale) {
            case 'pt':
                translation = ptBR;
                currentTranlation = ptBR;
                break;
            case 'en':
                translation = enUS;
                currentTranlation = enUS;
                break;
            default:
                translation = ptBR;
                currentTranlation = ptBR;
                break;
        }
        return translation;
    }
    TranslationUtils.fetchTranslations = fetchTranslations;
    function concatTranslate(key, params) {
        let t = currentTranlation[key];
        const count = (t.match(/{*}/g) || []).length;
        for (let i = 0; i < count; i++) {
            t = t.replaceAll(`{${i + 1}}`, params[i] || '');
        }
        return t;
    }
    TranslationUtils.concatTranslate = concatTranslate;
})(TranslationUtils || (TranslationUtils = {}));
