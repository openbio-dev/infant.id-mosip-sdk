import { notify } from '../../utils/notifier';
import WS from "../../utils/websocket";
import { faceAuthenticate, authLog, getPeople } from '../openbio-face-auth-component/api';
import * as faceapi from 'face-api.js';
import { TranslationUtils } from '../../locales/translation';
import { getAppConfig } from "../../utils/api";
import { getThemeByApplicationType } from "../../utils/utils";
const WebsocketStatus = {
    INITIALIZED: "initialized"
};
export class OpenbioFaceAuthComponent {
    constructor() {
        this.ws = new WS();
        this.showFullscreenLoader = false;
        this.debug = false;
        this.thresholdAuthenticate = 1;
        this.captured = false;
        this.authenticateError = false;
        this.faceDetected = false;
        this.countdown = 3;
        this.videoInterval = undefined;
        this.cameraInitialized = false;
        this.theme = "default";
        this.locale = 'pt';
        this.session = {
            store: (authentication) => {
                this.ws.respondToDeviceWS({ action: "store-session", data: { type: "auth", owner: "default-user", biometry: authentication } });
            }
        };
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
    closeComponent() {
        this.ws.respondToDeviceWS({ action: "store-session", data: { type: "authenticate", owner: "default-user" } });
    }
    saveLog(authLogBody) {
        authLogBody.type = "FACE";
        authLogBody.cpf = this.cpfState || this.cpf;
        authLog(authLogBody);
    }
    screenUpdate() {
        this.componentContainer.forceUpdate();
    }
    async getPerson() {
        if (!this.useOpenbioMatcherState) {
            return;
        }
        try {
            this.person = await getPeople(this.cpfState);
        }
        catch (e) {
            console.log(e);
        }
    }
    startFaceApi() {
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('./assets/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('./assets/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('./assets/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('./assets/models')
        ]).then(() => this.startCamera());
    }
    startCamera() {
        this.captured = false;
        this.countdown = 3;
        const videoElement = document.getElementsByTagName("openbio-face-auth")[0].shadowRoot.lastElementChild.getElementsByClassName("webcam-video")[0];
        videoElement.setAttribute('autoplay', '');
        videoElement.setAttribute('muted', '');
        videoElement.setAttribute('playsinline', '');
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then((stream) => {
                videoElement.srcObject = stream;
                if (this.hiddenCamera) {
                    setTimeout(() => {
                        videoElement.play();
                    }, 1 * 1000);
                }
            })
                .catch((e) => {
                console.error(e);
            });
        }
        if (!this.cameraInitialized) {
            faceapi.env.setEnv(Object.assign({}, faceapi.env.createBrowserEnv()));
            videoElement.addEventListener("play", () => {
                this.cameraInitialized = true;
                const canvas = document.getElementsByTagName("openbio-face-auth")[0].shadowRoot.lastElementChild.getElementsByClassName("face-canvas")[0];
                const displaySize = { width: videoElement.width, height: videoElement.height };
                faceapi.matchDimensions(canvas, displaySize);
                this.videoInterval = setInterval(async () => {
                    if (!this.videoInterval) {
                        this.countdown = 3;
                    }
                    this.screenUpdate();
                    const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    this.faceDetected = detections.length > 0;
                    if (this.faceDetected) {
                        if (this.countdown <= 0 && !this.captured) {
                            this.takeSnapShot();
                        }
                        else {
                            this.countdown -= 0.1;
                        }
                    }
                    else {
                        this.countdown = 3;
                    }
                }, 100);
            });
        }
    }
    loadWebsocketListeners() {
        this.ws.deviceSocket.addEventListener("message", (event) => {
            if (!event.data || !JSON.parse(event.data)) {
                return;
            }
            const { status } = JSON.parse(event.data);
            if (status === WebsocketStatus.INITIALIZED) {
                this.session.store({ result: "aborted" });
            }
        });
    }
    takeSnapShot() {
        clearInterval(this.videoInterval);
        this.videoInterval = undefined;
        const videoElement = document.getElementsByTagName("openbio-face-auth")[0].shadowRoot.lastElementChild.getElementsByClassName("webcam-video")[0];
        videoElement.pause();
        this.screenUpdate();
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataURI = canvas.toDataURL('image/jpeg');
        const snapShotElement = document.getElementsByTagName("openbio-face-auth")[0].shadowRoot.lastElementChild.getElementsByClassName("webcam-snapshot")[0];
        snapShotElement.src = dataURI;
        this.captured = true;
        this.screenUpdate();
        if (this.debug) {
            const similarity = Math.round(Math.random()) === 0 ? Math.random() * 39 : Math.random() * (60 - 41) + 41;
            const authResult = { result: similarity > 40 };
            this.session.store(authResult);
            if (similarity > 40) {
                notify(this.componentContainer, "success", this.translations.AUTHENTICATION_SUCCESS);
                this.authenticateError = false;
                this.saveLog({ status: "success" });
                setTimeout(() => {
                    this.closeComponent();
                }, 1.5 * 1000);
            }
            else {
                notify(this.componentContainer, "error", this.translations.AUTHENTICATION_ERROR);
                this.authenticateError = true;
                this.saveLog({ status: "fail", description: "match failed" });
                if (this.thresholdAuthenticate >= 3) {
                    this.closeComponent();
                }
                this.thresholdAuthenticate += 1;
            }
            this.onMatcherResult.emit(authResult);
            this.showFullscreenLoader = false;
        }
        else {
            faceAuthenticate({
                cpf: this.cpfState,
                face: {
                    data: dataURI.split(",")[1]
                },
                debug: this.debug,
            }).then((resolve) => {
                const authResult = { result: resolve && resolve.similarity > 40 };
                this.session.store(authResult);
                if (resolve && resolve.similarity > 40) {
                    notify(this.componentContainer, "success", this.translations.AUTHENTICATION_SUCCESS);
                    this.authenticateError = false;
                    this.saveLog({ status: "success", matchImage: dataURI.split(",")[1], score: resolve.similarity });
                    setTimeout(() => {
                        this.closeComponent();
                    }, 1.5 * 1000);
                }
                else {
                    notify(this.componentContainer, "error", this.translations.AUTHENTICATION_ERROR);
                    this.authenticateError = true;
                    this.saveLog({ status: "fail", description: "match failed", matchImage: dataURI.split(",")[1], score: resolve.similarity });
                    if (this.thresholdAuthenticate >= 3) {
                        this.closeComponent();
                    }
                    this.thresholdAuthenticate += 1;
                }
                this.onMatcherResult.emit(authResult);
                this.showFullscreenLoader = false;
            }, (reject) => {
                this.showFullscreenLoader = false;
                console.log(reject);
            });
        }
    }
    getCaptureText() {
        return this.captured ? this.translations.TRY_AGAIN : this.translations.MANUAL_CAPTURE;
    }
    async componentDidLoad() {
        this.config = await getAppConfig();
        this.theme = getThemeByApplicationType(this.config.applicationType);
        this.loadWebsocketListeners();
        let location = undefined;
        let queryObj = undefined;
        window.global = window;
        const _global = window || global;
        if (_global) {
            console.log(_global);
            location = _global.location;
        }
        if (location) {
            const { search } = location;
            if (search !== "") {
                queryObj = JSON.parse('{"' + decodeURI(search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
            }
        }
        this.useOpenbioMatcherState = queryObj ? queryObj.useOpenbioMatcher === "true" : this.useOpenbioMatcher;
        if (this.isDebug !== undefined) {
            this.debug = this.isDebug;
        }
        this.cpfState = queryObj ? queryObj.cpf : this.cpf;
        this.personNameState = queryObj ? queryObj.personName : this.personName;
        this.personImageState = queryObj ? queryObj.personImage : this.personImage;
        this.debug = queryObj ? queryObj.debug : !!this.debug;
        this.getPerson();
        this.startFaceApi();
    }
    render() {
        const personFaceBiometry = this.person && this.person.Biometries && this.person.Biometries.find((item) => item.biometry_type === 1);
        return (h("div", { class: "component-container", "data-theme": this.theme },
            h("div", { class: "window-size margin-left-fix" },
                h("loader-component", { enabled: this.showFullscreenLoader }),
                h("div", { id: "notification-container" }),
                h("nav", { class: 'navbar' },
                    h("div", { class: 'title is-3 has-text-centered has-text-white has-background-primary', style: { "width": "100%", "padding-top": "7px" } }, this.translations.BIOMETRIC_AUTHENTICATION)),
                h("div", { class: 'level', style: { "margin-top": "30px" } },
                    h("div", { class: 'level-item has-text-centered', style: { width: "50%" } },
                        h("div", { class: 'section' },
                            this.debug || ((personFaceBiometry && personFaceBiometry.FaceBiometries[0] && personFaceBiometry.FaceBiometries[0].data) || (this.personImageState)) ?
                                h("section", { class: "section" },
                                    h("figure", { class: "image" },
                                        h("img", { class: "is-rounded", style: { "width": "100%", "max-width": "250px", "max-height": "250px", "object-fit": "cover" }, src: this.debug ? './assets/face-empty.jpg' : `data:image/png;base64, ${this.personImageState || (personFaceBiometry && personFaceBiometry.FaceBiometries[0].data)}` })))
                                : undefined,
                            h("div", { class: "media-content" },
                                h("p", { class: "title is-4 has-text-weight-semibold", style: { textAlign: "center" } }, this.debug ? 'Ana Júlia Teste' : (this.personNameState || this.person && this.person.full_name)),
                                this.cpfState || this.person && this.person.cpf ?
                                    h("p", { class: "title is-6 has-text-grey", style: { textAlign: "center" } }, this.cpfState || (this.person && this.person.cpf))
                                    : undefined))),
                    h("div", { class: 'level-item has-text-centered' },
                        h("div", { style: { "border-left": "1px solid #16658a", "height": "500px" } })),
                    h("div", { class: 'rows has-text-centered', style: { width: "50%" } },
                        h("div", { class: "row", style: { paddingLeft: "65px", paddingRight: "65px", display: this.hiddenCamera ? "none" : "inline-block" } },
                            h("div", { style: { position: "relative", width: "333px", height: "250px", display: this.captured ? "none" : "inline-block" } },
                                this.faceDetected && this.countdown > 0 ?
                                    h("div", { class: "overlay" },
                                        h("span", null,
                                            " ",
                                            Math.floor(this.countdown),
                                            " "))
                                    : null,
                                h("canvas", { class: "face-canvas", width: "333", height: "250", style: { display: this.captured ? "none" : "inline-block" } }),
                                h("video", { id: "video", class: "webcam-video", height: "250", width: "333", autoplay: true, muted: true, style: { display: this.captured ? "none" : "inline-block" } })),
                            h("img", { id: "img", height: "250", class: "webcam-snapshot", style: { height: "250px !important", display: this.captured ? "inline" : "none", marginBottom: "5px" } })),
                        !this.hiddenCamera ?
                            h("div", { class: "row has-text-centered" },
                                h("a", { class: `btn-primary ${this.faceDetected ? "" : "disabled"}`, onClick: () => this.captured ? this.startCamera() : this.takeSnapShot() }, this.getCaptureText()))
                            : null,
                        this.hiddenCamera ?
                            h("div", { class: "rows", style: { marginTop: "50px" } },
                                h("div", { class: "row" },
                                    h("img", { class: "face-detection", src: this.captured ? `./assets/face/icon-face-rec-${this.authenticateError ? "error" : "ok"}.png` : `./assets/face/icon-face-rec.png` })),
                                !this.captured ?
                                    h("div", { class: "row", style: { marginTop: "45px" } },
                                        h("span", { class: "face-detection-text" },
                                            " ",
                                            this.faceDetected && this.countdown > 0 ? `Face detectada (${Math.floor(this.countdown)})` : "Aguardando detecção de face",
                                            " "))
                                    : this.authenticateError ?
                                        h("div", { class: "row has-text-centered" },
                                            h("a", { class: `btn-primary`, onClick: () => this.startCamera() },
                                                " ",
                                                this.translations.TRY_AGAIN,
                                                " "))
                                        : null)
                            : null)))));
    }
    static get is() { return "openbio-face-auth"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "authenticateError": {
            "state": true
        },
        "cameraInitialized": {
            "state": true
        },
        "captured": {
            "state": true
        },
        "componentContainer": {
            "elementRef": true
        },
        "config": {
            "state": true
        },
        "countdown": {
            "state": true
        },
        "cpf": {
            "type": String,
            "attr": "cpf"
        },
        "cpfState": {
            "state": true
        },
        "debug": {
            "state": true
        },
        "faceDetected": {
            "state": true
        },
        "hiddenCamera": {
            "type": Boolean,
            "attr": "hidden-camera"
        },
        "isDebug": {
            "type": Boolean,
            "attr": "is-debug"
        },
        "locale": {
            "type": String,
            "attr": "locale",
            "mutable": true,
            "watchCallbacks": ["listenLocale"]
        },
        "person": {
            "state": true
        },
        "personImage": {
            "type": String,
            "attr": "person-image"
        },
        "personImageState": {
            "state": true
        },
        "personName": {
            "type": String,
            "attr": "person-name"
        },
        "personNameState": {
            "state": true
        },
        "showFullscreenLoader": {
            "state": true
        },
        "theme": {
            "state": true
        },
        "thresholdAuthenticate": {
            "state": true
        },
        "translations": {
            "state": true
        },
        "useOpenbioMatcher": {
            "type": Boolean,
            "attr": "use-openbio-matcher"
        },
        "useOpenbioMatcherState": {
            "state": true
        },
        "videoInterval": {
            "state": true
        }
    }; }
    static get events() { return [{
            "name": "onMatcherResult",
            "method": "onMatcherResult",
            "bubbles": true,
            "cancelable": true,
            "composed": true
        }]; }
    static get style() { return "/**style-placeholder:openbio-face-auth:**/"; }
}
