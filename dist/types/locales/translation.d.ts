export declare namespace TranslationUtils {
    function setLocale(value: any): Promise<void>;
    function fetchTranslations(): Promise<any>;
    function concatTranslate(key: string, params: Array<string>): any;
}
