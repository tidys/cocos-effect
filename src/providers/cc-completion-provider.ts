import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, window } from "vscode";
import { DocumentInfo } from "../core/document-info";
import { Editor } from "../core/editor";

export class CCCompletionProvider implements CompletionItemProvider {
    private di: DocumentInfo | null = null;
    private position: Position | null = null;
    private context: CompletionContext | null = null;
    private items: Array<CompletionItem> = [];

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
        Editor.processElements(document);
        this.di = Editor.getDocumentInfo(document.uri);
        this.position = position;
        this.context = context;
        this.items = new Array<CompletionItem>();
        // auto completion
        const b = this.di.getCompletions(this.position);
        if (b && b.length > 0) {
            for (const item of b) {
                const ci: CompletionItem = new CompletionItem({ label: item.name, description: item.desc }, CompletionItemKind.Text);
                this.items.push(ci);
            }
        }
        return this.items;
    }

    resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
        throw new Error("Method not implemented.");
    }

}