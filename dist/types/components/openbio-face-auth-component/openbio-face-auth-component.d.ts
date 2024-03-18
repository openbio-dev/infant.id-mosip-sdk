import '../../stencil.core';
import { EventEmitter } from "../../stencil.core";
import WS from "../../utils/websocket";
interface AuthLogBody {
    type?: string;
    cpf?: string;
    status: string;
    description?: string;
    matchImage?: string;
    score?: number;
}
export declare class OpenbioFaceAuthComponent {
    ws: WS;
    useOpenbioMatcher: boolean;
    cpf: string;
    isDebug: boolean;
    hiddenCamera: boolean;
    personName: string;
    personImage: string;
    componentContainer: HTMLStencilElement;
    showFullscreenLoader: boolean;
    useOpenbioMatcherState: boolean;
    cpfState: string;
    personNameState: string;
    personImageState: string;
    debug: boolean;
    thresholdAuthenticate: number;
    captured: boolean;
    authenticateError: boolean;
    faceDetected: boolean;
    countdown: number;
    videoInterval: any;
    cameraInitialized: boolean;
    config: any;
    theme: string;
    person: any;
    translations: any;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    onMatcherResult: EventEmitter<any>;
    session: {
        store: (authentication: any) => void;
    };
    setI18nParameters(locale: any): Promise<void>;
    closeComponent(): void;
    saveLog(authLogBody: AuthLogBody): void;
    screenUpdate(): void;
    getPerson(): Promise<void>;
    startFaceApi(): void;
    startCamera(): void;
    loadWebsocketListeners(): void;
    takeSnapShot(): void;
    getCaptureText(): any;
    componentDidLoad(): Promise<void>;
    render(): JSX.Element;
}
export {};
