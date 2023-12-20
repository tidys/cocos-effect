import { CancellationToken, DocumentHighlight, DocumentHighlightProvider, Position, ProviderResult, Range, TextDocument } from "vscode";

export class CCHighlightProvider implements DocumentHighlightProvider {
    provideDocumentHighlights(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<DocumentHighlight[]> {
        const ret: DocumentHighlight[] = [];
        // const highlight = new DocumentHighlight(new Range(new Position(0, 1), new Position(2, 3)));
        // ret.push(highlight);
        return ret;
    }

}