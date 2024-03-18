import '../../stencil.core';
import WS from '../../utils/websocket';
export declare class OpenbioSignatureComponent {
    ws: WS;
    componentContainer: HTMLStencilElement;
    config: any;
    theme: string;
    componentDidLoad(): Promise<void>;
    render(): JSX.Element;
}
