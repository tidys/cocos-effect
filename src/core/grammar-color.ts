import { DecorationRenderOptions, Range, languages, workspace } from "vscode";
import { Kind, YAMLNode } from "yaml-ast-parser";

export enum GrammarYamlKind {
    NONE,
    KEY_SCALAR,
    KEY_MAP,
    KEY_SEQ,
    VALUE_BOOL,
    VALUE_STRING,
    VALUE_NUMBER,
}

class YamlConfig {
    /**
     * 着色区域
     */
    public range: Range[] = [];

    public kind: GrammarYamlKind = GrammarYamlKind.NONE;
    /**
     * 着色配置
     */
    public render: DecorationRenderOptions = {};
    constructor(kind: GrammarYamlKind) {
        this.kind = kind;
    }
}
const color = {
    key: '#e06c75',
    number: '#d19a66',
    string: '#98c379',
    constant: '#d19a66',//bool
};
export class GrammarColor {
    public yamlConfig: YamlConfig[] = [];
    public reset() {
        this.yamlConfig.forEach(el => {
            el.range = [];
        });
    }
    public addByYamlKind(kind: Kind, range: Range) {
        const map: Record<string, GrammarYamlKind | null> = {};
        map[Kind.SCALAR.toString()] = GrammarYamlKind.KEY_SCALAR;
        map[Kind.MAPPING.toString()] = null;
        map[Kind.MAP.toString()] = GrammarYamlKind.KEY_MAP;
        map[Kind.SEQ.toString()] = GrammarYamlKind.KEY_SEQ;
        map[Kind.ANCHOR_REF.toString()] = null;
        map[Kind.INCLUDE_REF.toString()] = null;
        const v = map[kind.toString()];
        if (v) {
            const cfg = this.getConfig(v);
            if (cfg) {
                cfg.range.push(range);
            }
        }
    }
    public add(kind: GrammarYamlKind, range: Range) {
        const cfg = this.getConfig(kind);
        if (cfg) {
            cfg.range.push(range);
        } else {
            console.log(`not config kind: ${kind}`);
        }
    }
    private getConfig(kind: GrammarYamlKind): YamlConfig | null {
        return this.yamlConfig.find(el => el.kind === kind) || null;
    }
    constructor() {
        const configArray: Array<{ type: GrammarYamlKind, color: string }> = [
            { type: GrammarYamlKind.KEY_SCALAR, color: color.key },
            { type: GrammarYamlKind.KEY_MAP, color: color.key },
            { type: GrammarYamlKind.KEY_SEQ, color: color.key },
            { type: GrammarYamlKind.VALUE_BOOL, color: color.constant },
            { type: GrammarYamlKind.VALUE_NUMBER, color: color.number },
            { type: GrammarYamlKind.VALUE_STRING, color: color.string },
        ];
        configArray.forEach(el => {
            const cfg = new YamlConfig(el.type);
            cfg.render.color = el.color;
            this.yamlConfig.push(cfg);
        });
    }
}