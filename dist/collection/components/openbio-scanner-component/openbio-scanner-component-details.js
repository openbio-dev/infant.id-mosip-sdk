import WS from '../../utils/websocket';
import { showImage } from '../../utils/canvas';
import { getAppConfig } from '../../utils/api';
import { loadFingerForm, loadRoiCroppedForm, loadPalmForm, savePalm, saveFingers } from './api';
import { getAnomalies } from '../openbio-finger-component/api';
// import { getDevices, setDevice , open, scan, close  } from './scannerApi';
import { notify } from '../../utils/notifier';
import constants from '../../utils/constants';
import { TranslationUtils } from '../../locales/translation';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { THEMES, addCustomLink } from '../../utils/utils';
// const BASE64_IMAGE = 'data:image/charset=UTF-8;bmp;base64,';
var FORM_TYPE;
(function (FORM_TYPE) {
    FORM_TYPE[FORM_TYPE["UNDEFINED"] = -1] = "UNDEFINED";
    FORM_TYPE[FORM_TYPE["DECADACTILAR"] = 0] = "DECADACTILAR";
    FORM_TYPE[FORM_TYPE["PALMAR"] = 1] = "PALMAR";
})(FORM_TYPE || (FORM_TYPE = {}));
var PALM_FORM_TYPE;
(function (PALM_FORM_TYPE) {
    PALM_FORM_TYPE[PALM_FORM_TYPE["UNDEFINED"] = -1] = "UNDEFINED";
    PALM_FORM_TYPE[PALM_FORM_TYPE["SINGLE_PALM"] = 0] = "SINGLE_PALM";
    PALM_FORM_TYPE[PALM_FORM_TYPE["FULL_PALM"] = 1] = "FULL_PALM";
})(PALM_FORM_TYPE || (PALM_FORM_TYPE = {}));
var PALM_TYPES;
(function (PALM_TYPES) {
    PALM_TYPES[PALM_TYPES["UNDEFINED"] = -1] = "UNDEFINED";
    PALM_TYPES[PALM_TYPES["RIGHT_PALM"] = 1] = "RIGHT_PALM";
    PALM_TYPES[PALM_TYPES["RIGHT_HYPOTHENAR"] = 2] = "RIGHT_HYPOTHENAR";
    PALM_TYPES[PALM_TYPES["LEFT_PALM"] = 3] = "LEFT_PALM";
    PALM_TYPES[PALM_TYPES["LEFT_HYPOTHENAR"] = 4] = "LEFT_HYPOTHENAR";
})(PALM_TYPES || (PALM_TYPES = {}));
var PALM_NAMES;
(function (PALM_NAMES) {
    PALM_NAMES[PALM_NAMES["Palma direita"] = 1] = "Palma direita";
    PALM_NAMES[PALM_NAMES["Hipotenar direita"] = 2] = "Hipotenar direita";
    PALM_NAMES[PALM_NAMES["Palma esquerda"] = 3] = "Palma esquerda";
    PALM_NAMES[PALM_NAMES["Hipotenar esquerda"] = 4] = "Hipotenar esquerda";
})(PALM_NAMES || (PALM_NAMES = {}));
export class OpenbioSignatureComponentDetails {
    constructor() {
        this.ws = new WS();
        this.payload = {
            action: undefined,
            data: undefined
        };
        this.theme = "default";
        this.imgTest = undefined;
        this.deviceReady = false;
        this.deviceOpened = false;
        this.backendSession = undefined;
        this.showLoader = false;
        this.isCapturing = false;
        this.model = '';
        this.brand = '';
        this.serial = '';
        this.deviceStatus = false;
        this.serviceConfigs = undefined;
        this.person = {};
        this.modal = {
            src: "",
            active: false,
        };
        this.form = {
            canvas: {
                width: undefined,
                height: undefined,
            },
            isActive: false,
            file: undefined,
            fileData: {},
            src: undefined,
            autoNext: true,
            fingerSelections: [
                { topLeft: { x: 39, y: 34 }, bottomRight: { x: 168, y: 153 }, index: 0, collected: true, selected: false },
                { topLeft: { x: 169, y: 34 }, bottomRight: { x: 298, y: 153 }, index: 1, collected: true, selected: false },
                { topLeft: { x: 298, y: 33 }, bottomRight: { x: 425, y: 152 }, index: 2, collected: true, selected: false },
                { topLeft: { x: 425, y: 33 }, bottomRight: { x: 558, y: 151 }, index: 3, collected: true, selected: false },
                { topLeft: { x: 558, y: 33 }, bottomRight: { x: 686, y: 153 }, index: 4, collected: true, selected: false },
                { topLeft: { x: 38, y: 195 }, bottomRight: { x: 167, y: 314 }, index: 5, collected: true, selected: false },
                { topLeft: { x: 167, y: 195 }, bottomRight: { x: 298, y: 316 }, index: 6, collected: true, selected: false },
                { topLeft: { x: 298, y: 195 }, bottomRight: { x: 425, y: 312 }, index: 7, collected: true, selected: false },
                { topLeft: { x: 425, y: 195 }, bottomRight: { x: 556, y: 313 }, index: 8, collected: true, selected: false },
                { topLeft: { x: 556, y: 195 }, bottomRight: { x: 686, y: 314 }, index: 9, collected: true, selected: true }
            ],
            palmSelection: {
                collected: false,
                topLeft: { x: 36, y: 82 },
                bottomRight: { x: 391, y: 412 },
                anomalyName: undefined,
            },
            palmSelections: [
                { topLeft: { x: 5, y: 172 }, bottomRight: { x: 102, y: 418 }, index: 0, type_id: 4, collected: false, anomalyName: undefined },
                { topLeft: { x: 115, y: 172 }, bottomRight: { x: 347, y: 418 }, index: 1, type_id: 3, collected: false, anomalyName: undefined },
                { topLeft: { x: 360, y: 172 }, bottomRight: { x: 589, y: 418 }, index: 2, type_id: 1, collected: false, anomalyName: undefined },
                { topLeft: { x: 603, y: 172 }, bottomRight: { x: 696, y: 418 }, index: 3, type_id: 2, collected: false, anomalyName: undefined },
            ],
            requiresManualSelection: true,
            selectedFinger: undefined,
            selectedPalm: undefined,
            success: undefined,
            croppedFingers: [],
            croppedPalm: {},
            croppedPalms: [],
            palms: [],
            // Canvas box control vars
            lineOffset: 8,
            anchrSize: 7,
            clickedArea: { box: -1, pos: 'o' },
            tmpBox: undefined,
            x1: undefined,
            x2: undefined,
            y1: undefined,
            y2: undefined,
        };
        this.deviceList = [];
        this.selectedDevice = undefined;
        this.formType = FORM_TYPE.UNDEFINED;
        this.palmType = PALM_TYPES.UNDEFINED;
        this.palmFormType = PALM_FORM_TYPE.UNDEFINED;
        this.disableFormSelection = false;
        this.anomalyOptions = [];
        this.palmAnomalyOptions = ["Amputado", "Danificado", "Enfaixado", "Interno", "Alergia", "Amputação parcial", "Cicatriz", "Atrofiado", "Bebe"];
        this.locale = 'pt';
    }
    async listenLocale(newValue) {
        this.setI18nParameters(newValue);
    }
    ;
    async componentWillLoad() {
        this.setI18nParameters(this.locale);
        addCustomLink("https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css");
        addCustomLink("https://cdn.jsdelivr.net/npm/@mdi/font@6.6.96/css/materialdesignicons.min.css");
        addCustomLink("https://db.onlinewebfonts.com/c/7200c6dd8ac604abe09f5159e53a40c0?family=Mark+Pro");
    }
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        this.palmAnomalyOptions = [this.translations.AMPUTATED, this.translations.DAMAGED, this.translations.BANDAGED, this.translations.INTERNAL, this.translations.ALLERGY, this.translations.PARTIAL_AMPUTATION, this.translations.SCAR, this.translations.STUNTED, this.translations.BABY];
        this.componentContainer.forceUpdate();
    }
    clearImages() {
        showImage(this.canvas, "");
    }
    start() {
        this.payload.action = "scanner-start";
        this.ws.respondToDeviceWS(this.payload);
    }
    // startService() {
    //   this.payload.action = "scanner-start-service";
    //   this.ws.respondToDeviceWS(this.payload);
    // }
    // getDeviceList() {
    //   getDevices().then((result) => {
    //     this.deviceList = result;
    //   })
    // }
    // setDevice() {
    //   setDevice(1).then((result) => {
    //     console.log(result);
    //   })
    // }
    // setDevice() {
    //   this.payload.action = "scanner-set-device";
    //   this.payload.data.deviceName = this.selectedDevice;
    //   this.ws.respondToDeviceWS(this.payload);
    // }
    async capture() {
        // await open();
        this.showLoader = true;
        if (!this.canCapture()) {
            notify(this.componentContainer, "warning", this.translations.SELECT_TOKEN_IF_PALMAR);
            return;
        }
        this.showLoader = true;
        this.payload.action = "scanner-scan";
        this.ws.respondToDeviceWS(this.payload);
        // scannerScan().then((result) => {
        //   function _base64ToArrayBuffer(base64) {
        //     var binary_string = window.atob(base64);
        //     var len = binary_string.length;
        //     var bytes = new Uint8Array(len);
        //     for (var i = 0; i < len; i++) {
        //         bytes[i] = binary_string.charCodeAt(i);
        //     }
        //     return bytes.buffer;
        //   }
        //   const buffer = _base64ToArrayBuffer(result.data);
        //   const tempFile: any = new File([buffer], "temp_scan.bmp", {
        //     type: "image/bmp",
        //   });
        //   this.loadForm(tempFile);
        // });
    }
    close() {
        this.payload.action = "scanner-close";
        this.ws.respondToDeviceWS(this.payload);
    }
    open() {
        this.payload.action = "open";
        this.ws.respondToDeviceWS(this.payload);
        this.deviceOpened = true;
    }
    setAnomaly(event) {
        const eventValue = parseInt(JSON.parse(JSON.stringify(event.target.value)), 10);
        const anomalyObj = this.anomalyOptions.find((anomaly) => { return anomaly.id === eventValue; });
        this.form.fingerSelections[this.form.selectedFinger].anomalyId = (anomalyObj && anomalyObj.id) || undefined;
        this.form.fingerSelections[this.form.selectedFinger].anomalyName = (anomalyObj && anomalyObj.name) || undefined;
        if (!this.form.fingerSelections[this.form.selectedFinger].collected) {
            this.form.fingerSelections[this.form.selectedFinger].collected = true;
        }
        if (eventValue) {
            event.target.value = -1;
        }
        this.redraw();
        this.screenUpdate();
    }
    setPalmAnomaly(event) {
        const eventValue = JSON.parse(JSON.stringify(event.target.value));
        if (this.palmFormType === PALM_FORM_TYPE.FULL_PALM) {
            this.form.palmSelections[this.form.selectedPalm].anomalyName = eventValue;
        }
        else {
            this.form.palmSelection.anomalyName = eventValue;
        }
        event.target.value = -1;
        this.redraw();
        this.screenUpdate();
    }
    setQueryParams() {
        let location = undefined;
        let queryObj = undefined;
        window.global = window;
        const _global = window || global;
        if (_global) {
            location = _global.location;
        }
        if (location) {
            const { search } = location;
            if (search !== "") {
                queryObj = JSON.parse('{"' + decodeURI(search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                this.disableFormSelection = true;
            }
        }
        this.formType = queryObj ? parseInt(queryObj.formType, 10) : FORM_TYPE.UNDEFINED;
        this.screenUpdate();
    }
    componentDidLoad() {
        this.showLoader = true;
        setTimeout(async () => {
            try {
                this.setQueryParams();
                this.serviceConfigs = await getAppConfig();
                this.anomalyOptions = await getAnomalies(constants.anomalyTypes.MODAL_ANOMALY, !!this.detached);
                if (this.serviceConfigs) {
                    this.form.configs = this.serviceConfigs.form;
                }
                if (this.detached && this.isTagComponent) {
                    window["getBiometryData"] = () => {
                        return;
                    };
                }
                else if (this.detached) {
                    // this.emitLoadInformation();
                    // const checkSessionInterval = setInterval(() => {
                    //   if (this.backendSession) {
                    //     clearInterval(checkSessionInterval);
                    //   }
                    // }, 200);
                }
                else {
                    if (this.tempPerson) {
                        this.person = JSON.parse(this.tempPerson);
                    }
                }
                this.wsStatusInterval = setInterval(() => {
                    if (this.ws.status() === 1) {
                        clearInterval(this.wsStatusInterval);
                        if (this.deviceReady) {
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
                this.ws.deviceSocket.addEventListener("message", (event) => {
                    const data = JSON.parse(event.data);
                    if (data.status === "initialized") {
                        this.deviceReady = true;
                    }
                    if (data.status === "scanner-get-device-list") {
                        this.deviceList = data.deviceList;
                    }
                    const deviceStatuses = data.deviceStatuses;
                    if (deviceStatuses) {
                        const previousStatus = JSON.parse(JSON.stringify(this.deviceStatus));
                        this.deviceStatus = deviceStatuses.signature && deviceStatuses.signature.initialized;
                        if (!this.deviceStatus) {
                            return;
                        }
                        else if (!previousStatus && this.deviceStatus) {
                            if (!this.deviceOpened) {
                                this.open();
                            }
                            return;
                        }
                    }
                    if (data.status === "scan-error") {
                        notify(this.componentContainer, "warning", TranslationUtils.concatTranslate('AN_ERROR_OCCURRED', [data.code]));
                        return;
                    }
                    if (data.status === "scan-complete") {
                        const buffer = this.base64ToArrayBuffer(data.scan);
                        const tempFile = new File([buffer], "temp_scan.bmp", {
                            type: "image/bmp",
                        });
                        this.loadRoiImage(tempFile);
                        this.showLoader = false;
                    }
                });
                this.start();
                // this.startService();
                // this.getDeviceList();
                this.showLoader = false;
                this.captureInput.onchange = () => {
                    if (this.captureInput.files.length > 0) {
                        this.loadRoiImage(this.captureInput.files[0]);
                    }
                };
            }
            catch (e) {
                this.showLoader = false;
                console.error(e);
            }
        }, 1000);
    }
    base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
    componentDidUnload() {
        this.payload.action = "scanner-kill-service";
        this.ws.respondToDeviceWS(this.payload);
    }
    toggleFormModal() {
        this.form.isActive = !this.form.isActive;
        if (!this.form.isActive) {
            this.resetForm();
        }
        this.screenUpdate();
    }
    clearRects() {
        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.form.canvas.width, this.form.canvas.height);
        ctx.drawImage(this.form.fileData.image, 0, 0, this.form.fileData.image.width, this.form.fileData.image.height, 0, 0, this.form.canvas.width, this.form.canvas.height);
    }
    loadRoiImage(file) {
        if (file && file.size === 0) {
            notify(this.componentContainer, "error", 'Imagem vazia - verifique o arquivo/scan de entrada');
            return;
        }
        if (file.type.toUpperCase() !== `image/${this.form.configs.imageType}`.toUpperCase()) {
            notify(this.componentContainer, "warning", TranslationUtils.concatTranslate('IMAGE_TYPE_NOT_ACCPTABLE', [this.form.configs.imageType]));
            return;
        }
        if (this.form.configs.ROICrop && this.formType === FORM_TYPE.DECADACTILAR) {
            const roiImage = new Image();
            roiImage.src = window.URL.createObjectURL(file);
            roiImage.onload = async () => {
                const fileData = {
                    image: roiImage,
                    width: roiImage.width,
                    height: roiImage.height,
                    type: roiImage.type,
                    size: file.size,
                };
                const formData = new FormData();
                formData.append("form_file", file);
                formData.set("dataOptions", JSON.stringify(fileData));
                const cropedForm = await loadRoiCroppedForm(formData);
                function _base64ToArrayBuffer(base64) {
                    var binary_string = window.atob(base64);
                    var len = binary_string.length;
                    var bytes = new Uint8Array(len);
                    for (var i = 0; i < len; i++) {
                        bytes[i] = binary_string.charCodeAt(i);
                    }
                    return bytes.buffer;
                }
                const buffer = _base64ToArrayBuffer(cropedForm.file);
                const tempFile = new File([buffer], "temp_form_roi.bmp", {
                    type: "image/bmp",
                });
                this.loadForm(tempFile);
            };
        }
        else {
            this.loadForm(file);
        }
    }
    getFingerName(index) {
        return this.serviceConfigs.form.configShortFingernames ? `${constants.fingerNames[index].split(' ')[0].substring(0, 3)}.${constants.fingerNames[index].split(' ')[1][0].toUpperCase()}.` : constants.fingerNames[index];
    }
    getPalmName(index) {
        return this.serviceConfigs.form.configShortFingernames ? `${constants.palmNames[index].split(' ')[0].substring(0, 3)}.${constants.palmNames[index].split(' ')[1][0].toUpperCase()}.` : constants.palmNames[index];
    }
    drawBoxOn(box, context) {
        const boxX1 = box.topLeft.x;
        const boxY1 = box.topLeft.y;
        const boxX2 = box.bottomRight.x;
        const boxY2 = box.bottomRight.y;
        this.form.xCenter = boxX1 + (boxX2 - boxX1) / 2;
        this.form.yCenter = boxY1 + (boxY2 - boxY1) / 2;
        if (box.anomalyName) {
            context.fillStyle = 'rgba(180, 0, 45, 0.75)';
            context.fillRect(boxX1, boxY1 - 20, (boxX2 - boxX1), 20);
            context.font = "12px monospace";
            context.fillStyle = '#FF0';
            context.fillText(box.anomalyName, boxX1, boxY1 - 7, (boxX2 - boxX1));
            if (box.anomalyName === 'Amputado') {
                context.strokeStyle = 'rgba(180, 0, 45)';
                context.beginPath();
                context.moveTo(boxX1, boxY1);
                context.lineTo(boxX2, boxY2);
                context.stroke();
                context.beginPath();
                context.moveTo(boxX2, boxY1);
                context.lineTo(boxX1, boxY2);
                context.stroke();
            }
        }
        context.beginPath();
        context.strokeStyle = box.anomalyName && !box.selected ? 'rgba(180, 0, 45)' : box.selected ? THEMES[this.theme].primary : box.color || THEMES[this.theme].secondary;
        context.fillStyle = box.anomalyName && !box.selected ? 'rgba(180, 0, 45)' : box.selected ? THEMES[this.theme].primary : box.color || THEMES[this.theme].secondary;
        context.lineWidth = 3;
        context.rect(boxX1, boxY1, (boxX2 - boxX1), (boxY2 - boxY1));
        context.stroke();
        context.fillRect(boxX1 - this.form.anchrSize, boxY1 - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
        context.fillRect(boxX1 - this.form.anchrSize, this.form.yCenter - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
        context.fillRect(boxX1 - this.form.anchrSize, boxY2 - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
        if (box.selected) {
            context.fillRect(this.form.xCenter - this.form.anchrSize, boxY1 - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
            context.fillRect(this.form.xCenter - (this.form.anchrSize / 2), this.form.yCenter - (this.form.anchrSize / 2), 2 * (this.form.anchrSize / 2), 2 * (this.form.anchrSize / 2));
            context.fillRect(this.form.xCenter - this.form.anchrSize, boxY2 - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
        }
        context.fillRect(boxX2 - this.form.anchrSize, boxY1 - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
        context.fillRect(boxX2 - this.form.anchrSize, this.form.yCenter - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
        context.fillRect(boxX2 - this.form.anchrSize, boxY2 - this.form.anchrSize, 2 * this.form.anchrSize, 2 * this.form.anchrSize);
        context.font = "bold 12px monospace";
        context.fillStyle = 'rgb(0, 0, 0)';
        if (this.formType === FORM_TYPE.DECADACTILAR) {
            context.fillText(this.getFingerName(box.index), boxX1 + 2, boxY1 + 12, (boxX2 - boxX1));
        }
        else if (this.palmFormType == PALM_FORM_TYPE.FULL_PALM) {
            context.fillText(this.getPalmName(box.index), boxX1 + 2, boxY1 + 12, (boxX2 - boxX1));
        }
    }
    newBox(x1, y1, x2, y2) {
        const boxX1 = x1 < x2 ? x1 : x2;
        const boxY1 = y1 < y2 ? y1 : y2;
        const boxX2 = x1 > x2 ? x1 : x2;
        const boxY2 = y1 > y2 ? y1 : y2;
        if (boxX2 - boxX1 > this.form.lineOffset * 2 && boxY2 - boxY1 > this.form.lineOffset * 2) {
            return {
                topLeft: { x: boxX1, y: boxY1 },
                bottomRight: { x: boxX2, y: boxY2 },
                lineWidth: 2,
                color: THEMES[this.theme].secondary
            };
        }
        else {
            return null;
        }
    }
    redraw() {
        const ctx = this.canvas.getContext('2d');
        let boxes = [];
        if (this.formType === FORM_TYPE.DECADACTILAR) {
            boxes = this.form.fingerSelections;
        }
        else {
            if (this.palmFormType == PALM_FORM_TYPE.FULL_PALM) {
                boxes = this.form.palmSelections;
            }
            else {
                boxes = [this.form.palmSelection];
            }
        }
        ctx.clearRect(0, 0, 800, 600);
        ctx.drawImage(this.form.fileData.image, 0, 0, this.form.fileData.width, this.form.fileData.height, 0, 0, this.form.canvas.width, this.form.canvas.height);
        for (let i = 0; i < boxes.length; i++) {
            this.drawBoxOn(boxes[i], ctx);
        }
        this.screenUpdate();
    }
    ;
    async loadForm(file) {
        const image = new Image();
        const url = window.URL.createObjectURL(file);
        image.onerror = () => {
            notify(this.componentContainer, "error", `${this.translations.IMAGE_OUT_OF_STANDART}\n
      ${this.translations.TYPE}: ${this.form.configs.imageType.toUpperCase()} /
      ${this.translations.GRAY_SCALE}: ${this.form.configs.bitDepth} /
      ${this.translations.VERTICAL_DPI}: ${this.form.configs.dpiVertical} /
      ${this.translations.HORIZONTAL_DPI}: ${this.form.configs.dpiHorizontal}
      `);
            return;
        };
        image.onload = () => {
            this.toggleFormModal();
            this.form.canvas.width = this.formType === FORM_TYPE.PALMAR && this.palmFormType === PALM_FORM_TYPE.SINGLE_PALM ? 420 : 700;
            this.form.canvas.height = (image.height * this.form.canvas.width) / image.width; /* this.formType === FORM_TYPE.DECADACTILAR ? 327 :  243; */
            this.screenUpdate();
            setTimeout(() => {
                this.form.file = file;
                this.form.fileData = {
                    image: image,
                    width: image.width,
                    height: image.height,
                    type: image.type,
                    size: file.size,
                    resizeParameters: {
                        width: this.form.canvas.width,
                        height: this.form.canvas.height,
                    }
                };
                const formData = new FormData();
                formData.append("form_file", this.form.file);
                formData.set("dataOptions", JSON.stringify(this.form.fileData));
                if (this.person.id) {
                    formData.set("personId", JSON.stringify(this.person.id));
                }
                this.showLoader = true;
                if (this.formType === FORM_TYPE.DECADACTILAR) {
                    loadFingerForm(formData).then(async (result) => {
                        if (result.message) {
                            notify(this.componentContainer, "warning", result.message);
                            this.showLoader = false;
                            this.toggleFormModal();
                            return;
                        }
                        this.form.success = result && result.length > 0;
                        this.form.requiresManualSelection = !this.form.success;
                        if (this.form.success) {
                            this.form.croppedFingers = result;
                            if (this.detached) {
                                this.saveFingersToSession();
                            }
                            else {
                                const data = {
                                    personId: this.person.id,
                                    fingers: JSON.stringify(this.form.croppedFingers.map((f) => {
                                        return {
                                            data: f.data,
                                            fingerIndex: f.index,
                                            nfiq: f.nfiq,
                                            nfiqScore: f.nfiqScore,
                                            wsq: f.wsq,
                                            captureType: constants.captureTypes.ROLLED_FINGER,
                                            wsqData: f.wsqBase64
                                        };
                                    }))
                                };
                                await saveFingers(data);
                                this.showSucessSaveMessage();
                            }
                            setTimeout(() => {
                                this.modalContentScrollToBottom();
                            }, 200);
                        }
                        else {
                            notify(this.componentContainer, "warning", this.translations.AUTOMATICALLY_CROP_NOT_POSSIBLE);
                            this.redraw();
                        }
                        this.showLoader = false;
                    });
                }
                else if (this.palmFormType === PALM_FORM_TYPE.SINGLE_PALM) {
                    formData.set("palmType", JSON.stringify(this.palmType));
                    loadPalmForm(formData).then(async (result) => {
                        if (result.message) {
                            notify(this.componentContainer, "warning", result.message);
                            this.showLoader = false;
                            this.toggleFormModal();
                            return;
                        }
                        this.form.success = result.hasOwnProperty("palm");
                        this.form.requiresManualSelection = !this.form.success;
                        if (this.form.success) {
                            this.form.croppedPalm = result.palm;
                            this.form.palmNfiqScore = result.nfiqScore || '0';
                            const palm = { type_id: this.palmType, palm: this.form.croppedPalm, wsqData: result.wsqBase64, nfiqScore: result.nfiqScore || '0' };
                            if (this.detached) {
                                this.savePalmToSession(palm);
                            }
                            else {
                                const data = {
                                    data: this.form.croppedPalm,
                                    typeId: this.palmType,
                                    personId: this.person.id
                                };
                                await savePalm(data);
                                this.showSucessSaveMessage();
                            }
                            this.insertPalm(palm);
                            setTimeout(() => {
                                this.modalContentScrollToBottom();
                            }, 200);
                        }
                        else {
                            notify(this.componentContainer, "warning", this.translations.AUTOMATICALLY_CROP_NOT_POSSIBLE);
                            this.redraw();
                        }
                        this.showLoader = false;
                    });
                }
                else {
                    setTimeout(() => {
                        this.retryManualCrop();
                        this.showLoader = false;
                    }, 500);
                }
            }, 1000);
            setTimeout(() => {
                if (this.canvas.getContext) {
                    const ctx = this.canvas.getContext('2d');
                    let isDown = false;
                    const findCurrentArea = (x, y) => {
                        let boxes = [];
                        if (this.formType === FORM_TYPE.DECADACTILAR) {
                            boxes = this.form.fingerSelections;
                        }
                        else {
                            if (this.palmFormType == PALM_FORM_TYPE.FULL_PALM) {
                                boxes = this.form.palmSelections;
                            }
                            else {
                                boxes = [this.form.palmSelection];
                            }
                        }
                        for (var i = 0; i < boxes.length; i++) {
                            const box = boxes[i];
                            const boxX1 = box.topLeft.x;
                            const boxY1 = box.topLeft.y;
                            const boxX2 = box.bottomRight.x;
                            const boxY2 = box.bottomRight.y;
                            this.form.xCenter = boxX1 + (boxX2 - boxX1) / 2;
                            this.form.yCenter = boxY1 + (boxY2 - boxY1) / 2;
                            if (boxX1 - this.form.lineOffset < x && x < boxX1 + this.form.lineOffset) {
                                if (boxY1 - this.form.lineOffset < y && y < boxY1 + this.form.lineOffset) {
                                    return { box: i, pos: 'tl' };
                                }
                                else if (boxY2 - this.form.lineOffset < y && y < boxY2 + this.form.lineOffset) {
                                    return { box: i, pos: 'bl' };
                                }
                                else if (this.form.yCenter - this.form.lineOffset < y && y < this.form.yCenter + this.form.lineOffset) {
                                    return { box: i, pos: 'l' };
                                }
                            }
                            else if (boxX2 - this.form.lineOffset < x && x < boxX2 + this.form.lineOffset) {
                                if (boxY1 - this.form.lineOffset < y && y < boxY1 + this.form.lineOffset) {
                                    return { box: i, pos: 'tr' };
                                }
                                else if (boxY2 - this.form.lineOffset < y && y < boxY2 + this.form.lineOffset) {
                                    return { box: i, pos: 'br' };
                                }
                                else if (this.form.yCenter - this.form.lineOffset < y && y < this.form.yCenter + this.form.lineOffset) {
                                    return { box: i, pos: 'r' };
                                }
                            }
                            else if (this.form.xCenter - this.form.lineOffset < x && x < this.form.xCenter + this.form.lineOffset) {
                                if (boxY1 - this.form.lineOffset < y && y < boxY1 + this.form.lineOffset) {
                                    return { box: i, pos: 't' };
                                }
                                else if (boxY2 - this.form.lineOffset < y && y < boxY2 + this.form.lineOffset) {
                                    return { box: i, pos: 'b' };
                                }
                                else if (boxY1 - this.form.lineOffset < y && y < boxY2 + this.form.lineOffset) {
                                    return { box: i, pos: 'i' };
                                }
                            }
                            else if (boxX1 - this.form.lineOffset < x && x < boxX2 + this.form.lineOffset) {
                                if (boxY1 - this.form.lineOffset < y && y < boxY2 + this.form.lineOffset) {
                                    return { box: i, pos: 'i' };
                                }
                            }
                        }
                        return { box: -1, pos: 'o' };
                    };
                    const handleMouseDown = (e) => {
                        const bounds = this.canvas.getBoundingClientRect();
                        let boxes = [];
                        if (this.formType === FORM_TYPE.DECADACTILAR) {
                            boxes = this.form.fingerSelections;
                        }
                        else {
                            if (this.palmFormType == PALM_FORM_TYPE.FULL_PALM) {
                                boxes = this.form.palmSelections;
                            }
                            else {
                                boxes = [this.form.palmSelection];
                            }
                        }
                        isDown = true;
                        this.form.clickedArea = findCurrentArea(e.pageX - bounds.left - scrollX, e.pageY - bounds.top - scrollY);
                        boxes.forEach((box, i) => {
                            box.selected = i === this.form.clickedArea.box;
                            if (box.selected) {
                                const selectedAttr = this.formType === FORM_TYPE.DECADACTILAR ? 'selectedFinger' : 'selectedPalm';
                                this.form[selectedAttr] = box.index;
                            }
                        });
                        this.redraw();
                        this.form.x1 = e.offsetX;
                        this.form.y1 = e.offsetY;
                        this.form.x2 = e.offsetX;
                        this.form.y2 = e.offsetY;
                    };
                    const handleMouseUp = () => {
                        let boxes = [];
                        if (this.formType === FORM_TYPE.DECADACTILAR) {
                            boxes = this.form.fingerSelections;
                        }
                        else {
                            if (this.palmFormType == PALM_FORM_TYPE.FULL_PALM) {
                                boxes = this.form.palmSelections;
                            }
                            else {
                                boxes = [this.form.palmSelection];
                            }
                        }
                        if (this.form.clickedArea && this.form.clickedArea.box !== -1) {
                            const selectedBox = boxes[this.form.clickedArea.box];
                            if (selectedBox.topLeft.x > selectedBox.bottomRight.x) {
                                const previousX1 = selectedBox.topLeft.x;
                                selectedBox.topLeft.x = selectedBox.bottomRight.x;
                                selectedBox.bottomRight.x = previousX1;
                            }
                            if (selectedBox.topLeft.y > selectedBox.bottomRight.y) {
                                const previousY1 = selectedBox.topLeft.y;
                                selectedBox.topLeft.y = selectedBox.bottomRight.y;
                                selectedBox.bottomRight.y = previousY1;
                            }
                            this.form.clickedArea = { box: -1, pos: 'o' };
                            this.form.tmpBox = null;
                            isDown = false;
                            this.screenUpdate();
                        }
                    };
                    const handleMouseOut = () => {
                        let boxes = [];
                        if (this.formType === FORM_TYPE.DECADACTILAR) {
                            boxes = this.form.fingerSelections;
                        }
                        else {
                            if (this.palmFormType == PALM_FORM_TYPE.FULL_PALM) {
                                boxes = this.form.palmSelections;
                            }
                            else {
                                boxes = [this.form.palmSelection];
                            }
                        }
                        if (this.form.clickedArea.box !== -1) {
                            const selectedBox = boxes[this.form.clickedArea.box];
                            if (selectedBox.x1 > selectedBox.x2) {
                                const previousX1 = selectedBox.x1;
                                selectedBox.x1 = selectedBox.x2;
                            }
                            if (selectedBox.y1 > selectedBox.y2) {
                                const previousY1 = selectedBox.y1;
                                selectedBox.y1 = selectedBox.y2;
                            }
                        }
                        isDown = false;
                        this.form.clickedArea = { box: -1, pos: 'o' };
                        this.form.tmpBox = null;
                    };
                    const handleMouseMove = (e) => {
                        let boxes = [];
                        if (this.formType === FORM_TYPE.DECADACTILAR) {
                            boxes = this.form.fingerSelections;
                        }
                        else {
                            if (this.palmFormType == PALM_FORM_TYPE.FULL_PALM) {
                                boxes = this.form.palmSelections;
                            }
                            else {
                                boxes = [this.form.palmSelection];
                            }
                        }
                        if (isDown && this.form.clickedArea.box !== -1) {
                            this.form.x2 = e.offsetX;
                            this.form.y2 = e.offsetY;
                            const xOffset = this.form.x2 - this.form.x1;
                            const yOffset = this.form.y2 - this.form.y1;
                            this.form.x1 = this.form.x2;
                            this.form.y1 = this.form.y2;
                            if (this.form.clickedArea.pos == 'i' ||
                                this.form.clickedArea.pos == 'tl' ||
                                this.form.clickedArea.pos == 'l' ||
                                this.form.clickedArea.pos == 'bl') {
                                boxes[this.form.clickedArea.box].topLeft.x += xOffset;
                            }
                            if (this.form.clickedArea.pos == 'i' ||
                                this.form.clickedArea.pos == 'tl' ||
                                this.form.clickedArea.pos == 't' ||
                                this.form.clickedArea.pos == 'tr') {
                                boxes[this.form.clickedArea.box].topLeft.y += yOffset;
                            }
                            if (this.form.clickedArea.pos == 'i' ||
                                this.form.clickedArea.pos == 'tr' ||
                                this.form.clickedArea.pos == 'r' ||
                                this.form.clickedArea.pos == 'br') {
                                boxes[this.form.clickedArea.box].bottomRight.x += xOffset;
                            }
                            if (this.form.clickedArea.pos == 'i' ||
                                this.form.clickedArea.pos == 'bl' ||
                                this.form.clickedArea.pos == 'b' ||
                                this.form.clickedArea.pos == 'br') {
                                boxes[this.form.clickedArea.box].bottomRight.y += yOffset;
                            }
                            this.redraw();
                        }
                    };
                    this.canvas.addEventListener('mousedown', (e) => {
                        handleMouseDown(e);
                    });
                    this.canvas.addEventListener('mousemove', (e) => {
                        handleMouseMove(e);
                    });
                    this.canvas.addEventListener('mouseup', () => {
                        handleMouseUp();
                    });
                    this.canvas.addEventListener('mouseout', () => {
                        handleMouseOut();
                    });
                    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, this.form.canvas.width, this.form.canvas.height);
                    this.screenUpdate();
                }
            }, 1000);
        };
        image.src = url;
    }
    acceptData() {
        this.payload.action = "close-component";
        this.payload.data = {
            type: "scanner",
            owner: "default-user" // #TODO replace this with a authenticated user
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    emitLoadInformation() {
        this.payload.action = "component-opened";
        this.payload.data = {
            type: "scanner"
        };
        const checkStatusInterval = setInterval(() => {
            if (this.ws.componentSocket.readyState === 1) {
                clearInterval(checkStatusInterval);
                this.ws.respondToComponentWS(this.payload);
            }
        }, 200);
    }
    sendFingersInformation(finger) {
        this.payload.action = "store-session";
        this.payload.data = {
            type: "modal",
            owner: "default-user",
            biometry: finger
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    saveFingersToSession() {
        return new Promise((resolve, _) => {
            for (let i = 0; i < this.form.croppedFingers.length; i++) {
                const finger = this.form.croppedFingers[i];
                finger.captureType = constants.captureTypes.ROLLED_FINGER;
                finger.wsqData = finger.wsq.data || finger.wsqBase64;
                finger.nfiqScore = finger.wsq.nfiqScore || finger.nfiqScore;
                finger.fingerIndex = finger.index;
                finger.anomalyName = finger.anomalyName;
                finger.anomalyId = finger.anomalyId;
                finger.exceptionIndex = finger.exceptionIndex;
                this.sendFingersInformation(finger);
            }
            resolve(true);
        });
    }
    savePalmToSession(palm) {
        return new Promise((resolve, _) => {
            this.payload.action = "store-session";
            this.payload.data = {
                type: "palm",
                owner: "default-user",
                biometry: palm
            };
            this.ws.respondToDeviceWS(this.payload);
            resolve(true);
        });
    }
    insertPalm(palm) {
        const index = this.form.palms.findIndex((p) => {
            return p.type_id === palm.type_id;
        });
        if (index >= 0) {
            this.form.palms[index] = palm;
        }
        else {
            this.form.palms.push(palm);
        }
    }
    setDeviceSelection(event) {
        this.selectedDevice = event.target.value;
    }
    setFormTypeSelection(event) {
        this.formType = parseInt(event.target.value, 10);
        this.palmType = PALM_TYPES.UNDEFINED;
    }
    setPalmFormTypeSelection(event) {
        this.palmFormType = parseInt(event.target.value, 10);
    }
    setPalmarTypeSelection(event) {
        this.palmType = parseInt(event.target.value, 10);
    }
    setAutoNextSelection(event) {
        this.form.autoNext = event.target.checked;
    }
    resetForm() {
        this.form = {
            configs: this.form.configs,
            canvas: {
                width: undefined,
                height: undefined,
            },
            isActive: false,
            file: undefined,
            fileData: {},
            src: undefined,
            autoNext: true,
            fingerSelections: [
                { topLeft: { x: 79, y: 32 }, bottomRight: { x: 208, y: 245 }, index: 0, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 210, y: 32 }, bottomRight: { x: 325, y: 245 }, index: 1, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 326, y: 32 }, bottomRight: { x: 444, y: 245 }, index: 2, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 445, y: 32 }, bottomRight: { x: 563, y: 245 }, index: 3, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 564, y: 32 }, bottomRight: { x: 681, y: 245 }, index: 4, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 79, y: 275 }, bottomRight: { x: 208, y: 493 }, index: 5, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 210, y: 275 }, bottomRight: { x: 325, y: 493 }, index: 6, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 326, y: 275 }, bottomRight: { x: 444, y: 493 }, index: 7, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 445, y: 275 }, bottomRight: { x: 563, y: 493 }, index: 8, collected: true, anomalyId: undefined, anomalyName: undefined },
                { topLeft: { x: 564, y: 275 }, bottomRight: { x: 681, y: 493 }, index: 9, collected: true, anomalyId: undefined, anomalyName: undefined },
            ],
            palmSelection: {
                collected: false,
                topLeft: { x: 36, y: 82 },
                bottomRight: { x: 391, y: 412 },
                anomalyName: undefined,
            },
            palmSelections: [
                { topLeft: { x: 5, y: 172 }, bottomRight: { x: 102, y: 418 }, index: 0, type_id: 4, collected: false, anomalyName: undefined },
                { topLeft: { x: 115, y: 172 }, bottomRight: { x: 347, y: 418 }, index: 1, type_id: 3, collected: false, anomalyName: undefined },
                { topLeft: { x: 360, y: 172 }, bottomRight: { x: 589, y: 418 }, index: 2, type_id: 1, collected: false, anomalyName: undefined },
                { topLeft: { x: 603, y: 172 }, bottomRight: { x: 696, y: 418 }, index: 3, type_id: 2, collected: false, anomalyName: undefined },
            ],
            requiresManualSelection: true,
            selectedFinger: undefined,
            selectedPalm: undefined,
            success: undefined,
            croppedFingers: [],
            croppedPalm: {},
            croppedPalms: [],
            palms: this.form.palms,
            // Canvas box control vars
            lineOffset: 8,
            anchrSize: 7,
            clickedArea: { box: -1, pos: 'o' },
            tmpBox: undefined,
            x1: undefined,
            x2: undefined,
            y1: undefined,
            y2: undefined,
        };
    }
    closeFingerModal() {
        this.form.isActive = false;
        this.screenUpdate();
        this.captureInput.files = undefined;
        this.captureInput.value = '';
        this.resetForm();
    }
    modalContentScrollToBottom() {
        this.modalCard.scrollTop = this.modalCard.scrollHeight;
    }
    manualCrop() {
        return Swal.fire({
            title: 'Confirmação',
            text: 'Todas as marcações foram finalizadas?',
            type: "warning",
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: this.translations.CONFIRM,
            confirmButtonColor: THEMES[this.theme].secondary,
            cancelButtonText: this.translations.BACK,
        }).then((result) => {
            if (result.value) {
                this.clearRects();
                this.showLoader = true;
                const formData = new FormData();
                formData.append("form_file", this.form.file);
                formData.set("dataOptions", JSON.stringify(this.form.fileData));
                if (this.person.id) {
                    formData.set("personId", JSON.stringify(this.person.id));
                }
                if (this.formType === FORM_TYPE.DECADACTILAR) {
                    formData.set("fingerSelections", JSON.stringify(this.form.fingerSelections));
                    loadFingerForm(formData).then(async (result) => {
                        this.form.success = result && result.length > 0;
                        if (this.form.success) {
                            this.modalCard.scrollTop = this.modalCard.scrollHeight;
                            this.form.croppedFingers = result;
                            if (this.detached) {
                                await this.saveFingersToSession();
                            }
                            else {
                                const data = {
                                    personId: this.person.id,
                                    fingers: JSON.stringify(this.form.croppedFingers.map((f) => {
                                        return {
                                            data: f.data,
                                            fingerIndex: f.index,
                                            nfiq: f.nfiq,
                                            nfiqScore: f.nfiqScore,
                                            wsq: f.wsq,
                                            captureType: constants.captureTypes.ROLLED_FINGER,
                                            wsqData: f.wsqBase64
                                        };
                                    }))
                                };
                                await saveFingers(data);
                                this.showSucessSaveMessage();
                            }
                            this.showLoader = false;
                            setTimeout(() => {
                                this.modalContentScrollToBottom();
                            }, 200);
                            this.screenUpdate();
                        }
                        else {
                            notify(this.componentContainer, "warning", this.translations.CROP_FINGERS_NOT_POSSIBLE);
                            this.redraw();
                            this.showLoader = false;
                        }
                    });
                }
                else {
                    if (this.palmFormType === PALM_FORM_TYPE.FULL_PALM) {
                        formData.set("palmSelection", JSON.stringify(this.form.palmSelections));
                    }
                    else {
                        formData.set("palmSelection", JSON.stringify(this.form.palmSelection));
                    }
                    formData.set("palmType", JSON.stringify(this.palmType));
                    loadPalmForm(formData).then(async (result) => {
                        this.form.success = result.length || result.hasOwnProperty("palm");
                        if (this.form.success) {
                            if (result.length) {
                                this.form.croppedPalms = result;
                                if (this.detached) {
                                    await this.savePalmToSession(result);
                                }
                                else {
                                    for (let i = 0; i < this.form.croppedPalms.length; i++) {
                                        const data = {
                                            data: this.form.croppedPalms[i].palm,
                                            typeId: this.form.croppedPalms[i].type_id,
                                            personId: this.person.id
                                        };
                                        await savePalm(data);
                                    }
                                    this.showSucessSaveMessage();
                                }
                                this.form.palms = result;
                                setTimeout(() => {
                                    this.modalContentScrollToBottom();
                                }, 200);
                            }
                            else {
                                this.form.croppedPalm = result.palm;
                                this.form.palmAnomaly = result.anomalyName;
                                this.form.palmNfiqScore = result.nfiqScore || '0';
                                const palm = { type_id: this.palmType, palm: this.form.croppedPalm, wsqData: result.wsqBase64, nfiqScore: result.nfiqScore || '0' };
                                this.insertPalm(palm);
                                if (this.detached) {
                                    await this.savePalmToSession(this.form.palms);
                                }
                                else {
                                    const data = {
                                        data: this.form.palms[0].palm,
                                        typeId: this.form.palms[0].type_id,
                                        personId: this.person.id
                                    };
                                    await savePalm(data);
                                    this.showSucessSaveMessage();
                                }
                                setTimeout(() => {
                                    this.modalContentScrollToBottom();
                                }, 200);
                            }
                            this.showLoader = false;
                            this.screenUpdate();
                        }
                        else {
                            this.redraw();
                            notify(this.componentContainer, "warning", this.translations.CROP_PALM_NOT_POSSIBLE);
                            this.showLoader = false;
                        }
                    });
                }
            }
        });
    }
    screenUpdate() {
        this.componentContainer.forceUpdate();
    }
    canCapture() {
        return this.formType === FORM_TYPE.DECADACTILAR || (this.formType === FORM_TYPE.PALMAR && this.palmFormType == PALM_FORM_TYPE.FULL_PALM) || (this.palmFormType === PALM_FORM_TYPE.SINGLE_PALM && this.palmType !== PALM_TYPES.UNDEFINED);
    }
    canUpload() {
        return this.formType === FORM_TYPE.DECADACTILAR || (this.formType === FORM_TYPE.PALMAR && this.palmFormType == PALM_FORM_TYPE.FULL_PALM) || (this.palmFormType === PALM_FORM_TYPE.SINGLE_PALM && this.palmType !== PALM_TYPES.UNDEFINED);
    }
    showFingerSelectionRect(finger) {
        this.form.selectedFinger = finger.index;
        this.form.fingerSelections.forEach((_finger) => {
            _finger.selected = _finger.index === finger.index;
        });
        this.redraw();
    }
    showPalmSelectionRect(palm) {
        this.form.selectedPalm = palm.index;
        if (this.canvas && this.canvas.getContext) {
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.form.canvas.width, this.form.canvas.height);
            ctx.drawImage(this.form.fileData.image, 0, 0, this.form.fileData.width, this.form.fileData.height, 0, 0, this.form.canvas.width, this.form.canvas.height);
            const topLeftX = this.form.palmSelections[palm.index].topLeft.x;
            const topLeftY = this.form.palmSelections[palm.index].topLeft.y;
            const width = this.form.palmSelections[palm.index].bottomRight.x - this.form.palmSelections[palm.index].topLeft.x;
            const height = this.form.palmSelections[palm.index].bottomRight.y - this.form.palmSelections[palm.index].topLeft.y;
            ctx.strokeRect(topLeftX, topLeftY, width, height);
            this.screenUpdate();
        }
    }
    palmSelection() {
        return this.form.palmSelections.map((palm) => {
            return (h("div", { class: "control" },
                h("label", { class: "radio", style: { marginTop: "2px" } },
                    h("input", { type: "radio", name: "selectedPalm", value: this.form.selectedPalm, onChange: () => this.showPalmSelectionRect(palm), checked: this.form.selectedPalm === palm.index }),
                    constants.palmNames[palm.index]),
                h("span", { style: { fontSize: "12px", color: `${palm.collected ? "rgb(0, 183, 39)" : "rgba(255, 0, 0, 0.7)"}` } },
                    " (",
                    palm.collected ? this.translations.MARKED : this.translations.UNMARKED,
                    ") ")));
        });
    }
    fingerSelection(rightHand = false) {
        let handFingers = [];
        if (rightHand) {
            handFingers = this.form.fingerSelections.slice(0, 5);
        }
        else {
            handFingers = this.form.fingerSelections.slice(5, 10);
        }
        return handFingers.map((finger) => {
            return (h("div", { class: "control" },
                h("label", { class: "radio", style: { marginTop: "2px" } },
                    h("input", { type: "radio", name: "selectedFinger", value: this.form.selectedFinger, onChange: () => this.showFingerSelectionRect(finger), checked: this.form.selectedFinger === finger.index, style: { marginRight: "5px" } }),
                    constants.fingerNames[finger.index]),
                h("span", { style: { fontSize: "12px", color: `${finger.collected ? "rgb(0, 183, 39)" : "rgba(255, 0, 0, 0.7)"}` } },
                    " (",
                    finger.collected ? this.translations.MARKED : this.translations.UNMARKED,
                    ") ")));
        });
    }
    fingerResult(rightHand = false) {
        let handFingers = [];
        if (rightHand) {
            handFingers = this.form.croppedFingers.slice(0, 5);
        }
        else {
            handFingers = this.form.croppedFingers.slice(5, 10);
        }
        return handFingers.map((finger) => {
            return (h("div", { class: "column has-text-centered" },
                h("p", null,
                    " ",
                    constants.fingerNames[finger.index],
                    " "),
                h("div", { style: { minWidth: "150px", minHeight: "170px", maxHeight: "170px", alignItems: "center", display: "flex", justifyContent: "center" } }, finger.data ?
                    h("img", { src: `data:image/charset=UTF-8;png;base64,${finger.data}`, style: { border: "1px solid #0000003d", maxHeight: "170px", maxWidth: "170px" }, onClick: () => this.showModal(finger.data) })
                    : h("div", { style: { minWidth: "170px", minHeight: "170px" } })),
                h("p", null,
                    " NFiq: ",
                    finger.nfiq || finger.nfiqScore,
                    " "),
                finger.anomalyId ?
                    h("p", null,
                        " Anomalia: ",
                        finger.anomalyName,
                        " ")
                    : null));
        });
    }
    palmsResult() {
        return this.form.palms.map((palm) => {
            return (h("div", { class: "column has-text-centered" },
                h("p", null,
                    " ",
                    constants.palmNames[palm.index],
                    " "),
                h("div", { style: { minWidth: "150px", minHeight: "170px", maxHeight: "170px", alignItems: "center", display: "flex", justifyContent: "center" } }, palm.palm ?
                    h("img", { src: `data:image/charset=UTF-8;png;base64,${palm.palm}`, style: { border: "1px solid #0000003d", maxHeight: "170px", maxWidth: "170px" }, onClick: () => this.showModal(palm.palm) })
                    : h("div", { style: { minWidth: "170px", minHeight: "170px" } })),
                h("p", null,
                    " NFiq: ",
                    palm.nfiq || palm.nfiqScore,
                    " "),
                palm.anomalyName ?
                    h("p", null,
                        " Anomalia: ",
                        palm.anomalyName,
                        " ")
                    : null));
        });
    }
    retryManualCrop() {
        this.form.requiresManualSelection = true;
        this.form.success = false;
        this.redraw();
        this.screenUpdate();
    }
    getResult() {
        if (this.formType === FORM_TYPE.DECADACTILAR) {
            return (h("div", null,
                h("h6", null, " M\u00E3o direita "),
                h("div", { style: { display: "flex", justifyContent: "space-around" } }, this.fingerResult(true)),
                h("h6", null, " M\u00E3o esquerda "),
                h("div", { style: { display: "flex", justifyContent: "space-around" } }, this.fingerResult())));
        }
        else if (this.palmFormType === PALM_FORM_TYPE.FULL_PALM) {
            return (h("div", null,
                h("div", { style: { display: "flex", justifyContent: "space-around" } }, this.palmsResult())));
        }
        else {
            return (h("div", null,
                h("div", { class: "flex-center" },
                    h("p", null,
                        " ",
                        PALM_NAMES[this.palmType],
                        " ")),
                h("div", { class: "flex-center" }, this.form.croppedPalm ?
                    h("img", { src: `data:image/charset=UTF-8;png;base64,${this.form.croppedPalm}`, style: { border: "1px solid #0000003d", maxHeight: "170px", maxWidth: "170px" }, onClick: () => this.showModal(this.form.croppedPalm) })
                    : h("div", { class: "flex-center", style: { minWidth: "170px", minHeight: "170px" } })),
                h("div", { class: "flex-center" },
                    h("p", null,
                        " NFiq: ",
                        this.form.palmNfiq || this.form.palmNfiqScore,
                        " ")),
                this.form.palmAnomaly &&
                    h("div", { class: "flex-center" },
                        h("br", null),
                        h("p", null,
                            " Anomalia: ",
                            this.form.palmAnomaly,
                            " "))));
        }
    }
    isPalmCaptured(type) {
        return this.form.palms.findIndex((palm) => palm.type_id === type) >= 0;
    }
    showModal(base64String) {
        this.modal.src = `data:image/charset=UTF-8;png;base64,${base64String}`;
        this.modal.active = true;
        this.componentContainer.forceUpdate();
    }
    hideModal() {
        this.modal.src = "";
        this.modal.active = false;
        this.componentContainer.forceUpdate();
    }
    palmCaptures() {
        return (h("div", { class: "columns is-mobile", style: { justifyContent: "space-evenly", marginTop: "10px", marginBottom: "20px" } },
            h("div", { class: "is-narrow" },
                h("div", null,
                    h("img", { src: "./assets/general/left_hand_writer.png", title: this.translations.LEFT_HYPOTHENAR, class: `fab-icon is-pulled-left ${this.isPalmCaptured(PALM_TYPES.LEFT_HYPOTHENAR) ? "" : "not-captured"}`, onClick: () => this.showModal(this.form.palms.find((palm) => palm.type_id === PALM_TYPES.LEFT_HYPOTHENAR).palm) }))),
            h("div", { class: "is-narrow" },
                h("div", null,
                    h("img", { src: "./assets/general/left_hand_palm.png", title: this.translations.LEFT_PALM, class: `fab-icon is-pulled-left ${this.isPalmCaptured(PALM_TYPES.LEFT_PALM) ? "" : "not-captured"}`, onClick: () => this.showModal(this.form.palms.find((palm) => palm.type_id === PALM_TYPES.LEFT_PALM).palm) }))),
            h("div", { class: "is-narrow" },
                h("div", null,
                    h("img", { src: "./assets/general/right_hand_palm.png", title: this.translations.RIGHT_PALM, class: `fab-icon is-pulled-left ${this.isPalmCaptured(PALM_TYPES.RIGHT_PALM) ? "" : "not-captured"}`, onClick: () => this.showModal(this.form.palms.find((palm) => palm.type_id === PALM_TYPES.RIGHT_PALM).palm) }))),
            h("div", { class: "is-narrow" },
                h("div", null,
                    h("img", { src: "./assets/general/right_hand_writer.png", title: this.translations.RIGHT_HYPOTHENAR, class: `fab-icon is-pulled-left ${this.isPalmCaptured(PALM_TYPES.RIGHT_HYPOTHENAR) ? "" : "not-captured"}`, onClick: () => this.showModal(this.form.palms.find((palm) => palm.type_id === PALM_TYPES.RIGHT_HYPOTHENAR).palm) })))));
    }
    getSelectedAnomaly(option) {
        return this.form.selectedFinger >= 0 && this.form.fingerSelections[this.form.selectedFinger].anomalyId === parseInt(option.id, 10);
    }
    getSelectedPalmAnomaly(option) {
        if (this.palmFormType === PALM_FORM_TYPE.FULL_PALM) {
            return this.form.selectedPalm >= 0 && this.form.palmSelections[this.form.selectedPalm].anomalyName === option;
        }
        else {
            return this.form.palmSelection.anomalyName === option;
        }
    }
    showSucessSaveMessage() {
        Swal.fire({
            type: "success",
            text: this.translations.CAPTURE_SUCCESS,
            allowOutsideClick: false,
            allowEscapeKey: true,
            allowEnterKey: false,
            confirmButtonColor: THEMES[this.theme].secondary,
        });
    }
    render() {
        // const deviceList = (this.deviceList || []).map((device) => {
        //   return (
        //     <option value={ device.id } selected={ this.selectedDevice === device.id }>{ device.name }</option>
        //   );
        // });
        const anomalyOptions = (this.anomalyOptions || []).map((option) => {
            const translatedOption = this.translations[option.i18n_code] || option.name;
            return (h("option", { value: option.id, selected: this.getSelectedAnomaly(option) }, translatedOption));
        });
        const palmAnomalyOptions = (this.palmAnomalyOptions || []).map((option) => {
            return (h("option", { value: option, selected: this.getSelectedPalmAnomaly(option) }, option));
        });
        return (h("div", { class: "window-size" },
            h("loader-component", { enabled: this.showLoader }),
            h("div", { id: "notification-container" }),
            h("div", { class: "columns is-mobile" },
                h("div", { class: "column is-half" },
                    h("h6", { class: "mb-10 is-6 has-text-info has-text-weight-semibold" }, this.translations.TOKEN_TYPE),
                    h("div", { class: "mb-10" },
                        h("div", { class: "select is-small inline" },
                            h("select", { onChange: this.setFormTypeSelection.bind(this), disabled: this.disableFormSelection },
                                h("option", { value: FORM_TYPE.UNDEFINED, selected: this.formType === FORM_TYPE.UNDEFINED },
                                    " ",
                                    this.translations.SELECT_TOKEN_TYPE,
                                    " "),
                                h("option", { value: FORM_TYPE.DECADACTILAR, selected: this.formType === FORM_TYPE.DECADACTILAR },
                                    " ",
                                    this.translations.DECADACTILAR_INN,
                                    " "),
                                h("option", { value: FORM_TYPE.PALMAR, selected: this.formType === FORM_TYPE.PALMAR },
                                    " ",
                                    this.translations.PALMAR,
                                    " ")))),
                    this.formType === FORM_TYPE.PALMAR ?
                        h("div", { class: "mb-10" },
                            h("div", { class: "select is-small inline" },
                                h("select", { onChange: this.setPalmFormTypeSelection.bind(this) },
                                    h("option", { value: PALM_FORM_TYPE.UNDEFINED },
                                        " ",
                                        this.translations.TOKEN_TYPE,
                                        " "),
                                    h("option", { value: PALM_FORM_TYPE.SINGLE_PALM },
                                        " ",
                                        this.translations.INDIVIDUAL_RECORD,
                                        " "),
                                    h("option", { value: PALM_FORM_TYPE.FULL_PALM },
                                        " ",
                                        this.translations.FULL_RECORD,
                                        " ")))) : null,
                    this.formType === FORM_TYPE.PALMAR && this.palmFormType === PALM_FORM_TYPE.SINGLE_PALM ?
                        h("div", { class: "mb-10" },
                            h("div", { class: "select is-small inline" },
                                h("select", { onChange: this.setPalmarTypeSelection.bind(this) },
                                    h("option", { value: PALM_TYPES.UNDEFINED },
                                        " ",
                                        this.translations.SELECT_CATEGORY,
                                        " "),
                                    h("option", { value: PALM_TYPES.RIGHT_PALM },
                                        " ",
                                        this.translations.RIGHT_PALM,
                                        " "),
                                    h("option", { value: PALM_TYPES.RIGHT_HYPOTHENAR },
                                        " ",
                                        this.translations.RIGHT_HYPOTHENAR,
                                        " "),
                                    h("option", { value: PALM_TYPES.LEFT_PALM },
                                        " ",
                                        this.translations.LEFT_PALM,
                                        " "),
                                    h("option", { value: PALM_TYPES.LEFT_HYPOTHENAR },
                                        " ",
                                        this.translations.LEFT_HYPOTHENAR,
                                        " ")))) : null,
                    this.formType === FORM_TYPE.PALMAR ?
                        h("div", null,
                            h("h6", { class: "mb-10 is-6 has-text-info has-text-weight-semibold" }, this.translations.CAPTURES_STATE),
                            this.palmCaptures()) : null,
                    h("div", { class: "mb-10" },
                        h("h6", { class: "mb-10 is-6 has-text-info has-text-weight-semibold" }, this.translations.SCANNER)),
                    h("div", { class: "mb-10" },
                        h("button", { class: `button is-small is-info ${this.canCapture() ? "" : "disabled"}`, title: `${this.deviceReady ? this.translations.CLICK_TO_CAPTURE : this.translations.INITIALIZE_DEVICE_TO_CAPTURE}`, onClick: () => this.capture() }, this.translations.MAKE_CAPTURE)),
                    h("h6", { class: "mb-10 is-6 has-text-info has-text-weight-semibold" }, this.translations.FILE),
                    h("div", { class: "mb-10" },
                        h("div", { id: "capture-file", class: `file is-small is-info ${this.canUpload() ? "" : "disabled"}` },
                            h("label", { class: "file-label" },
                                h("input", { ref: (el) => this.captureInput = el, class: "file-input", type: "file", name: "resume", accept: `image/${(this.form.configs && this.form.configs.imageType) || 'bmp'}`, disabled: !this.canUpload() }),
                                h("span", { class: "button is-small is-info" },
                                    h("span", { class: "file-label" }, this.translations.LOAD_FILE))))))),
            h("div", { class: `modal ${this.modal.active ? "show-modal" : ""}` },
                h("span", { class: "close", onClick: () => this.hideModal() }, "\u00D7"),
                h("img", { class: "modal-content-view mt-20", src: this.modal.src })),
            h("div", { class: `${this.form.isActive ? 'is-active' : ''} modal modal-full-screen modal-fx-fadeInScale` }, this.form.isActive ?
                h("div", { class: "modal-content modal-card model-content-margin-fix w-100 h-100" },
                    h("header", { class: "header modal-card-head no-border-radius", style: { paddingTop: this.detached ? "20px" : "30px" } },
                        h("p", { class: "modal-card-title" }, `${this.formType === FORM_TYPE.DECADACTILAR ? "Ficha Decadactilar Pousada" : "Ficha Palmar"}`),
                        h("button", { class: "modal-button-close delete", onClick: () => this.closeFingerModal() })),
                    h("section", { class: "modal-card-body section-body", ref: (el) => this.modalCard = el },
                        h("div", null,
                            h("div", { class: "canvas-container", style: { display: "flex", flex: "1" } },
                                h("canvas", { ref: (el) => this.canvas = el, width: this.form.canvas.width, height: this.form.canvas.height, id: "formCanvas", class: "canvas" })),
                            this.form.requiresManualSelection && this.form.success === false &&
                                h("div", { class: "mt-15" },
                                    h("div", { class: "flex-center" },
                                        h("p", null, this.formType === FORM_TYPE.DECADACTILAR ?
                                            h("div", { class: "flex-center" },
                                                h("p", { class: "anomaly-label" },
                                                    " ",
                                                    this.translations.ANOMALY,
                                                    ": "),
                                                h("div", { class: "select is-small inline" },
                                                    h("select", { onChange: this.setAnomaly.bind(this), name: "anomaly" },
                                                        h("option", { value: -1 }, this.translations.CHOOSE_IN_ANOMALY_CASE),
                                                        anomalyOptions)))
                                            :
                                                h("div", { class: "flex-center" },
                                                    h("p", { class: "anomaly-label" },
                                                        " ",
                                                        this.translations.ANOMALY,
                                                        ": "),
                                                    h("div", { class: "select is-small inline" },
                                                        h("select", { onChange: this.setPalmAnomaly.bind(this), name: "anomaly" },
                                                            h("option", { value: -1 }, this.translations.CHOOSE_IN_ANOMALY_CASE),
                                                            palmAnomalyOptions))))),
                                    h("div", { class: "flex-center" },
                                        h("button", { class: "button is-info mt-15", style: { color: 'white' }, onClick: () => { this.manualCrop(); } },
                                            h("span", { class: "icon is-small" },
                                                h("i", { class: "mdi mdi-check icon-24", style: { color: 'white' }, "aria-hidden": "true", title: this.translations.FINALIZE_AND_SAVE })),
                                            h("span", null, this.translations.FINISH))))),
                        this.form.success &&
                            h("div", null,
                                h("div", null,
                                    h("hr", { style: { margin: "15px !important" } }),
                                    h("div", { class: "has-text-info", style: { display: "flex", marginTop: "10px", position: "relative" } },
                                        h("h6", { class: "has-text-info", style: { fontWeight: '800' } }, this.translations.RESULT),
                                        h("div", { style: { marginTop: "-5px", display: "flex", alignContent: "center", justifyContent: "flex-end", alignItems: "flex-end", flex: "1" } },
                                            h("button", { class: "button is-info mt-15", style: { color: 'white' }, onClick: () => { this.retryManualCrop(); } },
                                                h("span", { class: "icon is-small" },
                                                    h("i", { class: "mdi mdi-reload icon-24", style: { color: 'white' }, "aria-hidden": "true" })),
                                                h("span", null, this.translations.REVIEW_TAGS))),
                                        this.detached && !this.isTagComponent &&
                                            h("div", { style: { marginTop: "-5px", display: "flex", alignContent: "center", justifyContent: "flex-end", alignItems: "flex-end", marginLeft: "15px" } },
                                                h("button", { class: "button is-info mt-15", onClick: () => { this.acceptData(); } },
                                                    h("span", { class: "icon is-small" },
                                                        h("i", { class: "mdi mdi-check icon-24", style: { color: 'white' }, "aria-hidden": "true" })),
                                                    h("span", null, this.translations.FINISH)))),
                                    this.getResult()))),
                    h("div", { class: `modal ${this.modal.active ? "show-modal" : ""}` },
                        h("span", { class: "close", onClick: () => this.hideModal() }, "\u00D7"),
                        h("img", { class: "modal-content-view mt-20", src: this.modal.src })))
                : null)));
    }
    static get is() { return "openbio-scanner-details"; }
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
        "captureInput": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "detached": {
            "type": Boolean,
            "attr": "detached",
            "mutable": true
        },
        "deviceList": {
            "state": true
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
        "disableFormSelection": {
            "state": true
        },
        "form": {
            "state": true
        },
        "formType": {
            "state": true
        },
        "imgTest": {
            "state": true
        },
        "isCapturing": {
            "state": true
        },
        "isTagComponent": {
            "type": Boolean,
            "attr": "is-tag-component"
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "modal": {
            "state": true
        },
        "model": {
            "state": true
        },
        "palmAnomalyOptions": {
            "state": true
        },
        "palmFormType": {
            "state": true
        },
        "palmType": {
            "state": true
        },
        "person": {
            "state": true
        },
        "selectedDevice": {
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
        "tempPerson": {
            "type": "Any",
            "attr": "temp-person"
        },
        "theme": {
            "type": String,
            "attr": "theme"
        },
        "translations": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:openbio-scanner-details:**/"; }
}
