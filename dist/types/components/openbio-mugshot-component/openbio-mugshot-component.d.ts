import '../../stencil.core';
import WS from '../../utils/websocket';
export declare class OpenbioMugshotComponent {
    ws: WS;
    payload: any;
    componentContainer: HTMLStencilElement;
    deviceReady: boolean;
    forceLoadComponent: boolean;
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
