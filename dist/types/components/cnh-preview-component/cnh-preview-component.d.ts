import '../../stencil.core';
interface PreviewSize {
    width: string | number;
    height: string | number;
    unit?: string;
}
export declare class CnhPreviewComponent {
    private ws;
    componentContainer: HTMLStencilElement;
    person: any;
    photo: any;
    inputSignature: any;
    size: PreviewSize;
    cnhTemplate: string;
    signature: string;
    componentDidLoad(): Promise<void>;
    loadWsListeners(): void;
    open(): void;
    removeSignatureBackground(): void;
    applyCpfMask(cpf: any): string;
    formatDate(date: any): string;
    render(): JSX.Element;
}
export {};
