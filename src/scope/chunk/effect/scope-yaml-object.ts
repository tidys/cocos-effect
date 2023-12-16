import { Element } from "./element";
import { Interval } from "../../interval";
import { Scope } from "../../scope";
import { ScopeYaml } from "./scope-yaml";
import { ScopeYamlString } from "./scope-yaml-string";
import { ScopeYamlNumber } from "./scope-yaml-number";
import { ScopeYamlBool } from "./scope-yaml-bool";
import { ParserRuleContext } from "antlr4ts";
import { ScopeYamlArray } from "./scope-yaml-array";
import { Helper } from "../../../core/helper";
import { ScopeChunk } from "../scope-chunks";

export class YamlPair {
    public readonly key: ScopeYamlString;
    public value: ScopeYamlString | ScopeYamlObject | ScopeYamlNumber | ScopeYamlBool | ScopeYaml | null = null;
    constructor(key: ScopeYamlString) {
        this.key = key;
    }
    public isNumber() { return this.value instanceof ScopeYamlNumber; }
    public isString() { return this.value instanceof ScopeYamlString; }
    public isObject() { return this.value instanceof ScopeYamlObject; }
    public isBool() { return this.value instanceof ScopeYamlBool; }
}

export class ScopeYamlObject extends ScopeYaml {
    constructor(ctx: ParserRuleContext, parent: ScopeYamlObject | ScopeYamlArray | ScopeChunk) {
        super();
        this.interval = Helper.getIntervalFromParserRuleContext(ctx);
        this.parent = parent;
    }
    public values: Record<string, YamlPair> = {};
    public addKeyValue(pair: YamlPair) {
        const key = pair.key.value;
        if (key) {
            this.values[key] = pair;
        }
    }
    public toData() {
        const obj: Record<string, any> = {};
        for (const key in this.values) {
            const pair = this.values[key];
            const objKey = pair.key.value;
            if (objKey) {
                obj[objKey] = pair.value?.toData();
            }
        }
        return obj;
    }
}

