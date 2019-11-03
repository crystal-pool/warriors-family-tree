export class Stopwatch {
    private _startTime = 0;
    private _elapsed = 0;
    private _isRunning = false;
    public static startNew() {
        const sw = new Stopwatch();
        sw.start();
        return sw;
    }
    public constructor() {
    }
    public start() {
        if (this._isRunning) return;
        this._startTime = performance.now();
        this._isRunning = true;
    }
    public stop() {
        if (!this._isRunning) return;
        this._isRunning = false;
        this._elapsed += performance.now() - this._startTime;
    }
    public reset() {
        this._isRunning = false;
        this._startTime = 0;
        this._elapsed = 0;
    }
    public restart() {
        this.reset();
        this.start();
    }
    public get isRunning() {
        return this._isRunning;
    }
    public get elapsed() {
        return this._isRunning
            ? Math.round(this._elapsed * 1000) / 1000
            : Math.round((this._elapsed + (performance.now() - this._startTime)) * 1000) / 1000;
    }
}
