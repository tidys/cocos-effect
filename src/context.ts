import {
    workspace,
    Disposable,
    OutputChannel,
} from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    ForkOptions
} from 'vscode-languageclient/node';

class CocosLanguageClient extends LanguageClient {
}

export class CocosEffectContext implements Disposable {
    subscriptions: Disposable[] = [];
    client!: CocosLanguageClient;

    async activate(serverModule: string, outputChannel: OutputChannel) {
        const debugOptions: ForkOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
        const serverOptions: ServerOptions = {
            run: {
                module: serverModule,
                transport: TransportKind.ipc
            },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions,
            }
        };

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            documentSelector: [
                { scheme: 'file', language: 'cocos-program' },
                { scheme: 'file', language: 'cocos-effect' }
            ],
            synchronize: {
                fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
            },
            outputChannel: outputChannel,
        };
        this.client = new CocosLanguageClient(
            'CocosEffect Language Server',
            serverOptions,
            clientOptions
        );
        this.client.start();
        console.log('Clang Language Server is now active!');
    }

    dispose() {
        this.subscriptions.forEach(sub => sub.dispose());
        if (this.client) {
            this.client.stop();
        }
        this.subscriptions.length = 0;
    }
}