import WS from '../../utils/websocket';
import { TranslationUtils } from '../../locales/translation';
import { getAppConfig } from '../../utils/api';
import constants from '../../utils/constants';
import { addCustomLink, getThemeByApplicationType } from '../../utils/utils';
export class OpenbioPalmComponent {
    constructor() {
        this.ws = new WS();
        this.payload = {
            deviceName: constants.device.IB,
            deviceType: "modal",
            processorName: constants.processor.AK_MATCHER,
            devicePosition: 0,
            captureType: 0,
            fingerIndex: undefined,
            action: undefined,
            data: undefined,
            module: "finger"
        };
        this.deviceReady = false;
        this.forceLoadComponent = false;
        this.theme = "default";
        this.locale = 'pt';
    }
    async listenLocale(newValue) {
        this.setI18nParameters(newValue);
    }
    ;
    async componentWillLoad() {
        this.setI18nParameters(this.locale);
        this.translations = await TranslationUtils.fetchTranslations();
        addCustomLink("https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css");
        addCustomLink("https://cdn.jsdelivr.net/npm/@mdi/font@6.6.96/css/materialdesignicons.min.css");
        addCustomLink("https://db.onlinewebfonts.com/c/7200c6dd8ac604abe09f5159e53a40c0?family=Mark+Pro");
    }
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    componentDidUnload() {
        if (!this.config.startDevicesOnRun) {
            this.ws.respondToDeviceWS(Object.assign({}, this.payload, { action: 'close' }));
        }
    }
    async componentDidLoad() {
        this.config = await getAppConfig();
        this.theme = getThemeByApplicationType(this.config.applicationType);
        if (!this.config.startDevicesOnRun) {
            await this.ws.startDevice(this.ws, Object.assign({}, this.payload, { action: 'open' }));
        }
        this.ws.deviceSocket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            this.deviceReady = data.deviceStatuses && data.deviceStatuses.modal.initialized;
        });
    }
    render() {
        const params = {};
        Object.keys(this.componentContainer.attributes).forEach((index) => {
            params[this.componentContainer.attributes[index].name] = this.componentContainer.attributes[index].value;
        });
        return (h("div", { class: "component-container", "data-theme": this.theme }, this.deviceReady || this.forceLoadComponent ?
            h("openbio-palm-details", Object.assign({}, params, { theme: this.theme })) :
            h("div", { class: "center-container", style: { 'padding-bottom': '50px' } },
                h("div", { class: "flex-center" },
                    h("span", { class: "icon" },
                        h("i", { class: "mdi mdi-connection icon-24", style: { color: "#767676" }, "aria-hidden": "true" }))),
                h("div", { class: "flex-center flex-column" },
                    h("span", null, this.translations.DEVICE_DISCONNECTED),
                    h("span", { class: 'device-info-text' }, this.translations.DEVICE_DISCONNECTED_SUPPORT_INFO)),
                h("a", { class: "button is-small is-info", style: { 'margin-top': '20px' }, onClick: () => this.forceLoadComponent = true }, this.translations.CONTINUE_WITHOUT_DEVICE))));
    }
    static get is() { return "openbio-palm"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "componentContainer": {
            "elementRef": true
        },
        "config": {
            "state": true
        },
        "deviceReady": {
            "state": true
        },
        "forceLoadComponent": {
            "state": true
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "theme": {
            "state": true
        },
        "translations": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:openbio-palm:**/"; }
}
