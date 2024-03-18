import WS from '../../utils/websocket';
import { showImage } from '../../utils/canvas';
import { setSignature } from '../../store/main.store';
import { getAnomalies, saveSignature, getSignatureSettings } from "./api";
import { THEMES, getLocalization } from '../../utils/utils';
import { getAppConfig, saveServiceTime } from '../../utils/api';
import constants from "../../utils/constants";
import changeDPI from "changedpi";
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { TranslationUtils } from '../../locales/translation';
const BASE64_IMAGE = 'data:image/charset=UTF-8;png;base64,';
const EMPTY_IMAGE = '';
var TABS;
(function (TABS) {
    TABS[TABS["CAPTURE"] = 0] = "CAPTURE";
    TABS[TABS["RESULT"] = 1] = "RESULT";
})(TABS || (TABS = {}));
;
export class OpenbioSignatureComponentDetails {
    constructor() {
        this.ws = new WS();
        this.person = {
            id: 0
        };
        this.payload = {
            deviceName: "WACOM",
            deviceType: "signature",
            devicePosition: 0,
            action: undefined,
            data: undefined,
            module: "signature"
        };
        this.theme = "default";
        this.deviceReady = false;
        this.deviceOpened = false;
        this.originalImage = EMPTY_IMAGE;
        this.rawImage = EMPTY_IMAGE;
        this.points = [];
        this.dpiValue = 0;
        this.tab = 0;
        this.anomalyOptions = [];
        this.signature = {
            originalImage: "",
            points: []
        };
        this.backendSession = undefined;
        this.showLoader = false;
        this.isCapturing = false;
        this.model = '';
        this.brand = '';
        this.serial = '';
        this.deviceStatus = false;
        this.serviceConfigs = undefined;
        this.captureDone = false;
        this.lastPreviewImg = '';
        this.startPreviewTime = new Date().getTime();
        this.cropperModal = false;
        this.uploadedBase64 = undefined;
        this.locale = 'pt';
        this.fileToBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    async listenLocale(newValue) {
        this.setI18nParameters(newValue);
    }
    ;
    async componentWillLoad() {
        this.setI18nParameters(this.locale);
    }
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    async sendServiceTimeInformation(observations, details) {
        if (!this.detached) {
            await saveServiceTime({
                personId: this.person.id,
                type: "SIGNATURE",
                processingTime: new Date().getTime() - this.startPreviewTime,
                observations,
                details,
                brand: this.brand,
                model: this.model,
                serial: this.serial
            });
        }
    }
    clearImages() {
        showImage(this.canvas, "");
        this.signature.originalImage = undefined;
    }
    clearImagesObjects() {
        this.uploadedBase64 = EMPTY_IMAGE;
        this.originalImage = EMPTY_IMAGE;
        this.signature.originalImage = EMPTY_IMAGE;
        this.componentContainer.forceUpdate();
    }
    clear() {
        this.stopPreview();
        this.startPreview();
    }
    startPreview(backToPreview = false) {
        this.captureDone = false;
        if (this.isCapturing)
            return;
        this.startPreviewTime = new Date().getTime();
        this.clearImages();
        this.isCapturing = true;
        this.payload.action = "start";
        this.ws.respondToDeviceWS(this.payload);
        if (backToPreview) {
            this.setActiveTab(TABS.CAPTURE);
        }
    }
    close() {
        this.payload.action = "close";
        this.ws.respondToDeviceWS(this.payload);
    }
    stopPreview() {
        this.isCapturing = false;
        this.payload.action = "stop";
        this.ws.respondToDeviceWS(this.payload);
    }
    getFinishTitle() {
        return `${this.deviceReady ? this.translations.CLICK_TO_FINISH : this.translations.CAPTURE_BEFORE_FINISH}`;
    }
    capture() {
        this.clearImagesObjects();
        this.showLoader = true;
        this.payload.action = "capture";
        this.ws.respondToDeviceWS(this.payload);
    }
    open() {
        this.payload.action = "open";
        this.ws.respondToDeviceWS(this.payload);
        this.deviceOpened = true;
    }
    componentDidLoad() {
        this.showLoader = true;
        setTimeout(async () => {
            try {
                const faceSettings = await getSignatureSettings();
                this.dpiValue = constants.dpiValue[faceSettings.dpiOption] || 0;
                this.serviceConfigs = await getAppConfig();
                this.componentContainer.forceUpdate();
                if (this.detached && this.isTagComponent) {
                    const _this = this;
                    window["getBiometryData"] = function () {
                        return _this.signature;
                    };
                    if (this.tempSignature) {
                        this.signature = JSON.parse(this.tempSignature);
                    }
                }
                else if (this.detached) {
                    this.emitLoadInformation();
                    const checkSessionInterval = setInterval(() => {
                        if (this.backendSession) {
                            clearInterval(checkSessionInterval);
                            this.originalImage = this.backendSession.signature.data;
                            this.signature.originalImage = this.backendSession.signature.data;
                        }
                    }, 200);
                }
                else {
                    this.person = JSON.parse(this.tempPerson);
                    this.signature = JSON.parse(this.tempSignature);
                }
                this.anomalyOptions = await getAnomalies(constants.anomalyTypes.SIGNATURE_ANOMALY, !!this.detached);
                this.wsStatusInterval = setInterval(() => {
                    if (this.ws.status() === 1) {
                        clearInterval(this.wsStatusInterval);
                        if (!this.deviceReady) {
                            this.open();
                        }
                    }
                }, 1000);
                this.ws.componentSocket.addEventListener("message", (event) => {
                    const data = JSON.parse(event.data);
                    if (data.action === "session-data") {
                        this.backendSession = data.session;
                    }
                });
                this.ws.deviceSocket.addEventListener("message", async (event) => {
                    const data = JSON.parse(event.data);
                    if (data.status === "initialized") {
                        this.deviceReady = true;
                        this.stopPreview();
                        this.startPreview();
                    }
                    if (data.status === "session-data-stored") {
                        setTimeout(() => {
                            this.backendSession = undefined;
                            this.emitLoadInformation();
                            const checkSessionInterval = setInterval(() => {
                                if (this.backendSession && this.backendSession.signature) {
                                    clearInterval(checkSessionInterval);
                                    setTimeout(() => {
                                        this.showLoader = false;
                                        Swal.fire({
                                            type: "success",
                                            text: this.translations.CAPTURE_SUCCESS,
                                            allowOutsideClick: false,
                                            allowEscapeKey: false,
                                            allowEnterKey: false,
                                            confirmButtonColor: THEMES[this.theme].secondary,
                                        });
                                        this.setActiveTab(TABS.RESULT);
                                        this.captureDone = true;
                                    }, 2000);
                                }
                            }, 200);
                        }, 1000);
                    }
                    if (data.status === "validation-error") {
                        Swal.fire({
                            type: "error",
                            text: TranslationUtils.concatTranslate('CROPPED_IMAGE_NOT_IN_PREDEFINED_PARAMETERS', [data.errorMessage.toLowerCase().split(" ").join(", ")]),
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            allowEnterKey: false,
                            confirmButtonColor: THEMES[this.theme].secondary,
                        });
                        this.showLoader = false;
                        return;
                    }
                    const deviceStatuses = data.deviceStatuses;
                    if (deviceStatuses) {
                        const previousStatus = JSON.parse(JSON.stringify(this.deviceStatus));
                        this.deviceStatus = deviceStatuses.signature && deviceStatuses.signature.initialized;
                        if (!this.deviceStatus) {
                            return;
                        }
                        else if (!previousStatus) {
                            if (!this.deviceOpened) {
                                this.open();
                                this.stopPreview();
                                this.startPreview();
                            }
                            return;
                        }
                    }
                    if (data.module === "signature") {
                        this.model = data.deviceInfo ? data.deviceInfo.modelName : "";
                        this.brand = data.deviceInfo ? data.deviceInfo.manufacturName : "";
                        this.serial = data.deviceInfo ? data.deviceInfo.serialNumber : "";
                        if (data.error) {
                            this.showLoader = false;
                            const error = `${TranslationUtils.concatTranslate('CODE_DESC', [data.code])}\n${TranslationUtils.concatTranslate('DESCRIPTION_DESC', [data.error])}`;
                            await this.sendServiceTimeInformation(error);
                            Swal.fire({
                                type: 'error',
                                title: this.translations.ERROR_WHILE_CAPTURING,
                                text: error,
                                confirmButtonColor: THEMES[this.theme].secondary,
                            });
                            return;
                        }
                        else if (data.previewImage) {
                            showImage(this.canvas, data.previewImage);
                            this.lastPreviewImg = data.previewImage;
                        }
                        else if (data.originalImage) {
                            this.isCapturing = false;
                            showImage(this.canvas, this.isImageTypeTiff() ? this.lastPreviewImg : data.originalImage);
                            this.originalImage = data.originalImage;
                            this.points = data.points;
                            this.rawImage = data.rawImage;
                            this.saveSignature();
                            return;
                        }
                    }
                });
                this.showLoader = false;
            }
            catch (e) {
                this.showLoader = false;
                console.error(e);
            }
        }, 1000);
    }
    isImageTypeTiff() {
        return this.serviceConfigs.signature.imageType === 'tiff';
    }
    componentDidUnload() {
        this.stopPreview();
    }
    acceptData() {
        if (this.isCapturing)
            return;
        this.payload.action = "close-component";
        this.payload.data = {
            type: "signature",
            owner: "default-user" // #TODO replace this with a authenticated user
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    emitLoadInformation() {
        this.payload.action = "component-opened";
        this.payload.data = {
            type: "signature"
        };
        const checkStatusInterval = setInterval(() => {
            if (this.ws.componentSocket.readyState === 1) {
                clearInterval(checkStatusInterval);
                this.ws.respondToComponentWS(this.payload);
            }
        }, 200);
    }
    sendBiometryInformation(signature) {
        this.payload.action = "store-session";
        this.payload.data = {
            type: "signature",
            owner: "default-user",
            biometry: signature
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    activeTabClass(num) {
        return this.tab === num ? "is-active" : "";
    }
    setActiveTab(num) {
        this.tab = num;
        if (num === TABS.CAPTURE && this.signature.originalImage !== undefined) {
            setTimeout(() => {
                showImage(this.canvas, this.signature.originalImage);
            }, 200);
        }
        this.componentContainer.forceUpdate();
    }
    setSelection(event) {
        const name = event.target.name;
        const value = event.target.value;
        this[name] = parseInt(value);
    }
    saveAnomaly() {
        if (!this.anomaly)
            return;
        this.stopPreview();
        this.saveSignature(true);
    }
    async saveSignature(saveAnomaly = false) {
        let localization = undefined;
        if (this.serviceConfigs && this.serviceConfigs.tools.geolocationService) {
            localization = await getLocalization();
        }
        const signature = {
            id: this.signature.id ? this.signature.id : null,
            data: this.originalImage ? (this.dpiValue ? changeDPI.changeDpiDataUrl(`data:image/png;base64,${this.originalImage}`, this.dpiValue).split(",")[1] : this.originalImage) : "",
            rawData: this.rawImage ? (this.dpiValue ? changeDPI.changeDpiDataUrl(`data:image/png;base64,${this.rawImage}`, this.dpiValue).split(",")[1] : this.rawImage) : "",
            anomalyId: saveAnomaly && this.anomaly ? this.anomaly : null,
            points: JSON.stringify(this.points),
            model: this.model,
            brand: this.brand,
            serial: this.serial,
            localization,
            isUpload: Boolean(this.uploadedBase64)
        };
        if (!this.detached) {
            const saveSignatureResult = await saveSignature({
                personId: this.person.id,
                signature: signature
            });
            await this.sendServiceTimeInformation(this.translations.CAPTURE_SUCCESS);
            await this.storeCapturedSignature({
                id: saveSignatureResult.id,
                data: saveSignatureResult.data,
                rawData: saveSignatureResult.rawData,
                anomalyId: saveSignatureResult.anomaly_id,
                model: saveSignatureResult.model,
                brand: saveSignatureResult.brand,
                serial: saveSignatureResult.serial,
                updatedAt: saveSignatureResult.updated_at,
                localization,
            });
            this.showLoader = false;
            Swal.fire({
                type: "success",
                text: this.translations.CAPTURE_SUCCESS,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                confirmButtonColor: THEMES[this.theme].secondary,
            });
            this.setActiveTab(TABS.RESULT);
        }
        else {
            if (!this.isTagComponent) {
                await this.sendBiometryInformation(signature);
            }
            await this.storeCapturedSignature(signature);
        }
    }
    storeCapturedSignature(parsedValue) {
        this.anomaly = 0;
        this.signature.id = parsedValue.id;
        this.signature.originalImage = parsedValue.data;
        this.signature.points = parsedValue.points;
        this.signature.anomalyId = parsedValue.anomalyId;
        this.signature.model = parsedValue.model;
        this.signature.brand = parsedValue.brand;
        this.signature.serial = parsedValue.serial;
        this.signature.localization = parsedValue.localization;
        setSignature(this.signature);
        this.componentContainer.forceUpdate();
    }
    async onInputChange(files) {
        if (files.length > 0) {
            if (files[0].type.toUpperCase() !== `image/${this.serviceConfigs.signature.imageType}`.toUpperCase()) {
                Swal.fire({
                    type: "error",
                    text: TranslationUtils.concatTranslate('FILE_FORMAT_NOT_ACCEPTED_DESC', [this.serviceConfigs.signature.imageType]),
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    confirmButtonColor: THEMES[this.theme].secondary,
                });
                return;
            }
            if (files[0].type.toUpperCase() !== `image/${this.serviceConfigs.signature.imageType}`.toUpperCase()) {
                Swal.fire({
                    type: "error",
                    text: TranslationUtils.concatTranslate('FILE_FORMAT_NOT_ACCEPTED_DESC', [this.serviceConfigs.signature.imageType]),
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    confirmButtonColor: THEMES[this.theme].secondary,
                });
                return;
            }
            this.uploadedBase64 = await this.fileToBase64(files[0]);
            this.showLoader = true;
            setTimeout(() => {
                if (this.serviceConfigs && this.serviceConfigs.signature.uploadSettings.enrollCropper) {
                    this.showLoader = false;
                    this.cropperModal = true;
                }
                else {
                    this.cropCallback(this, this.uploadedBase64.split(',')[1]);
                }
            }, 1000);
        }
        files = undefined;
        return;
    }
    _base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
    cropCallback(_this, croppedBase64Image) {
        _this.clearImagesObjects();
        _this.originalImage = croppedBase64Image;
        _this.signature.originalImage = croppedBase64Image;
        _this.cropperModal = false;
        _this.normalizeImage();
    }
    async normalizeImage() {
        const image = new Image();
        const blob = await fetch(`data:image/${this.serviceConfigs.signature.imageType};base64,${this.signature.originalImage}`).then(res => res.blob());
        const url = window.URL.createObjectURL(blob);
        image.onload = async () => {
            this.payload.action = "normalize-image";
            this.payload.data = {
                type: "signature",
                owner: "default-user",
                base64Input: this.signature.originalImage,
                width: image.width,
                height: image.height,
            };
            this.ws.respondToDeviceWS(this.payload);
        };
        image.src = url;
    }
    render() {
        const anomalyOptions = (this.anomalyOptions || []).map((option) => {
            const translatedOption = this.translations[option.i18n_code] || option.name;
            return (h("option", { value: option.id, selected: this.anomaly === option.id }, translatedOption));
        });
        return (h("div", { class: "window-size" },
            h("loader-component", { enabled: this.showLoader }),
            h("div", { id: "notification-container" }),
            this.cropperModal ?
                h("div", { class: `modal is-active` },
                    h("div", { class: "modal-background" }),
                    h("div", { class: "modal-content image-cropper-modal-content-container" },
                        h("image-cropper-component", { src: this.uploadedBase64, cropBoxResizable: true, parentElementTag: "openbio-signature", currentElementTag: "openbio-signature-details", parentComponentContext: this, cropCallback: this.cropCallback })),
                    h("button", { class: "modal-close is-large", "aria-label": "close", onClick: () => this.cropperModal = false })) : null,
            h("div", { class: "tabs is-left is-boxed" },
                h("ul", null,
                    h("li", { class: this.activeTabClass(TABS.CAPTURE) },
                        h("a", { onClick: () => this.setActiveTab(TABS.CAPTURE) },
                            h("span", { class: "tab-title" }, this.translations.CAPTURE))),
                    h("li", { class: this.activeTabClass(TABS.RESULT) },
                        h("a", { onClick: () => this.setActiveTab(TABS.RESULT) },
                            h("span", { class: "tab-title" }, this.translations.RESULT))))),
            this.tab === TABS.CAPTURE ? h("div", { class: "columns is-mobile" },
                h("div", { class: "column is-one-third" },
                    h("div", { class: "device-status-container" },
                        h("h6", { class: "title is-7" },
                            this.translations.DEVICE_STATUS.toUpperCase(),
                            ": ",
                            this.deviceReady ? this.translations.READY : this.translations.NOT_LOADED)),
                    this.serviceConfigs && (this.serviceConfigs.signature.help.guideImage || this.serviceConfigs.signature.help.content) ?
                        h("help-component", { src: this.serviceConfigs.signature.help.guideImage, "help-text": this.serviceConfigs.signature.help.content }) : null),
                h("div", { class: "column text-align-left" },
                    this.serviceConfigs && this.serviceConfigs.signature.grid && this.serviceConfigs.signature.grid.enabled ?
                        h("svg", { width: "460px", height: "300px", xmlns: "http://www.w3.org/2000/svg", style: { position: "absolute" } },
                            " \\",
                            h("defs", null,
                                " \\",
                                h("pattern", { id: "smallGrid", width: this.serviceConfigs.signature.grid.width, height: this.serviceConfigs.signature.grid.height, patternUnits: "userSpaceOnUse" },
                                    " \\",
                                    h("path", { d: `M ${this.serviceConfigs.signature.grid.width} 0 L 0 0 0 ${this.serviceConfigs.signature.grid.height}`, fill: "none", stroke: "gray", "stroke-width": "0.5" }),
                                    " \\"),
                                " \\",
                                h("pattern", { id: "grid", width: "80", height: "80", patternUnits: "userSpaceOnUse" },
                                    " \\",
                                    h("rect", { width: "80", height: "80", fill: "url(#smallGrid)" }),
                                    " \\",
                                    h("path", { d: "M 80 0 L 0 0 0 80", fill: "none", stroke: "gray", "stroke-width": "1" }),
                                    " \\"),
                                " \\"),
                            " \\",
                            h("rect", { width: "100%", height: "100%", fill: "url(#smallGrid)" }),
                            " \\") : null,
                    h("canvas", { width: "460", height: "300", class: "canvas", ref: el => this.canvas = el }),
                    h("div", { class: "columns is-mobile action-buttons-container" },
                        h("div", { class: "column" },
                            h("button", { class: `button is-small is-pulled-left is-info ${this.deviceReady && this.isCapturing ? "disabled" : ""}`, onClick: () => this.startPreview() }, this.translations.PREVIEW_INIT)),
                        h("div", { class: "column has-text-centered" },
                            h("button", { class: `button is-small is-info is-pulled-right ${this.deviceReady ? "" : "disabled"}`, title: `${this.translations.CLICK_TO_CLEAN}`, onClick: () => this.clear() }, this.translations.CLEAN)),
                        h("div", { class: "column has-text-centered" },
                            h("button", { class: `button is-small is-info is-pulled-right ${this.deviceReady && !this.signature.originalImage ? "" : "disabled"}`, title: `${this.deviceReady ? this.translations.MAKE_CAPTURE : this.translations.DEVICE_NOT_LOADED}`, onClick: () => this.capture() }, this.translations.MAKE_CAPTURE)),
                        this.detached && !this.isTagComponent && this.captureDone ? h("div", { class: "column has-text-centered" },
                            h("button", { class: `button is-small is-pulled-left is-info ${!this.deviceReady || this.isCapturing || !this.originalImage || !this.signature.originalImage ? "disabled" : ""}`, title: this.getFinishTitle(), onClick: () => this.acceptData() }, this.translations.FINISH)) : null),
                    this.serviceConfigs && this.serviceConfigs.signature.uploadSettings.enabled ?
                        h("div", { id: "capture-file", class: "file is-small is-info" },
                            h("label", { class: "file-label" },
                                h("input", { onInput: ($event) => this.onInputChange($event.target.files), class: "file-input", type: "file", name: "resume", accept: `image/${this.serviceConfigs ? this.serviceConfigs.signature.imageType : "png"}` }),
                                h("span", { class: "file-cta" },
                                    h("span", { class: "file-label" }, this.translations.LOAD_FILE)))) : null,
                    h("div", { class: "columns is-mobile anomaly-buttons-container" },
                        h("div", { class: "column" },
                            h("div", { class: "select is-small inline is-pulled-left" },
                                h("select", { onChange: this.setSelection.bind(this), name: "anomaly" },
                                    h("option", { value: undefined }, this.translations.CHOOSE_IN_ANOMALY_CASE.toUpperCase()),
                                    anomalyOptions))),
                        h("div", { class: "column" },
                            h("button", { class: "button is-small is-info is-pulled-right", onClick: () => this.saveAnomaly() }, this.translations.SAVE_ANOMALY.toUpperCase()))))) : null,
            this.tab === TABS.RESULT ? h("div", { class: "tab-content" },
                h("div", { class: "columns" },
                    h("div", { class: "column has-text-centered preview-result" },
                        h("img", { src: `${BASE64_IMAGE}${this.detached ? this.isImageTypeTiff() ? this.lastPreviewImg : (this.signature.originalImage || this.signature.formatedData) : this.signature.formatedData || this.signature.originalImage}`, class: "bg-color-primary" }),
                        h("div", { class: "columns is-mobile", style: { transform: "translate(30%, 0)", marginTop: "10px" } },
                            h("div", { class: "column is-narrow", style: { transform: "translate(24px, 0)" } },
                                h("div", null,
                                    h("img", { src: "./assets/general/signature-freehand.png", title: this.translations.CLICK_TO_REDO_SIGNATURE, class: `fab-icon`, onClick: () => this.startPreview(true) }),
                                    h("br", null),
                                    h("span", { style: { padding: '6px', display: 'inline-block' } },
                                        " ",
                                        this.translations.NEW_SIGNATURE,
                                        " "))),
                            this.detached && !this.isTagComponent && this.captureDone ?
                                h("div", { class: "column is-narrow", style: { transform: "translate(70px, 0)" } },
                                    h("div", null,
                                        h("img", { src: "./assets/general/check.png", class: "fab-icon", style: { float: 'right !important' }, onClick: () => this.acceptData() }),
                                        h("br", null),
                                        h("span", { style: { paddingLeft: '7px', display: 'inline-block' } },
                                            " ",
                                            this.translations.FINISH,
                                            " "))) : null))),
                h("p", null, this.signature.anomalyId ? this.anomalyOptions.find((anomaly) => { return anomaly.id === this.signature.anomalyId; }).name : "")) : null));
    }
    static get is() { return "openbio-signature-details"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "anomaly": {
            "state": true
        },
        "anomalyOptions": {
            "state": true
        },
        "backendSession": {
            "state": true
        },
        "brand": {
            "state": true
        },
        "captureDone": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "cropperModal": {
            "state": true
        },
        "detached": {
            "type": Boolean,
            "attr": "detached",
            "mutable": true
        },
        "deviceOpened": {
            "state": true
        },
        "deviceReady": {
            "state": true
        },
        "deviceStatus": {
            "state": true
        },
        "dpiValue": {
            "state": true
        },
        "isCapturing": {
            "state": true
        },
        "isTagComponent": {
            "type": Boolean,
            "attr": "is-tag-component"
        },
        "lastPreviewImg": {
            "state": true
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "model": {
            "state": true
        },
        "originalImage": {
            "state": true
        },
        "points": {
            "state": true
        },
        "rawImage": {
            "state": true
        },
        "serial": {
            "state": true
        },
        "serviceConfigs": {
            "state": true
        },
        "showLoader": {
            "state": true
        },
        "signature": {
            "state": true
        },
        "startPreviewTime": {
            "state": true
        },
        "tab": {
            "state": true
        },
        "tempPerson": {
            "type": "Any",
            "attr": "temp-person"
        },
        "tempSignature": {
            "type": "Any",
            "attr": "temp-signature"
        },
        "theme": {
            "type": String,
            "attr": "theme"
        },
        "translations": {
            "state": true
        },
        "uploadedBase64": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:openbio-signature-details:**/"; }
}
