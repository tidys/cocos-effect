import { Diagnostic, MarkdownString, Range, TextDocument } from "vscode";
import { YAMLDocument, YAMLNode } from "yaml-ast-parser";
import * as yaml from "yaml-ast-parser";
import { Editor } from "./editor";
import { FieldType, ICompletion, ICompletionType, Scheme } from "../builtin/interfaces";
import { effect_scheme } from "../builtin/effect";
import { MyParser } from "./parser";
import { isNumber, isString, isVarName } from "./util";

export class ProvideConfig {
    public start: number;
    public end: number;
    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
}
export class CompletionConfig extends ProvideConfig {
    public completions: ICompletion[] = [];
}
export class HoverConfig extends ProvideConfig {
    public desc: MarkdownString = new MarkdownString();
}
const ANY_TAG = '*';

export class CheckEffectField {
    private offset: number = 0;
    private document: TextDocument;
    private yaml: YAMLNode;
    public myParser: MyParser;
    public diagnostic: Diagnostic[] = [];

    constructor(document: TextDocument, offset: number, yaml: YAMLNode, myParser: MyParser) {
        this.document = document;
        this.offset = offset;
        this.yaml = yaml;
        this.myParser = myParser;
    }
    private addDiagnostic(began: number, end: number, message: string) {
        const range = new Range(this.document.positionAt(began + this.offset), this.document.positionAt(end + this.offset));
        const diagnostic = new Diagnostic(range, message);
        this.diagnostic.push(diagnostic);
    }
    public hoverConfig: HoverConfig[] = [];
    private addHoverConfig(start: number, end: number, str: string) {
        const cfg = new HoverConfig(start + this.offset, end + this.offset);
        cfg.desc.value = str;
        this.hoverConfig.push(cfg);
    }
    public completionConfig: CompletionConfig[] = [];
    private addCompletionConfig(start: number, end: number, scheme: Scheme) {
        const cfg = new CompletionConfig(start + this.offset, end + this.offset);
        const completions: ICompletion[] = [];
        if (scheme.children) {
            for (const key in scheme.children) {
                if (key !== ANY_TAG) {
                    const item = scheme.children[key];
                    completions.push({
                        name: key,
                        desc: item.desc,
                    });
                }
            }
        }
        cfg.completions = cfg.completions.concat(completions);
        this.completionConfig.push(cfg);
    }
    public checkField() {
        this.diagnostic = [];

        this.doCompletionsAndCheckType(this.yaml, effect_scheme, '');

        if (this.diagnostic.length > 0) {
            Editor.getDiagnosticCollection().set(this.document.uri, this.diagnostic);
        }
    }
    private doCompletionsAndCheckType(yamlNode: yaml.YAMLNode, scheme: Scheme, key: string) {
        this.addCompletionConfig(yamlNode.startPosition, yamlNode.endPosition, scheme);
        if (scheme.type === ICompletionType.Object) {
            // object
            if (yamlNode.kind !== yaml.Kind.MAP) {
                const seq: yaml.YAMLSequence = yamlNode as yaml.YAMLSequence;
                this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `${key}必须是map`);
                return;
            }
            this.checkMap(yamlNode as yaml.YamlMap, scheme);
        } else if (scheme.type === ICompletionType.Array) {
            // array
            if (yamlNode.kind !== yaml.Kind.SEQ) {
                this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `${key}必须是数组`);
                return;
            }
            this.checkArray(yamlNode as yaml.YAMLSequence, scheme);
        } else {
            if (scheme.type === ICompletionType.String) {
                // string
                this.checkString(yamlNode, scheme, key);
            } else if (scheme.type === ICompletionType.Number) {
                // number
                this.checkNumber(yamlNode, scheme, key);
            } else if (scheme.type === ICompletionType.Bool) {
                // boolean
                this.checkBool(yamlNode, scheme, key);
            } else if (scheme.type === ICompletionType.Vec2) {
                // vec2
                this.checkVec(yamlNode, scheme, key, 2);
            } else if (scheme.type === ICompletionType.Vec3) {
                // vec3
                this.checkVec(yamlNode, scheme, key, 3);
            } else if (scheme.type === ICompletionType.Vec4) {
                // vec4
                this.checkVec(yamlNode, scheme, key, 4);
            } else if (scheme.type === ICompletionType.String_Number_Bool_Vec2_Vec3_Vec4) {
                // string_number_bool_vec2_vec3_vec4
                this.checkScalar(yamlNode, scheme, key, true);
            } else if (scheme.type === ICompletionType.Vec2_Vec3_Vec4) {
                this.checkVector(yamlNode, scheme, key, true);
            }
            if (scheme.check) {
                const result = scheme.check(this, yamlNode);
                if (result.length > 0) {
                    result.forEach(el => {
                        this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, el);
                    });
                }
            }
        }
    }
    private _checkEmpty(yamlNode: yaml.YAMLNode, key: string, diagnostic: boolean = true): boolean {
        if (yamlNode.startPosition === -1 || yamlNode.endPosition === -1) {
            diagnostic && this.addDiagnostic(yamlNode.parent.key.startPosition, yamlNode.parent.key.endPosition, `${key}不能为空`);
            return false;
        }
        return true;
    }
    public checkVector(yamlNode: yaml.YAMLNode, scheme: Scheme, key: string, diagnostic: boolean = true, diagnosticPrefix: string = ""): boolean {
        if (!this._checkEmpty(yamlNode, key, diagnostic)) {
            return false;
        }
        if (this.checkVec(yamlNode, scheme, key, 2, false, diagnosticPrefix)) {
            return true;
        }
        if (this.checkVec(yamlNode, scheme, key, 3, false, diagnosticPrefix)) {
            return true;
        }
        if (this.checkVec(yamlNode, scheme, key, 4, false, diagnosticPrefix)) {
            return true;
        }
        diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `${diagnosticPrefix}${key}的类型无效`);
        return false;
    }

    private checkScalar(yamlNode: yaml.YAMLNode, scheme: Scheme, key: string, diagnostic: boolean = true): boolean {
        if (!this._checkEmpty(yamlNode, key, diagnostic)) {
            return false;
        }
        if (this.checkString(yamlNode, scheme, key, false)) {
            return true;
        }
        if (this.checkNumber(yamlNode, scheme, key, false)) {
            return true;
        }
        if (this.checkBool(yamlNode, scheme, key, false)) {
            return true;
        }
        if (this.checkVec(yamlNode, scheme, key, 2, false)) {
            return true;
        }
        if (this.checkVec(yamlNode, scheme, key, 3, false)) {
            return true;
        }
        if (this.checkVec(yamlNode, scheme, key, 4, false)) {
            return true;
        }
        diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `${key}的类型无效`);
        return false;
    }
    private checkString(yamlNode: yaml.YAMLNode, scheme: Scheme, key: string, diagnostic: boolean = true): boolean {
        if (!this._checkEmpty(yamlNode, key, diagnostic)) {
            return false;
        }
        if (yamlNode.kind !== yaml.Kind.SCALAR) {
            diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `必须是${scheme.type}`);
            return false;
        }
        const scalar: yaml.YAMLScalar = yamlNode as yaml.YAMLScalar;
        const str = scalar.value;
        if (!isString(str)) {
            diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `必须是${scheme.type}`);
            return false;
        }
        if (scheme.values) {
            if (!scheme.values.find(el => el === str)) {
                diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `${str}必须是[${scheme.values.join(', ')}]中的一个`);
                return false;
            }
        }
        return true;
    }

    private checkBool(yamlNode: yaml.YAMLNode, scheme: Scheme, key: string, diagnostic: boolean = true): boolean {
        if (!this._checkEmpty(yamlNode, key, diagnostic)) {
            return false;
        }
        if (yamlNode.kind !== yaml.Kind.SCALAR) {
            diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `必须是${scheme.type}`);
            return false;
        }
        const scalar: yaml.YAMLScalar = yamlNode as yaml.YAMLScalar;
        if (scalar.value !== 'true' && scalar.value !== 'false') {
            diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `必须是${scheme.type}`);
            return false;
        }
        return true;
    }

    public checkVec(yamlNode: yaml.YAMLNode, scheme: Scheme, key: string, num: number, diagnostic: boolean = true, diagnosticPrefix: string = ""): boolean {
        if (!this._checkEmpty(yamlNode, key, diagnostic)) {
            return false;
        }
        if (yamlNode.kind !== yaml.Kind.SEQ) {
            diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `${diagnosticPrefix}必须是${scheme.type}`);
            return false;
        }
        const seq: yaml.YAMLSequence = yamlNode as yaml.YAMLSequence;
        if (seq.items.length !== num) {
            diagnostic && this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, `${diagnosticPrefix}必须是${scheme.type}`);
            return false;
        }
        let ret = true;
        for (let i = 0; i < seq.items.length; i++) {
            const item = seq.items[i];
            if (!this.checkNumber(item, scheme, key, diagnostic, diagnosticPrefix)) {
                ret = false;
            }
        }
        return ret;
    }
    private checkNumber(item: yaml.YAMLNode, scheme: Scheme, key: string, diagnostic: boolean = true, diagnosticPrefix: string = ""): boolean {
        if (!this._checkEmpty(item, key, diagnostic)) {
            return false;
        }
        if (item.kind !== yaml.Kind.SCALAR) {
            diagnostic && this.addDiagnostic(item.startPosition, item.endPosition, `${diagnosticPrefix}必须是常量`);
            return false;
        }
        if (!isNumber(item.value)) {
            diagnostic && this.addDiagnostic(item.startPosition, item.endPosition, `${diagnosticPrefix}必须是数值`);
            return false;
        }
        return true;
    }
    private checkArray(data: yaml.YAMLSequence, scheme: Scheme) {
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            if (item.kind === yaml.Kind.MAP) {
                this.checkMap(item as yaml.YamlMap, scheme);
            } else {
                // 其他类型
                console.log('unknown');
            }
        }
    }
    private checkMap(map: yaml.YamlMap, scheme: Scheme) {
        const missingKeys: string[] = [];
        if (scheme.children) {
            Object.keys(scheme.children).forEach(el => {
                if (el !== ANY_TAG) {
                    missingKeys.push(el);
                }
            });
        }

        for (let i = 0; i < map.mappings.length; i++) {
            const mapping = map.mappings[i];
            const mapping_key = mapping.key.value;
            if (!isVarName(mapping_key)) {
                this.addDiagnostic(mapping.key.startPosition, mapping.key.endPosition, `无效的名字:${mapping_key}`);
            }
            const idx = missingKeys.findIndex(el => el === mapping_key);
            if (idx !== -1) {
                missingKeys.splice(idx, 1);
            }
            if (scheme.children) {
                let child_scheme: Scheme | null = null;
                const keys = Object.keys(scheme.children);
                if (keys.length === 1 && keys[0] == ANY_TAG) {
                    child_scheme = scheme.children[ANY_TAG];
                } else {
                    child_scheme = scheme.children[mapping_key];
                }
                if (child_scheme) {
                    const hoverString = this.getHoverString(child_scheme);
                    this.addHoverConfig(mapping.key.startPosition, mapping.key.endPosition, hoverString);
                    this.doCompletionsAndCheckType(mapping.value, child_scheme, mapping_key);
                } else {
                    if (scheme.childFieldType && scheme.childFieldType === FieldType.Exist) {
                        this.addDiagnostic(mapping.key.startPosition, mapping.key.endPosition, `不支持的字段:${mapping_key}`);
                    }
                }
            }
        }

        if (scheme.childFieldType && scheme.childFieldType === FieldType.Fixed && missingKeys.length > 0) {
            missingKeys.forEach(el => {
                this.addDiagnostic(map.startPosition, map.endPosition, `缺少${el}字段`);
            });
        }
    }
    private getHoverString(scheme: Scheme) {
        let hoverString = "";
        if (scheme.desc) {
            hoverString += `${scheme.desc}\n`;
        }
        if (scheme.values) {
            hoverString += `- 可选值: ${scheme.values.join(', ')}\n`;
        }
        if (scheme.defaultValue !== undefined) {
            hoverString += `- 默认值: ${scheme.defaultValue}\n`;
        }
        return hoverString;
    }
}