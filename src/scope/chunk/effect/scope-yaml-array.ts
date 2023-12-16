import { Yaml_arrayContext } from "../../../antlr/CocosEffectParser";
import { Helper } from "../../../core/helper";
import { Interval } from "../../interval";
import { Scope } from "../../scope";
import { ScopeYaml } from "./scope-yaml";
import { ScopeYamlObject } from "./scope-yaml-object";


export class ScopeYamlArray extends ScopeYaml {
    constructor(ctx: Yaml_arrayContext, scope: ScopeYamlObject | ScopeYamlArray) {
        super();
        this.interval = Helper.getIntervalFromParserRuleContext(ctx);
    }
    public valuesInterval: Interval[] = [];
    public addValueInterval(value: Interval) {
        //
    }
}