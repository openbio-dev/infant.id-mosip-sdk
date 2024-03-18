import '../../stencil.core';
export declare class GuideImageComponent {
    componentContainer: HTMLStencilElement;
    src: string;
    helpText: string;
    isHelpModalActive: boolean;
    translations: any;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    setHelpModalStatus(status: boolean): void;
    setI18nParameters(locale: any): Promise<void>;
    componentDidLoad(): void;
    render(): JSX.Element;
}
