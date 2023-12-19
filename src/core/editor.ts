import { Diagnostic, DiagnosticCollection, Range, TextDocument, Uri, languages } from "vscode";
import { DocumentInfo } from "./document-info";

export class Editor {
    private static readonly documentInfos = new Map<string, DocumentInfo>();
    public static processElements(document: TextDocument) {
        const di = this.getDocumentInfo(document.uri);
        di.processElements(document);
    }
    public static getDocumentInfo(uri: Uri): DocumentInfo {
        const key = `${uri.scheme}:${uri.path}`;
        let di = this.documentInfos.get(key);
        if (!di) {
            di = new DocumentInfo(uri);
            this.documentInfos.set(key, di);
        }
        return di;

    }
    private static readonly collection = languages.createDiagnosticCollection('cocos-effect');
    public static getDiagnosticCollection(): DiagnosticCollection {
        return this.collection;
    }
    public static addDiagnosticByOffset(document: TextDocument, began: number, end: number, message: string) {
        const range = new Range(document.positionAt(began), document.positionAt(end));
        const diagnostic = new Diagnostic(range, message);
        this.collection.set(document.uri, [diagnostic]);
    }
}