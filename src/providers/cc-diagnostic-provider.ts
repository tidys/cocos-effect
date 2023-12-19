import { TextDocument } from "vscode";
import { Editor } from "../core/editor";

export class CCDiagnosticProvider {
    public textChanged(document: TextDocument): void {
        this.initialize(document);
    }
    private initialize(document: TextDocument): void {
        Editor.processElements(document);
    }
}