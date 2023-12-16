import { Interval } from "../../interval";


export class Element {
    /** 
     * 元素所在的区间段
     */
    public interval: Interval | null = null;
    /**
     * 元素对应的文本
     */
    public text: string = "";
    constructor(interval: Interval) {
        this.interval = interval;
    }
}

export class YamlElement {
    public keyInterval: Interval;
    public key: string = "";

    public valueInterval: Interval;
    public value: any;

    constructor(keyInterval: Interval, valueInterval: Interval) {
        this.keyInterval = keyInterval;
        this.valueInterval = valueInterval;
    }
}


