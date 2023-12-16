import { DocumentInfo } from "../core/document-info";


export interface IntervalOptions {
    startIndex: number;
    startLine: number;
    stopIndex: number;
    stopLine: number;
    text: string;
    // di: DocumentInfo;
}
/**
 * 范围间隔
 */
export class Interval {
    private readonly _startIndex: number;
    private readonly _stopIndex: number;
    private readonly _startLine: number = 0;
    private readonly _stopLine: number = 0;
    private readonly _text: string;

    public constructor(opts: IntervalOptions) {
        const { startIndex, startLine, stopIndex, stopLine, text } = opts;
        this._startIndex = startIndex;// - di.getInjectionOffset();
        this._stopIndex = stopIndex;// - di.getInjectionOffset();
        this._startLine = startLine;
        this._stopLine = stopLine;
        this._text = text;
    }
    public get startIndex(): number {
        return this._startIndex;
    }

    public get stopIndex(): number {
        return this._stopIndex;
    }

    public isInjected(): boolean {
        return this.startIndex < 0;
    }
    public contains(offset: number): boolean {
        if (offset > this._startIndex && offset <= this._stopIndex) {
            return true;
        }
        return false;
    }
}