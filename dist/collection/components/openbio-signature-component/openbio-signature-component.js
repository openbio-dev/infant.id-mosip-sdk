import { notify } from '../../utils/notifier';
import WS from '../../utils/websocket';
import { saveSignatureFile } from './api';
import { TranslationUtils } from '../../locales/translation';
import { getAppConfig } from '../../utils/api';
import { addCustomLink, getThemeByApplicationType } from '../../utils/utils';
export class OpenbioSignatureComponent {
    constructor() {
        this.ws = new WS();
        this.payload = {
            action: undefined,
            deviceName: 'WACOM',
            deviceType: 'signature',
            devicePosition: 0,
            data: undefined,
            module: 'signature'
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
        addCustomLink("https://cdn.jsdelivr.net/npm/@mdi/font@6.6.96/css/materialdesignicons.min.css");
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
            this.deviceReady = data.deviceStatuses && data.deviceStatuses.signature.initialized;
        });
        this.captureInput.onchange = () => {
            if (this.captureInput.files.length > 0) {
                if (this.captureInput.files[0].type !== 'image/png') {
                    notify(this.componentContainer, "error", TranslationUtils.concatTranslate('FILE_FORMAT_NOT_ACCEPTED_DESC', ['png']));
                    this.captureInput.files = undefined;
                    this.captureInput.value = '';
                    return;
                }
                const image = new Image();
                const url = window.URL.createObjectURL(this.captureInput.files[0]);
                image.onload = async () => {
                    try {
                        await saveSignatureFile({
                            personId: 34,
                            signature: {},
                        }, this.captureInput.files[0]);
                    }
                    catch (e) {
                        console.log(e);
                    }
                    window.URL.revokeObjectURL(url);
                };
                image.src = url;
            }
        };
    }
    render() {
        const params = {};
        Object.keys(this.componentContainer.attributes).forEach((index) => {
            params[this.componentContainer.attributes[index].name] = this.componentContainer.attributes[index].value;
        });
        return (h("div", { class: "component-container", "data-theme": this.theme }, this.deviceReady || this.forceLoadComponent ?
            h("openbio-signature-details", Object.assign({}, params, { theme: this.theme })) :
            h("div", { class: "center-container", style: { 'padding-bottom': '50px' } },
                h("div", { class: "flex-center" },
                    h("span", { class: "icon" },
                        h("i", { class: "mdi mdi-connection icon-24", style: { color: "#767676" }, "aria-hidden": "true" }))),
                h("div", { class: "flex-center flex-column" },
                    h("span", null, this.translations.DEVICE_DISCONNECTED),
                    h("span", { class: 'device-info-text' }, this.translations.DEVICE_DISCONNECTED_SUPPORT_INFO)),
                h("button", { class: "button is-small is-info", style: { 'margin-top': '20px' }, onClick: () => this.forceLoadComponent = true }, this.translations.CONTINUE_WITHOUT_DEVICE))));
    }
    static get is() { return "openbio-signature"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "captureInput": {
            "state": true
        },
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
    static get style() { return "/**style-placeholder:openbio-signature:**/"; }
}
