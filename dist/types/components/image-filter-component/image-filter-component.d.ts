import '../../stencil.core';
export declare class GuideImageComponent {
    componentContainer: HTMLStencilElement;
    src: string;
    filterCallback: any;
    parentComponentContext: any;
    parentElementTag: string;
    currentElementTag: string;
    filters: any;
    translations: any;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    componentDidLoad(): Promise<void>;
    loadFilters(filters: any): void;
    getCanvas(): Element;
    loadImage(): void;
    getConfirmPopUpHtml(finalImage: any): string;
    finalize(): any;
    sliderInput(filter: any, event: any): void;
    textInput(filter: any, event: any): void;
    checkInput(filter: any, event: any): void;
    getFilters(): any;
    render(): JSX.Element;
}
