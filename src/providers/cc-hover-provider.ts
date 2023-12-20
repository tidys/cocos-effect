import { CancellationToken, Hover, HoverProvider, MarkdownString, Position, ProviderResult, TextDocument } from "vscode";
import { CCPositionalProvider } from "./cc-positional-provider";
import { Editor } from "../core/editor";

export class CCHoverProvider extends CCPositionalProvider<Hover> implements HoverProvider {
    provideHover(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover> {
        this.di = Editor.getDocumentInfo(document.uri);
        this.position = position;
        this.document = document;
        const hover = this.di.getHover(position);
        // 获取对应的hover内容
        return hover || this.processElements(document, position);
    }
}