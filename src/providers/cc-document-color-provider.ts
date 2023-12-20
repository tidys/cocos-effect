import { CancellationToken, Color, ColorInformation, ColorPresentation, DocumentColorProvider, Position, ProviderResult, Range, TextDocument } from "vscode";

export class CCDocumentColorProvider implements DocumentColorProvider {
    provideDocumentColors(document: TextDocument, token: CancellationToken): ProviderResult<ColorInformation[]> {
        const ret: ColorInformation[] = [];
        const range = new Range(new Position(0, 1), new Position(0, 5));
        const c = new Color(255, 0, 0, 255);
        const color = new ColorInformation(range, c);
        // ret.push(color);
        return ret;
    }
    provideColorPresentations(color: Color, context: { readonly document: TextDocument; readonly range: Range; }, token: CancellationToken): ProviderResult<ColorPresentation[]> {
        throw new Error("Method not implemented.");
    }

}