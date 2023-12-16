import { Scope } from "../../scope";

export type ScopeYamlCtor = new () => ScopeYaml;
export class ScopeYaml extends Scope {
    public toData(): any {
        return null;
    }
}