import '../../stencil.core';
import WS from '../../utils/websocket';
export declare class OpenbioSignatureComponentDetails {
    ws: WS;
    private wsStatusInterval;
    private canvas?;
    private modalCard?;
    private payload;
    componentContainer: HTMLStencilElement;
    detached: boolean;
    isTagComponent: boolean;
    tempPerson: any;
    theme: string;
    imgTest: any;
    deviceReady: boolean;
    deviceOpened: boolean;
    backendSession: any;
    showLoader: boolean;
    isCapturing: boolean;
    model: string;
    brand: string;
    serial: string;
    deviceStatus: boolean;
    serviceConfigs: any;
    person: any;
    modal: any;
    form: any;
    deviceList: any;
    selectedDevice: string;
    formType: number;
    palmType: number;
    palmFormType: number;
    disableFormSelection: boolean;
    anomalyOptions: Array<any>;
    palmAnomalyOptions: Array<any>;
    anomaly: any;
    captureInput: HTMLInputElement;
    translations: any;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    setI18nParameters(locale: any): Promise<void>;
    clearImages(): void;
    start(): void;
    capture(): Promise<void>;
    close(): void;
    open(): void;
    setAnomaly(event: any): void;
    setPalmAnomaly(event: any): void;
    setQueryParams(): void;
    componentDidLoad(): void;
    base64ToArrayBuffer(base64: any): ArrayBuffer | SharedArrayBuffer;
    componentDidUnload(): void;
    toggleFormModal(): void;
    clearRects(): void;
    loadRoiImage(file: any): void;
    getFingerName(index: any): string;
    getPalmName(index: any): string;
    drawBoxOn(box: any, context: any): void;
    newBox(x1: any, y1: any, x2: any, y2: any): {
        topLeft: {
            x: any;
            y: any;
        };
        bottomRight: {
            x: any;
            y: any;
        };
        lineWidth: number;
        color: any;
    };
    redraw(): void;
    loadForm(file: any): Promise<void>;
    acceptData(): void;
    emitLoadInformation(): void;
    sendFingersInformation(finger: any): void;
    saveFingersToSession(): Promise<{}>;
    savePalmToSession(palm: any): Promise<{}>;
    insertPalm(palm: any): void;
    setDeviceSelection(event: any): void;
    setFormTypeSelection(event: any): void;
    setPalmFormTypeSelection(event: any): void;
    setPalmarTypeSelection(event: any): void;
    setAutoNextSelection(event: any): void;
    resetForm(): void;
    closeFingerModal(): void;
    modalContentScrollToBottom(): void;
    manualCrop(): any;
    screenUpdate(): void;
    canCapture(): boolean;
    canUpload(): boolean;
    showFingerSelectionRect(finger: any): void;
    showPalmSelectionRect(palm: any): void;
    palmSelection(): any;
    fingerSelection(rightHand?: boolean): JSX.Element[];
    fingerResult(rightHand?: boolean): JSX.Element[];
    palmsResult(): any;
    retryManualCrop(): void;
    getResult(): JSX.Element;
    isPalmCaptured(type: number): boolean;
    showModal(base64String: any): void;
    hideModal(): void;
    palmCaptures(): JSX.Element;
    getSelectedAnomaly(option: any): boolean;
    getSelectedPalmAnomaly(option: any): boolean;
    showSucessSaveMessage(): void;
    render(): JSX.Element;
}