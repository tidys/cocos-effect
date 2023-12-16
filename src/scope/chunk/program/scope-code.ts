import { Interval } from "../../interval";
import { Scope } from "../../scope";

export class ScopeCode extends Scope {
    /**
     * 元素的名字
     */
    public name: string = "";
    /**
     * 元素名字的区间段
     */
    public nameInterval: Interval | null = null;
    /**
     * 子作用域
     */
    public children = new Array<ScopeCode>();

}