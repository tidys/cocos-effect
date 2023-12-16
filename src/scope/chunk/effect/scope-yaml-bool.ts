import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { Element } from "./element";
import { Interval } from "../../interval";
import { Scope } from "../../scope";
import { Helper } from "../../../core/helper";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { ScopeYaml } from "./scope-yaml";
import { ScopeYamlArray } from "./scope-yaml-array";
import { ScopeYamlObject } from "./scope-yaml-object";

export class ScopeYamlBool extends ScopeYaml {
    public value: boolean | null = null;
    constructor(ctx: TerminalNode, parent: ScopeYamlObject | ScopeYamlArray) {
        super();
        this.parent = parent;
        this.interval = Helper.getIntervalFromTerminalNode(ctx);
        const { text } = ctx;
        if ('true' === text.trim() || 'false' === text.trim()) {
            this.value = JSON.parse(text);
        } else {
            this.value = null;
        }
    }
    public toData() {
        return this.value;
    }
}