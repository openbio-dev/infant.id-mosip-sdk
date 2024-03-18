import '../../stencil.core';
export declare class ImageCropperComponent {
    componentContainer: HTMLStencilElement;
    aspectRatio: any;
    cropBoxResizable: boolean;
    customizedImageSize: boolean;
    src: string;
    parentElementTag: string;
    currentElementTag: string;
    parentComponentContext: any;
    cropCallback: any;
    cropper: any;
    segment: boolean;
    translations: any;
    locale: string;
    listenLocale(newValue: string): Promise<void>;
    componentWillLoad(): Promise<void>;
    setI18nParameters(locale: any): Promise<void>;
    componentDidLoad(): void;
    crop(): any;
    segmentCheckInput(): void;
    render(): JSX.Element;
}
