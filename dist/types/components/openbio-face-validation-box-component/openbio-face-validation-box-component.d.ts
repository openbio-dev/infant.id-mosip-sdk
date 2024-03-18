import '../../stencil.core';
export declare class OpenbioFaceValidationBoxComponent {
    componentContainer: HTMLStencilElement;
    leftIcon: boolean;
    status: any;
    type: string;
    typeTitle: string;
    detached: boolean;
    statusMessage: string;
    translations: any;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    setI18nParameters(locale: any): Promise<void>;
    getStatusMessage(): string;
    getClasses(): string;
    render(): JSX.Element;
}
