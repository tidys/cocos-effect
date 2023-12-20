import { CallHierarchyIncomingCall, CallHierarchyItem, CallHierarchyOutgoingCall, CallHierarchyProvider, CancellationToken, Position, ProviderResult, TextDocument } from "vscode";

export class CCCallHierarchyProvider implements CallHierarchyProvider {
    prepareCallHierarchy(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CallHierarchyItem | CallHierarchyItem[]> {
        throw new Error("Method not implemented.");
    }
    provideCallHierarchyIncomingCalls(item: CallHierarchyItem, token: CancellationToken): ProviderResult<CallHierarchyIncomingCall[]> {
        throw new Error("Method not implemented.");
    }
    provideCallHierarchyOutgoingCalls(item: CallHierarchyItem, token: CancellationToken): ProviderResult<CallHierarchyOutgoingCall[]> {
        throw new Error("Method not implemented.");
    }

}