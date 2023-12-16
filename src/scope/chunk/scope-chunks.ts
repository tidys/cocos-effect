import { ScopeYamlObject } from "./effect/scope-yaml-object";
import { ScopeCode } from "./program/scope-code";
import { Interval } from "../interval";
import { Scope } from "../scope";
import { ScopeRoot } from "../scope-root";
export type ScopeChunkCtor = new () => ScopeChunk;
export class ScopeChunk extends Scope {
    public value: ScopeYamlObject | ScopeCode | null = null;
    /**
     * 元素的名字
     */
    public name: string = "";
    /**
     * 元素名字的区间段
     */
    public nameInterval: Interval | null = null;
    constructor(parent: ScopeRoot) {
        super();
        this.parent = parent;
    }
    toString() {
        if (this.value instanceof ScopeYamlObject) {
            const data = this.value.toData();
            return JSON.stringify(data, null, 2);
        }
        return "";
    }
}