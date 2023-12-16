import { ICompletion } from "../builtin/interfaces";
import { Interval } from "./interval";

export type ScopeConstructor = new () => Scope;
/**
 * 作用域，里面包含了所用到的所有类型数据等信息
 */
export abstract class Scope {
    /**
     * 自己的区间段
     */
    public interval: Interval | null = null;
    /**
     * 父作用域
     */
    public parent: Scope | null = null;
    /**
     * 此作用域下的代码补全接口
     * @param interval 自己的作用域
     * @param parent 父作用域
     */
    init(interval: Interval | null, parent: Scope | null) {
        this.interval = interval;
        this.parent = parent;
    }
    private completionCB: (() => ICompletion[]) | null = null;
    public bindCompletion(cb: () => ICompletion[]) {
        this.completionCB = cb;
    }
    public execCompletion(): ICompletion[] {
        if (this.completionCB) {
            return this.completionCB();
        }
        return [];
    }
    /**
     * 从当前作用域开始查找符合offset的作用域
     */
    findScopeByOffset(offset: number): Scope | null {
        return null;
    }
}