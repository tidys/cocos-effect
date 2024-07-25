import { ICompletion } from "../builtin/interfaces";
import { Interval } from "../scope/interval";

export class Region {
    /**
     * 领域的别名
     */
    name: string = "";
    /**
     * 区间
     */
    public interval: Interval[] = [];
    /**
     * 区间对应的基础补全
     */
    public baseCompletions: ICompletion[] = [];
    constructor(name: string) {
        this.name = name;
    }
}
export class DocumentRegions {
    public readonly effect = new Region('effect');
    public readonly effect_techniques = new Region('effect_techniques');
    public readonly effect_techniques_pass = new Region('effect_techniques_pass');
    public readonly effect_techniques_pass_vert = new Region('');
    public readonly effect_techniques_pass_frag = new Region('');
    public readonly effect_techniques_pass_blendState = new Region('');
    public readonly effect_techniques_pass_rasterizerState = new Region('');
    public readonly effect_techniques_pass_properties = new Region('');

    public readonly program = new Region('program');

    constructor() {
        this.setCompletions(this.effect, []);
        this.setCompletions(this.effect_techniques, []);
        this.setCompletions(this.effect_techniques_pass, []);
    }
    private setCompletions(obj: Region, completions: ICompletion[]) {
        obj.baseCompletions = completions;
    }

    public reset(): void {
        this.effect.interval.length = 0;
        this.program.interval.length = 0;
    }
    public isInEffectTechniquesPassProperties(offset: number): ICompletion[] {
        for (const item of this.effect.interval) {
            if (item.contains(offset)) {
                return this.effect.baseCompletions;
            }
        }
        return [];
    }
}