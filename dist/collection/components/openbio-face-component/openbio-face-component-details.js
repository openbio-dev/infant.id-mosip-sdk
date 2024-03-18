import WS from '../../utils/websocket';
import { setFace } from '../../store/main.store';
import { getAnomalies, getCameraSettingsOptions, getCameraSettings, saveCameraSettings, saveFace, getFaceSettings, } from "./api";
import { showImage } from '../../utils/canvas';
import constants from "../../utils/constants";
import changeDPI from "changedpi";
import { getAppConfig, getCameraPresets, saveServiceTime } from '../../utils/api';
import { THEMES, addCustomLink, getLocalization, getThemeByApplicationType } from '../../utils/utils';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { TranslationUtils } from '../../locales/translation';
const EYE_AXIS_LOCATION_RATIO = "Eye Axis Location Ratio";
const CENTER_LINE_LOCATION_RATIO = "Centerline Location Ratio";
const EYE_SEPARATION_SCORE = "Eye Separation Score";
const OFF_ANGLE_GAZE = "Off-Angle Gaze";
const EYE_AXIS_ANGLE = "Eye Axis Angle";
const POSE_ANGLE_YAW = "Pose-Angle Yaw";
const RIGHT_EYE_CLOSED = "Right Eye Closed";
const LEFT_EYE_CLOSED = "Left Eye Closed";
const BASE64_IMAGE = 'data:image/charset=UTF-8;png;base64,';
const EMPTY_IMAGE = undefined;
const FACE_TEMPLATE = './assets/face/face-template.png';
const UNPLUGGED_ERROR = -201;
const NO_FACE_DETECTED_ERROR = -50;
var tabs;
(function (tabs) {
    tabs[tabs["PREVIEW"] = 0] = "PREVIEW";
    tabs[tabs["VALIDATION"] = 1] = "VALIDATION";
    tabs[tabs["RESULT"] = 2] = "RESULT";
    tabs[tabs["CONFIG"] = 3] = "CONFIG";
})(tabs || (tabs = {}));
const evaluationList = [
    EYE_AXIS_LOCATION_RATIO,
    CENTER_LINE_LOCATION_RATIO,
    EYE_SEPARATION_SCORE,
    OFF_ANGLE_GAZE,
    EYE_AXIS_ANGLE,
    POSE_ANGLE_YAW,
    RIGHT_EYE_CLOSED,
    LEFT_EYE_CLOSED
];
function orderEyes(a, b) {
    if (a.x > b.x) {
        return -1;
    }
    if (a.x < b.x) {
        return 1;
    }
    return 0;
}
export class OpenbioFaceComponentDetails {
    constructor() {
        this.ws = new WS();
        // private gammaTables: number;
        this.person = {
            id: 0
        };
        this.payload = {
            deviceName: constants.device.AKYSCAM,
            deviceType: "face",
            devicePosition: 0,
            action: undefined,
            data: undefined,
            doEvaluate: true,
            file: undefined,
            fileOptions: undefined,
            module: "face",
        };
        this.keysForEvaluate = new Map();
        this.theme = "default";
        this.deviceReady = false;
        this.eyeAxisLocationRatio = '...';
        this.centerLineLocationRatio = '...';
        this.eyeSeparation = '...';
        this.offAngleGaze = '...';
        this.eyeAxysAngle = '...';
        this.poseAngleYaw = '...';
        this.rightOrLeftEyeClosed = '...';
        this.originalImage = EMPTY_IMAGE;
        this.croppedImage = EMPTY_IMAGE;
        this.segmentedImage = EMPTY_IMAGE;
        this.rawImage = EMPTY_IMAGE;
        this.autoCaptureCount = 0;
        this.autoCapturing = false;
        this.autoCaptureInterval = null;
        this.dpiValue = 0;
        this.flashCharge = 0;
        this.customizedImageSize = false;
        this.cameraSettingsOptions = {
            imageFormatOptions: [],
            flashWidthOptions: [],
            gammaTablesOptions: [],
            isoValueOptions: [],
            shutterSpeedOptions: [],
            whiteBalanceOptions: [],
            apertureOptions: []
        };
        this.tab = 0;
        this.anomalyOptions = [];
        this.face = {
            originalImage: "",
            croppedImage: "",
            segmentedImage: "",
        };
        this.validation = {
            background: "",
            brightness: "",
            eyeAxisAngle: "",
            eyeAxisLocationRatio: "",
            eyeSeparation: "",
            glasses: "",
            heightWidthRatio: "",
            poseAngleYaw: "",
            saturation: "",
            sharpness: "",
            smile: "",
        };
        this.backendSession = undefined;
        this.showLoader = false;
        this.cameraPresetOptions = {
            presetNames: [],
            presetValues: {}
        };
        this.flashProperty = 0;
        this.flashWidth = 0;
        this.aperture = 0;
        this.shutterSpeed = 0;
        this.imageFormat = 0;
        this.isoValue = 0;
        this.whiteBalance = 0;
        this.preset = 0;
        this.previewSize = 2;
        this.previewType = 2;
        this.isCapturing = false;
        this.isPreviewing = false;
        this.model = '';
        this.brand = '';
        this.serial = '';
        this.video = undefined;
        this.track = undefined;
        this.allowConfiguration = false;
        this.showCameraConfiguration = true;
        this.showPreviewTemplate = true;
        this.manualEyeSelection = {
            enabled: false,
            eyes: [],
        };
        this.faceDetected = true;
        this.deviceStatus = false;
        this.shallCapture = false;
        this.evaluations = [];
        this.serviceConfigs = undefined;
        this.uploadedBase64 = undefined;
        this.uploadedBase64Original = undefined;
        this.imageFilterBase64 = undefined;
        this.postProcessFilterAdjust = false;
        this.startPreviewTime = new Date().getTime();
        this.cropperModal = false;
        this.imageAdjustmentModal = false;
        this.imageFilterModal = false;
        this.cropSegment = false;
        this.locale = 'pt';
        this.fileToBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
        this.keysForEvaluate.set(EYE_AXIS_LOCATION_RATIO, { message: this.eyeAxisLocationRatioMessage.bind(this) });
        this.keysForEvaluate.set(CENTER_LINE_LOCATION_RATIO, { message: this.centerLineLocationRatioMessage.bind(this) });
        this.keysForEvaluate.set(EYE_SEPARATION_SCORE, { message: this.eyeSeparationMessage.bind(this) });
        this.keysForEvaluate.set(OFF_ANGLE_GAZE, { message: this.offAngleGazeMessage.bind(this) });
        this.keysForEvaluate.set(EYE_AXIS_ANGLE, { message: this.eyeAxysAngleMessage.bind(this) });
        this.keysForEvaluate.set(POSE_ANGLE_YAW, { message: this.poseAngleYawMessage.bind(this) });
        this.keysForEvaluate.set(RIGHT_EYE_CLOSED, { message: this.rightEyeClosedMessage.bind(this) });
        this.keysForEvaluate.set(LEFT_EYE_CLOSED, { message: this.leftEyeClosedMessage.bind(this) });
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
    clearManualEyeSelection() {
        this.manualEyeSelection.eyes = [];
        this.componentContainer.forceUpdate();
    }
    async setI18nParameters(locale) {
        TranslationUtils.setLocale(locale);
        this.translations = await TranslationUtils.fetchTranslations();
        this.componentContainer.forceUpdate();
    }
    toggleManualEyeSelection() {
        this.manualEyeSelection.enabled = !this.manualEyeSelection.enabled;
        if (this.manualEyeSelection.enabled) {
            this.canvas.addEventListener("mousedown", (e) => {
                if (!this.manualEyeSelection.enabled || this.manualEyeSelection.eyes.length === 2) {
                    return;
                }
                this.manualEyeSelection.eyes.push({ x: e.offsetX, y: e.offsetY });
                if (this.manualEyeSelection.eyes.length === 2) {
                    if (this.manualEyeSelection.eyes[0].x === this.manualEyeSelection.eyes[1].x && this.manualEyeSelection.eyes[0].y === this.manualEyeSelection.eyes[1].y) {
                        this.manualEyeSelection.eyes.splice(1, 1);
                    }
                    else {
                        this.manualEyeSelection.enabled = false;
                        this.manualEyeSelection.eyes.sort(orderEyes);
                    }
                }
                this.componentContainer.forceUpdate();
            });
        }
        else {
            this.canvas.removeEventListener("mousedown", (e) => {
                if (!this.manualEyeSelection.enabled || this.manualEyeSelection.eyes.length === 2) {
                    return;
                }
                this.manualEyeSelection.eyes.push({ x: e.offsetX, y: e.offsetY });
                if (this.manualEyeSelection.eyes.length === 2) {
                    if (this.manualEyeSelection.eyes[0].x === this.manualEyeSelection.eyes[1].x && this.manualEyeSelection.eyes[0].y === this.manualEyeSelection.eyes[1].y) {
                        this.manualEyeSelection.eyes.splice(1, 1);
                    }
                    else {
                        this.manualEyeSelection.enabled = false;
                        this.manualEyeSelection.eyes.sort(orderEyes);
                    }
                }
                this.componentContainer.forceUpdate();
            });
        }
        this.componentContainer.forceUpdate();
    }
    cropWithEyesCoords() {
        this.setLoader(true);
        this.stopPreview();
        this.payload.action = "crop-with-eyes-coords";
        this.payload.data = {
            crop: this.crop,
            segmentation: this.segmentation,
            eyes: this.manualEyeSelection.eyes,
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    eyeAxisLocationRatioMessage(status) {
        let message;
        if (status === "OK")
            message = status;
        else
            message = status === "Fail Low" ? this.translations.MOVE_HEAD_UP : this.translations.MOVE_HEAD_DOWN;
        this.eyeAxisLocationRatio = message;
    }
    centerLineLocationRatioMessage(status) {
        let message;
        if (status === "OK")
            message = status;
        else
            message = status === "Fail Low" ? this.translations.LEFT : this.translations.RIGHT;
        this.centerLineLocationRatio = message;
    }
    eyeSeparationMessage(score) {
        this.eyeSeparation = 3.827 * score > 120 ? this.translations.OK : this.translations.GET_CLOSER_TO_CAMERA;
    }
    offAngleGazeMessage(status) {
        let message;
        if (status === "OK")
            message = status;
        else
            message = this.translations.LOOK_TO_CAMERA;
        this.offAngleGaze = message;
    }
    eyeAxysAngleMessage(status) {
        let message;
        if (status === "OK")
            message = status;
        else
            message = status === "Fail Low" ? this.translations.TURN_HEAD_COUNTERCLOCKWISE : this.translations.TURN_HEAD_CLOCKWISE;
        this.eyeAxysAngle = message;
    }
    poseAngleYawMessage(status) {
        let message;
        if (status === "OK")
            message = status;
        else
            message = status === "Fail Low" ? this.translations.TURN_FACE_LEFT : this.translations.TURN_FACE_RIGHT;
        this.poseAngleYaw = message;
    }
    rightEyeClosedMessage(status) {
        const message = status === "Fail Low" ? this.translations.OPEN_EYES : this.translations.OK;
        this.rightOrLeftEyeClosed = message;
    }
    leftEyeClosedMessage(status) {
        const message = status === "Fail Low" ? this.translations.OPEN_EYES : this.translations.OK;
        this.rightOrLeftEyeClosed = message;
    }
    setEvaluateMessageFor(type, status) {
        if (this.keysForEvaluate.get(type)) {
            this.keysForEvaluate.get(type).message(status);
        }
    }
    checkInvalidEvaluations() {
        return this.evaluations.find((result) => (result[0] !== "Eye Separation Score" && result[1] !== "OK") || (result[0] === "Eye Separation Score" && result[1] * 3.827 < 120));
    }
    tryAutoCapture() {
        if (this.originalImage || this.checkInvalidEvaluations()) {
            this.resetAutoCapturing();
            return;
        }
        this.autoCapturing = true;
        if (!this.autoCaptureInterval && !this.isCapturing) {
            this.autoCaptureInterval = setInterval(() => {
                if (this.checkInvalidEvaluations() || this.originalImage || this.isCapturing) {
                    this.resetAutoCapturing();
                    return;
                }
                else if (this.shallCapture) {
                    if (Math.floor(this.autoCaptureCount) === 3) {
                        clearInterval(this.autoCaptureInterval);
                        this.autoCaptureInterval = null;
                        this.capture();
                    }
                    else {
                        this.autoCaptureCount += 0.01;
                    }
                }
            }, 10);
        }
        else {
            this.resetAutoCapturing();
        }
    }
    open() {
        this.payload.action = "open";
        this.ws.respondToDeviceWS(this.payload);
    }
    async sendServiceTimeInformation(observations, details) {
        if (!this.detached) {
            await saveServiceTime({
                personId: this.person.id,
                type: "FACE",
                processingTime: new Date().getTime() - this.startPreviewTime,
                observations,
                details,
                brand: this.brand,
                model: this.model,
                serial: this.serial
            });
        }
    }
    async applyCameraSettings() {
        const currentCameraSettings = [
            'flashProperty',
            'flashWidth',
            'shutterSpeed',
            'imageFormat',
            'isoValue',
            'whiteBalance',
            'previewSize',
            'previewType',
            'aperture',
        ];
        currentCameraSettings.forEach((setting, index) => {
            this.payload.action = "camera-properties";
            this.payload.data = {
                property: setting,
                value: this[setting],
                canStartPreview: index === currentCameraSettings.length - 1
            };
            this.ws.respondToDeviceWS(this.payload);
        });
    }
    async fetchCurrentCameraSettings() {
        this.cameraSettingsOptions = await getCameraSettingsOptions();
        const cameraSettings = await getCameraSettings();
        this.flashProperty = cameraSettings.flash_property;
        this.flashWidth = cameraSettings.flash_width;
        this.shutterSpeed = cameraSettings.shutter_speed;
        this.imageFormat = cameraSettings.image_format;
        this.isoValue = cameraSettings.iso_value;
        this.whiteBalance = cameraSettings.white_balance;
        this.preset = cameraSettings.preset;
        this.previewSize = cameraSettings.previewSize || 2;
        this.previewType = cameraSettings.previewType || 2;
        this.aperture = cameraSettings.aperture;
    }
    isWebcam() {
        return this.payload.deviceName === constants.device.WEBCAM;
    }
    buildWebcam() {
        let width = 460;
        let height = 300;
        let loopFrame = null;
        const webcamCanvas = this.canvas;
        if (!webcamCanvas)
            return;
        const webcamContext = webcamCanvas.getContext('2d');
        this.video = document.createElement('video');
        this.video.setAttribute('autoplay', 'true');
        this.deviceReady = true;
        const loop = () => {
            if (!this.video)
                return;
            loopFrame = requestAnimationFrame(loop);
            webcamContext.save();
            webcamContext.scale(-1, 1);
            webcamContext.drawImage(this.video, 0, 0, -width, height);
            webcamContext.restore();
        };
        this.video.addEventListener('loadedmetadata', () => {
            webcamCanvas.width = width;
            webcamCanvas.height = height;
            loopFrame = loopFrame || requestAnimationFrame(loop);
        });
    }
    resetAutoCapturing() {
        this.autoCapturing = false;
        this.autoCaptureCount = 0;
        this.shallCapture = false;
        if (this.autoCaptureInterval) {
            clearInterval(this.autoCaptureInterval);
            this.autoCaptureInterval = null;
        }
        this.componentContainer.forceUpdate();
    }
    async componentDidLoad() {
        this.detached = true;
        this.setLoader(true);
        setTimeout(async () => {
            this.anomalyOptions = await getAnomalies(constants.anomalyTypes.FACE_ANOMALY, !!this.detached);
            this.fetchCurrentCameraSettings();
            const faceSettings = await getFaceSettings();
            this.crop = faceSettings.crop;
            this.segmentation = faceSettings.segmentation;
            this.autoCapture = faceSettings.autoCapture;
            this.dpiValue = constants.dpiValue[faceSettings.dpiOption] || 0;
            this.cameraPresetOptions = await getCameraPresets();
            this.payload.deviceName = faceSettings.device ? constants.device[faceSettings.device] : constants.device.AKYSCAM;
            this.serviceConfigs = await getAppConfig();
            if (this.serviceConfigs) {
                this.allowConfiguration = this.serviceConfigs.ui.allowDeviceConfiguration;
                this.showCameraConfiguration = this.serviceConfigs.ui.showCameraConfiguration;
                this.showPreviewTemplate = this.serviceConfigs.face.showPreviewTemplate;
                this.theme = getThemeByApplicationType(this.serviceConfigs.applicationType);
                this.componentContainer.forceUpdate();
            }
            if (this.detached && this.isTagComponent) {
                const _this = this;
                window["getBiometryData"] = function () {
                    return _this.face;
                };
                if (this.tempFace) {
                    this.face = JSON.parse(this.tempFace);
                    this.originalImage = this.face.originalImage;
                    this.croppedImage = this.face.croppedImage;
                    this.segmentedImage = this.face.segmentedImage;
                }
                this.emitLoadInformation();
            }
            else if (this.detached) {
                this.emitLoadInformation();
                const checkSessionInterval = setInterval(() => {
                    if (this.backendSession) {
                        clearInterval(checkSessionInterval);
                        this.originalImage = this.backendSession.photo.data;
                    }
                }, 200);
            }
            else {
                this.person = JSON.parse(this.tempPerson);
                this.face = JSON.parse(this.tempFace);
            }
            this.wsStatusInterval = setInterval(() => {
                if (this.ws.status() === 1) {
                    clearInterval(this.wsStatusInterval);
                    if (this.isWebcam()) {
                        this.buildWebcam();
                        this.startPreview();
                    }
                    else {
                        this.open();
                        if (this.deviceReady) {
                            this.applyCameraSettings();
                            this.stopPreview();
                            this.startPreview();
                        }
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
                if (data.status === "initialized-camera-capture") {
                    this.setLoader(true);
                }
                if (data.status === "camera-capture-finished") {
                    this.setLoader(false);
                }
                if (data.status === "initialized") {
                    if (data.deviceInfo.ready) {
                        this.deviceReady = true;
                    }
                    else {
                        Swal.fire({
                            type: "error",
                            text: `${!data.deviceInfo.serialNumber ? this.translations.DEVICE_WITHOUT_SERIAL_NUMBER : this.translations.DEVICE_WITHOUT_PART_NUMBER}`,
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            allowEnterKey: false,
                            confirmButtonColor: THEMES[this.theme].secondary,
                        });
                    }
                }
                if (data.status === "session-data-stored") {
                    this.backendSession = undefined;
                    this.emitLoadInformation();
                    const checkSessionInterval = setInterval(() => {
                        if (this.backendSession && this.backendSession.photo) {
                            clearInterval(checkSessionInterval);
                            this.setLoader(false);
                        }
                    }, 200);
                }
                if (data.status === "settings-applied") {
                    this.startPreview();
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
                    this.setLoader(false);
                    return;
                }
                if (data.flashCharge) {
                    this.flashCharge = data.flashCharge;
                }
                const deviceStatuses = data.deviceStatuses;
                if (deviceStatuses && !this.isWebcam()) {
                    const previousStatus = this.deviceStatus ? JSON.parse(JSON.stringify(this.deviceStatus)) : undefined;
                    this.deviceStatus = deviceStatuses.face && deviceStatuses.face.initialized;
                    if (!this.deviceStatus) {
                        return;
                    }
                    else if (!previousStatus && this.deviceStatus) {
                        this.configureSegmentation();
                        this.applyCameraSettings();
                        this.stopPreview();
                        this.startPreview();
                        return;
                    }
                }
                const evaluation = data.evaluation;
                if (evaluation && evaluation !== UNPLUGGED_ERROR) {
                    this.shallCapture = true;
                    const evaluateEntries = Object.entries(evaluation);
                    this.evaluations = evaluateEntries.filter((result) => evaluationList.includes(result[0]));
                    if (this.autoCapture && !this.autoCapturing && !this.isCapturing) {
                        this.tryAutoCapture();
                    }
                    this.evaluations.forEach((evaluate) => {
                        this.setEvaluateMessageFor(evaluate[0], evaluate[1]);
                    });
                }
                else if (data.status === NO_FACE_DETECTED_ERROR) {
                    this.resetAutoCapturing();
                }
                if (data.module === "face") {
                    this.model = data.deviceInfo ? data.deviceInfo.modelName : "";
                    this.brand = data.deviceInfo ? data.deviceInfo.manufacturName : "";
                    this.serial = data.deviceInfo ? data.deviceInfo.serialNumber : "";
                    if (data.error) {
                        this.setLoader(false);
                        const error = `${TranslationUtils.concatTranslate('CODE_DESC', [data.code])}\n${this.translations.concatTranslate('DESCRIPTION_DESC', [data.error])}`;
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
                        showImage(this.canvas, data.previewImage, null, null, this.manualEyeSelection);
                    }
                    else if (data.originalImage) {
                        this.isPreviewing = false;
                        this.isCapturing = false;
                        this.resetAutoCapturing();
                        if (this.crop && data.cropResultCode !== 0) {
                            showImage(this.canvas, undefined, null, null, this.manualEyeSelection);
                            showImage(this.canvas, this.uploadedBase64 ? this.uploadedBase64 : data.originalImage, null, null, this.manualEyeSelection);
                            this.originalImage = this.uploadedBase64 ? this.uploadedBase64 : data.originalImage;
                            this.croppedImage = this.uploadedBase64 ? this.uploadedBase64 : data.croppedImage;
                            this.segmentedImage = this.uploadedBase64 ? this.uploadedBase64 : data.segmentedImage;
                            this.setLoader(false);
                            this.faceDetected = false;
                            await this.sendServiceTimeInformation(this.translations.FACE_NOT_DETECTED_TRY_AGAIN);
                            Swal.fire({
                                type: "error",
                                text: this.translations.FACE_NOT_DETECTED_TRY_AGAIN,
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                allowEnterKey: false,
                                confirmButtonColor: THEMES[this.theme].secondary,
                            });
                        }
                        else {
                            this.serviceConfigs = await getAppConfig();
                            this.uploadedBase64 = undefined;
                            const dataImage = data.segmentedImage || data.croppedImage || data.originalImage;
                            showImage(this.canvas, undefined, null, null, this.manualEyeSelection);
                            showImage(this.canvas, dataImage, null, null, this.manualEyeSelection);
                            this.originalImage = data.originalImage;
                            this.croppedImage = data.croppedImage;
                            this.segmentedImage = data.segmentedImage;
                            this.rawImage = data.rawImage;
                            if (this.segmentation && !this.customizedImageSize) {
                                this.applyImageAdjust();
                            }
                            else if (this.customizedImageSize) {
                                this.saveFace();
                                this.crop = this.serviceConfigs.face.crop;
                                this.segmentation = this.serviceConfigs.face.segmentation;
                                this.setActiveTab(1);
                                this.setLoader(false);
                            }
                            else {
                                this.saveFace();
                                this.crop = this.serviceConfigs.face.crop;
                                this.segmentation = this.serviceConfigs.face.segmentation;
                                this.setActiveTab(1);
                                this.setLoader(false);
                            }
                            this.customizedImageSize = false;
                            this.postProcessFilterAdjust = false;
                            this.componentContainer.forceUpdate();
                            const { imageEvaluation } = data;
                            if (imageEvaluation) {
                                this.validation.background = imageEvaluation["Background Type Score"];
                                this.validation.brightness = imageEvaluation["Brightness Score"];
                                this.validation.centerlineLocationRatio = imageEvaluation["Centerline Location Ratio"];
                                this.validation.eyeAxisAngle = imageEvaluation["Eye Axis Angle"];
                                this.validation.eyeAxisLocationRatio = imageEvaluation["Eye Axis Location Ratio"];
                                this.validation.eyeSeparation = imageEvaluation["Eye Separation"];
                                this.validation.glasses = imageEvaluation["Glasses"];
                                this.validation.poseAngleYaw = imageEvaluation["Pose-Angle Yaw"];
                                this.validation.saturation = imageEvaluation["Facial Saturation"];
                                this.validation.sharpness = imageEvaluation["Sharpness"];
                                this.validation.smile = imageEvaluation["Smile"];
                                this.validation.rightOrLeftEyeClosed = imageEvaluation["Right Eye Valid"] === "OK" && imageEvaluation["Left Eye Valid"] === "OK";
                            }
                        }
                    }
                }
            });
            this.setLoader(false);
        }, 1000);
    }
    configureSegmentation() {
        this.payload.action = "configure-segmentation";
        this.payload.data = {
            type: this.serviceConfigs.face.segmentationType
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    componentDidUnload() {
        this.stopPreview();
    }
    findSetting(settings, name) {
        return settings.find((setting) => {
            return setting.field === name;
        });
    }
    clearImagesObjects() {
        this.uploadedBase64 = EMPTY_IMAGE;
        this.originalImage = EMPTY_IMAGE;
        this.croppedImage = EMPTY_IMAGE;
        this.segmentedImage = EMPTY_IMAGE;
        this.face.originalImage = EMPTY_IMAGE;
        this.face.croppedImage = EMPTY_IMAGE;
        this.face.segmentedImage = EMPTY_IMAGE;
        this.componentContainer.forceUpdate();
    }
    clearImages() {
        this.clearImagesObjects();
        showImage(this.canvas, EMPTY_IMAGE, null, null, this.manualEyeSelection);
    }
    close() {
        this.payload.action = "close";
        this.ws.respondToDeviceWS(this.payload);
    }
    getWebcam() {
        navigator.getUserMedia({ video: true, audio: false }, (stream) => {
            this.video.srcObject = stream;
            this.track = stream.getTracks()[0];
        }, (e) => {
            console.error(e);
        });
    }
    createCode(length) {
        let code = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }
    setLoader(value, text) {
        this.showLoader = value;
        this.loaderText = text;
    }
    customizeClipping() {
        let inputCode = this.createCode(8);
        this.customizedImageSize = true;
        Swal.fire({
            type: 'warning',
            html: '<b>Atenção, edições manuais podem gerar imagens incompatíveis com as normas de qualidade de imagem, continuar assim mesmo?</b>',
            allowEscapeKey: false,
            allowEnterKey: false,
            showCancelButton: true,
            confirmButtonText: this.translations.YES,
            cancelButtonText: this.translations.NO,
            confirmButtonColor: THEMES[this.theme].secondary,
        }).then((result) => {
            if (result.value) {
                Swal.fire({
                    title: 'Digite o código de confirmação abaixo',
                    text: inputCode,
                    input: 'text',
                    inputValue: '',
                    confirmButtonColor: THEMES[this.theme].secondary,
                    showCancelButton: true,
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Você precisa inserir o código de confirmação';
                        }
                        if (value === inputCode) {
                            this.uploadedBase64 = `data:image/jpeg;base64,${(this.segmentedImage || this.croppedImage || this.originalImage)}`;
                            this.cropperModal = true;
                        }
                        else {
                            return 'O código digitado está incorreto.';
                        }
                    }
                });
            }
        });
    }
    adjustFilters() {
        this.postProcessFilterAdjust = true;
        this.uploadedBase64Original = `data:image/jpeg;base64,${this.originalImage}`;
        this.imageFilterBase64 = `data:image/jpeg;base64,${this.croppedImage}`;
        setTimeout(() => {
            this.imageFilterModal = true;
        }, 500);
    }
    startPreview(backToPreview = false) {
        if (this.isPreviewing)
            return;
        this.startPreviewTime = new Date().getTime();
        this.clearImages();
        this.isPreviewing = true;
        this.faceDetected = true;
        this.clearManualEyeSelection();
        this.manualEyeSelection.enabled = false;
        if (this.isWebcam()) {
            this.getWebcam();
            return;
        }
        if (this.autoCapture) {
            this.autoCaptureCount = 0;
            clearInterval(this.autoCaptureInterval);
            this.autoCaptureInterval = null;
        }
        this.payload.action = "start";
        this.payload.doEvaluate = this.autoCapture;
        this.ws.respondToDeviceWS(this.payload);
        if (backToPreview) {
            this.setActiveTab(0);
        }
    }
    restartPreview() {
        this.stopPreview();
        this.startPreview();
    }
    stopPreview() {
        this.isPreviewing = false;
        if (this.isWebcam()) {
            this.track.stop();
            this.buildWebcam();
            return;
        }
        this.payload.action = "stop";
        this.ws.respondToDeviceWS(this.payload);
    }
    capture(manual = false) {
        this.clearImagesObjects();
        this.isPreviewing = false;
        this.isCapturing = true;
        if (manual && this.autoCapture) {
            this.resetAutoCapturing();
        }
        this.stopPreview();
        this.setLoader(true, this.translations.PROCESSING_IMAGE);
        if (this.isWebcam()) {
            const dataImage = this.canvas.toDataURL('image/png');
            const base64 = dataImage.split(',')[1];
            this.originalImage = base64;
            this.saveFace();
            this.setActiveTab(1);
            return;
        }
        this.payload.action = "capture";
        this.payload.data = {
            crop: this.crop,
            segmentation: this.segmentation
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    setPresetValues(event) {
        const value = parseInt(event.target.value);
        if (value) {
            this.preset = value;
            const presetSettings = this.cameraPresetOptions.presetValues[this.preset];
            for (const property in presetSettings) {
                this[property] = parseInt(presetSettings[property]);
            }
        }
        this.updateCameraSettings();
    }
    setCameraValue(event) {
        this.stopPreview();
        this.preset = 0;
        const name = event.target.name;
        const value = event.target.value;
        this[name] = parseInt(value);
        this.updateCameraSettings();
        this.payload.action = "camera-properties";
        this.payload.data = {
            property: name,
            value: value
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    increaseZoom() {
        this.payload.action = "increase-zoom";
        this.ws.respondToDeviceWS(this.payload);
    }
    decreaseZoom() {
        this.payload.action = "decrease-zoom";
        this.ws.respondToDeviceWS(this.payload);
    }
    updateCameraSettings() {
        const tempCameraSettings = {
            shutterSpeed: this.shutterSpeed,
            isoValue: this.isoValue,
            flashProperty: this.flashProperty,
            flashWidth: this.flashWidth,
            imageFormat: this.imageFormat,
            whiteBalance: this.whiteBalance,
            segmentation: this.segmentation,
            autoCapture: this.autoCapture,
            preset: this.preset,
            aperture: this.aperture
        };
        saveCameraSettings(tempCameraSettings);
    }
    setFeature(event) {
        this[event.target.name] = event.target.checked;
        if (event.target.name === "autoCapture") {
            this.stopPreview();
            this.startPreview();
        }
        this.updateCameraSettings();
    }
    acceptData() {
        this.stopPreview();
        this.payload.action = "close-component";
        this.payload.data = {
            type: "face",
            owner: "default-user" // #TODO replace this with a authenticated user
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    emitLoadInformation() {
        this.payload.action = "component-opened";
        this.payload.data = {
            type: "face"
        };
        const checkStatusInterval = setInterval(() => {
            if (this.ws.componentSocket.readyState === 1) {
                clearInterval(checkStatusInterval);
                this.ws.respondToComponentWS(this.payload);
            }
        }, 200);
    }
    sendBiometryInformation(face) {
        this.payload.action = "store-session";
        this.payload.data = {
            type: "face",
            owner: "default-user",
            biometry: face
        };
        this.ws.respondToDeviceWS(this.payload);
    }
    activeTabClass(num) {
        let classes = this.tab === num ? "is-active" : "";
        if ((num === tabs.VALIDATION || num === tabs.RESULT) && !this.originalImage) {
            classes += ` disabled`;
        }
        return classes;
    }
    setActiveTab(num) {
        if ((num === tabs.VALIDATION || num === tabs.RESULT) && !this.originalImage) {
            return;
        }
        this.tab = num;
        if (num === tabs.PREVIEW && this.isWebcam()) {
            setTimeout(() => {
                this.restartPreview();
            }, 1000);
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
        this.saveFace();
    }
    async saveFace() {
        let localization = undefined;
        if (this.serviceConfigs && this.serviceConfigs.tools.geolocationService) {
            localization = await getLocalization();
        }
        let croppedImage = "";
        let originalImage = "";
        let segmentedImage = "";
        let rawImage = "";
        if (this.croppedImage) {
            if (this.dpiValue) {
                croppedImage = changeDPI.changeDpiDataUrl(`data:image/png;base64,${this.croppedImage}`, this.dpiValue).split(",")[1];
            }
            else {
                croppedImage = this.croppedImage;
            }
        }
        if (this.originalImage) {
            if (this.dpiValue) {
                originalImage = changeDPI.changeDpiDataUrl(`data:image/png;base64,${this.originalImage}`, this.dpiValue).split(",")[1];
            }
            else {
                originalImage = this.originalImage;
            }
        }
        if (this.segmentedImage && !this.customizedImageSize) {
            if (this.dpiValue) {
                segmentedImage = changeDPI.changeDpiDataUrl(`data:image/png;base64,${this.segmentedImage}`, this.dpiValue).split(",")[1];
            }
            else if (!this.customizedImageSize) {
                segmentedImage = this.segmentedImage;
            }
        }
        if (this.rawImage) {
            if (this.dpiValue) {
                rawImage = changeDPI.changeDpiDataUrl(`data:image/png;base64,${this.rawImage}`, this.dpiValue).split(",")[1];
            }
            else {
                rawImage = this.rawImage;
            }
        }
        const face = {
            id: this.face.id ? this.face.id : null,
            data: croppedImage,
            originalImage,
            segmentedImage,
            rawImage,
            anomalyId: this.anomaly ? this.anomaly : null,
            model: this.model,
            serial: this.serial,
            brand: this.brand,
            localization,
            isUpload: Boolean(this.uploadedBase64)
        };
        this.clearManualEyeSelection();
        this.manualEyeSelection.enabled = false;
        this.faceDetected = true;
        if (!this.detached) {
            const saveFaceResult = await saveFace({
                personId: this.person.id,
                face: face
            });
            await this.sendServiceTimeInformation(this.translations.CAPTURE_SUCCESS);
            await this.storeCapturedFace({
                id: saveFaceResult.id,
                data: saveFaceResult.cropped_data,
                originalImage: saveFaceResult.original_data,
                segmentedImage: saveFaceResult.segmented_data,
                rawImage: saveFaceResult.rawImage,
                anomalyId: saveFaceResult.original_data.anomaly_id,
                model: saveFaceResult.model,
                serial: saveFaceResult.serial,
                brand: saveFaceResult.brand,
                localization
            });
            this.setLoader(false);
        }
        else {
            if (!this.isTagComponent) {
                this.sendBiometryInformation(face);
            }
            await this.storeCapturedFace(face);
        }
        Swal.fire({
            type: "success",
            text: this.translations.CAPTURE_SUCCESS,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            confirmButtonColor: THEMES[this.theme].secondary,
        });
    }
    storeCapturedFace(saveFaceResult) {
        this.anomaly = 0;
        this.face.id = saveFaceResult.id;
        this.face.originalImage = saveFaceResult.originalImage;
        this.face.croppedImage = saveFaceResult.data;
        this.face.segmentedImage = saveFaceResult.segmentedImage;
        this.face.anomalyId = saveFaceResult.anomalyId;
        this.face.model = saveFaceResult.model;
        this.face.serial = saveFaceResult.serial;
        this.face.brand = saveFaceResult.brand;
        this.face.localization = saveFaceResult.localization;
        this.face.rawImage = saveFaceResult.rawImage;
        this.componentContainer.forceUpdate();
        setFace(this.face);
    }
    async openImageAdjustment() {
        this.imageAdjustmentModal = true;
    }
    async onInputChange(files) {
        if (files.length > 0) {
            this.stopPreview();
            if (files[0].type.toUpperCase() !== `image/${this.serviceConfigs.face.imageType}`.toUpperCase()) {
                Swal.fire({
                    type: "error",
                    text: TranslationUtils.concatTranslate('FILE_FORMAT_NOT_ACCEPTED_DESC', [this.serviceConfigs.face.imageType]),
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    confirmButtonColor: THEMES[this.theme].secondary,
                });
                files = undefined;
                return;
            }
            this.originalImage = undefined;
            this.croppedImage = undefined;
            this.segmentedImage = undefined;
            this.validation = {
                background: "",
                brightness: "",
                eyeAxisAngle: "",
                eyeAxisLocationRatio: "",
                eyeSeparation: "",
                glasses: "",
                heightWidthRatio: "",
                poseAngleYaw: "",
                saturation: "",
                sharpness: "",
                smile: "",
            };
            this.uploadedBase64Original = await this.fileToBase64(files[0]);
            this.uploadedBase64 = await this.fileToBase64(files[0]);
            this.imageFilterBase64 = await this.fileToBase64(files[0]);
            this.setLoader(true);
            setTimeout(() => {
                if (this.serviceConfigs.face.uploadSettings.enrollCropper) {
                    this.cropperModal = true;
                    this.setLoader(false);
                }
                else if (this.serviceConfigs.face.imageFilter.enabled) {
                    this.setLoader(false);
                    Swal.fire({
                        type: "info",
                        iconColor: THEMES[this.theme].secondary,
                        text: this.translations.WOULD_ADJUST_IMAGE_FILTERS,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                        showCancelButton: true,
                        confirmButtonText: this.translations.YES,
                        cancelButtonText: this.translations.NO,
                        confirmButtonColor: THEMES[this.theme].secondary,
                    }).then((result) => {
                        if (result.value) {
                            this.imageFilterModal = true;
                            this.componentContainer.forceUpdate();
                        }
                        else {
                            this.cropCallback(this, this.uploadedBase64.split(',')[1], this.uploadedBase64.split(',')[1], this.serviceConfigs.face.uploadSettings.segment);
                        }
                    });
                }
                else {
                    this.cropCallback(this, this.uploadedBase64.split(',')[1], this.uploadedBase64.split(',')[1], this.serviceConfigs.face.uploadSettings.segment);
                }
                files = undefined;
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
    async filterCallback(_this, filteredImageBase64) {
        _this.imageFilterModal = false;
        _this.saveCrop(filteredImageBase64, _this.uploadedBase64Original.split(',')[1]);
    }
    async saveCrop(finalImageBase64, originalImage) {
        ;
        this.setLoader(true);
        const image = new Image();
        const blob = await fetch(`data:image/${this.serviceConfigs.face.imageType};base64,${finalImageBase64}`).then(res => res.blob());
        // this.uploadedBase64 = finalImageBase64;
        this.componentContainer.forceUpdate();
        const url = window.URL.createObjectURL(blob);
        image.onload = async () => {
            this.stopPreview();
            this.payload.action = "load-capture-data";
            this.payload.module = "face";
            const reader = new FileReader();
            let rawData = this._base64ToArrayBuffer(finalImageBase64);
            reader.onload = () => {
                rawData = reader.result;
                this.ws.respondToDeviceWS(rawData);
                this.payload.fileOptions = {
                    width: image.width,
                    height: image.height,
                    base64: finalImageBase64,
                    originalBase64: originalImage
                };
                this.crop = this.serviceConfigs.face.uploadSettings.crop;
                if (this.customizedImageSize) {
                    this.segmentation = false;
                }
                else {
                    this.segmentation = this.postProcessFilterAdjust ? this.serviceConfigs.face.segmentation : (this.cropSegment || this.serviceConfigs.face.uploadSettings.segment);
                }
                this.payload.data = {
                    crop: this.crop,
                    segmentation: this.segmentation
                };
                this.ws.respondToDeviceWS(this.payload);
            };
            reader.readAsArrayBuffer(blob);
            window.URL.revokeObjectURL(url);
        };
        image.src = url;
    }
    applyImageAdjust() {
        this.setLoader(false);
        const html = `
      <div>
        <div class="swal2-content">
          <h2 class="has-text-primary" style="display: flex;
            justify-content: center;
            margin: 20px;
            font-size: 1.4em;
            font-weight: 600;
            word-wrap: break-word"
          >${this.translations.CURRENT_SEGMENTATION_RESULT}</h2>
        </div>
        <img src="data:image/jpeg;base64,${this.segmentedImage}" class="object-fit-contain" style="max-height: 300px; position: relative" />
        <div class="swal2-content">
          <h2 style="display: flex;
            justify-content: center;
            margin: 20px;
            word-wrap: break-word;
            margin-bottom: 0;"
          >${this.translations.WOULD_OPEN_IMAGE_ADJUSTMENT}</h2>
        </div>
      </div>`;
        Swal.fire({
            html,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showCancelButton: true,
            confirmButtonText: this.translations.YES,
            cancelButtonText: this.translations.NO,
            confirmButtonColor: THEMES[this.theme].secondary,
        }).then((result) => {
            if (result.value) {
                this.imageAdjustmentModal = true;
            }
            else {
                this.saveFace();
                this.crop = this.serviceConfigs.face.crop;
                this.segmentation = this.serviceConfigs.face.segmentation;
                this.setActiveTab(1);
            }
        });
    }
    async cropCallback(_this, croppedBase64Image, originalImage, segment) {
        _this.croppedImageURL = croppedBase64Image;
        _this.clearImagesObjects();
        _this.setLoader(true);
        _this.cropperModal = false;
        if (_this.serviceConfigs.face.imageFilter.enabled && !_this.customizedImageSize) {
            _this.setLoader(false);
            Swal.fire({
                type: "info",
                iconColor: THEMES[_this.theme].secondary,
                text: this.translations.WOULD_ADJUST_IMAGE_FILTERS,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showCancelButton: true,
                confirmButtonText: this.translations.YES,
                cancelButtonText: this.translations.NO,
                confirmButtonColor: THEMES[_this.theme].secondary,
            }).then((result) => {
                if (result.value) {
                    _this.imageFilterModal = true;
                    _this.componentContainer.forceUpdate();
                    _this.imageFilterBase64 = `data:image/${_this.serviceConfigs.face.imageType};base64,${croppedBase64Image}`;
                    _this.cropSegment = segment;
                }
                else {
                    _this.cropSegment = segment;
                    _this.saveCrop(croppedBase64Image, originalImage);
                }
            });
        }
        else {
            _this.saveCrop(croppedBase64Image, originalImage);
        }
    }
    imageAdjustmentCallback(_this, adjustment, adjustedImage) {
        _this.adjustment = adjustment;
        _this.adjustedImage = adjustedImage;
    }
    closeImageAdjustment(_this) {
        let backgroundImage = 'data:image/jpeg;base64, ' + _this.croppedImage;
        if (!_this.adjustment) {
            _this.adjustedImage = 'data:image/jpeg;base64, ' + this.segmentedImage;
        }
        // let backgroundImage = 'data:image/jpeg;base64, ' +  (_this.croppedImage || _this.originalImage);
        // if(!_this.adjustment) {
        //   _this.adjustedImage = backgroundImage;
        // }
        const html = `
    <div>
      <img src="${backgroundImage}" class="object-fit-contain" style="max-height: 300px; position: relative" />
      <img src="${_this.adjustedImage || 'data:image/jpeg;base64, ' + (_this.segmentedImage || _this.croppedImage || _this.originalImage)}" class="object-fit-contain" style="max-height: 300px; position: relative; margin-left: -229px" />
      <div class="swal2-content">
        <h2 style="display: flex;
          justify-content: center;
          font-size: 1.4em;
          font-weight: 600;
          margin: 20px;
          word-wrap: break-word;"
        >${_this.translations.CONFIRM_ADJUSTMENT}</h2>
      </div>
    </div>
  `;
        Swal.fire({
            type: "warning",
            html,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showCancelButton: true,
            confirmButtonText: _this.translations.CONFIRM,
            cancelButtonText: _this.translations.BACK,
            confirmButtonColor: THEMES[this.theme].secondary,
        }).then((result) => {
            if (result.value) {
                _this.saveImage(_this);
            }
        });
    }
    saveImage(_this) {
        let temp = document.createElement('canvas');
        let temp_ctx = temp.getContext('2d');
        let img = new Image();
        img.src = 'data:image/jpeg;base64, ' + (_this.croppedImage || _this.originalImage);
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            temp.width = width;
            temp.height = height;
            temp_ctx.drawImage(img, 0, 0, width, height);
            let img_2 = new Image();
            img_2.src = _this.adjustedImage || 'data:image/jpeg;base64, ' + (_this.segmentedImage || _this.croppedImage || _this.originalImage);
            img_2.onload = () => {
                let width = img.width;
                let height = img.height;
                temp_ctx.drawImage(img_2, 0, 0, width, height);
                _this.segmentedImage = temp.toDataURL('image/png').split(',')[1];
                _this.saveFace();
                _this.crop = _this.serviceConfigs.face.crop;
                _this.segmentation = _this.serviceConfigs.face.segmentation;
                _this.setActiveTab(1);
                _this.imageAdjustmentModal = false;
            };
        };
        _this.adjustment = false;
    }
    render() {
        const shutterSpeedOptions = (this.cameraSettingsOptions.shutterSpeedOptions || []).map((option) => {
            const key = Object.keys(option)[0];
            return (h("option", { value: option[key], selected: this.shutterSpeed === option[key] }, key));
        });
        const isoOptions = (this.cameraSettingsOptions.isoValueOptions || []).map((option) => {
            const key = Object.keys(option)[0];
            return (h("option", { value: option[key], selected: this.isoValue === option[key] }, key));
        });
        const whiteBalanceOptions = (this.cameraSettingsOptions.whiteBalanceOptions || []).map((option) => {
            const key = Object.keys(option)[0];
            return (h("option", { value: option[key], selected: this.whiteBalance === option[key] }, key));
        });
        const flashPropertyOptions = (this.cameraSettingsOptions.flashPropertyOptions || []).map((option) => {
            const key = Object.keys(option)[0];
            return (h("option", { value: option[key], selected: this.flashProperty === option[key] }, key));
        });
        const formatOptions = (this.cameraSettingsOptions.imageFormatOptions || []).map((option) => {
            const key = Object.keys(option)[0];
            return (h("option", { value: option[key], selected: this.imageFormat === option[key] }, key));
        });
        const flashWidthOptions = (this.cameraSettingsOptions.flashWidthOptions || []).map((option) => {
            const key = Object.keys(option)[0];
            return (h("option", { value: option[key], selected: this.flashWidth === option[key] }, key));
        });
        const apertureOptions = (this.cameraSettingsOptions.apertureOptions || []).map((option) => {
            const key = Object.keys(option)[0];
            return (h("option", { value: option[key], selected: this.aperture === option[key] }, key));
        });
        const presetOptions = (this.cameraSettingsOptions.presetOptions || []).map((option) => {
            const translation = this.translations[this.cameraPresetOptions.presetNames[option]];
            const key = translation ? translation : this.cameraPresetOptions.presetNames[option];
            return (h("option", { value: option, selected: this.preset === option }, key));
        });
        const anomalyOptions = (this.anomalyOptions || []).map((option) => {
            const translatedOption = this.translations[option.i18n_code] || option.name;
            return (h("option", { value: option.id, selected: this.anomaly === option.id }, translatedOption));
        });
        return (h("div", { class: "window-size" },
            h("loader-component", { enabled: this.showLoader, text: this.loaderText }),
            h("div", { id: "notification-container" }),
            this.cropperModal ?
                h("div", { class: `modal is-active` },
                    h("div", { class: "modal-background" }),
                    h("div", { class: "modal-content image-cropper-modal-content-container" },
                        h("image-cropper-component", { customizedImageSize: this.customizedImageSize, src: this.uploadedBase64, aspectRatio: 3 / 4, parentElementTag: "openbio-face", currentElementTag: "openbio-face-details", parentComponentContext: this, cropCallback: this.cropCallback })),
                    h("button", { class: "modal-close is-large", "aria-label": "close", onClick: () => this.cropperModal = false })) : null,
            this.imageFilterModal ?
                h("div", { class: `modal is-active` },
                    h("div", { class: "modal-background" }),
                    h("div", { class: "modal-content modal-content-container", style: { overflowY: "hidden" } },
                        h("image-filter-component", { src: this.imageFilterBase64, parentComponentContext: this, parentElementTag: "openbio-face", currentElementTag: "openbio-face-details", filterCallback: this.filterCallback })),
                    h("button", { class: "modal-close is-large", "aria-label": "close", onClick: () => this.imageFilterModal = false })) : null,
            this.imageAdjustmentModal &&
                h("div", { class: `modal is-active` },
                    h("div", { class: "modal-background" }),
                    h("div", { class: "modal-content image-cropper-modal-content-container", id: "image-adjustment" },
                        h("image-segmentation-adjustment-component", { class: "justify-content-center", parentElementTag: "openbio-face", currentElementTag: "openbio-face-details", parentComponentContext: this, imageAdjustmentCallback: this.imageAdjustmentCallback, saveAdjustedImageCallback: this.closeImageAdjustment, originalImage: this.croppedImage || this.croppedImageURL || this.originalImage, segmentedImage: this.segmentedImage })),
                    h("button", { class: "modal-close is-large", id: "close-image-adjustment", "aria-label": "close", onClick: () => this.closeImageAdjustment(this) })),
            h("div", { class: "tabs is-left is-boxed" },
                h("ul", null,
                    h("li", { class: this.activeTabClass(tabs.PREVIEW) },
                        h("a", { onClick: () => this.setActiveTab(tabs.PREVIEW) },
                            h("span", { class: "tab-title" }, this.translations.CAPTURE))),
                    h("li", { class: this.activeTabClass(tabs.VALIDATION) },
                        h("a", { onClick: () => this.setActiveTab(tabs.VALIDATION) },
                            h("span", { class: "tab-title" }, this.translations.VALIDATION))),
                    h("li", { class: this.activeTabClass(tabs.RESULT) },
                        h("a", { onClick: () => this.setActiveTab(tabs.RESULT) },
                            h("span", { class: "tab-title" }, this.translations.FINAL_RESULT))),
                    !this.isWebcam() && this.showCameraConfiguration ?
                        h("li", { class: this.activeTabClass(tabs.CONFIG) },
                            h("a", { onClick: () => this.setActiveTab(tabs.CONFIG) },
                                h("span", { class: "tab-title" }, this.translations.SETTINGS))) : null)),
            this.tab === tabs.PREVIEW ? h("div", { class: "columns is-mobile" },
                h("div", { class: "column is-one-quarter" },
                    h("div", { class: "device-status-container" },
                        h("h6", { class: "title is-7" },
                            this.translations.DEVICE_STATUS.toUpperCase(),
                            ": ",
                            this.deviceReady ? this.translations.READY.toUpperCase() : this.translations.NOT_LOADED.toUpperCase()),
                        h("progress", { class: "progress is-small", value: this.flashCharge, max: "100" })),
                    this.serviceConfigs && (this.serviceConfigs.face.help.guideImage || this.serviceConfigs.face.help.content) ?
                        h("help-component", { src: this.serviceConfigs.face.help.guideImage, "help-text": this.serviceConfigs.face.help.content }) : null,
                    this.autoCapture && !this.originalImage ?
                        h("div", { class: "evaluation" },
                            h("hr", { style: { margin: "10px 0 10px 0" } }),
                            h("div", null,
                                h("h6", { class: "is-7" }, this.autoCapturing ? this.translations.AUTO_CAPTURE_STARTED : this.translations.VERIFY_ITENS_BEFORE_AUTO_CAPTURE)),
                            h("hr", { style: { margin: "10px 0 20px 0" } }),
                            h("div", { class: "info" },
                                h("div", null,
                                    h("strong", null,
                                        " ",
                                        this.translations.FACE_POSITION.toUpperCase(),
                                        " ")),
                                h("span", null,
                                    this.translations.STATE,
                                    ": ",
                                    this.eyeAxisLocationRatio)),
                            h("div", { class: "info" },
                                h("div", null,
                                    h("strong", null,
                                        " ",
                                        this.translations.FACE_DIRECTION.toUpperCase(),
                                        "  ")),
                                h("span", null,
                                    this.translations.STATE,
                                    ": ",
                                    this.centerLineLocationRatio)),
                            h("div", { class: "info" },
                                h("div", null,
                                    h("strong", null,
                                        " ",
                                        this.translations.PROXIMITY.toUpperCase(),
                                        "  ")),
                                h("span", null,
                                    this.translations.STATE,
                                    ": ",
                                    this.eyeSeparation)),
                            h("div", { class: "info" },
                                h("div", null,
                                    h("strong", null,
                                        " ",
                                        this.translations.EYE_DIRECTION.toUpperCase(),
                                        "  ")),
                                h("span", null,
                                    this.translations.STATE,
                                    ": ",
                                    this.offAngleGaze)),
                            h("div", { class: "info" },
                                h("div", null,
                                    h("strong", null,
                                        " ",
                                        this.translations.FACE_ANGLE.toUpperCase(),
                                        "  ")),
                                h("span", null,
                                    this.translations.STATE,
                                    ": ",
                                    this.eyeAxysAngle)),
                            h("div", { class: "info" },
                                h("div", null,
                                    h("strong", null,
                                        " ",
                                        this.translations.FACE_INCLINATION.toUpperCase(),
                                        "  ")),
                                h("span", null,
                                    this.translations.STATE,
                                    ": ",
                                    this.poseAngleYaw)),
                            h("div", { class: "info" },
                                h("div", null,
                                    h("strong", null,
                                        " ",
                                        this.translations.EYE_SITUATION.toUpperCase(),
                                        "  ")),
                                h("span", null,
                                    this.translations.STATE,
                                    ": ",
                                    this.rightOrLeftEyeClosed))) : null),
                h("div", { class: "column text-align-left", style: { maxWidth: '486px' } },
                    this.autoCapturing ?
                        h("div", { class: "overlay" },
                            h("span", null,
                                " ",
                                3 - Math.floor(this.autoCaptureCount),
                                " ")) : null,
                    this.isPreviewing && this.showPreviewTemplate && !this.autoCapturing ? h("div", { class: this.isWebcam() ? "face-template" : "face-template-akyscam" },
                        h("img", { src: `${FACE_TEMPLATE}` })) : null,
                    h("canvas", { width: "460", height: "300", class: `canvas`, ref: el => {
                            this.canvas = el;
                            if (!this.isPreviewing && this.originalImage) {
                                showImage(this.canvas, undefined, null, null, this.manualEyeSelection);
                                showImage(this.canvas, this.segmentedImage || this.croppedImage || this.originalImage, null, null, this.manualEyeSelection);
                            }
                        } }),
                    h("div", { class: "columns is-mobile anomaly-buttons-container" },
                        h("div", { class: "column" },
                            h("div", { class: "select is-small inline is-pulled-left" },
                                h("select", { onChange: this.setSelection.bind(this), name: "anomaly" },
                                    h("option", { value: undefined },
                                        " ",
                                        this.translations.CHOOSE_IN_ANOMALY_CASE.toUpperCase()),
                                    anomalyOptions))),
                        h("div", { class: "column", style: { display: "flex", justifyContent: "flex-end" } },
                            h("button", { class: "button is-small is-info", id: "button", style: { color: "white" }, onClick: () => this.saveAnomaly() },
                                h("span", null, this.translations.SAVE_ANOMALY)))),
                    this.serviceConfigs && this.serviceConfigs.face.uploadSettings.enabled &&
                        h("button", { class: "button is-info is-small", id: "button" },
                            h("input", { class: "file-input", onInput: ($event) => this.onInputChange($event.target.files), type: "file", name: "resume", accept: `image/${this.serviceConfigs.face.imageType}` }),
                            h("span", { class: "icon is-small" },
                                h("i", { class: "mdi mdi-upload icon-16", style: { color: "white", marginRight: "3px", marginTop: "2px" }, "aria-hidden": "true" })),
                            h("span", null, this.translations.LOAD_FILE))),
                h("div", { class: "columns is-mobile action-buttons-container" },
                    h("span", null,
                        " ",
                        this.manualEyeSelection.enabled,
                        " "),
                    h("div", { class: "column has-text-left" },
                        h("div", { class: "is-full" },
                            h("img", { src: "./assets/general/image-search-outline.png", class: `fab-icon  is-pulled-left ${this.isPreviewing ? "disabled" : ""} `, onClick: () => this.restartPreview() }),
                            h("span", { class: "icon-text" }, this.translations.PREVIEW)),
                        h("div", { class: "is-full" },
                            h("img", { src: "./assets/general/camera.png", class: "fab-icon is-pulled-left", onClick: () => this.capture(true) }),
                            h("span", { class: "icon-text" },
                                " ",
                                this.translations.MAKE_CAPTURE,
                                " ")),
                        !this.faceDetected ? h("hr", null) : null,
                        !this.faceDetected ?
                            h("div", { class: "is-full" },
                                h("img", { src: "./assets/general/eye-outline.png", title: "Clique aqui para ativar e desativar o modo de sele\u00E7\u00E3o de olhos", class: `fab-icon is-pulled-left ${this.manualEyeSelection.enabled ? "fab-icon-active" : ""}`, onClick: () => this.toggleManualEyeSelection() }),
                                h("span", { class: "icon-text" },
                                    " ",
                                    this.translations.TAG_EYES,
                                    " ")) : null,
                        !this.faceDetected ?
                            h("div", { class: "is-full" },
                                h("img", { src: "./assets/general/camera-retake-outline.png", title: "Clique aqui para tentar novamente a detec\u00E7\u00E3o de face atrav\u00E9s da marca\u00E7\u00E3o manual de olhos", class: `fab-icon is-pulled-left ${this.manualEyeSelection.eyes.length === 2 ? "" : "disabled"}`, onClick: () => this.cropWithEyesCoords() }),
                                h("span", { class: "icon-text" },
                                    " ",
                                    this.translations.VALIDATE_TAG,
                                    " ")) : null,
                        !this.faceDetected ?
                            h("div", { class: "is-full" },
                                h("img", { src: "./assets/general/eye-minus-outline.png", title: "Clique para limpar a marca\u00E7\u00E3o de olhos", class: `fab-icon is-pulled-left ${this.manualEyeSelection.eyes.length > 0 ? "" : "disabled"}`, onClick: () => this.clearManualEyeSelection() }),
                                h("span", { class: "icon-text" },
                                    " ",
                                    this.translations.CLEAN_EYES,
                                    " ")) : null,
                        this.detached && !this.isTagComponent ?
                            h("div", { class: "is-full" },
                                h("img", { src: "./assets/general/check.png", class: "fab-icon is-pulled-left", onClick: () => this.acceptData() }),
                                h("span", { class: "icon-text" },
                                    " ",
                                    this.translations.FINISH,
                                    " ")) : null))) : null,
            this.tab === tabs.VALIDATION ?
                h("div", null,
                    h("div", { class: "columns is-mobile" },
                        !this.isWebcam() ?
                            h("div", { class: "column is-4", style: { height: '280px', marginTop: '3%' } },
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: false, status: this.validation.centerlineLocationRatio, type: "centerlineLocationRatio", typeTitle: this.translations.LOCATION_RATIO }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: false, status: this.validation.brightness, type: "brightness", typeTitle: this.translations.BRIGHTNESS }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: false, status: this.validation.saturation, type: "saturation", typeTitle: this.translations.SATURATION }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: false, status: this.validation.sharpness, type: "sharpness", typeTitle: this.translations.SHARPNESS }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: false, status: this.validation.background, type: "background", typeTitle: this.translations.BACKGROUND }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: false, status: this.validation.rightOrLeftEyeClosed, type: "openedEyes", typeTitle: this.translations.OPENED_EYES })) : null,
                        h("div", { class: "column" },
                            h("div", { class: "has-text-centered preview-result", style: { paddingTop: '5px' } },
                                h("img", { src: `${BASE64_IMAGE}${this.segmentedImage || this.croppedImage || this.originalImage}` }))),
                        !this.isWebcam() ?
                            h("div", { class: "column is-4", style: { marginTop: '3%' } },
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: true, status: this.validation.poseAngleYaw, type: "poseAngleYaw", typeTitle: this.translations.POSE_ANGLE_Y_AW }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: true, status: this.validation.eyeAxisLocationRatio, type: "eyeAxisLocationRatio", typeTitle: this.translations.EYE_AXIS_LOCATION_RATIO }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: true, status: this.validation.eyeAxisAngle, type: "eyeAxisAngle", typeTitle: this.translations.ANGLE }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: true, status: this.validation.smile, type: "smile", typeTitle: this.translations.MOUTH }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: true, status: this.validation.glasses, type: "glasses", typeTitle: this.translations.GLASSES }),
                                h("openbio-face-validation-box-component", { detached: this.detached, leftIcon: true, status: this.validation.eyeSeparation, type: "eyeSeparation", typeTitle: this.translations.EYE_SEPARATION })) : null),
                    h("div", { class: "columns is-mobile", style: { marginTop: "10px", justifyContent: "center" } },
                        h("div", { class: "column is-narrow" },
                            h("div", { class: "is-pulled-left centrelize" },
                                h("img", { src: "./assets/general/camera-retake-outline.png", title: "Clique aqui para tirar uma nova foto.", class: `fab-icon is-pulled-left ${this.isPreviewing ? "disabled" : ""} `, onClick: () => this.isWebcam() ? this.setActiveTab(0) : this.startPreview(true) }),
                                h("span", { style: { padding: '6px', display: 'inline-block' } },
                                    " ",
                                    this.translations.NEW_PHOTO,
                                    " "))),
                        h("div", { class: "column is-narrow" },
                            h("div", { class: "is-pulled-left centrelize" },
                                h("img", { src: "./assets/general/image-filter.png", class: "fab-icon", title: "Clique aqui para ajustar os filtros.", onClick: () => this.adjustFilters() }),
                                h("span", { style: { padding: '6px', display: 'inline-block' } },
                                    " ",
                                    this.translations.ADJUST_FILTERS,
                                    " "))),
                        h("div", { class: "column is-narrow" },
                            h("div", { class: "is-pulled-left centrelize" },
                                h("img", { src: "./assets/general/crop2.png", class: "fab-icon", title: "Clique aqui para personalizar recorte.", onClick: () => this.customizeClipping() }),
                                h("span", { style: { padding: '6px', display: 'inline-block' } },
                                    " ",
                                    this.translations.CUSTOMIZE_CLIPPING,
                                    " "))),
                        this.detached && !this.isTagComponent ?
                            h("div", { class: "column is-narrow" },
                                h("div", { class: "is-pulled-right centrelize" },
                                    h("img", { src: "./assets/general/check.png", class: "fab-icon", onClick: () => this.acceptData() }),
                                    h("span", { style: { padding: '6px', display: 'inline-block' } },
                                        " ",
                                        this.translations.FINISH,
                                        " "))) : null))
                : null,
            this.tab === tabs.RESULT ? h("div", { class: "tab-content" },
                h("div", { class: "columns" },
                    this.face.originalImage || this.originalImage ?
                        h("div", { class: "column has-text-centered preview-result" },
                            h("img", { src: `${BASE64_IMAGE}${this.detached ? this.originalImage : (this.face.originalImage || this.originalImage)}` })) : null,
                    this.face.croppedImage || this.croppedImage ?
                        h("div", { class: "column has-text-centered preview-result" },
                            h("img", { src: `${BASE64_IMAGE}${this.detached ? this.croppedImage : (this.face.croppedImage || this.croppedImage)}` })) : null,
                    this.face.segmentedImage || this.segmentedImage ?
                        h("div", { class: "column has-text-centered preview-result" },
                            h("img", { src: `${BASE64_IMAGE}${this.detached ? this.segmentedImage : (this.face.segmentedImage || this.segmentedImage)}` })) : null),
                h("p", null, this.face.anomalyId ? this.anomalyOptions.find((anomaly) => { return anomaly.id === this.face.anomalyId; }).name : "")) : null,
            this.tab === tabs.CONFIG ? h("div", { class: "tab-content" },
                h("div", { class: "columns is-mobile settings-container" },
                    this.allowConfiguration ?
                        h("div", { class: "column" },
                            h("div", { class: "field" },
                                h("label", { class: "label" }, this.translations.SHUTTER_SPEED),
                                h("div", { class: "control" },
                                    h("div", { class: "select is-small inline" },
                                        h("select", { onChange: this.setCameraValue.bind(this), name: "shutterSpeed" },
                                            h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                            shutterSpeedOptions)))),
                            h("div", { class: "field" },
                                h("label", { class: "label" }, this.translations.ISO.toUpperCase()),
                                h("div", { class: "control" },
                                    h("div", { class: "select is-small inline" },
                                        h("select", { onChange: this.setCameraValue.bind(this), name: "isoValue" },
                                            h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                            isoOptions)))),
                            h("div", { class: "field" },
                                h("label", { class: "label" }, this.translations.APERTURE.toUpperCase()),
                                h("div", { class: "select is-small inline" },
                                    h("select", { onChange: this.setCameraValue.bind(this), name: "aperture" },
                                        h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                        apertureOptions)))) : null,
                    this.allowConfiguration ?
                        h("div", { class: "column" },
                            h("div", { class: "field" },
                                h("label", { class: "label" }, this.translations.WHITE_BALANCE.toUpperCase()),
                                h("div", { class: "select is-small inline" },
                                    h("select", { onChange: this.setCameraValue.bind(this), name: "whiteBalance" },
                                        h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                        whiteBalanceOptions))),
                            h("div", { class: "field" },
                                h("label", { class: "label" }, this.translations.FORMAT.toUpperCase()),
                                h("div", { class: "select is-small inline" },
                                    h("select", { onChange: this.setCameraValue.bind(this), name: "imageFormat" },
                                        h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                        formatOptions)))) : null,
                    this.allowConfiguration ?
                        h("div", { class: "column" },
                            h("div", { class: "field" },
                                h("label", { class: "label" }, this.translations.FLASH_STATUS.toUpperCase()),
                                h("div", { class: "select is-small inline" },
                                    h("select", { onChange: this.setCameraValue.bind(this), name: "flashProperty" },
                                        h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                        flashPropertyOptions))),
                            h("div", { class: "field" },
                                h("label", { class: "label" }, this.translations.FLASH_APERTURE.toUpperCase()),
                                h("div", { class: "select is-small inline" },
                                    h("select", { onChange: this.setCameraValue.bind(this), name: "flashWidth" },
                                        h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                        flashWidthOptions)))) : null,
                    h("div", { class: "column" },
                        h("div", { class: "field" },
                            h("label", { class: "label" }, this.translations.PRESETS.toUpperCase()),
                            h("div", { class: "select is-small inline" },
                                h("select", { onChange: this.setPresetValues.bind(this), name: "preset" },
                                    h("option", { value: "0" }, this.translations.SELECT_OPTION.toUpperCase()),
                                    presetOptions))))),
                this.allowConfiguration ?
                    h("div", { class: "columns" },
                        h("div", { class: "column" },
                            h("label", { class: "checkbox" },
                                h("input", { type: "checkbox", checked: this.segmentation, onChange: this.setFeature.bind(this), name: "segmentation" }),
                                this.translations.SEGMENTATION.toUpperCase()),
                            h("label", { class: "checkbox" },
                                h("input", { type: "checkbox", checked: this.autoCapture, onChange: this.setFeature.bind(this), name: "autoCapture" }),
                                this.translations.AUTOMATIC_CAPTURE.toUpperCase()))) : null,
                h("hr", null),
                this.allowConfiguration ?
                    h("div", { class: "columns" },
                        h("div", { class: "column has-text-left" },
                            h("div", null,
                                h("label", { class: "label" }, this.translations.ZOOM_CONTROL)),
                            h("button", { class: "button is-small is-info", style: { 'margin-right': '10px' }, onClick: this.increaseZoom.bind(this) }, this.translations.ZOOM_PLUS),
                            h("button", { class: "button is-small is-info", onClick: this.decreaseZoom.bind(this) }, this.translations.ZOOM_MINUS))) : null) : null));
    }
    static get is() { return "openbio-face-details"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "adjustedImage": {
            "state": true
        },
        "adjustment": {
            "state": true
        },
        "allowConfiguration": {
            "state": true
        },
        "anomaly": {
            "state": true
        },
        "anomalyOptions": {
            "state": true
        },
        "aperture": {
            "state": true
        },
        "autoCapture": {
            "state": true
        },
        "autoCaptureCount": {
            "state": true
        },
        "autoCaptureInterval": {
            "state": true
        },
        "autoCapturing": {
            "state": true
        },
        "backendSession": {
            "state": true
        },
        "brand": {
            "state": true
        },
        "cameraPresetOptions": {
            "state": true
        },
        "cameraSettingsOptions": {
            "state": true
        },
        "captureInput": {
            "state": true
        },
        "centerLineLocationRatio": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "crop": {
            "state": true
        },
        "croppedImage": {
            "state": true
        },
        "croppedImageURL": {
            "state": true
        },
        "cropperModal": {
            "state": true
        },
        "cropSegment": {
            "state": true
        },
        "customizedImageSize": {
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
        "deviceStatus": {
            "state": true
        },
        "dpiValue": {
            "state": true
        },
        "evaluations": {
            "state": true
        },
        "eyeAxisLocationRatio": {
            "state": true
        },
        "eyeAxysAngle": {
            "state": true
        },
        "eyeSeparation": {
            "state": true
        },
        "face": {
            "state": true
        },
        "faceDetected": {
            "state": true
        },
        "flashCharge": {
            "state": true
        },
        "flashProperty": {
            "state": true
        },
        "flashWidth": {
            "state": true
        },
        "imageAdjustmentModal": {
            "state": true
        },
        "imageFilterBase64": {
            "state": true
        },
        "imageFilterModal": {
            "state": true
        },
        "imageFormat": {
            "state": true
        },
        "isCapturing": {
            "state": true
        },
        "isoValue": {
            "state": true
        },
        "isPreviewing": {
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
        "manualEyeSelection": {
            "state": true
        },
        "model": {
            "state": true
        },
        "offAngleGaze": {
            "state": true
        },
        "originalImage": {
            "state": true
        },
        "poseAngleYaw": {
            "state": true
        },
        "postProcessFilterAdjust": {
            "state": true
        },
        "preset": {
            "state": true
        },
        "previewSize": {
            "state": true
        },
        "previewType": {
            "state": true
        },
        "rawImage": {
            "state": true
        },
        "rightOrLeftEyeClosed": {
            "state": true
        },
        "segmentation": {
            "state": true
        },
        "segmentedImage": {
            "state": true
        },
        "serial": {
            "state": true
        },
        "serviceConfigs": {
            "state": true
        },
        "shallCapture": {
            "state": true
        },
        "showCameraConfiguration": {
            "state": true
        },
        "showLoader": {
            "state": true
        },
        "showPreviewTemplate": {
            "state": true
        },
        "shutterSpeed": {
            "state": true
        },
        "startPreviewTime": {
            "state": true
        },
        "tab": {
            "state": true
        },
        "tempFace": {
            "type": "Any",
            "attr": "temp-face"
        },
        "tempPerson": {
            "type": "Any",
            "attr": "temp-person"
        },
        "theme": {
            "type": String,
            "attr": "theme",
            "mutable": true
        },
        "track": {
            "state": true
        },
        "translations": {
            "state": true
        },
        "uploadedBase64": {
            "state": true
        },
        "uploadedBase64Original": {
            "state": true
        },
        "validation": {
            "state": true
        },
        "video": {
            "state": true
        },
        "whiteBalance": {
            "state": true
        }
    }; }
    static get style() { return "/**style-placeholder:openbio-face-details:**/"; }
}
