import '../../stencil.core';
import WS from '../../utils/websocket';
export declare class OpenbioSignatureComponent {
    ws: WS;
    payload: any;
    componentContainer: HTMLStencilElement;
    deviceReady: boolean;
    forceLoadComponent: boolean;
    captureInput: HTMLInputElement;
    translations: any;
    config: any;
    theme: string;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    setI18nParameters(locale: any): Promise<void>;
    componentDidUnload(): void;
    componentDidLoad(): Promise<void>;
    render(): JSX.Element;
}