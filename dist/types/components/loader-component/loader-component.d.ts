import '../../stencil.core';
export declare class LoaderComponent {
    componentContainer: HTMLStencilElement;
    enabled: boolean;
    text: string;
    locale: string;
    translations: any;
    listenLocale(newValue: string): Promise<void>;
    listenEnable(newValue: boolean): void;
    setI18nParameters(locale: any): Promise<void>;
    componentWillLoad(): Promise<void>;
    render(): JSX.Element;
}
