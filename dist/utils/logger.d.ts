import * as winston from 'winston';
declare const logger: winston.Logger;
export declare function profile(id: string, meta?: any): winston.Logger | undefined;
export declare function logError(error: any): void;
export declare function createFileLogger(filename: string): winston.Logger;
export default logger;
