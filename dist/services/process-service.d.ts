export default class ProcessService {
    static PID_PATH: string;
    static LOG_PATH: string;
    runDetached(args: string[]): number | undefined;
    isRunning(): boolean;
    getPid(): number;
    kill(): void;
    cleanup(): void;
    private writePidFile;
}
