import { notify } from '../../utils/notifier';
import { TranslationUtils } from '../../locales/translation';
import { getAppConfig } from '../../utils/api';
import { getThemeByApplicationType } from '../../utils/utils';
const BASE64_IMAGE = 'data:image/charset=UTF-8;png;base64,';
const DEFAULT_IMAGE = './assets/general/no-image.png';
var captureType;
(function (captureType) {
    captureType[captureType["ONE_FINGER_FLAT"] = 0] = "ONE_FINGER_FLAT";
    captureType[captureType["TWO_FINGER_FLAT"] = 1] = "TWO_FINGER_FLAT";
    captureType[captureType["ROLLED_FINGER"] = 2] = "ROLLED_FINGER";
    captureType[captureType["FOUR_FINGER_FLAT"] = 3] = "FOUR_FINGER_FLAT";
})(captureType || (captureType = {}));
export class OpenbioFingerImageComponent {
    constructor() {
        this.isModalShown = false;
        this.theme = "default";
        this.locale = 'pt';
    }
    async listenLocale(newValue) {
        TranslationUtils.setLocale(newValue);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    ;
    async componentWillLoad() {
        this.translations = await TranslationUtils.fetchTranslations();
    }
    async componentDidLoad() {
        this.serviceConfigs = await getAppConfig();
        this.theme = getThemeByApplicationType(this.serviceConfigs.applicationType);
    }
    showModal() {
        this.isModalShown = true;
    }
    hideModal() {
        this.isModalShown = false;
    }
    onInputChange(files) {
        if (files.length > 0) {
            if (files[0].type !== 'image/png') {
                notify(this.parentComponentContext.componentContainer, "error", TranslationUtils.concatTranslate('FILE_FORMAT_NOT_ACCEPTED_DESC', ['png']));
                return;
            }
            const file = files[0];
            const image = new Image();
            const url = window.URL.createObjectURL(file);
            image.onload = async () => {
                this.uploadFingerImageCallback(this.parentComponentContext, this.fingerIndex, files[0], { height: image.height, width: image.width });
                window.URL.revokeObjectURL(url);
            };
            image.src = url;
        }
    }
    getNfiqClass() {
        if (this.finger && this.serviceConfigs) {
            const type = this.finger.captureType === captureType.ROLLED_FINGER ? 'rolled' : 'flat';
            if (this.serviceConfigs.finger.colorizeLowNfiq || this.finger.nfiqScore <= this.serviceConfigs.finger.failControl.attemptLimit[this.fingerIndex][type].nfiq.threshold) {
                return this.finger.nfiqScore;
            }
        }
        return 0;
    }
    render() {
        return (h("div", { class: "column is-narrow component-container", "data-theme": this.theme, style: { width: '140px' } },
            h("div", { class: "finger-name", title: this.fingerName }, this.fingerName),
            h("div", { class: "status-item-line" },
                h("li", { class: `status-item status${this.getNfiqClass()}` }, this.finger ? this.finger.nfiqScore : 0)),
            this.finger ? h("div", { class: "button-hover" },
                h("button", { class: "button is-small is-pulled-left is-info finger-button edit-button", onClick: () => this.editFingerCallback(this.parentComponentContext, this.finger) }, this.translations.EDIT),
                h("button", { class: "button is-small is-pulled-left is-info finger-button", onClick: () => this.showModal() }, this.translations.VIEW)) : null,
            h("div", { class: "is-light finger-box" },
                h("img", { src: this.finger && (this.finger.minutiateData || this.finger.data) ? `${BASE64_IMAGE}${this.finger.minutiateData || this.finger.data}` : DEFAULT_IMAGE })),
            h("div", { class: "anomaly-title" }, this.finger ? this.finger.anomaly : ""),
            h("div", { class: `modal ${this.isModalShown ? "show-modal" : ""}` },
                h("span", { class: "close", onClick: () => this.hideModal() }, "\u00D7"),
                h("img", { class: "modal-content", src: this.finger && (this.finger.minutiateData || this.finger.data) ? `${BASE64_IMAGE}${this.finger.minutiateData || this.finger.data}` : DEFAULT_IMAGE })),
            this.allowUpload ?
                h("div", { id: "capture-file", class: "file is-small is-info mt-10" },
                    h("label", { class: "file-label" },
                        h("input", { onChange: ($event) => this.onInputChange($event.target.files), class: "file-input", type: "file", name: "resume", accept: ".png" }),
                        h("span", { class: "file-cta", id: "load-file-button" },
                            h("span", { class: "file-label" }, this.translations.LOAD_FILE)))) : null));
    }
    static get is() { return "openbio-finger-image-component"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "allowUpload": {
            "type": Boolean,
            "attr": "allow-upload"
        },
        "captureInput": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "editFingerCallback": {
            "type": "Any",
            "attr": "edit-finger-callback"
        },
        "finger": {
            "type": "Any",
            "attr": "finger"
        },
        "fingerIndex": {
            "type": Number,
            "attr": "finger-index"
        },
        "fingerName": {
            "type": String,
            "attr": "finger-name"
        },
        "isModalShown": {
            "state": true
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "parentComponentContext": {
            "type": "Any",
            "attr": "parent-component-context"
        },
        "serviceConfigs": {
            "state": true
        },
        "theme": {
            "state": true
        },
        "translations": {
            "state": true
        },
        "uploadFingerImageCallback": {
            "type": "Any",
            "attr": "upload-finger-image-callback"
        }
    }; }
    static get style() { return "/**style-placeholder:openbio-finger-image-component:**/"; }
}
