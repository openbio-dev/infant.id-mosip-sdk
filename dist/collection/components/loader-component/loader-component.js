import { TranslationUtils } from '../../locales/translation';
export class LoaderComponent {
    constructor() {
        this.enabled = false;
        this.locale = 'pt';
    }
    async listenLocale(newValue) {
        this.setI18nParameters(newValue);
    }
    ;
    listenEnable(newValue) {
        const interval = 2000;
        let timeCount = 0;
        let checkStatusInterval;
        if (newValue) {
            checkStatusInterval = setInterval(() => {
                timeCount = timeCount + interval;
                if (timeCount >= 60000) {
                    this.enabled = false;
                    clearInterval(checkStatusInterval);
                }
            }, interval);
        }
        else {
            timeCount = 0;
            checkStatusInterval = undefined;
        }
    }
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    async componentWillLoad() {
        this.setI18nParameters(this.locale);
    }
    render() {
        return (h("div", { class: 'loader-container', style: { display: this.enabled ? 'flex' : 'none' } },
            h("div", { class: "centered-dialog" },
                h("div", { class: "center-content" },
                    h("div", { class: "progress-circle" }),
                    h("h5", { class: "mt-2" }, this.text || this.translations.LOADING)))));
    }
    static get is() { return "loader-component"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "componentContainer": {
            "elementRef": true
        },
        "enabled": {
            "type": Boolean,
            "attr": "enabled",
            "mutable": true,
            "watchCallbacks": ["listenEnable"]
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "text": {
            "type": String,
            "attr": "text",
            "mutable": true
        },
        "translations": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:loader-component:**/"; }
}
