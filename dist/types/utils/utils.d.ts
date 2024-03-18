export declare function format(first: string, middle: string, last: string): string;
export declare function getLocalization(): Promise<{}>;
export declare function addCustomLink(url: string): void;
export declare const THEMES: {
    default: {
        primary: string;
        secondary: string;
        accent: string;
    };
    infant: {
        primary: string;
        secondary: string;
        accent: string;
    };
};
export declare function getThemeByApplicationType(type: string): "infant" | "default";
