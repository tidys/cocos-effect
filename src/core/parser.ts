import { Diagnostic, DiagnosticSeverity, Range, TextDocument, Uri } from "vscode";
import { Editor } from "./editor";
import * as  yaml from 'yaml-ast-parser';
import { ICompletion } from "../builtin/interfaces";
import { CheckEffectField, CompletionConfig } from "./check-effect-field";
import { isVarName } from "./util";

enum ChunkType {
    None = 'none',
    Comment = 'comment',
    CCProgram = 'program',
    CCEffect = 'effect',
}
class MyRange {
    public startOffset: number = -1;
    public endOffset: number = -1;
    public text: string = '';
}
class MyChunk {
    public ok: boolean = false;
    public err: MyRange = new MyRange();
    public value: MyRange = new MyRange();
    public name: MyRange = new MyRange();
    public type: ChunkType = ChunkType.None;
    constructor(type: ChunkType) {
        this.type = type;
    }
    public failed(offset: number, err: string) {
        this.ok = false;
        this.err.text = err;
        this.err.startOffset = offset;
        this.err.endOffset = offset;
        return this;
    }
    public oked() {
        this.ok = true;
        return this;
    }
}

class MyChunkEffect extends MyChunk {
    constructor() {
        super(ChunkType.CCEffect);
    }
    public field: CheckEffectField | null = null;
    public positionAt(offset: number): CompletionConfig | null {
        if (!this.field) {
            return null;
        }
        // 要找到最小的区间
        const cfg: CompletionConfig[] = [];
        for (let i = 0; i < this.field.completionConfig.length; ++i) {
            const item = this.field.completionConfig[i];
            if (item.start <= offset && offset <= item.end) {
                cfg.push(item);
            }
        }
        if (cfg.length === 0) {
            return null;
        } else if (cfg.length === 1) {
            return cfg[0];
        } else {
            let min = cfg[0];
            cfg.map(item => {
                if (min.start < item.start && item.end < min.end) {
                    min = item;
                }
            });
            return min;
        }
    }
}

