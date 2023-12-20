import { CancellationToken, DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider, FormattingOptions, ProviderResult, TextDocument, TextEdit, Range, } from "vscode";

export class CCDocumentFormattingProvider implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider {
    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        throw new Error("Method not implemented.");
    }
    provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        throw new Error("Method not implemented.");
    }

}