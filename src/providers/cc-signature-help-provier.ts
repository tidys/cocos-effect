import { CancellationToken, Position, ProviderResult, SignatureHelp, SignatureHelpContext, SignatureHelpProvider, TextDocument } from 'vscode';
export class CCSignatureHelpProvider implements SignatureHelpProvider {
    provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken, context: SignatureHelpContext): ProviderResult<SignatureHelp> {
        const sh: ProviderResult<SignatureHelp> = new SignatureHelp();
        return sh;
    }

}