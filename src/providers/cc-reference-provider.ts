import { CancellationToken, Location, Position, ProviderResult, ReferenceContext, ReferenceProvider, TextDocument } from "vscode";

export class CCReferenceProvider implements ReferenceProvider {
    provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): ProviderResult<Location[]> {
        throw new Error("Method not implemented.");
    }

}