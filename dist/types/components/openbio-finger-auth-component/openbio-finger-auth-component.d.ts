import '../../stencil.core';
import { EventEmitter } from "../../stencil.core";
import WS from "../../utils/websocket";
declare enum FlowTypes {
    FLOW_TYPE_TEN_FLAT_CAPTURES = 0,
    FLOW_TYPE_TEN_ROLLED_CAPTURES = 1,
    FLOW_TYPE_FIVE_FLAT_CAPTURES = 2,
    FLOW_TYPE_THREE_FLAT_CAPTURES = 3,
    FLOW_TYPE_SEQUENCE_CONTROL_CAPTURE = 4,
    FLOW_TYPE_TWO_FLAT_SEQUENCE_CONTROL_CAPTURE = 5,
    FLOW_TYPE_FOUR_FLAT_SEQUENCE_CONTROL_CAPTURE = 6,
    FLOW_TYPE_PINCH = 7
}
declare type ModalSettings = {
    storeOriginalImage: boolean;
    repetitionControl: any;
    generateBMP: boolean;
    failControl: object;
    match?: any;
    device?: string;
    flowType: FlowTypes;
};
declare enum CaptureType {
    FLAT = 0,
    ROLLED = 1
}
interface AuthLogBody {
    type?: string;
    cpf?: string;
    status: string;
    description?: string;
    matchImage?: string;
    score?: number;
}
export declare class OpenbioFingerAuthComponent {
    ws: WS;
    private wsStatusInterval;
    private fingerPreviewCanvas?;
    private fingerNames;
    useOpenbioMatcher: boolean;
    cpf: string;
    isDebug: boolean;
    personName: string;
    personImage: string;
    componentContainer: HTMLStencilElement;
    showFullscreenLoader: boolean;
    modalSettings: ModalSettings;
    fingerPreviewCurrentRollingStatus: any;
    fingerPreviewCurrentStatusLineX: any;
    fingerNfiqScore: number | string;
    fingerAuthenticationSimilarity: number;
    fingerOriginalImage: string;
    deviceModel: string;
    deviceBrand: string;
    deviceSerial: string;
    captureType: CaptureType;
    selectedFinger: {
        index: number;
        name: string;
    };
    currentFingerImage: string;
    useOpenbioMatcherState: boolean;
    cpfState: string;
    personNameState: string;
    personImageState: string;
    debug: boolean;
    fingerAuthenticate: boolean;
    thresholdAuthenticate: number;
    captureMessage: string;
    person: any;
    ready: boolean;
    translations: any;
    config: any;
    theme: string;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    setI18nParameters(locale: any): Promise<void>;
    onMatcherResult: EventEmitter<any>;
    onCaptureFingerprintResult: EventEmitter<any>;
    private payload;
    clearCanvasFingerImage(): void;
    session: {
        store: (authentication: any) => void;
        load: () => void;
    };
    device: {
        open: () => void;
        close: () => void;
        prepareToPreview: () => void;
        startPreview: () => void;
        stopPreview: () => void;
        stopPreviewProcessor: () => void;
        clearCapture: () => void;
    };
    getModalSettings(): Promise<void>;
    closeComponent(): void;
    saveLog(authLogBody: AuthLogBody): void;
    loadWebsocketListeners(): void;
    getPerson(): Promise<void>;
    setCurrentFingerImage(): void;
    setSelectionCaptureType(event: any): void;
    setSelectionFingerList(event: any): void;
    componentDidLoad(): Promise<void>;
    componentDidUnload(): void;
    applyCpfMask(cpf: string): string;
    getPersonPhoto(): string;
    render(): JSX.Element;
}
export {};
