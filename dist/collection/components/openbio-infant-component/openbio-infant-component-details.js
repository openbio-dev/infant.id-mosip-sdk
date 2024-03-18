import { getFlowOptions, getAnomalies, saveFingers, getModalSettings, getPeople, saveFingerFile, } from "./api";
import { setFingers } from "../../store/main.store";
import { showImage } from "../../utils/canvas";
import { getAppConfig, saveServiceTime } from "../../utils/api";
import constants from "../../utils/constants";
import WS from "../../utils/websocket";
import Swal from "sweetalert2/dist/sweetalert2.all.min.js";
import { THEMES, getLocalization } from "../../utils/utils";
import { TranslationUtils } from "../../locales/translation";
var flowTypes;
(function (flowTypes) {
    flowTypes[flowTypes["FLOW_TYPE_TEN_FLAT_CAPTURES"] = 0] = "FLOW_TYPE_TEN_FLAT_CAPTURES";
})(flowTypes || (flowTypes = {}));
var TABS;
(function (TABS) {
    TABS[TABS["CAPTURE"] = 0] = "CAPTURE";
    TABS[TABS["FLATS"] = 1] = "FLATS";
})(TABS || (TABS = {}));
var captureType;
(function (captureType) {
    captureType[captureType["ONE_FINGER_FLAT"] = 0] = "ONE_FINGER_FLAT";
})(captureType || (captureType = {}));
const EMPTY_IMAGE = "";
let NFIQ_QUALITY_MESSAGE = "Qualidade da captura inferior ao permitido. Por favor tente novamente";
let ERROR_MESSAGE = "Ocorreu um erro, por favor tente novamente";
export class OpenbioFingerComponent {
    constructor() {
        this.ws = new WS();
        this.fingerNames = [
            "Polegar direito",
            "Indicador direito",
            "Médio direito",
            "Anelar direito",
            "Mínimo direito",
            "Polegar esquerdo",
            "Indicador esquerdo",
            "Médio esquerdo",
            "Anelar esquerdo",
            "Mínimo esquerdo",
        ];
        this.person = {
            id: 0,
        };
        this.payload = {
            deviceName: constants.device.ETAN,
            deviceType: "infant",
            processorName: constants.processor.AK_MATCHER,
            devicePosition: 0,
            captureType: 0,
            fingerIndex: undefined,
            action: undefined,
            data: undefined,
            module: "infant",
        };
        this.theme = "default";
        this.capturedData = null;
        this.originalImage = EMPTY_IMAGE;
        this.deviceReady = false;
        this.nfiqScore = 0;
        this.captureType = 0;
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
        this.badNfiqQualityCount = 0;
        this.model = "";
        this.brand = "";
        this.serial = "";
        this.opened = false;
        this.fingersToCapture = [];
        this.editingId = 0;
        this.isEditing = false;
        this.showLoader = false;
        this.loaderText = '';
        this.showControlDisable = false;
        this.serviceConfigs = undefined;
        this.isUpload = false;
        this.isManualSave = false;
        this.singleCaptureLoading = false;
        this.captureDone = false;
        this.previewActive = false;
    }
    async listenLocale(newValue) {
        this.setI18nParameters(newValue);
    }
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        NFIQ_QUALITY_MESSAGE = this.translations.NFIQ_QUALITY_MESSAGE;
        ERROR_MESSAGE = this.translations.ERROR_MESSAGE;
        this.fingerNames = [
            this.translations.RIGHT_THUMB,
            this.translations.RIGHT_INDEX,
            this.translations.RIGHT_MIDDLE,
            this.translations.RIGHT_RING,
            this.translations.RIGHT_PINKY,
            this.translations.LEFT_THUMB,
            this.translations.LEFT_INDEX,
            this.translations.LEFT_MIDDLE,
            this.translations.LEFT_RING,
            this.translations.LEFT_PINKY,
        ];
        this.componentContainer.forceUpdate();
    }
    async componentWillLoad() {
        this.setI18nParameters(this.locale);
    }
    clearImages() {
        showImage(this.canvas, "");
    }
    setLoader(value, text) {
        this.showLoader = value;
        this.loaderText = text;
    }
    startPreview() {
        this.nfiqScore = 0;
        this.captureDone = false;
        this.clearImages();
        this.payload.action = "start";
        this.payload.captureType = this.captureType;
        if (this.isEditing) {
            this.payload.fingerIndex = this.currentFingerSequence[0];
        }
        else {
            this.payload.fingerIndex = undefined;
        }
        this.ws.respondToDeviceWS(this.payload);
        this.componentContainer.forceUpdate();
        this.previewActive = true;
    }
    stopPreview() {
        this.payload.action = "stop";
        this.ws.respondToDeviceWS(this.payload);
        this.previewActive = false;
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
    executeRepetitionControl() {
        this.setLoader(true, this.translations.EXECUTING_SEQUENCE_CONTROL);
        const fingers = [];
        for (const index in this.currentFingerSequence) {
            fingers.push({
                template: this.tempFingersData.templates[index],
                height: this.tempFingersData.heights[index],
                width: this.tempFingersData.widths[index],
                fingerIndex: this.currentFingerSequence[index],
            });
        }
        this.payload.action = "repetition-control";
        this.payload.data = {
            fingers: JSON.stringify(fingers),
            repetitionControl: this.repetitionControl,
            disabledControl: this.disabledControls || !!this.anomaly || this.singleCaptureSt,
        };
        if (this.isEditing)
            this.payload.fingerIndex = this.currentFingerSequence[0];
        this.ws.respondToDeviceWS(this.payload);
    }
    generateMinutiateData() {
        this.setLoader(true, this.translations.EXTRACTING_MINUTIAE);
        const fingers = [];
        for (const index in this.currentFingerSequence) {
            // If composed or segmented image exists, use then to generate minutiae data
            let data = this.tempFingersData.images[index].image;
            if (this.tempFingersData.images[index].composedImage) {
                data = this.tempFingersData.images[index].composedImage;
            }
            else if (this.tempFingersData.images[index].segmentedImage) {
                data = this.tempFingersData.images[index].segmentedImage;
            }
            fingers.push({
                data,
                fingerIndex: this.currentFingerSequence[index],
            });
        }
        this.payload.action = "generate-minutiate-data";
        this.payload.data = {
            fingers: JSON.stringify(fingers),
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    async sendServiceTimeInformation(observations, details) {
        if (!this.detached) {
            await saveServiceTime({
                personId: this.person.id,
                type: "INFANT",
                processingTime: new Date().getTime() - this.startPreviewTime,
                observations,
                details,
                brand: this.brand,
                model: this.model,
                serial: this.serial
            });
        }
    }
    async uploadFingerImage(_this, fingerIndex, image, fileOptions) {
        if (image.type !== "image/png") {
            Swal.fire({
                type: "error",
                title: this.translations.FILE_FORMAT_NOT_ACCEPTED,
                text: TranslationUtils.concatTranslate("FILE_FORMAT_NOT_ACCEPTED_DESC", ["png"]),
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                confirmButtonColor: THEMES[this.theme].secondary,
            });
            return;
        }
        _this.isEditing = true;
        _this.isUpload = true;
        const data = {
            fingerIndex: fingerIndex,
            fileOptions: fileOptions,
            currentCaptureType: 1,
        };
        try {
            _this.stopPreviewprocessor();
            _this.stopPreview();
            const result = await saveFingerFile(data, image);
            if (result.error) {
                Swal.fire({
                    type: "warning",
                    message: result.data.error,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    confirmButtonColor: THEMES[this.theme].secondary,
                });
                return;
            }
            _this.setLoader(true);
            const reader = new FileReader();
            let rawData = new ArrayBuffer(image.size);
            reader.onload = async () => {
                rawData = reader.result;
                if (!_this.detached) {
                    const saveFingersResult = await saveFingers({
                        personId: _this.person.id,
                        fingers: JSON.stringify([
                            {
                                id: _this.isEditing ? _this.editingId : null,
                                data: Buffer.from(rawData).toString("base64"),
                                segmentedData: "",
                                composedData: "",
                                template: result.template.data,
                                wsqData: result.wsq.data,
                                minutiateData: result.minutiate.data,
                                nfiqScore: result.wsq.nfiqScore,
                                captureType: 1,
                                fingerIndex: fingerIndex,
                                height: result.template.heights,
                                width: result.template.widths,
                            },
                        ]),
                    });
                    const parsedValue = await saveFingersResult.map((item) => {
                        return {
                            id: item.id,
                            data: item.data,
                            segmentedData: item.segmented_data,
                            composedData: item.composed_data,
                            template: item.template,
                            wsqData: item.wsq_data,
                            rawData: item.raw_data,
                            minutiateData: item.minutiate_data,
                            nfiqScore: item.nfiq_score,
                            captureType: item.capture_type,
                            fingerIndex: item.finger_index,
                            anomalyId: item.anomaly_id,
                            height: item.height,
                            width: item.width,
                            model: item.model,
                            brand: item.brand,
                            serial: item.serial,
                            localization: item.localization,
                        };
                    });
                    _this.storeCapturedFinger(parsedValue);
                }
                else {
                    const finger = [{
                            id: _this.editingId,
                            data: (Buffer.from(rawData)).toString("base64"),
                            template: "",
                            wsqData: "",
                            rawData: "",
                            minutiateDate: "",
                            nfiqScore: 1,
                            captureType: _this.tab === 1 ? 2 : 1,
                            fingerIndex,
                            anomalyId: "",
                            width: "",
                            height: "",
                            model: _this.model,
                            brand: _this.brand,
                            serial: _this.serial,
                            localization: "",
                        }];
                    _this.storeCapturedFinger(finger);
                }
            };
            reader.readAsArrayBuffer(image);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            _this.setLoader(false);
            _this.componentContainer.forceUpdate();
        }
    }
    setProcessorFingers() {
        const tempflatFingers = this.fingers;
        const flatFingers = tempflatFingers.map((finger) => {
            return {
                template: finger.template,
                height: finger.height,
                width: finger.width,
                fingerIndex: finger.fingerIndex,
            };
        });
        this.payload.action = "set-processor-fingers";
        this.payload.data = { fingers: JSON.stringify(flatFingers) };
        this.ws.respondToDeviceWS(this.payload);
    }
    foundFlowType(sequence) {
        let foundFlow = this.modalSettings
            ? this.modalSettings.flowType
            : undefined;
        if (foundFlow === undefined) {
            this.flowOptions.forEach((flow, index) => {
                const key = Object.keys(flow)[0];
                const option = flow[key];
                const sortedSequence = Array.from(sequence);
                if (sequence.length === option.length &&
                    sortedSequence.sort().every(function (value, index) {
                        const optionCopy = Array.from(option);
                        return value === optionCopy.sort()[index];
                    })) {
                    foundFlow = index;
                }
            });
        }
        return foundFlow;
    }
    prepareToPreview() {
        this.wsStatusInterval = setInterval(() => {
            if (this.ws.status() === 1) {
                clearInterval(this.wsStatusInterval);
                this.open();
            }
        }, 500);
    }
    async confirmSaveWithException() {
        let anomalySelect = `<p>${this.translations.DO_YOU_WANT_MANUALLY_CONFIRM_COLLECTION}</p>` +
            `<div class="select is-small inline">` +
            `<select id="swalAnomaly" name='anomaly'>` +
            `<option value="${undefined}">${this.translations.CHOOSE_IN_ANOMALY_CASE}</option>`;
        for (const anomaly of this.anomalyOptions) {
            anomalySelect += `<option value="${anomaly.id}">${anomaly.name}</option>`;
        }
        anomalySelect += `</select>` + `</div>`;
        return Swal.fire({
            type: "warning",
            html: anomalySelect,
            onOpen: () => {
                document
                    .querySelector("#swalAnomaly")
                    .addEventListener("change", this.setSelection.bind(this));
            },
            onClose: () => {
                document
                    .querySelector("#swalAnomaly")
                    .removeEventListener("change", this.setSelection.bind(this));
            },
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: this.translations.SAVE,
            confirmButtonColor: THEMES[this.theme].secondary,
            cancelButtonText: this.translations.CANCEL,
        });
    }
    async confirmSaveManually() {
        return Swal.fire({
            text: this.translations.IMPOSSIBLE_MATCH_SAVE_MANUALLY,
            type: "warning",
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: this.translations.SAVE,
            confirmButtonColor: THEMES[this.theme].secondary,
            cancelButtonText: this.translations.CANCEL,
        });
    }
    callProcessors(data) {
        this.tempFingersData = data.fingersData;
        if (this.payload.processorName) {
            this.executeRepetitionControl();
        }
        else {
            this.generateMinutiateData();
        }
    }
    async nfiqEvaluation(data) {
        if (!!this.anomaly)
            return this.callProcessors(data);
        const configType = "flat";
        const nfiqEvaluation = this.failControl.attemptLimit[this.currentFingerSequence[0]][configType]
            .nfiq;
        const nfiqEvaluationEnabled = nfiqEvaluation.enabled;
        const nfiqEvaluationThreshold = nfiqEvaluation.threshold;
        const attemptLimit = nfiqEvaluation.attemptLimit;
        if (data.fingersData && data.fingersData.fingerCount > 1) {
            for (const index in this.currentFingerSequence) {
                if (nfiqEvaluation &&
                    nfiqEvaluationEnabled &&
                    data.fingersData.images[index] &&
                    data.fingersData.images[index].nfiqScore > nfiqEvaluationThreshold) {
                    await this.insertPendingCapture({
                        fingerIndex: this.currentFingerSequence[index],
                        captureType: this.captureType,
                    });
                    const fingerName = this.translations[constants.fingerNamesMap.get(this.currentFingerSequence[index])];
                    const details = `${fingerName} (${this.translations[captureType[this.captureType]]})`;
                    await this.sendServiceTimeInformation(this.translations.COLLECTION_LOW_QUALITY, details);
                    Swal.fire({
                        type: "warning",
                        title: this.translations.RECOLLECT,
                        text: this.translations.COLLECTION_LOW_QUALITY,
                        confirmButtonColor: THEMES[this.theme].secondary,
                    });
                }
            }
            this.callProcessors(data);
        }
        else {
            if (nfiqEvaluation &&
                nfiqEvaluationEnabled &&
                data.nfiqScore > nfiqEvaluationThreshold) {
                this.setLoader(false);
                this.badNfiqQualityCount = this.badNfiqQualityCount + 1;
                const fingerName = this.translations[constants.fingerNamesMap.get(data.fingerIndex)];
                const details = `${fingerName} (${this.translations[captureType[this.captureType]]})`;
                if (this.badNfiqQualityCount === attemptLimit) {
                    this.confirmSaveWithException().then(async (result) => {
                        if (result.value) {
                            this.callProcessors(data);
                        }
                        else {
                            await this.sendServiceTimeInformation(NFIQ_QUALITY_MESSAGE, details);
                            Swal.fire({
                                type: "warning",
                                text: NFIQ_QUALITY_MESSAGE,
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                allowEnterKey: false,
                                confirmButtonColor: THEMES[this.theme].secondary,
                            });
                            this.startPreview();
                            this.badNfiqQualityCount = 0;
                        }
                    });
                }
                else if (this.badNfiqQualityCount > attemptLimit) {
                    this.callProcessors(data);
                }
                else {
                    await this.sendServiceTimeInformation(NFIQ_QUALITY_MESSAGE, details);
                    Swal.fire({
                        type: "warning",
                        text: NFIQ_QUALITY_MESSAGE,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                        confirmButtonColor: THEMES[this.theme].secondary,
                    });
                    this.startPreview();
                }
            }
            else {
                this.callProcessors(data);
            }
        }
    }
    async getPersonInfo() {
        this.personInfo = await getPeople(this.cpfSt, this.captureType === 0 ? 1 : this.captureType);
        try {
            const fingerprintBiometries = this.personInfo.Biometries.find((item) => item.biometry_type === 2)
                .FingerprintBiometries.map((item) => item.finger_index)
                .sort((a, b) => a - b);
            this.selectedFinger = {
                id: fingerprintBiometries[0],
                name: this.fingerNames[fingerprintBiometries[0]],
            };
            this.currentFingerSequence = [fingerprintBiometries[0]];
            this.stepPhase = fingerprintBiometries[0];
            this.currentFingerNames = this.currentFingerSequence.map((finger) => {
                return this.fingerNames[finger] + ", ";
            });
            this.setCurrentFingerImage();
        }
        catch (e) {
            console.log(e);
        }
    }
    async componentDidLoad() {
        Swal.fire({
            type: "info",
            text: this.translations.INFANT_WARNING,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            confirmButtonColor: THEMES[this.theme].secondary,
        });
        this.singleCaptureLoading = true;
        this.setLoader(!this.forceLoad, this.translations.LOADING_DEVICE);
        this.useOpenbioMatcherSt = this.useOpenbioMatcher;
        this.cpfSt = this.cpf;
        this.singleCaptureSt = this.singleCapture;
        setTimeout(async () => {
            try {
                if (this.useOpenbioMatcherSt && this.singleCaptureSt) {
                    this.getPersonInfo();
                }
                this.anomalyOptions = await getAnomalies(constants.anomalyTypes.MODAL_ANOMALY, !!this.detached);
                try {
                    this.flowOptions = await getFlowOptions();
                }
                catch (e) {
                    console.log("error on getFlowOptions");
                    console.log(e);
                }
                try {
                    this.modalSettings = await getModalSettings();
                    this.storeOriginalImage = this.modalSettings.storeOriginalImage;
                    this.repetitionControl = this.modalSettings.repetitionControl;
                    this.generateBMP = this.modalSettings.generateBMP;
                    this.failControl = this.modalSettings.failControl;
                    this.payload.deviceName = this.modalSettings.device
                        ? constants.device[this.modalSettings.device]
                        : constants.device.ETAN;
                    if (!this.singleCaptureSt) {
                        this.flowType = this.modalSettings.flowType;
                    }
                    if (this.detached && this.isTagComponent) {
                        const _this = this;
                        window["getBiometryData"] = function () {
                            return _this.fingers;
                        };
                        if (this.tempFingers) {
                            this.fingers = JSON.parse(this.tempFingers);
                        }
                        this.checkSessionData();
                        this.prepareToPreview();
                    }
                    else if (this.detached) {
                        this.emitLoadInformation();
                        this.setFingersFromBackendSession();
                    }
                    else {
                        this.singleCaptureLoading = false;
                        if (this.tempPerson) {
                            this.person = JSON.parse(this.tempPerson);
                        }
                        if (this.tempFingers) {
                            this.fingers = JSON.parse(this.tempFingers);
                        }
                        this.checkSessionData();
                        this.prepareToPreview();
                    }
                }
                catch (e) {
                    console.log("error on getModalSettings");
                    console.log(e);
                }
                this.ws.componentSocket.addEventListener("message", (event) => {
                    const data = JSON.parse(event.data);
                    if (data.action === "session-data") {
                        this.backendSession = data.session;
                        this.singleCaptureSt = this.backendSession.singleCapture;
                        this.cpfSt = this.backendSession.cpf;
                        this.useOpenbioMatcherSt = this.backendSession.useOpenbioMatcher;
                        this.flowType =
                            this.backendSession.flowType || this.modalSettings.flowType;
                        if (this.useOpenbioMatcherSt && this.singleCaptureSt) {
                            this.getPersonInfo();
                        }
                        if (this.singleCaptureSt) {
                            this.captureType = captureType.ONE_FINGER_FLAT;
                        }
                        this.singleCaptureLoading = false;
                    }
                });
                this.ws.deviceSocket.addEventListener("message", async (event) => {
                    const data = JSON.parse(event.data);
                    if (data.status === "initialized") {
                        if (this.payload.processorName) {
                            this.setProcessorFingers();
                        }
                        else {
                            this.clearImages();
                            this.stopPreview();
                            this.startPreview();
                        }
                        this.deviceReady = true;
                    }
                    if (data.status === 'will-start-capture') {
                        this.setLoader(true, this.translations.INITIATING_CAPTURE);
                    }
                    if (data.status === "preview-started") {
                        if (data.ret === -1) {
                            Swal.fire({
                                type: "info",
                                title: "Falha na inicialização da coleta",
                                text: "Verifique se há algum dedo apoiado ou resquício de sujeira no leitor.",
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                allowEnterKey: false,
                                confirmButtonColor: THEMES[this.theme].secondary,
                            }).then((result) => {
                                if (result.value) {
                                    this.stopPreview();
                                    this.startPreview();
                                }
                            });
                        }
                        setTimeout(() => {
                            this.clearImages();
                            this.setLoader(false);
                        }, 1000);
                        this.startPreviewTime = new Date().getTime();
                    }
                    if (data.status === "session-data-stored") {
                        this.backendSession = data.session;
                        if (this.allFingersCollected() &&
                            this.backendSession &&
                            this.backendSession.infantData.length === this.fingers.length) {
                            this.componentContainer.forceUpdate();
                            setTimeout(() => {
                                this.setLoader(false);
                                this.captureDone = true;
                                this.componentContainer.forceUpdate();
                            }, 500);
                        }
                    }
                    if (data.status === "match-success") {
                        this.generateMinutiateData();
                        this.unmatchCount = 0;
                    }
                    if (data.status === "minutiate-data-generated") {
                        this.minutiateFingers = JSON.parse(data.minutiateFingers);
                        await this.saveFingers(this.tempFingersData);
                        this.tempFingersData = null;
                        if (this.fingersToCapture && this.fingersToCapture.length > 0) {
                            this.editFinger(this, Object.assign({}, this.fingersToCapture[0]));
                            this.fingersToCapture.shift();
                        }
                    }
                    if (data.status === "repeated") {
                        this.setLoader(false);
                        this.repeatedCount = this.repeatedCount + 1;
                        const attemptLimit = this.failControl.attemptLimit[this.currentFingerSequence[0]].flat
                            .repetition;
                        const message = this.translations.REPEAT_MESSAGE.replace("{1}", this.fingerNames[data.similarFingerIndex]);
                        const fingerName = this.translations[constants.fingerNamesMap.get(data.similarFingerIndex)];
                        const details = `${fingerName} (${this.translations[captureType[this.captureType]]})`;
                        await this.sendServiceTimeInformation(message, details);
                        if (this.serviceConfigs.finger.allowManualSave) {
                            if (this.repeatedCount === attemptLimit) {
                                this.confirmSaveWithException().then(async (result) => {
                                    if (result.value) {
                                        this.isManualSave = true;
                                        this.generateMinutiateData();
                                    }
                                    else {
                                        this.isManualSave = false;
                                        Swal.fire({
                                            type: "warning",
                                            text: message,
                                            allowOutsideClick: false,
                                            allowEscapeKey: false,
                                            allowEnterKey: false,
                                            confirmButtonColor: THEMES[this.theme].secondary,
                                        });
                                        this.startPreview();
                                        this.repeatedCount = 0;
                                    }
                                });
                            }
                            else if (this.repeatedCount > attemptLimit) {
                                this.generateMinutiateData();
                            }
                            else {
                                Swal.fire({
                                    type: "warning",
                                    text: message,
                                    allowOutsideClick: false,
                                    allowEscapeKey: false,
                                    allowEnterKey: false,
                                    confirmButtonColor: THEMES[this.theme].secondary,
                                });
                                this.startPreview();
                            }
                        }
                        else {
                            Swal.fire({
                                type: "warning",
                                text: message,
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                allowEnterKey: false,
                                confirmButtonColor: THEMES[this.theme].secondary,
                            });
                            this.startPreview();
                        }
                    }
                    if (data.status === "match-not-possible") {
                        await this.sendServiceTimeInformation(this.translations.IMPOSSIBLE_MATCH, this.translations[captureType[this.captureType]]);
                        this.setLoader(false);
                        if (this.serviceConfigs.finger.allowManualSave) {
                            return Swal.fire({
                                text: this.translations.IMPOSSIBLE_MATCH_SAVE_MANUALLY,
                                type: "warning",
                                showCloseButton: true,
                                showCancelButton: true,
                                focusConfirm: false,
                                confirmButtonText: this.translations.SAVE,
                                confirmButtonColor: THEMES[this.theme].secondary,
                                cancelButtonText: this.translations.CANCEL,
                            }).then(async (result) => {
                                if (result.value) {
                                    this.isManualSave = true;
                                    this.generateMinutiateData();
                                }
                                else {
                                    this.isManualSave = false;
                                    Swal.fire({
                                        type: "warning",
                                        text: ERROR_MESSAGE,
                                        allowOutsideClick: false,
                                        allowEscapeKey: false,
                                        allowEnterKey: false,
                                        confirmButtonColor: THEMES[this.theme].secondary,
                                    });
                                    this.startPreview();
                                }
                            });
                        }
                        else {
                            Swal.fire({
                                type: "warning",
                                text: ERROR_MESSAGE,
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                allowEnterKey: false,
                                confirmButtonColor: THEMES[this.theme].secondary,
                            });
                            this.startPreview();
                        }
                    }
                    if (data.status === "done-setting-fingers") {
                        this.stopPreview();
                        this.startPreview();
                    }
                    if (data.rollingStatus) {
                        this.currentRollingStatus = data.rollingStatus;
                        this.currentStatusLineX = data.rollingLineX;
                    }
                    if (data.module === "infant") {
                        this.model = data.deviceInfo ? data.deviceInfo.modelName : "";
                        this.brand = data.deviceInfo ? data.deviceInfo.manufacturName : "";
                        this.serial = data.deviceInfo ? data.deviceInfo.serialNumber : "";
                        if (data.error) {
                            const error = `${TranslationUtils.concatTranslate("CODE_DESC", [
                                data.code,
                            ])}\n${this.translations.concatTranslate("DESCRIPTION_DESC", [
                                data.error,
                            ])}`;
                            await this.sendServiceTimeInformation(error, this.translations[captureType[this.captureType]]);
                            this.setLoader(false);
                            Swal.fire({
                                type: "error",
                                title: this.translations.ERROR_WHILE_CAPTURING,
                                confirmButtonColor: THEMES[this.theme].secondary,
                                text: error,
                            });
                            return;
                        }
                        if (data.previewImage) {
                            if (data.deviceInfo &&
                                data.deviceInfo.manufacturName !== "DigitalPersona" &&
                                data.deviceInfo.modelName !== "M421") {
                                showImage(this.canvas, data.previewImage, this.currentRollingStatus, this.currentStatusLineX);
                            }
                            this.nfiqScore = data.nfiqScore > 0 && data.nfiqScore <= 5 ? data.nfiqScore : 0;
                        }
                        else if (data.originalImage) {
                            if (data.fingersData.fingerCount === 0) {
                                await this.sendServiceTimeInformation(this.translations.FINGER_NOT_IDENTIFIED, this.translations[captureType[this.captureType]]);
                                return Swal.fire({
                                    type: "warning",
                                    title: this.translations.FINGER_NOT_IDENTIFIED,
                                    text: this.translations.VERIFY_FINGER_POSITION,
                                    allowOutsideClick: false,
                                    allowEscapeKey: false,
                                    allowEnterKey: false,
                                    confirmButtonColor: THEMES[this.theme].secondary,
                                }).then((result) => {
                                    if (result.value) {
                                        this.stopPreview();
                                        this.startPreview();
                                    }
                                });
                            }
                            this.nfiqScore = data.nfiqScore > 0 && data.nfiqScore <= 5 ? data.nfiqScore : 0;
                            this.stopPreview();
                            this.setLoader(true, this.translations.PROCESSING_IMAGE);
                            this.clearImages();
                            if (this.isEditing ||
                                this.doesCountMatchFlow(data.fingersData.fingerCount)) {
                                if (data.fingersData.fingerCount > 1) {
                                    showImage(this.canvas, data.originalImage, 0);
                                }
                                else {
                                    showImage(this.canvas, data.fingersData.images[0].image, 0);
                                }
                                this.originalImage = data.originalImage;
                                this.currentRollingStatus = 0;
                                this.currentStatusLineX = data.rollingLineX;
                                this.nfiqEvaluation(data);
                            }
                            else {
                                await this.sendServiceTimeInformation(this.translations.FINGERS_NOT_ENOUGH, this.translations[captureType[this.captureType]]);
                                Swal.fire({
                                    type: "error",
                                    title: "AVISO",
                                    text: this.translations.FINGERS_NOT_ENOUGH,
                                    confirmButtonColor: THEMES[this.theme].secondary,
                                });
                                this.startPreview();
                            }
                        }
                    }
                });
                this.serviceConfigs = await getAppConfig();
                if (this.serviceConfigs) {
                    this.showControlDisable =
                        this.serviceConfigs.finger.showControlDisable;
                    this.componentContainer.forceUpdate();
                }
            }
            catch (e) {
                this.setLoader(false);
                console.error(e);
            }
        }, 500);
    }
    doesCountMatchFlow(fingersCount) {
        return fingersCount === this.currentFingerSequence.length;
    }
    componentDidUnload() {
        if (this.deviceReady) {
            this.stopPreview();
            this.stopPreviewprocessor();
        }
        this.clearImages();
    }
    allFingersCollected() {
        return (this.flowType === flowTypes.FLOW_TYPE_TEN_FLAT_CAPTURES &&
            this.fingers.length === 10 &&
            this.backendSession.infantData.length === 10);
    }
    setFingersFromBackendSession() {
        const checkSessionInterval = setInterval(() => {
            if (this.backendSession) {
                clearInterval(checkSessionInterval);
                const captureData = this.backendSession.infantData.map((item) => {
                    return {
                        data: item.imageFlat,
                        nfiqScore: item.nfiqScore,
                        captureType: item.captureType,
                        fingerIndex: item.fingerIndex,
                        anomalyId: item.exceptionIndex,
                    };
                });
                this.fingers = captureData;
                this.checkSessionData();
                if (!this.singleCaptureSt) {
                    this.setCaptureType();
                }
                this.prepareToPreview();
            }
        }, 500);
    }
    async setCurrentFinger() {
        const fingerSessionData = this.fingers;
        const orderedSequence = this.fingerSequence.reduce((a, b) => {
            return a.concat(b);
        }, []);
        let currentFingerSequence = [];
        const _this = this;
        const noFingersToCapture = !this.fingersToCapture ||
            (this.fingersToCapture && this.fingersToCapture.length === 0);
        if (noFingersToCapture &&
            fingerSessionData.length < orderedSequence.length) {
            this.fingerSequence.forEach((sequence, index) => {
                if (!currentFingerSequence.length) {
                    _this.stepPhase = index;
                    _this.setCaptureType();
                    const joinedSequence = sequence.join("");
                    const finger = fingerSessionData.find((finger) => {
                        const joinedSequenceContainsFinger = joinedSequence.includes(finger.fingerIndex);
                        return joinedSequenceContainsFinger;
                    });
                    if (!finger)
                        currentFingerSequence = sequence;
                }
            });
        }
        _this.currentFingerSequence = currentFingerSequence;
        _this.currentFingerNames = currentFingerSequence.map((finger) => {
            return _this.fingerNames[finger] + ", ";
        });
        this.setCurrentFingerImage();
    }
    setCurrentFingerImage() {
        let type = "slap";
        let joinedFingerStep = this.currentFingerSequence.join("");
        this.currentFingerImage = !joinedFingerStep ? "" : `./assets/fingers/${type}/d${joinedFingerStep}.gif`;
    }
    currentFlowName() {
        const flowType = this.flowOptions[this.flowType];
        if (!flowType)
            return;
        return Object.keys(flowType)[0];
    }
    parseFingerSequence() {
        const currentFlow = this.flowOptions[this.flowType][this.currentFlowName()];
        if (currentFlow) {
            this.fingerSequence = currentFlow.map((item) => {
                if (Number.isInteger(item))
                    return [item];
                return item.split("").map(Number);
            });
        }
    }
    checkSessionData() {
        this.parseFingerSequence();
        this.setCurrentFinger();
    }
    setCaptureType() {
        this.captureType = captureType.ONE_FINGER_FLAT;
        this.captureTypeName = this.translations.POSITION;
    }
    isFlatSequence() {
        return this.captureType === captureType.ONE_FINGER_FLAT;
    }
    checkCaptureNeed(anomalyId = undefined) {
        if (anomalyId) {
            const anomaly = this.anomalyOptions.find((anomaly) => anomaly.id === anomalyId);
            return (this.isFlatSequence() && (anomaly.requiresFlat || anomaly.requires_flat));
        }
        else {
            return (this.isFlatSequence() &&
                (this.anomaly.requiresFlat || this.anomaly.requires_flat));
        }
    }
    insertPendingCapture(finger) {
        return new Promise((resolve) => {
            this.fingersToCapture.push(finger);
            resolve();
        });
    }
    async saveAmputatedHand() {
        let isRightHand = true;
        if (this.currentFingerSequence.length === 1) {
            isRightHand = this.currentFingerSequence[0] <= 4;
        }
        const handTranslation = isRightHand ? this.translations.RIGHT_HAND : this.translations.LEFT_HAND;
        const text = TranslationUtils.concatTranslate('MARK_AS_AMPUTATED?', [handTranslation]);
        const result = await Swal.fire({
            type: "warning",
            text,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showCancelButton: true,
            cancelButtonText: this.translations.CANCEL,
            confirmButtonColor: THEMES[this.theme].secondary,
        });
        if (!result.value)
            return;
        const anomaly = this.anomalyOptions.find(a => a.i18n_code === 'AMPUTATED');
        if (!anomaly) {
            await Swal.fire({
                type: "error",
                text: this.translations.ANOMALY_ERROR,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                confirmButtonColor: THEMES[this.theme].secondary,
            });
            return;
        }
        let startIndex = isRightHand ? 0 : 5;
        let endIndex = isRightHand ? 5 : 10;
        if (isRightHand) {
            // the five right fingers
            this.currentFingerSequence = [0, 1, 2, 3, 4];
        }
        else {
            // the five left fingers
            this.currentFingerSequence = [5, 6, 7, 8, 9];
        }
        // set all fingers anomaly to amputated
        for (let i = startIndex; i < endIndex; i++) {
            this.anomalies[i] = anomaly;
        }
        await this.saveFingers();
        this.forceUpdate();
        // For now, we don't need to care about more than one finger by step as occur in finger
    }
    async saveAnomaly() {
        let anomaliesWithImage = 0;
        const fingersPerStep = 1;
        for (const index in this.currentFingerSequence) {
            const fingerIndex = this.currentFingerSequence[index];
            if (this.anomalies[fingerIndex]) {
                if (this.checkCaptureNeed(this.anomalies[fingerIndex].id)) {
                    Swal.fire({
                        type: "warning",
                        text: `Realize a captura do dedo indicado`,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                        confirmButtonColor: THEMES[this.theme].secondary,
                    });
                    if (fingersPerStep === 1) {
                        return;
                    }
                    anomaliesWithImage++;
                    await this.insertPendingCapture({
                        fingerIndex,
                        captureType: this.captureType,
                    });
                }
            }
            else {
                Swal.fire({
                    type: "warning",
                    text: `Realize a captura do dedo indicado`,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    confirmButtonColor: THEMES[this.theme].secondary,
                });
                try {
                    anomaliesWithImage++;
                    await this.insertPendingCapture({
                        fingerIndex,
                        captureType: this.captureType,
                    });
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        this.forceUpdate();
        if (anomaliesWithImage < fingersPerStep) {
            this.setLoader(true, this.translations.PROCESSING_IMAGE);
            this.stopPreview();
            await this.saveFingers();
            if (this.fingersToCapture.length > 0) {
                const { fingerIndex } = this.fingersToCapture[0];
                const savedFingerWithAnomaly = this.fingers.find((f) => f.fingerIndex === fingerIndex);
                if (savedFingerWithAnomaly) {
                    this.fingersToCapture[0].id = savedFingerWithAnomaly.id;
                }
                this.editFinger(this, Object.assign({}, this.fingersToCapture[0]));
                this.fingersToCapture.shift();
            }
        }
        else {
            Swal.fire({
                type: "warning",
                text: `A(s) anomalia(s) informada(s) necessita(m) de coleta de imagem`,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
            });
            this.fingersToCapture = [];
            return;
        }
    }
    clearSession() {
        this.payload.action = "session-clear-data";
        this.payload.data = {
            type: "infant",
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
    async saveFingers(fingersData) {
        this.setLoader(true, this.translations.SAVING_CAPTURE);
        let localization = undefined;
        if (this.serviceConfigs && this.serviceConfigs.tools.geolocationService) {
            localization = await getLocalization();
        }
        let fingers = [];
        for (const index in this.currentFingerSequence) {
            const fingerIndex = this.currentFingerSequence[index];
            let minutiateFinger = undefined;
            if (this.minutiateFingers) {
                minutiateFinger = this.minutiateFingers.find((finger) => {
                    return finger.fingerIndex === fingerIndex;
                });
            }
            fingers.push({
                id: this.isEditing ? this.editingId : null,
                data: fingersData
                    ? fingersData.bmpData.length > 0
                        ? fingersData.bmpData[index]
                        : fingersData.images[index].image
                    : "",
                template: fingersData && fingersData.templates
                    ? fingersData.templates[index]
                    : "",
                segmentedData: fingersData
                    ? fingersData.images[index].segmentedImage
                    : "",
                composedData: fingersData
                    ? fingersData.images[index].composedImage
                    : "",
                wsqData: fingersData ? fingersData.images[index].wsqImage : "",
                rawData: fingersData ? fingersData.images[index].rawImage : "",
                minutiateData: minutiateFinger ? minutiateFinger.data : "",
                nfiqScore: fingersData ? fingersData.images[index].nfiqScore : null,
                captureType: captureType.ONE_FINGER_FLAT,
                fingerIndex: fingerIndex,
                anomalyId: (this.anomalies &&
                    this.anomalies[fingerIndex] &&
                    this.anomalies[fingerIndex].id) ||
                    (this.anomaly && this.anomaly.id) ||
                    null,
                height: fingersData && fingersData.heights ? fingersData.heights[index] : 0,
                width: fingersData && fingersData.widths ? fingersData.widths[index] : 0,
                model: this.model,
                brand: this.brand,
                serial: this.serial,
                localization,
                isUpload: this.isUpload,
                isManualSave: this.isManualSave
            });
        }
        ;
        this.isUpload = false;
        this.isManualSave = false;
        if (!this.detached) {
            if (this.person && !this.singleCaptureSt) {
                if (this.storeOriginalImage)
                    await this.saveOriginalImage();
                const saveFingersResult = await saveFingers({
                    personId: this.person.id,
                    fingers: JSON.stringify(fingers),
                });
                const fingerNamesText = fingers.map(finger => this.translations[constants.fingerNamesMap.get(finger.fingerIndex)]).join(' | ');
                const details = `${fingerNamesText} (${this.translations[captureType[this.captureType]]})`;
                await this.sendServiceTimeInformation(this.translations.CAPTURE_SUCCESS, details);
                const parsedValue = await saveFingersResult.map((item) => {
                    return {
                        id: item.id,
                        data: item.data,
                        segmentedData: item.segmented_data,
                        composedData: item.composed_data,
                        template: item.template,
                        wsqData: item.wsq_data,
                        rawData: item.raw_data,
                        minutiateData: item.minutiate_data,
                        nfiqScore: item.nfiq_score,
                        captureType: item.capture_type,
                        fingerIndex: item.finger_index,
                        anomalyId: item.anomaly_id,
                        height: item.height,
                        width: item.width,
                        model: item.model,
                        brand: item.brand,
                        serial: item.serial,
                        localization,
                    };
                });
                this.storeCapturedFinger(parsedValue);
            }
            this.setLoader(false);
        }
        else {
            const tempFingers = fingers.filter((finger) => {
                return this.currentFingerSequence.includes(finger.fingerIndex);
            });
            if (!this.isTagComponent)
                this.sendBiometryInformation(tempFingers);
            this.storeCapturedFinger(tempFingers);
        }
    }
    async saveOriginalImage() {
        let fingerIndex = 0;
        if (fingerIndex) {
            const fingersStructure = {
                personId: this.person.id,
                fingers: JSON.stringify([
                    {
                        data: this.originalImage,
                        segmentedData: "",
                        composedData: "",
                        template: "",
                        wsqData: "",
                        rawData: "",
                        minutiateData: "",
                        nfiqScore: null,
                        captureType: this.captureType,
                        fingerIndex: fingerIndex,
                        anomalyId: null,
                        model: this.model,
                        serial: this.serial,
                        brand: this.brand,
                    },
                ]),
            };
            await saveFingers(fingersStructure);
        }
    }
    storeCapturedFinger(saveFingersResult) {
        this.anomaly = undefined;
        if (this.isEditing) {
            const tempFinger = saveFingersResult[0];
            const index = this.fingers.findIndex((finger) => {
                return (finger.fingerIndex === tempFinger.fingerIndex &&
                    tempFinger.captureType === captureType.ONE_FINGER_FLAT &&
                    finger.captureType === captureType.ONE_FINGER_FLAT);
            });
            if (index >= 0)
                this.fingers.splice(index, 1);
            this.isEditing = false;
        }
        for (const finger of saveFingersResult) {
            this.fingers.push({
                id: finger.id,
                data: finger.data,
                composedData: finger.composed_data,
                segmentedData: finger.segmented_data,
                template: finger.template,
                wsqData: finger.wsq_data,
                minutiateData: finger.minutiateData,
                nfiqScore: finger.nfiqScore,
                captureType: finger.captureType,
                fingerIndex: finger.fingerIndex,
                anomalyId: finger.anomalyId,
                anomaly: finger.anomalyId
                    ? this.anomalyOptions.find((anomaly) => {
                        return anomaly.id === finger.anomalyId;
                    }).name
                    : "",
                height: finger.height,
                width: finger.width,
                model: finger.model,
                brand: finger.brand,
                serial: finger.serial,
                localization: finger.localization,
            });
        }
        setFingers(this.fingers);
        if (!this.singleCaptureSt) {
            this.setCurrentFinger();
        }
        this.badNfiqQualityCount = 0;
        this.unmatchCount = 0;
        this.repeatedCount = 0;
        if (!this.singleCaptureSt && this.currentFingerSequence.length > 0) {
            this.clearImages();
            this.startPreview();
        }
        else {
            this.stopPreview();
            if (!this.detached || (this.detached && this.currentFingerNames.length)) {
                this.setLoader(false);
            }
            this.componentContainer.forceUpdate();
        }
        this.componentContainer.forceUpdate();
    }
    getFlatFingerFromIndex(index) {
        const finger = this.fingers.find((finger) => finger.fingerIndex === index);
        return finger;
    }
    acceptData() {
        this.stopPreview();
        this.payload.action = "close-component";
        this.payload.data = {
            type: "infant",
            owner: "default-user",
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    emitLoadInformation() {
        this.payload.action = "component-opened";
        this.payload.data = {
            type: "infant"
        };
        const checkStatusInterval = setInterval(() => {
            if (this.ws.componentSocket.readyState === 1) {
                clearInterval(checkStatusInterval);
                this.ws.respondToComponentWS(this.payload);
            }
        }, 500);
    }
    sendBiometryInformation(fingers) {
        for (const finger of fingers) {
            this.payload.action = "store-session";
            this.payload.data = {
                type: "infant",
                owner: "default-user",
                biometry: finger,
            };
            this.ws.respondToDeviceWS(this.payload);
        }
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
    setSelectionCaptureType(event) {
        const name = event.target.name;
        const value = event.target.value;
        this[name] = parseInt(value, 10);
        this.setSelectionFingerList({
            target: { name: "fingerList", value: this.stepPhase },
        });
        this.captureTypeName = this.translations.POSITION;
        this.getPersonInfo();
        this.stopPreview();
        setTimeout(() => {
            this.startPreview();
        }, 500);
    }
    setSelectionFingerList(event) {
        const { name, value } = event.target;
        this[name] = { id: value, name: this.fingerNames[parseInt(value, 10)] };
        this.currentFingerSequence = [parseInt(value, 10)];
        this.stepPhase = parseInt(value, 10);
        this.currentFingerNames = this.currentFingerSequence.map((finger) => {
            return this.fingerNames[finger] + ", ";
        });
        this.setCurrentFingerImage();
    }
    updateDisabledControls() {
        this.disabledControls = !this.disabledControls;
    }
    capturedNfiq(index) {
        const finger = this.fingers.find((finger) => finger.fingerIndex === index);
        return finger ? finger.nfiqScore : 0;
    }
    editFinger(_this, finger) {
        _this.tab = 0;
        _this.isEditing = true;
        _this.editingId = finger.id;
        _this.stopPreview();
        _this.captureType = captureType.ONE_FINGER_FLAT;
        _this.captureTypeName = _this.translations.POSITION;
        _this.currentFingerSequence = [finger.fingerIndex];
        _this.loadStepPhaseOnEdit();
        _this.currentFingerNames = _this.currentFingerSequence.map((item) => {
            return _this.fingerNames[item] + ", ";
        });
        _this.setCurrentFingerImage();
        _this.setLoader(true);
        setTimeout(() => {
            _this.startPreview();
        }, 500);
    }
    loadStepPhaseOnEdit() {
        this.stepPhase = 0;
    }
    forceUpdate() {
        this.componentContainer.forceUpdate();
    }
    setAnomaly(fingerIndex, event) {
        const value = event.target.value;
        this.anomalies[fingerIndex] = this.anomalyOptions.find((a) => a.id === parseInt(value));
        this.forceUpdate();
    }
    getNfiqClass(fingerIndex) {
        const finger = this.fingers.find((f) => f.fingerIndex === fingerIndex);
        if (finger) {
            const type = "flat";
            if (this.serviceConfigs.finger.colorizeLowNfiq ||
                finger.nfiqScore <=
                    this.failControl.attemptLimit[fingerIndex][type].nfiq.threshold) {
                return finger.nfiqScore;
            }
        }
        return 0;
    }
    anomaliesSelection() {
        return this.currentFingerSequence.map((fingerIndex) => {
            return (h("div", { style: { marginBottom: "4vh" } },
                h("span", null,
                    " ",
                    this.fingerNames[fingerIndex],
                    " "),
                h("div", { class: "select is-small inline is-pulled-left" },
                    h("select", { onChange: this.setAnomaly.bind(this, fingerIndex), name: "anomaly" },
                        h("option", { value: undefined }, this.translations.CHOOSE_IN_ANOMALY_CASE),
                        (this.anomalyOptions || []).map((option) => {
                            const translatedOption = this.translations[option.i18n_code] || option.name;
                            return (h("option", { value: option.id, selected: this.anomalies &&
                                    this.anomalies[fingerIndex] &&
                                    this.anomalies[fingerIndex].id === option.id }, translatedOption));
                        })))));
        });
    }
    getNfiqPreviewColor(nfiqScore) {
        switch (nfiqScore) {
            case 1: return 'is-success';
            case 2: return 'is-info';
            case 3: return 'is-link';
            case 4: return 'is-warning';
            case 5: return 'is-danger';
            default: return '';
        }
    }
    ;
    getNfiqScoreProgressBarValue(nfiqScore) {
        switch (nfiqScore) {
            case 1: return 100;
            case 2: return 80;
            case 3: return 60;
            case 4: return 40;
            case 5: return 10;
            default: return 0;
        }
    }
    render() {
        const personFaceBiometry = this.personInfo &&
            this.personInfo.Biometries &&
            this.personInfo.Biometries.find((item) => item.biometry_type === 1);
        const anomalyOptions = (this.anomalyOptions || []).map((option) => {
            return (h("option", { value: option.id, selected: this.anomaly && this.anomaly.id === option.id }, option.name));
        });
        const fingerCaptureGuide = (h("div", { class: "info" },
            this.currentFingerNames.length > 0 ? (h("span", null,
                " ",
                this.captureTypeName,
                " ",
                this.translations.THE_FINGERS,
                " ",
                h("b", null,
                    this.currentFingerNames,
                    " "),
                this.translations.ABOVE_READER)) : (h("span", null, this.translations.COLLECTION_COMPLETED)),
            h("p", { class: "finger-image" }, this.currentFingerImage && h("img", { alt: "", src: this.currentFingerImage }))));
        let personFingerList = undefined;
        if (this.singleCaptureSt && this.personInfo) {
            const personBiometries = this.personInfo.Biometries.find((item) => item.biometry_type === 2) ||
                {};
            personFingerList = personBiometries.FingerprintBiometries.map((item) => {
                return (h("option", { value: item.finger_index, selected: this.selectedFinger &&
                        this.selectedFinger.id === item.finger_index }, this.fingerNames[item.finger_index]));
            });
        }
        else {
            personFingerList = this.fingerNames.map((item, index) => {
                return (h("option", { value: index, selected: this.selectedFinger && this.selectedFinger.id === index }, item));
            });
        }
        return (h("div", null, !this.singleCaptureLoading ? (h("div", { class: "window-size" },
            h("loader-component", { enabled: this.showLoader, text: this.loaderText }),
            h("div", { id: "notification-container" }),
            this.singleCaptureSt ? (h("div", { class: "card", style: { "box-shadow": "none", "padding-bottom": "10px" } },
                h("div", { class: "card-content" },
                    h("div", { class: "media" },
                        (personFaceBiometry &&
                            personFaceBiometry.FaceBiometries[0] &&
                            personFaceBiometry.FaceBiometries[0].data) ||
                            this.personImage ? (h("div", { class: "media-left" },
                            h("figure", { class: "image is-128x128" },
                                h("img", { style: {
                                        "max-width": "128px",
                                        "max-height": "128px",
                                    }, src: `data:image/png;base64, ${this.personImage ||
                                        (personFaceBiometry &&
                                            personFaceBiometry.FaceBiometries[0].data)}` })))) : undefined,
                        h("div", { class: "media-content" },
                            h("p", { class: "title is-4" }, this.personName ||
                                (this.personInfo && this.personInfo.full_name)),
                            this.cpfSt ||
                                (this.personInfo && this.personInfo.cpf) ? (h("p", { class: "subtitle is-6" },
                                this.translations.CPF,
                                ":",
                                " ",
                                this.cpfSt ||
                                    (this.personInfo && this.personInfo.cpf))) : undefined))))) : (h("div", { class: "tabs is-left is-boxed" },
                h("ul", null,
                    h("li", { class: this.activeTabClass(TABS.CAPTURE) },
                        h("a", { onClick: () => this.setActiveTab(TABS.CAPTURE) },
                            h("span", { class: "tab-title" }, this.translations.CAPTURE))),
                    h("li", { class: this.activeTabClass(TABS.FLATS) },
                        h("a", { onClick: () => this.setActiveTab(TABS.FLATS) },
                            h("span", { class: "tab-title" }, this.translations.FLAT_FINGERS)))))),
            this.tab === TABS.CAPTURE ? (h("div", { class: "columns is-mobile" },
                h("div", { class: "column is-one-third" },
                    h("div", { class: "device-status-container" },
                        h("h6", { class: "title is-7 has-text-left" },
                            this.translations.DEVICE_STATUS,
                            ":",
                            " ",
                            this.deviceReady && !this.showLoader
                                ? this.translations.READY
                                : this.translations.NOT_LOADED)),
                    this.singleCaptureSt ? (h("div", null,
                        h("p", { style: { marginBottom: "10px" } },
                            h("span", { style: { fontSize: "14px" } },
                                this.translations.CAPTURE_TYPE,
                                ":",
                                " "),
                            h("div", { class: "select is-small inline" },
                                h("select", { onChange: this.setSelectionCaptureType.bind(this), name: "captureType", disabled: this.originalImage ? true : false },
                                    h("option", { value: "0" }, this.translations.FLAT),
                                    h("option", { value: "2" }, this.translations.ROLLED)))),
                        h("p", null,
                            h("span", { style: { fontSize: "14px" } },
                                this.translations.FINGER,
                                ":",
                                " "),
                            h("div", { class: "select is-small inline", style: { marginLeft: "5px", minWidth: "142px" } },
                                h("select", { onChange: this.setSelectionFingerList.bind(this), name: "fingerList", disabled: this.originalImage ? true : false }, personFingerList))))) : null,
                    this.serviceConfigs &&
                        (this.serviceConfigs.finger.help.guideImage ||
                            this.serviceConfigs.finger.help.content) ? (h("help-component", { src: this.serviceConfigs.finger.help.guideImage, "help-text": this.serviceConfigs.finger.help.content })) : null,
                    h("div", { class: "evaluation" },
                        fingerCaptureGuide,
                        !this.singleCaptureSt ? (h("div", null,
                            h("div", { class: "hand-status" },
                                h("p", { class: "margin-name-hand" },
                                    h("strong", null, this.translations.RIGHT_HAND)),
                                h("ul", null,
                                    h("li", { class: `status-item status${this.getNfiqClass(0)}` }, this.capturedNfiq(0)),
                                    h("li", { class: `status-item status${this.getNfiqClass(1)}` }, this.capturedNfiq(1)),
                                    h("li", { class: `status-item status${this.getNfiqClass(2)}` }, this.capturedNfiq(2)),
                                    h("li", { class: `status-item status${this.getNfiqClass(3)}` }, this.capturedNfiq(3)),
                                    h("li", { class: `status-item status${this.getNfiqClass(4)}` }, this.capturedNfiq(4)))),
                            h("div", { class: "hand-status" },
                                h("p", { class: "margin-name-hand" },
                                    h("strong", null, this.translations.LEFT_HAND)),
                                h("ul", null,
                                    h("li", { class: `status-item status${this.getNfiqClass(5)}` }, this.capturedNfiq(5)),
                                    h("li", { class: `status-item status${this.getNfiqClass(6)}` }, this.capturedNfiq(6)),
                                    h("li", { class: `status-item status${this.getNfiqClass(7)}` }, this.capturedNfiq(7)),
                                    h("li", { class: `status-item status${this.getNfiqClass(8)}` }, this.capturedNfiq(8)),
                                    h("li", { class: `status-item status${this.getNfiqClass(9)}` }, this.capturedNfiq(9)))))) : null)),
                h("div", { class: "column text-align-left" },
                    h("span", { class: `status-item-line-in-canvas status-item status${this.nfiqScore}` }, this.nfiqScore),
                    h("canvas", { width: "460", height: "300", class: "canvas", ref: (el) => (this.canvas = el) }),
                    h("div", { class: "columns is-mobile action-buttons-container" },
                        this.detached &&
                            !this.isTagComponent &&
                            this.captureDone &&
                            !this.currentFingerNames.length && (h("div", { class: "column has-text-centered" },
                            h("button", { class: "button is-small is-pulled-right is-info", onClick: () => this.acceptData() }, this.translations.FINISH))),
                        this.singleCaptureSt && this.originalImage ? (h("div", { class: "column has-text-centered" },
                            h("button", { class: "button is-small is-pulled-right is-info", onClick: () => this.clearCapture() }, this.translations.CLEAN_CAPTURE))) : null),
                    this.currentFingerNames.length > 0 && (h("div", { class: "columns is-mobile anomaly-buttons-container" },
                        h("div", { class: "column" }, this.anomaliesSelection()),
                        h("div", { class: "column", style: { marginTop: "2vh" } },
                            h("button", { class: "button is-small is-pulled-right is-info", onClick: () => this.saveAnomaly() }, this.translations.SAVE_ANOMALY),
                            h("button", { class: "button is-small is-pulled-right is-info", style: { marginTop: "16px" }, onClick: () => this.saveAmputatedHand() }, this.translations.AMPUTATED_HAND)))),
                    this.showControlDisable ? (h("div", { class: "columns is-mobile" },
                        h("div", { class: "column" },
                            h("div", { class: "field" },
                                h("input", { id: "disabledControls", type: "checkbox", name: "disabledControls", class: "switch is-rounded is-danger" }),
                                h("label", { htmlFor: "disabledControls", onClick: this.updateDisabledControls.bind(this) }, this.translations.DISABLED_CONTROLS))))) : null))) : null,
            this.tab === TABS.FLATS ? (h("div", { class: "tab-content" },
                h("div", { class: "capture-result-container" },
                    h("div", { class: "columns is-mobile is-multiline is-left" },
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(0), fingerName: this.fingerNames[0], fingerIndex: 0, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(1), fingerName: this.fingerNames[1], fingerIndex: 1, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(2), fingerName: this.fingerNames[2], fingerIndex: 2, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(3), fingerName: this.fingerNames[3], fingerIndex: 3, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(4), fingerName: this.fingerNames[4], fingerIndex: 4, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage })),
                    h("div", { class: "columns is-mobile is-multiline is-left" },
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(5), fingerName: this.fingerNames[5], fingerIndex: 5, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(6), fingerName: this.fingerNames[6], fingerIndex: 6, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(7), fingerName: this.fingerNames[7], fingerIndex: 7, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(8), fingerName: this.fingerNames[8], fingerIndex: 8, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }),
                        h("openbio-finger-image-component", { finger: this.getFlatFingerFromIndex(9), fingerName: this.fingerNames[9], fingerIndex: 9, editFingerCallback: this.editFinger, parentComponentContext: this, allowUpload: this.serviceConfigs.finger.uploadSettings.enabled, uploadFingerImageCallback: this.uploadFingerImage }))))) : null)) : (h("loader-component", { enabled: this.showLoader }))));
    }
    static get is() { return "openbio-infant-details"; }
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
        "forceLoad": {
            "type": Boolean,
            "attr": "force-load"
        },
        "generateBMP": {
            "state": true
        },
        "isEditing": {
            "state": true
        },
        "isManualSave": {
            "state": true
        },
        "isTagComponent": {
            "type": Boolean,
            "attr": "is-tag-component"
        },
        "isUpload": {
            "state": true
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
        "previewActive": {
            "state": true
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
        "tempFingers": {
            "type": "Any",
            "attr": "temp-fingers"
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
    static get style() { return "/**style-placeholder:openbio-infant-details:**/"; }
}
