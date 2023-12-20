import { TextDocument, Position } from "vscode";
import { DocumentInfo } from "../core/document-info";
import { Editor } from "../core/editor";

export class CCPositionalProvider<T>{
    protected di: DocumentInfo | null = null;
    protected document: TextDocument | null = null;
    protected position: Position | null = null;
    protected init(document: TextDocument, position: Position) {
        Editor.processElements(document);
        this.di = Editor.getDocumentInfo(document.uri);
        this.position = position;
    }
    protected processElements(document: TextDocument, position: Position): T | null {
        return this.processFunctionCall();
    }
    protected processFunctionCall(): T | null {
        return null;
    }
}