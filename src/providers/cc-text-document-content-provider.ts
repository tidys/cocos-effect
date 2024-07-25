import { CancellationToken, Event, ProviderResult, TextDocumentContentProvider, Uri } from "vscode";

export class CCTextDocumentContentProvider implements TextDocumentContentProvider {
    onDidChange?: Event<Uri> | undefined;
    provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
        throw new Error("Method not implemented.");
    }

}