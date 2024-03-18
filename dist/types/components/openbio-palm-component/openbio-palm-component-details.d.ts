import '../../stencil.core';
import WS from '../../utils/websocket';
declare enum PALM_TYPES {
    UNDEFINED = -1,
    RIGHT_PALM0 = 0,
    RIGHT_PALM = 1,
    RIGHT_HYPOTHENAR = 2,
    LEFT_PALM = 3,
    LEFT_HYPOTHENAR = 4,
    RIGHT_PALM_FINGERS = 5,
    LEFT_PALM_FINGERS = 6,
    THUMBS = 7,
    LEFT_HYPOTHENAR_PALM = 8,
    RIGHT_HYPOTHENAR_PALM = 9,
    RIGHT_PINKY_RING_FINGERS = 10,
    RIGHT_MIDDLE_INDEX_FINGERS = 11,
    RIGHT_THUMB_FINGER = 12,
    LEFT_THUMB_FINGER = 13,
    LEFT_MIDDLE_INDEX_FINGERS = 14,
    LEFT_PINKY_RING_FINGERS = 15
}
declare enum CAPTURE_TYPES {
    FLAT = 4,
    SIDE = 5,
    MANUAL = 6
}
export declare class OpenbioPalmComponent {
    ws: WS;
    private wsStatusInterval;
    private canvas?;
    private palmNames;
    private person;
    private payload;
    componentContainer: HTMLStencilElement;
    detached: boolean;
    isTagComponent: boolean;
    tempPerson: any;
    tempPalms: any;
    cpf: string;
    personImage: string;
    personName: string;
    singleCapture: boolean;
    fingerCaptureType: number;
    useOpenbioMatcher: boolean;
    onCaptureFingerprint: Function;
    onOpenbioMatcher: Function;
    theme: string;
    capturedData: any;
    originalImage: string;
    deviceReady: boolean;
    nfiqScore: number;
    captureType: number;
    captureTypeName: string;
    stepPhase: number;
    flowType: number;
    currentRollingStatus: number;
    currentStatusLineX: number;
    flowOptions: Array<any>;
    anomalyOptions: Array<any>;
    anomaly: any;
    anomalies: Array<any>;
    currentFingerNames: Array<string>;
    currentFingerImage: any;
    currentFingerSequence: Array<any>;
    fingerSequence: Array<any>;
    fingers: Array<any>;
    tab: number;
    backendSession: any;
    repetitionControl: boolean;
    match: boolean;
    disabledControls: boolean;
    generateBMP: boolean;
    storeOriginalImage: boolean;
    modalSettings: any;
    failControl: any;
    unmatchCount: number;
    repeatedCount: number;
    smearCount: number;
    badNfiqQualityCount: number;
    model: string;
    brand: string;
    serial: string;
    opened: boolean;
    fingerNamesList: Array<String>;
    fingersToCapture: Array<any>;
    editingId: number;
    isEditing: boolean;
    showLoader: boolean;
    loaderText: string;
    showControlDisable: boolean;
    serviceConfigs: any;
    personInfo: any;
    selectedFinger: any;
    authenticationSimilarity: number;
    useOpenbioMatcherSt: boolean;
    cpfSt: string;
    singleCaptureSt: boolean;
    singleCaptureLoading: boolean;
    captureDone: boolean;
    palms: any[];
    currentPalm: number;
    startPreviewTime: number;
    translations: any;
    sequence: number[];
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    setI18nParameters(locale: any): Promise<void>;
    componentWillLoad(): Promise<void>;
    clearImages(): void;
    startPreview(): void;
    stopPreview(): void;
    stopPreviewprocessor(): void;
    open(): void;
    prepareToPreview(): void;
    setPalmsFromBackendSession(): void;
    sendServiceTimeInformation(observations?: string, details?: string): Promise<void>;
    setLoader(value: boolean, text?: string): void;
    componentDidLoad(): Promise<void>;
    getCaptureSequence(): PALM_TYPES[];
    componentDidUnload(): void;
    setCurrentFingerImage(): void;
    getCurrentCaptureType(): CAPTURE_TYPES;
    nextCapture(): Promise<void>;
    rearrange(palm: any): void;
    insertIntoPalms(palm: any): Promise<void>;
    saveAnomaly(): Promise<void>;
    clearSession(): void;
    clearCapture(): void;
    isPalmCaptured(type: number): boolean;
    isCurrentPalm(index: number): boolean;
    collectPalm(type: number): void;
    acceptData(): void;
    emitLoadInformation(): void;
    savePalmToSession(palm: any): Promise<{}>;
    activeTabClass(num: number): "" | "is-active";
    setActiveTab(num: number): void;
    setSelection(event: any): void;
    updateDisabledControls(): void;
    editPalm(_this: any, palm: any): void;
    forceUpdate(): void;
    setAnomaly(fingerIndex: number, event: any): void;
    getCollectText(): JSX.Element;
    palmCaptures(): JSX.Element;
    palmResults(): JSX.Element;
    render(): JSX.Element;
}
export {};
