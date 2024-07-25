import {
    ExtensionContext,
    languages,
    commands,
    window,
    workspace,
    CompletionItem,
    ProviderResult,
    SignatureHelp,
    DocumentSelector,
    Range,
    Position,
} from 'vscode';

import {
    CocosSemanticTokensProvider, legend, selector,
} from './semantic';

import {
    find_if_upwards,
    is_engine_path,
    is_project_path,
    get_project_engine_dir,
    compilerExecPath,
} from './file-utils';

import { CocosEffectContext } from './context';

import * as fs from 'fs';
import * as path from 'path';
import { CCDiagnosticProvider } from './providers/cc-diagnostic-provider';
import { CCCompletionProvider } from './providers/cc-completion-provider';
import { CCHoverProvider } from './providers/cc-hover-provider';
import { CCSignatureHelpProvider } from './providers/cc-signature-help-provier';
import { Editor } from './core/editor';
import { CCHighlightProvider } from './providers/cc-highlight-provider';
import { CCCallHierarchyProvider } from './providers/cc-call-hierarchy-provider';
import { CCDocumentColorProvider } from './providers/cc-document-color-provider';
import { CCDocumentFormattingProvider } from './providers/cc-document-formatting-provider';
import { CCRenameProvider } from './providers/cc-rename-provider';
import { CCReferenceProvider } from './providers/cc-reference-provider';
import { CCTextDocumentContentProvider } from './providers/cc-text-document-content-provider';
import { DocumentInfo } from './core/document-info';

export async function activate(context: ExtensionContext) {
    // query settings
    const config = workspace.getConfiguration('cocos-effect');
    const pth = config.get<string>('enginePath') || '';
    const enginePath = is_engine_path(pth) ? pth : undefined;

    const outputChannel = window.createOutputChannel('Cocos Effect');
    context.subscriptions.push(outputChannel);

    const cocosEffectContext = new CocosEffectContext();
    context.subscriptions.push(cocosEffectContext);

    addDiagnostic(context);

    const selector: DocumentSelector = [
        { language: 'cocos-effect' },
        { language: 'yaml' },
    ];
    languages.registerSignatureHelpProvider(selector, new CCSignatureHelpProvider());
    languages.registerHoverProvider(selector, new CCHoverProvider());
    context.subscriptions.push(
        languages.registerCompletionItemProvider(selector, new CCCompletionProvider())
    );
    languages.registerCallHierarchyProvider(selector, new CCCallHierarchyProvider());
    languages.registerDocumentHighlightProvider(selector, new CCHighlightProvider());
    languages.registerColorProvider(selector, new CCDocumentColorProvider());
    languages.registerDocumentSemanticTokensProvider(selector, new CocosSemanticTokensProvider(), legend);
    languages.registerDocumentFormattingEditProvider(selector, new CCDocumentFormattingProvider());
    languages.registerDocumentRangeFormattingEditProvider(selector, new CCDocumentFormattingProvider());
    languages.registerRenameProvider(selector, new CCRenameProvider());
    languages.registerReferenceProvider(selector, new CCReferenceProvider());
    languages.registerDocumentSemanticTokensProvider({ language: 'cocos-program' }, new CocosSemanticTokensProvider(), legend);
    // workspace.registerTextDocumentContentProvider('file', new CCTextDocumentContentProvider());
    const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));

    context.subscriptions.push(
        commands.registerCommand('CocosEffect.inspectSyntaxType', async () => {
            const editor = window.activeTextEditor;
            if (editor) {
                const position = editor.selection.active; // 获取当前光标所在位置
                const document = editor.document;
                window.showInformationMessage(`${document.languageId}`);
                languages.match(document.languageId, document);

                // // 调用 getTextMateTokens 方法获取指定位置的语法类型信息
                // const tokens = languages.getTextMateTokens(document.uri, position);

                // // 循环遍历 tokens，找到包含指定位置的 token
                // for (const token of tokens) {
                //     const range = token.range;
                //     if (range.contains(position)) {
                //         const tokenType = token.tokenType;
                //         console.log('语法类型:', tokenType);
                //         break;
                //     }
                // }
            }
        }),
        workspace.onDidCloseTextDocument(event => {
            Editor.getDiagnosticCollection().delete(event.uri);
        }),
        commands.registerCommand('CocosEffect.activateLSP', async () => { return; }),
        commands.registerCommand('CocosEffect.restartLSP', async () => {
            if (cocosEffectContext) {
                await cocosEffectContext.dispose();
                window.showInformationMessage('Restarting CocosEffect language server!');
                await cocosEffectContext.activate(serverModule, outputChannel);
            }
        }),
        commands.registerCommand('CocosEffect.compileEffect', async () => {
            const editor = window.activeTextEditor;
            if (editor) {
                const document = editor.document.fileName;
                if (document.endsWith('.effect') === false) {
                    window.showErrorMessage('Not a valid effect file!');
                    return;
                }
                const documentPath = path.dirname(document);
                let engineDirectory = enginePath ? enginePath : '';
                const engine = find_if_upwards(documentPath, is_engine_path);
                const project = find_if_upwards(documentPath, is_project_path);
                if (engine !== '') {
                    engineDirectory = engine;
                }
                if (project !== '') {
                    engineDirectory = find_if_upwards(get_project_engine_dir(project), is_engine_path);
                }
                const compiler_path = path.join(engineDirectory, compilerExecPath);
                if (fs.existsSync(compiler_path)) {
                    const terminal = window.activeTerminal || window.createTerminal({ name: 'Cocos Effect', hideFromUser: true });
                    const document = editor.document;
                    terminal.sendText(`${compiler_path} 0 ${document.fileName} ${engineDirectory}`);
                    terminal.show();
                }
            }
        })
    );

    await cocosEffectContext.activate(serverModule, outputChannel);
}

function addDiagnostic(context: ExtensionContext): void {
    for (const editor of window.visibleTextEditors) {
        // new DiagnosticProvider().textChanged(editor.document);
    }
    context.subscriptions.push(
        workspace.onDidChangeTextDocument(event => {
            // new DiagnosticProvider().textChanged(event.document);
        })
    );
    context.subscriptions.push(workspace.onWillSaveTextDocument(event => {
        if (event.document.languageId === "cocos-effect") {
            new CCDiagnosticProvider().textChanged(event.document);
            const editor = window.activeTextEditor;
            if (editor) {
                const documentInfo: DocumentInfo | null = Editor.getDocumentInfo(event.document.uri);
                if (documentInfo) {
                    documentInfo.doSyntaxesColor(editor);
                }
            }
        }
    }));
}