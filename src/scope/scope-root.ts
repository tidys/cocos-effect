import { ScopeChunk } from "./chunk/scope-chunks";
import { Scope } from "./scope";

export class ScopeRoot extends Scope {
    public chunks: Array<ScopeChunk> = [];
}