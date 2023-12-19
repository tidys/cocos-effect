import { Diagnostic, Range, TextDocument } from "vscode";
import { YAMLDocument, YAMLNode } from "yaml-ast-parser";
import * as yaml from "yaml-ast-parser";
import { Editor } from "./editor";
import { FieldType, ICompletion, ICompletionType, Scheme } from "../builtin/interfaces";
import { effect_scheme } from "../builtin/effect";
import { MyParser } from "./parser";

export class CompletionConfig {
    public start: number;
    public end: number;
    public completions: ICompletion[] = [];
    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
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
            if (scheme.check) {
                const result = scheme.check(this, yamlNode.value);
                if (result.length > 0) {
                    result.forEach(el => {
                        this.addDiagnostic(yamlNode.startPosition, yamlNode.endPosition, el);
                    });
                }
            }
            if (scheme.type === ICompletionType.String) {
                // string
            } else if (scheme.type === ICompletionType.Number) {
                // number
            } else if (scheme.type === ICompletionType.Bool) {
                // boolean
            }
        }
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
}