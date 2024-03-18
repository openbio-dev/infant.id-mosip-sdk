export declare function getAppConfig(): Promise<any>;
export declare function getCameraPresets(): Promise<any>;
declare type ServiceTimes = "FINGER" | "INFANT" | "FACE" | "MUGSHOT" | "SIGNATURE" | "BIOGRAPHY" | "SCANNER" | "PALM";
declare type ServiceTimesParameters = {
    personId: number;
    type: ServiceTimes;
    processingTime: number;
    observations?: string;
    details?: string;
    brand?: string;
    model?: string;
    serial?: string;
};
export declare function saveServiceTime(parameters: ServiceTimesParameters): Promise<any>;
export declare function getPersonById(id: any): Promise<any>;
export {};