const KEYS = {
    CCProgram: "CCProgram",
    CCEffect: "CCEffect",
    RangeBegan: '%{',
    RangeEnded: '}%',
};
export class MyParser {
    public text: string;
    private totalLen: number;
    private chunks: MyChunk[] = [];
    constructor(text: string) {
        this.text = text;
        this.totalLen = this.text.length;
        this.init();
        this.log();
    }
    public checkDiagnosis(document: TextDocument): void {
        this.checkEffectDiagnosis(document);
        this.checkProgramDiagnosis(document);
    }
    public getCompletions(offset: number): ICompletion[] {
        for (let i = 0; i < this.chunks.length; ++i) {
            const chunk = this.chunks[i];
            if (chunk instanceof MyChunkEffect) {
                const ret = chunk.positionAt(offset);
                if (ret) {
                    return ret.completions;
                }
            }
        }
        return [];
    }
    private checkProgramDiagnosis(document: TextDocument): void {
        //
    }
    private checkEffectDiagnosis(document: TextDocument): void {
        const chunk = this.getEffectChunk();
        if (chunk && chunk instanceof MyChunkEffect) {
            const ret = yaml.load(chunk.value.text);
            if (ret.errors.length) {
                const items: Diagnostic[] = [];
                for (let i = 0; i < ret.errors.length; ++i) {
                    const err = ret.errors[i];
                    items.push(new Diagnostic(
                        new Range(
                            // document.positionAt(chunk.value.startOffset),
                            // document.positionAt(chunk.value.endOffset)
                            document.positionAt(err.mark.position + chunk.value.startOffset),
                            document.positionAt(err.mark.position + chunk.value.startOffset),
                        ),
                        `${err.reason}`, DiagnosticSeverity.Error)
                    );
                }
                Editor.getDiagnosticCollection().set(document.uri, items);
            } else {
                chunk.field = new CheckEffectField(document, chunk.value.startOffset, ret, this);
                chunk.field.checkField();

            }
        }
    }
    public getError(document: TextDocument): boolean {
        const items: Diagnostic[] = [];
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            if (!chunk.ok) {
                const { text, startOffset, endOffset } = chunk.err;
                items.push(new Diagnostic(
                    new Range(
                        document.positionAt(startOffset),
                        document.positionAt(endOffset)
                    ),
                    text, DiagnosticSeverity.Error)
                );
            }
        }
        if (items.length > 0) {
            Editor.getDiagnosticCollection().set(document.uri, items);
            return true;
        }
        return false;
    }
    public getEffectChunk(): MyChunk | null {
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            if (chunk.type === ChunkType.CCEffect) {
                return chunk;
            }
        }
        return null;
    }
    public getProgramChunk(name: string): MyChunk | null {
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            if (chunk.type === ChunkType.CCProgram && chunk.name.text === name) {
                return chunk;
            }
        }
        return null;
    }
    private currentIndex: number = 0;
    private nextIsBegan(key: string) {
        while (this.currentIndex < this.totalLen) {
            if (this.nextIsSpace()) {
                continue;
            }
            if (this.nextIsNewLine()) {
                continue;
            }
            return this.nextIs(key);
        }
        return false;
    }
    private skipWhitespace() {
        while (this.currentIndex < this.totalLen) {
            if (this.nextIsSpace() || this.nextIsNewLine()) {
                continue;
            } else {
                break;
            }
        }
    }
    private findCCEffectEnded(): MyChunk {
        const ret = new MyChunkEffect();
        // 必须有一个空格
        if (!this.nextIsSpace()) {
            return ret.failed(this.currentIndex, '必须有一个空格');
        }
        // 跳过空格换行
        this.skipWhitespace();
        if (!this.nextIs(KEYS.RangeBegan)) {
            return ret.failed(this.currentIndex, `必须是${KEYS.RangeBegan}开头`);
        }
        ret.value.startOffset = this.currentIndex;
        while (this.currentIndex < this.totalLen) {
            const offset = this.currentIndex;
            if (this.nextIs(KEYS.RangeEnded)) {
                ret.value.endOffset = offset;
                return ret.oked();
            } else {
                ret.value.text += this.text[this.currentIndex];
                this.currentIndex++;
            }
        }
        return ret;
    }
    private findCCProgramEnded(): MyChunk {
        const ret = new MyChunk(ChunkType.CCProgram);
        if (!this.nextIsSpace()) {
            return ret.failed(this.currentIndex, '必须有一个空格');
        }
        // 跳过空格换行
        this.skipWhitespace();
        // 找到program的名字
        let programName = '';
        ret.name.startOffset = this.currentIndex;
        while (this.currentIndex < this.totalLen) {
            const offset = this.currentIndex;
            if (this.nextIsSpace() || this.nextIsNewLine()) {
                if (isVarName(programName)) {
                    ret.name.text = programName;
                    ret.name.endOffset = offset;
                    break;
                } else {
                    return ret.failed(this.currentIndex, `无效的Program名字${programName}`);
                }
            } else {
                programName += this.text[this.currentIndex];
                this.currentIndex++;
            }
        }
        this.skipWhitespace();
        if (!this.nextIs(KEYS.RangeBegan)) {
            return ret.failed(this.currentIndex, 'Program名字后边必须有一个空格');
        }
        // 找到code
        ret.value.startOffset = this.currentIndex;
        while (this.currentIndex < this.totalLen) {
            const offset = this.currentIndex;
            if (this.nextIs(KEYS.RangeEnded)) {
                ret.value.endOffset = offset;
                return ret.oked();
            } else {
                ret.value.text += this.text[this.currentIndex];
                this.currentIndex++;
            }
        }
        return ret;
    }
    private log() {
        this.chunks.map(chunk => {
            if (chunk.ok) {
                console.log(`chunk: ${chunk.name.text}: ${chunk.value.text}`);
            } else {
                console.log(`chunk error:${chunk.err.startOffset} at ${chunk.err.text}`);
            }
        });
    }
    private init(): MyChunk {
        const parseResult = new MyChunk(ChunkType.None);
        while (this.currentIndex < this.totalLen) {
            if (this.nextIsSpace() || this.nextIsNewLine()) {
                continue;
            } else if (this.isCommentBegan()) {
                const ret = this.findCommentEnded();
                this.chunks.push(ret);
                if (!ret.ok) {
                    return ret;
                }
            } else if (this.nextIsBegan(KEYS.CCEffect)) {
                const ret = this.findCCEffectEnded();
                this.chunks.push(ret);
                if (!ret.ok) {
                    return ret;
                }
            } else if (this.nextIsBegan(KEYS.CCProgram)) {
                const ret = this.findCCProgramEnded();
                this.chunks.push(ret);
                if (!ret.ok) {
                    return ret;
                }
            } else {
                return parseResult.failed(this.currentIndex, 'unknown');
            }
        }
        return parseResult;
    }
    private isCommentBegan() {
        return this.nextIs('/');
    }
    private findCommentEnded(): MyChunk {
        const ret = new MyChunk(ChunkType.Comment);
        if (!this.nextIs('/')) {
            return ret.failed(this.currentIndex, '无效的注释');
        }
        while (this.currentIndex < this.totalLen) {
            if (this.nextIsNewLine()) {
                return ret.oked();
            }
        }
        return ret;
    }
    private nextIsSpace() {
        return this.nextIs(' ');
    }
    private nextIsNewLine() {
        return this.nextIs('\n') || this.nextIs('\r\n');
    }
    private getOffsetString(len: number): string {
        let target = "";
        for (let i = 0; i < len; i++) {
            const index = this.currentIndex + i;
            if (index < this.totalLen) {
                target += this.text[index];
            } else {
                break;
            }
        }
        return target;
    }
    private nextIs(char: string): boolean {
        const len = char.length;
        const target = this.getOffsetString(len);
        if (target === char) {
            this.currentIndex += len;
            return true;
        } else {
            return false;
        }
    }
}