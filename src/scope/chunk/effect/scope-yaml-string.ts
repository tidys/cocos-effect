import { ParserRuleContext } from "antlr4ts";
import { Element } from "./element";
import { Interval } from "../../interval";
import { Scope } from "../../scope";
import { Helper } from "../../../core/helper";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { ScopeYaml } from "./scope-yaml";
import { ScopeYamlObject } from "./scope-yaml-object";
import { ScopeYamlArray } from "./scope-yaml-array";

export class ScopeYamlString extends ScopeYaml {
    public value: string | null = null;
    constructor(ctx: TerminalNode, parent: ScopeYamlObject | ScopeYamlArray) {
        super();
        this.interval = Helper.getIntervalFromTerminalNode(ctx);
        this.value = ctx.text;
        this.parent = parent;
    }
    public toData() {
        return this.value;
    }
}