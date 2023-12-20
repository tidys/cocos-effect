import { CancellationToken, Position, ProviderResult, Range, RenameProvider, TextDocument, WorkspaceEdit } from "vscode";

export class CCRenameProvider implements RenameProvider {
    provideRenameEdits(document: TextDocument, position: Position, newName: string, token: CancellationToken): ProviderResult<WorkspaceEdit> {
        throw new Error("Method not implemented.");
    }
    prepareRename?(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Range | { range: Range; placeholder: string; }> {
        throw new Error("Method not implemented.");
    }

}