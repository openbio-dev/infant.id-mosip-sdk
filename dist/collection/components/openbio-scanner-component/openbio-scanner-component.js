import WS from '../../utils/websocket';
import { getAppConfig } from '../../utils/api';
import { getThemeByApplicationType } from '../../utils/utils';
export class OpenbioSignatureComponent {
    constructor() {
        this.ws = new WS();
        this.theme = "default";
    }
    async componentDidLoad() {
        this.config = await getAppConfig();
        this.theme = getThemeByApplicationType(this.config.applicationType);
    }
    render() {
        const params = {};
        Object.keys(this.componentContainer.attributes).forEach((index) => {
            params[this.componentContainer.attributes[index].name] = this.componentContainer.attributes[index].value;
        });
        return (h("div", { class: "component-container", "data-theme": this.theme },
            h("openbio-scanner-details", Object.assign({}, params, { theme: this.theme }))));
    }
    static get is() { return "openbio-scanner"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "componentContainer": {
            "elementRef": true
        },
        "config": {
            "state": true
        },
        "theme": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:openbio-scanner:**/"; }
}
