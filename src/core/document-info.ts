import { Diagnostic, Position, Range, TextDocument, Uri, window } from "vscode";
import { CocosEffectLexer } from "../antlr/CocosEffectLexer";
import { CocosEffectParser, MainContext } from "../antlr/CocosEffectParser";
import {
    ANTLRInputStream,
    CommonTokenStream, ParserErrorListener,
    RecognitionException, Recognizer, Token,
    ANTLRErrorListener,
} from "antlr4ts";
import { CocosEffectVisitor } from "../antlr/CocosEffectVisitor";
import { Visitor } from "./visitor";
import { Scope } from "../scope/scope";
import { DocumentRegions } from "./document-regions";
import { Builtin } from "../builtin/builtin";
import { Editor } from "./editor";
import { DiagnosticSeverity } from "vscode-languageserver";
import { ScopeChunk } from "../scope/chunk/scope-chunks";
import { ScopeRoot } from "../scope/scope-root";
import { MyParser } from "./parser";
import { ICompletion } from "../builtin/interfaces";

type ANTLRErrorCallback = (line: number, charPositionInLine: number, msg: string) => void;
class DocumentErrorListener implements ANTLRErrorListener<Token> {
    public readonly callback: ANTLRErrorCallback;
    constructor(uri: ANTLRErrorCallback) {
        this.callback = uri;
    }
    syntaxError<Token>(recognizer: Recognizer<Token, any>, offendingSymbol: Token | undefined, line: number, charPositionInLine: number, msg: string, e: RecognitionException | undefined) {
        this.callback && this.callback(line, charPositionInLine, msg);
    }
}
export class DocumentInfo {
    private readonly uri: Uri;
    private invalid = false;
    private lastProcessedVersion = -1;
    public constructor(uri: Uri) {
        this.uri = uri;
    }

    public myParser: MyParser | null = null;
    public processElements(document: TextDocument): void {
        if (document.version > this.lastProcessedVersion || this.invalid) {
            Editor.getDiagnosticCollection().clear();
            this.processDocument(document);
            const useRegParseRoot = true;
            if (useRegParseRoot) {
                const str = this.getText();
                // const programRegex = /\s*CCProgram\s+([\w-]+)\s+%{\s+([\s\S]+?)\s+}%/g;
                // const match: RegExpExecArray | null = programRegex.exec(str);
                this.myParser = new MyParser(str);
                const b = this.myParser.getError(document);
                if (!b) {
                    this.myParser.checkDiagnosis(document);
                }

            } else {
                this.processVisitor(); // 回头在进行完整的语法解析
            }
            this.lastProcessedVersion = document.version;
            this.invalid = false;
        }
    }
    private document: TextDocument | null = null;
    private lexer: CocosEffectLexer | null = null;
    private parser: CocosEffectParser | null = null;
    private processDocument(document: TextDocument): void {
        this.document = document;

    }
    private createLexer(): CocosEffectLexer {
        const charStream = new ANTLRInputStream(this.getText());
        const lexer = new CocosEffectLexer(charStream);
        // this.tokens = lexer.getAllTokens();
        lexer.reset();
        return lexer;
    }
    private createParser(): CocosEffectParser {
        const tokenStream = new CommonTokenStream(this.lexer!);
        const parser = new CocosEffectParser(tokenStream);
        parser.removeErrorListeners();
        // watch error
        const errLis = new DocumentErrorListener((line: number, charPositionInLine: number, msg: string,) => {
            const ret = `line:${line}\npos:${charPositionInLine}\nmsg:${msg}`;
            const items: Diagnostic[] = [];
            items.push(new Diagnostic(
                new Range(line - 1, charPositionInLine, line - 1, charPositionInLine),
                msg, DiagnosticSeverity.Error)
            );
            Editor.getDiagnosticCollection().set(this.uri, items);
            throw new Error(ret);
        });
        parser.addErrorListener(errLis);
        return parser;
    }
    public getText(): string {
        const originalText = this.document!.getText();
        return originalText;
    }
    private visitor: Visitor | null = null;
    private processVisitor(): boolean {
        this.lexer = this.createLexer();
        this.parser = this.createParser();
        let tree: MainContext | null = null;
        try {
            tree = this.parser!.main();
        } catch (e: any) {
            window.showErrorMessage(`${e.message}`);
            tree = null;
        }
        if (tree) {
            // console.log(tree.toStringTree());
            this.visitor = new Visitor(this.uri);
            this.visitor.visit(tree);
            this.parser!.reset();
            if (this.rootScope instanceof ScopeRoot) {
                this.rootScope.chunks.forEach((chunk) => {
                    const json = chunk.toString();
                    console.log(`name: ${chunk.name}\njson: ${json}`);
                });
            }
            return true;
        } else {
            return false;
        }
    }
    private rootScope: Scope | null = null;
    public getRootScope(): Scope | null {
        return this.rootScope;
    }
    public reset(): void {
        this.rootScope = new ScopeRoot();
        this.rootScope.init(null, null);
        this.regions.reset();
    }
    private injectionOffset = 0;
    public getInjectionOffset(): number {
        return this.injectionOffset;
    }
    public getCompletions(position: Position): ICompletion[] {
        if (this.document && this.myParser) {
            const offset = this.document.offsetAt(position);
            return this.myParser.getCompletions(offset);
        } else {
            return [];
        }
    }

    private regions: DocumentRegions = new DocumentRegions();
    public getRegions(): DocumentRegions {
        return this.regions;
    }
    public builtin: Builtin = new Builtin();
}