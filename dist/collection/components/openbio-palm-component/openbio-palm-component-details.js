import { savePalm } from "./api";
import { showImage } from '../../utils/canvas';
import { getAppConfig, saveServiceTime } from '../../utils/api';
import constants from "../../utils/constants";
import WS from '../../utils/websocket';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { TranslationUtils } from '../../locales/translation';
import { getAnomalies } from '../openbio-finger-component/api';
import { THEMES } from '../../utils/utils';
var TABS;
(function (TABS) {
    TABS[TABS["CAPTURE"] = 0] = "CAPTURE";
    TABS[TABS["RESULT"] = 1] = "RESULT";
})(TABS || (TABS = {}));
var PALM_TYPES;
(function (PALM_TYPES) {
    PALM_TYPES[PALM_TYPES["UNDEFINED"] = -1] = "UNDEFINED";
    PALM_TYPES[PALM_TYPES["RIGHT_PALM0"] = 0] = "RIGHT_PALM0";
    PALM_TYPES[PALM_TYPES["RIGHT_PALM"] = 1] = "RIGHT_PALM";
    PALM_TYPES[PALM_TYPES["RIGHT_HYPOTHENAR"] = 2] = "RIGHT_HYPOTHENAR";
    PALM_TYPES[PALM_TYPES["LEFT_PALM"] = 3] = "LEFT_PALM";
    PALM_TYPES[PALM_TYPES["LEFT_HYPOTHENAR"] = 4] = "LEFT_HYPOTHENAR";
    PALM_TYPES[PALM_TYPES["RIGHT_PALM_FINGERS"] = 5] = "RIGHT_PALM_FINGERS";
    PALM_TYPES[PALM_TYPES["LEFT_PALM_FINGERS"] = 6] = "LEFT_PALM_FINGERS";
    PALM_TYPES[PALM_TYPES["THUMBS"] = 7] = "THUMBS";
    PALM_TYPES[PALM_TYPES["LEFT_HYPOTHENAR_PALM"] = 8] = "LEFT_HYPOTHENAR_PALM";
    PALM_TYPES[PALM_TYPES["RIGHT_HYPOTHENAR_PALM"] = 9] = "RIGHT_HYPOTHENAR_PALM";
    PALM_TYPES[PALM_TYPES["RIGHT_PINKY_RING_FINGERS"] = 10] = "RIGHT_PINKY_RING_FINGERS";
    PALM_TYPES[PALM_TYPES["RIGHT_MIDDLE_INDEX_FINGERS"] = 11] = "RIGHT_MIDDLE_INDEX_FINGERS";
    PALM_TYPES[PALM_TYPES["RIGHT_THUMB_FINGER"] = 12] = "RIGHT_THUMB_FINGER";
    PALM_TYPES[PALM_TYPES["LEFT_THUMB_FINGER"] = 13] = "LEFT_THUMB_FINGER";
    PALM_TYPES[PALM_TYPES["LEFT_MIDDLE_INDEX_FINGERS"] = 14] = "LEFT_MIDDLE_INDEX_FINGERS";
    PALM_TYPES[PALM_TYPES["LEFT_PINKY_RING_FINGERS"] = 15] = "LEFT_PINKY_RING_FINGERS";
})(PALM_TYPES || (PALM_TYPES = {}));
var CAPTURE_TYPES;
(function (CAPTURE_TYPES) {
    CAPTURE_TYPES[CAPTURE_TYPES["FLAT"] = 4] = "FLAT";
    CAPTURE_TYPES[CAPTURE_TYPES["SIDE"] = 5] = "SIDE";
    CAPTURE_TYPES[CAPTURE_TYPES["MANUAL"] = 6] = "MANUAL";
})(CAPTURE_TYPES || (CAPTURE_TYPES = {}));
export class OpenbioPalmComponent {
    constructor() {
        this.ws = new WS();
        this.palmNames = [
            '',
            "RIGHT_PALM",
            "RIGHT_HYPOTHENAR",
            "LEFT_PALM",
            "LEFT_HYPOTHENAR",
            "RIGHT_PALM_FINGERS",
            "LEFT_PALM_FINGERS",
            "THUMBS",
            "LEFT_HYPOTHENAR_PALM",
            "RIGHT_HYPOTHENAR_PALM",
            "RIGHT_PINKY_RING_FINGERS",
            "RIGHT_MIDDLE_INDEX_FINGERS",
            "RIGHT_THUMB_FINGER",
            "LEFT_THUMB_FINGER",
            "LEFT_MIDDLE_INDEX_FINGERS",
            "LEFT_PINKY_RING_FINGERS",
        ];
        this.person = {
            id: 0
        };
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
        this.theme = "default";
        this.capturedData = null;
        this.originalImage = "";
        this.deviceReady = false;
        this.nfiqScore = 0;
        this.captureType = CAPTURE_TYPES.FLAT;
        this.stepPhase = 0;
        this.flowType = 0;
        this.currentRollingStatus = 0;
        this.currentStatusLineX = 0;
        this.flowOptions = [];
        this.anomalyOptions = [];
        this.anomalies = [];
        this.currentFingerNames = [];
        this.currentFingerSequence = [];
        this.fingerSequence = [];
        this.fingers = [];
        this.tab = 0;
        this.backendSession = undefined;
        this.disabledControls = false;
        this.modalSettings = {};
        this.unmatchCount = 0;
        this.repeatedCount = 0;
        this.smearCount = 0;
        this.badNfiqQualityCount = 0;
        this.model = '';
        this.brand = '';
        this.serial = '';
        this.opened = false;
        this.fingerNamesList = constants.fingerNames;
        this.fingersToCapture = [];
        this.editingId = 0;
        this.isEditing = false;
        this.showLoader = false;
        this.loaderText = '';
        this.showControlDisable = false;
        this.serviceConfigs = undefined;
        this.singleCaptureLoading = false;
        this.captureDone = false;
        this.palms = [];
        this.currentPalm = 0;
        this.startPreviewTime = new Date().getTime();
    }
    async listenLocale(newValue) {
        this.setI18nParameters(newValue);
    }
    ;
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    async componentWillLoad() {
        this.setI18nParameters(this.locale);
    }
    clearImages() {
        showImage(this.canvas, "");
    }
    startPreview() {
        this.startPreviewTime = new Date().getTime();
        this.nfiqScore = 0;
        this.captureDone = false;
        this.showLoader = false;
        this.clearImages();
        this.payload.action = "start";
        this.payload.captureType = this.captureType;
        if (this.isEditing)
            this.payload.fingerIndex = this.currentFingerSequence[0];
        else
            this.payload.fingerIndex = undefined;
        this.ws.respondToDeviceWS(this.payload);
        this.componentContainer.forceUpdate();
    }
    stopPreview() {
        this.payload.action = "stop";
        this.ws.respondToDeviceWS(this.payload);
    }
    stopPreviewprocessor() {
        this.payload.action = "stop-processor";
        this.ws.respondToDeviceWS(this.payload);
    }
    open() {
        this.payload.action = "open";
        this.ws.respondToDeviceWS(this.payload);
        this.opened = true;
    }
    prepareToPreview() {
        this.wsStatusInterval = setInterval(() => {
            if (this.ws.status() === 1) {
                clearInterval(this.wsStatusInterval);
                this.open();
            }
        }, 2000);
    }
    setPalmsFromBackendSession() {
        const checkSessionInterval = setInterval(() => {
            if (this.backendSession) {
                clearInterval(checkSessionInterval);
                const captureData = this.backendSession.data.map((item) => {
                    return {
                        data: item.data,
                        nfiqScore: item.nfiqScore || item.nfiq_score,
                        captureType: item.captureType || item.capture_type,
                        type_id: item.typeId || item.type_id,
                        typeId: item.typeId || item.type_id,
                        anomaly_id: item.anomalyId || item.anomaly_id || item.exceptionIndex,
                        anomalyId: item.anomalyId || item.anomaly_id || item.exceptionIndex
                    };
                });
                this.palms = captureData;
                this.prepareToPreview();
            }
        }, 200);
    }
    async sendServiceTimeInformation(observations, details) {
        if (!this.detached) {
            await saveServiceTime({
                personId: this.person.id,
                type: "PALM",
                processingTime: new Date().getTime() - this.startPreviewTime,
                observations,
                details,
                brand: this.brand,
                model: this.model,
                serial: this.serial
            });
        }
    }
    setLoader(value, text) {
        this.showLoader = value;
        this.loaderText = text;
    }
    async componentDidLoad() {
        // this.detached = true;
        this.singleCaptureLoading = true;
        this.showLoader = true;
        this.useOpenbioMatcherSt = this.useOpenbioMatcher;
        this.cpfSt = this.cpf;
        this.singleCaptureSt = this.singleCapture;
        setTimeout(async () => {
            try {
                this.anomalyOptions = await getAnomalies(constants.anomalyTypes.MODAL_ANOMALY, !!this.detached);
                try {
                }
                catch (e) {
                    console.log('error on getFlowOptions');
                    console.log(e);
                }
                try {
                    this.storeOriginalImage = this.modalSettings.storeOriginalImage;
                    this.repetitionControl = this.modalSettings.repetitionControl;
                    this.generateBMP = this.modalSettings.generateBMP;
                    this.failControl = this.modalSettings.failControl;
                    this.match = this.modalSettings.match;
                    this.payload.deviceName = this.modalSettings.device ? constants.device[this.modalSettings.device] : constants.device.IB;
                    if (!this.singleCaptureSt) {
                        this.flowType = this.modalSettings.flowType;
                    }
                    if (this.detached && this.isTagComponent) {
                        const _this = this;
                        window["getBiometryData"] = function () {
                            return _this.palms;
                        };
                        if (this.palms) {
                            for (let i = 0; i < this.palms.length; i++) {
                                const anomaly = this.anomalyOptions.find((a) => a.id === this.palms[i].anomaly_id);
                                this.palms[i].anomaly = anomaly && anomaly.name;
                            }
                            if (this.palms.length === 4) {
                                this.currentPalm = -1;
                            }
                            this.forceUpdate();
                        }
                        this.prepareToPreview();
                    }
                    else if (this.detached) {
                        this.emitLoadInformation();
                        this.setPalmsFromBackendSession();
                    }
                    else {
                        this.singleCaptureLoading = false;
                        if (this.tempPerson) {
                            this.person = JSON.parse(this.tempPerson);
                        }
                        if (this.tempPalms) {
                            this.palms = JSON.parse(this.tempPalms);
                            if (this.palms) {
                                for (let i = 0; i < this.palms.length; i++) {
                                    const anomaly = this.anomalyOptions.find((a) => a.id === this.palms[i].anomaly_id);
                                    this.palms[i].anomaly = anomaly && anomaly.name;
                                }
                                if (this.palms.length === 4) {
                                    this.currentPalm = -1;
                                }
                                this.forceUpdate();
                            }
                        }
                        this.prepareToPreview();
                    }
                }
                catch (e) {
                    console.log('error on getModalSettings');
                    console.log(e);
                }
                this.ws.componentSocket.addEventListener("message", (event) => {
                    const data = JSON.parse(event.data);
                    if (data.action === "session-data") {
                        this.backendSession = data.session;
                        this.singleCaptureSt = this.backendSession.singleCapture;
                        this.cpfSt = this.backendSession.cpf;
                        this.useOpenbioMatcherSt = this.backendSession.useOpenbioMatcher;
                        this.flowType = this.backendSession.flowType || this.modalSettings.flowType;
                        this.singleCaptureLoading = false;
                    }
                });
                this.ws.deviceSocket.addEventListener("message", async (event) => {
                    const data = JSON.parse(event.data);
                    if (data.status === "initialized") {
                        this.stopPreview();
                        this.startPreview();
                        this.deviceReady = true;
                    }
                    if (data.status === 'will-start-capture') {
                        this.setLoader(true, this.translations.INITIATING_CAPTURE);
                    }
                    if (data.status === "session-data-stored") {
                        this.backendSession = data.session;
                        if (this.backendSession.palm.captures.length === this.palms.length) {
                            this.showLoader = false;
                        }
                    }
                    if (data.rollingStatus) {
                        this.currentRollingStatus = data.rollingStatus;
                        this.currentStatusLineX = data.rollingLineX;
                    }
                    if (data.module === "finger") {
                        this.model = data.deviceInfo ? data.deviceInfo.modelName : "";
                        this.brand = data.deviceInfo ? data.deviceInfo.manufacturName : "";
                        this.serial = data.deviceInfo ? data.deviceInfo.serialNumber : "";
                        if (data.error) {
                            this.showLoader = false;
                            const error = `${TranslationUtils.concatTranslate('CODE_DESC', [data.code])}\n${this.translations.concatTranslate('DESCRIPTION_DESC', [data.error])}`;
                            await this.sendServiceTimeInformation(error, this.translations[CAPTURE_TYPES[this.captureType]]);
                            Swal.fire({
                                type: 'error',
                                title: this.translations.ERROR_WHILE_CAPTURING,
                                text: error,
                                confirmButtonColor: THEMES[this.theme].secondary,
                            });
                            return;
                        }
                        else if (data.previewImage) {
                            if (data.deviceInfo && data.deviceInfo.manufacturName !== "DigitalPersona" && data.deviceInfo.modelName !== "M421") {
                                showImage(this.canvas, data.previewImage, this.currentRollingStatus, this.currentStatusLineX);
                            }
                            this.nfiqScore = data.nfiqScore > 0 && data.nfiqScore <= 5 ? data.nfiqScore : 0;
                        }
                        else if (data.originalImage) {
                            this.showLoader = true;
                            this.nfiqScore = data.nfiqScore > 0 && data.nfiqScore <= 5 ? data.nfiqScore : 0;
                            this.stopPreview();
                            if (data.fingersData.fingerCount > 1) {
                                showImage(this.canvas, data.originalImage, 0);
                            }
                            else {
                                showImage(this.canvas, data.fingersData.images[0].image, 0);
                            }
                            this.originalImage = data.originalImage;
                            this.currentRollingStatus = 0;
                            this.currentStatusLineX = data.rollingLineX;
                            this.insertIntoPalms({ typeId: this.sequence[this.currentPalm], data: data.originalImage, wsq_data: data.wsqImage, nfiqScore: this.nfiqScore });
                            this.nextCapture();
                        }
                    }
                });
                this.serviceConfigs = await getAppConfig();
                if (this.serviceConfigs) {
                    this.showControlDisable = this.serviceConfigs.finger.showControlDisable;
                    this.sequence = this.getCaptureSequence();
                    this.componentContainer.forceUpdate();
                }
                this.showLoader = false;
            }
            catch (e) {
                this.showLoader = false;
                console.error(e);
            }
        }, 1000);
    }
    getCaptureSequence() {
        if (this.serviceConfigs.palm.extraFingerCapture) {
            return [
                PALM_TYPES.RIGHT_PALM,
                PALM_TYPES.RIGHT_HYPOTHENAR,
                PALM_TYPES.RIGHT_HYPOTHENAR_PALM,
                PALM_TYPES.RIGHT_PINKY_RING_FINGERS,
                PALM_TYPES.RIGHT_MIDDLE_INDEX_FINGERS,
                PALM_TYPES.RIGHT_THUMB_FINGER,
                PALM_TYPES.RIGHT_PALM_FINGERS,
                PALM_TYPES.THUMBS,
                PALM_TYPES.LEFT_PALM_FINGERS,
                PALM_TYPES.LEFT_PALM,
                PALM_TYPES.LEFT_HYPOTHENAR,
                PALM_TYPES.LEFT_HYPOTHENAR_PALM,
                PALM_TYPES.LEFT_PINKY_RING_FINGERS,
                PALM_TYPES.LEFT_MIDDLE_INDEX_FINGERS,
                PALM_TYPES.LEFT_THUMB_FINGER
            ];
        }
        return [
            PALM_TYPES.RIGHT_PALM,
            PALM_TYPES.RIGHT_HYPOTHENAR,
            PALM_TYPES.LEFT_PALM,
            PALM_TYPES.LEFT_HYPOTHENAR,
        ];
    }
    componentDidUnload() {
        if (this.deviceReady) {
            this.stopPreview();
            this.stopPreviewprocessor();
        }
        this.clearImages();
    }
    setCurrentFingerImage() {
        let type = '';
        let joinedFingerStep = this.currentFingerSequence.join('');
        this.currentFingerImage = `./assets/fingers/${type}/d${joinedFingerStep}.gif`;
    }
    getCurrentCaptureType() {
        return CAPTURE_TYPES.MANUAL;
        // switch (this.sequence[this.currentPalm]) {
        //   case PALM_TYPES.LEFT_PALM:
        //   case PALM_TYPES.RIGHT_PALM:
        //   case PALM_TYPES.LEFT_PALM_FINGERS:
        //   case PALM_TYPES.RIGHT_PALM_FINGERS:
        //   case PALM_TYPES.RIGHT_PINKY_RING_FINGERS:
        //   case PALM_TYPES.RIGHT_MIDDLE_INDEX_FINGERS:
        //   case PALM_TYPES.LEFT_MIDDLE_INDEX_FINGERS:
        //   case PALM_TYPES.LEFT_PINKY_RING_FINGERS:
        //     return CAPTURE_TYPES.FLAT;
        //   case PALM_TYPES.RIGHT_THUMB_FINGER:
        //   case PALM_TYPES.LEFT_THUMB_FINGER:
        //   case PALM_TYPES.THUMBS:
        //   case PALM_TYPES.LEFT_HYPOTHENAR:
        //   case PALM_TYPES.RIGHT_HYPOTHENAR:
        //   case PALM_TYPES.LEFT_HYPOTHENAR_PALM:
        //   case PALM_TYPES.RIGHT_HYPOTHENAR_PALM:
        //     return CAPTURE_TYPES.MANUAL;
        // }
    }
    async nextCapture() {
        this.anomaly = undefined;
        this.clearImages();
        if ((!this.serviceConfigs.palm.extraFingerCapture && this.palms.length < 4)
            || (this.serviceConfigs.palm.extraFingerCapture && this.palms.length < 15)) {
            this.currentPalm++;
            this.captureType = this.getCurrentCaptureType();
            setTimeout(() => {
                this.startPreview();
            }, 700);
        }
        else {
            Swal.fire({
                type: "success",
                title: 'Coleta finalizada',
            }).then(() => {
                this.clearImages();
                this.nfiqScore = 0;
                this.currentPalm = -1;
            });
            this.stopPreview();
            this.showLoader = false;
        }
    }
    rearrange(palm) {
        const index = this.palms.findIndex(p => p.typeId === palm.typeId);
        if (index !== -1) {
            this.palms[index] = palm;
        }
        else if ((!this.serviceConfigs.palm.extraFingerCapture && this.palms.length < 4)
            || (this.serviceConfigs.palm.extraFingerCapture && this.palms.length < 15)) {
            this.palms.push(palm);
        }
    }
    async insertIntoPalms(palm) {
        if (this.detached) {
            this.rearrange(palm);
            this.showLoader = true;
            await this.savePalmToSession(palm);
        }
        else {
            savePalm(Object.assign({}, palm, { personId: this.person.id })).then((result) => {
                palm.id = result.id;
                this.rearrange(palm);
                this.forceUpdate();
            });
            const details = `${this.translations[PALM_TYPES[palm.typeId]]} (${this.translations[CAPTURE_TYPES[this.captureType]]})`;
            await this.sendServiceTimeInformation(this.translations.CAPTURE_SUCCESS, details);
        }
    }
    async saveAnomaly() {
        this.insertIntoPalms({ typeId: this.sequence[this.currentPalm], anomalyId: this.anomaly.id, anomaly: this.anomaly.name });
        this.nextCapture();
    }
    clearSession() {
        this.payload.action = "session-clear-data";
        this.payload.data = {
            type: "modal",
            owner: "default-user",
            data: [],
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    clearCapture() {
        this.originalImage = undefined;
        this.fingers = [];
        this.clearSession();
        this.startPreview();
    }
    isPalmCaptured(type) {
        return this.palms.findIndex((palm) => palm.typeId === type) >= 0;
    }
    isCurrentPalm(index) {
        return this.currentPalm === this.sequence.indexOf(index);
    }
    collectPalm(type) {
        this.currentPalm = this.sequence.indexOf(type);
        this.captureType = this.getCurrentCaptureType();
        this.stopPreview();
        this.startPreview();
        this.forceUpdate();
    }
    acceptData() {
        this.stopPreview();
        this.payload.action = "close-component";
        this.payload.data = {
            type: "palm",
            owner: "default-user" // #TODO replace this with a authenticated user
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    emitLoadInformation() {
        this.payload.action = "component-opened";
        this.payload.data = {
            type: "palm"
        };
        const checkStatusInterval = setInterval(() => {
            if (this.ws.componentSocket.readyState === 1) {
                clearInterval(checkStatusInterval);
                this.ws.respondToComponentWS(this.payload);
            }
        }, 200);
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
    activeTabClass(num) {
        return this.tab === num ? "is-active" : "";
    }
    setActiveTab(num) {
        this.tab = num;
    }
    setSelection(event) {
        const name = event.target.name;
        const value = event.target.value;
        this[name] = this.anomalyOptions.find((a) => a.id === parseInt(value));
    }
    updateDisabledControls() {
        this.disabledControls = !this.disabledControls;
    }
    editPalm(_this, palm) {
        _this.tab = 0;
        _this.isEditing = true;
        _this.editingId = palm.id;
        _this.stopPreview();
        _this.currentPalm = _this.sequence.indexOf(palm.typeId || palm.type_id);
        _this.captureType = _this.getCurrentCaptureType();
        _this.startPreview();
    }
    forceUpdate() {
        this.componentContainer.forceUpdate();
    }
    setAnomaly(fingerIndex, event) {
        const value = event.target.value;
        this.anomalies[fingerIndex] = this.anomalyOptions.find((a) => a.id === parseInt(value));
        this.forceUpdate();
    }
    getCollectText() {
        return (h("div", { class: "info" }, this.currentPalm !== -1 ?
            h("div", null,
                h("span", null,
                    this.translations.DO_COLLECT,
                    " "),
                h("strong", null, this.translations[this.palmNames[this.sequence[this.currentPalm]]])) : h("span", null,
            " ",
            this.translations.COLLECTION_COMPLETED,
            " ")));
    }
    palmCaptures() {
        const rows = [];
        const limit = this.serviceConfigs.palm.extraFingerCapture ? 3 : 4;
        for (let i = 0; i < this.sequence.length; i += limit) {
            rows.push(this.sequence.slice(i, i + limit));
        }
        return (h("div", null, rows.map((row, rowIndex) => (h("div", null,
            [0, 2, 3].includes(rowIndex) &&
                h("span", null,
                    " ",
                    rowIndex === 0 ? 'Mão direita' : rowIndex === 2 ? 'Transição' : 'Mão esquerda',
                    " "),
            h("div", { class: 'columns is-mobile', key: rowIndex, style: { justifyContent: 'space-evenly', marginTop: '10px', marginBottom: '20px' } }, row.map((index) => {
                return (h("div", { class: 'is-narrow', key: index },
                    h("div", null,
                        h("img", { src: `./assets/general/${PALM_TYPES[index].toLowerCase()}.png`, title: this.translations[this.palmNames[index]], class: `
                            status-icon
                            fab-icon
                            is-pulled-left
                            ${this.isPalmCaptured(index) ? 'captured' : 'not-captured'}
                            ${this.isCurrentPalm(index) ? 'pulse-highlight' : ''}
                          `, onClick: () => { this.collectPalm(index); } }))));
            })))))));
    }
    palmResults() {
        const rows = [];
        const limit = this.serviceConfigs.palm.extraFingerCapture ? 3 : 4;
        for (let i = 0; i < this.sequence.length; i += limit) {
            rows.push(this.sequence.slice(i, i + limit));
        }
        return (h("div", null, rows.map((row, rowIndex) => (h("div", null,
            [0, 2, 3].includes(rowIndex) &&
                h("span", null,
                    " ",
                    rowIndex === 0 ? 'Mão direita' : rowIndex === 2 ? 'Transição' : 'Mão esquerda',
                    " "),
            h("div", { class: 'columns is-mobile', key: rowIndex, style: { marginTop: '10px', marginBottom: '20px' } }, row.map((sequenceIndex) => {
                return (h("div", null,
                    h("openbio-finger-image-component", { finger: this.palms[this.sequence.indexOf(sequenceIndex)], fingerName: this.translations[this.palmNames[sequenceIndex]], fingerIndex: sequenceIndex, editFingerCallback: this.editPalm, parentComponentContext: this, allowUpload: false })));
            })))))));
    }
    render() {
        const anomalyOptions = (this.anomalyOptions || []).map((option) => {
            const translatedOption = this.translations[option.i18n_code] || option.name;
            return (h("option", { value: option.id, selected: this.anomaly && this.anomaly.id === option.id }, translatedOption));
        });
        const fingerCaptureGuide = (h("div", { class: "info" },
            this.currentFingerNames.length > 0 ?
                h("span", null,
                    " ",
                    this.captureTypeName,
                    " ",
                    this.translations.THE_FINGERS,
                    " ",
                    h("b", null,
                        this.currentFingerNames,
                        " "),
                    this.translations.ABOVE_READER) :
                h("span", null, this.translations.COLLECTION_COMPLETED),
            h("p", { class: "finger-image" },
                h("img", { alt: "", src: this.currentFingerImage }))));
        return (h("div", null, !this.singleCaptureLoading ?
            h("div", { class: "window-size" },
                h("loader-component", { enabled: this.showLoader, text: this.loaderText }),
                h("div", { id: "notification-container" }),
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
                            h("h6", { class: "title is-7 has-text-left" },
                                this.translations.DEVICE_STATUS,
                                ": ",
                                this.deviceReady ? this.translations.READY : this.translations.NOT_LOADED)),
                        h("div", null,
                            h("h6", { class: "mb-10 is-6 has-text-info has-text-weight-semibold" }, this.translations.CAPTURES_STATE),
                            this.palmCaptures()),
                        this.getCollectText()),
                    h("div", { class: "column text-align-left" },
                        h("span", { class: `status-item-line-in-canvas status-item status${this.nfiqScore}` }, this.nfiqScore),
                        h("canvas", { width: "460", height: "560", class: "canvas", ref: el => this.canvas = el }),
                        h("div", { class: "columns is-mobile action-buttons-container" },
                            this.detached && !this.isTagComponent && this.palms.length ? h("div", { class: "column has-text-centered" },
                                h("button", { class: "button is-small is-pulled-right is-info", onClick: () => this.acceptData() }, this.translations.FINISH)) : null,
                            this.singleCaptureSt && this.originalImage ?
                                h("div", { class: "column has-text-centered" },
                                    h("button", { class: "button is-small is-pulled-right is-info", onClick: () => this.clearCapture() }, this.translations.CLEAN_CAPTURE)) : null),
                        this.currentPalm >= 0 && h("div", { class: "columns is-mobile anomaly-buttons-container" },
                            h("div", { class: "column" },
                                h("div", { class: "select is-small inline is-pulled-left" },
                                    h("select", { onChange: this.setSelection.bind(this), name: "anomaly" },
                                        h("option", { value: undefined }, this.translations.CHOOSE_IN_ANOMALY_CASE.toUpperCase()),
                                        anomalyOptions))),
                            h("div", { class: "column" },
                                h("button", { class: "button is-small is-info is-pulled-right", onClick: () => this.saveAnomaly() }, this.translations.SAVE_ANOMALY.toUpperCase()))))) : null,
                this.tab === TABS.RESULT &&
                    h("div", { class: "tab-content" },
                        h("div", { class: "capture-result-container" }, this.palmResults()))) : h("loader-component", { enabled: this.showLoader })));
    }
    static get is() { return "openbio-palm-details"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "anomalies": {
            "state": true
        },
        "anomaly": {
            "state": true
        },
        "anomalyOptions": {
            "state": true
        },
        "authenticationSimilarity": {
            "state": true
        },
        "backendSession": {
            "state": true
        },
        "badNfiqQualityCount": {
            "state": true
        },
        "brand": {
            "state": true
        },
        "capturedData": {
            "state": true
        },
        "captureDone": {
            "state": true
        },
        "captureType": {
            "state": true
        },
        "captureTypeName": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "cpf": {
            "type": String,
            "attr": "cpf"
        },
        "cpfSt": {
            "state": true
        },
        "currentFingerImage": {
            "state": true
        },
        "currentFingerNames": {
            "state": true
        },
        "currentFingerSequence": {
            "state": true
        },
        "currentPalm": {
            "state": true
        },
        "currentRollingStatus": {
            "state": true
        },
        "currentStatusLineX": {
            "state": true
        },
        "detached": {
            "type": Boolean,
            "attr": "detached",
            "mutable": true
        },
        "deviceReady": {
            "state": true
        },
        "disabledControls": {
            "state": true
        },
        "editingId": {
            "state": true
        },
        "failControl": {
            "state": true
        },
        "fingerCaptureType": {
            "type": Number,
            "attr": "finger-capture-type"
        },
        "fingerNamesList": {
            "state": true
        },
        "fingers": {
            "state": true
        },
        "fingerSequence": {
            "state": true
        },
        "fingersToCapture": {
            "state": true
        },
        "flowOptions": {
            "state": true
        },
        "flowType": {
            "state": true
        },
        "generateBMP": {
            "state": true
        },
        "isEditing": {
            "state": true
        },
        "isTagComponent": {
            "type": Boolean,
            "attr": "is-tag-component"
        },
        "loaderText": {
            "state": true
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "match": {
            "state": true
        },
        "modalSettings": {
            "state": true
        },
        "model": {
            "state": true
        },
        "nfiqScore": {
            "state": true
        },
        "onCaptureFingerprint": {
            "type": "Any",
            "attr": "on-capture-fingerprint"
        },
        "onOpenbioMatcher": {
            "type": "Any",
            "attr": "on-openbio-matcher"
        },
        "opened": {
            "state": true
        },
        "originalImage": {
            "state": true
        },
        "palms": {
            "state": true
        },
        "personImage": {
            "type": String,
            "attr": "person-image"
        },
        "personInfo": {
            "state": true
        },
        "personName": {
            "type": String,
            "attr": "person-name"
        },
        "repeatedCount": {
            "state": true
        },
        "repetitionControl": {
            "state": true
        },
        "selectedFinger": {
            "state": true
        },
        "sequence": {
            "state": true
        },
        "serial": {
            "state": true
        },
        "serviceConfigs": {
            "state": true
        },
        "showControlDisable": {
            "state": true
        },
        "showLoader": {
            "state": true
        },
        "singleCapture": {
            "type": Boolean,
            "attr": "single-capture"
        },
        "singleCaptureLoading": {
            "state": true
        },
        "singleCaptureSt": {
            "state": true
        },
        "smearCount": {
            "state": true
        },
        "startPreviewTime": {
            "state": true
        },
        "stepPhase": {
            "state": true
        },
        "storeOriginalImage": {
            "state": true
        },
        "tab": {
            "state": true
        },
        "tempPalms": {
            "type": "Any",
            "attr": "temp-palms"
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
        },
        "unmatchCount": {
            "state": true
        },
        "useOpenbioMatcher": {
            "type": Boolean,
            "attr": "use-openbio-matcher"
        },
        "useOpenbioMatcherSt": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:openbio-palm-details:**/"; }
}
