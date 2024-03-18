import '../../stencil.core';
export declare class OpenbioMugshotComponentDetails {
    private ws;
    private wsStatusInterval;
    private canvas?;
    private person;
    private payload;
    constructor();
    componentContainer: HTMLStencilElement;
    detached: boolean;
    isTagComponent: boolean;
    tempPerson: any;
    tempMugshotPhotos: any;
    allowConfiguration: any;
    capturedData: any;
    deviceReady: boolean;
    eyeAxisLocationRatio: string;
    centerLineLocationRatio: string;
    eyeSeparation: string;
    poseAnglePitch: string;
    eyeAxysAngle: string;
    poseAngleYaw: string;
    rightOrLeftEyeClosed: string;
    originalImage: string;
    croppedImage: string;
    segmentedImage: string;
    rawImage: string;
    crop: boolean;
    segmentation: boolean;
    autoCapture: boolean;
    flashCharge: number;
    mugshotIndex: string;
    mugshotDescription: string;
    mugshotPhotos: Array<any>;
    cameraSettingsOptions: any;
    tab: number;
    anomalyOptions: Array<any>;
    anomaly: number;
    backendSession: any;
    showLoader: boolean;
    flashProperty: number;
    flashWidth: number;
    aperture: number;
    shutterSpeed: number;
    imageFormat: number;
    isoValue: number;
    whiteBalance: number;
    isCapturing: boolean;
    model: string;
    brand: string;
    serial: string;
    video: any;
    track: any;
    serviceConfigs: any;
    deviceStatus: boolean;
    showCameraConfiguration: boolean;
    startPreviewTime: number;
    translations: any;
    cameraPresetOptions: any;
    preset: number;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    setI18nParameters(locale: any): Promise<void>;
    open(): void;
    applyCameraSettings(): Promise<void>;
    sendServiceTimeInformation(observations?: string, details?: string): Promise<void>;
    fetchCurrentCameraSettings(): Promise<void>;
    setPresetValues(event: any): void;
    isWebcam(): boolean;
    buildWebcam(): void;
    componentDidLoad(): Promise<void>;
    componentDidUnload(): void;
    setMugshotsFromBackendSession(): void;
    findSetting(settings: any, name: string): any;
    clearImages(): void;
    close(): void;
    getWebcam(): void;
    startPreview(): void;
    stopPreview(): void;
    capture(): Promise<void>;
    setCameraValue(event: any): void;
    increaseZoom(): void;
    decreaseZoom(): void;
    updateCameraSettings(): void;
    setFeature(event: any): void;
    emitLoadInformation(): void;
    sendBiometryInformation(mugshot: any): void;
    activeTabClass(num: number): "" | "is-active";
    setActiveTab(num: number): void;
    isActiveTab(tab: number): "is-flex" | "is-hidden";
    setSelection(event: any): void;
    saveMugshotPhoto(): Promise<void>;
    resetStates(): void;
    storeCapturedMugshot(saveMugshotResult: any): void;
    acceptData(): void;
    handleChange(event: any): void;
    handleDeleteMugshotPhoto(id: number, index?: number): Promise<void>;
    clearSession(): void;
    updateSessionData(): void;
    render(): JSX.Element;
}
