import * as yaml from "yaml-ast-parser";
import { isNumber, isString, isVarName } from "./util";
import { GrammarColor, GrammarYamlKind } from "./grammar-color";
import { Scheme } from "../builtin/interfaces";

export class CheckOptions {
    /**
     * 检查的节点
     */
    yamlNode: yaml.YAMLNode;
    scheme: Scheme | null = null;
    constructor(yamlNode: yaml.YAMLNode) {
        this.yamlNode = yamlNode;
    }
    clone(yamlNode: yaml.YAMLNode) {
        const opts = new CheckOptions(yamlNode);
        opts.scheme = this.scheme;
        opts.key = this.key;
        opts.diagnosticEnabled = this.diagnosticEnabled;
        opts.diagnosticPrefix = this.diagnosticPrefix;
        opts.diagnosticCallback = this.diagnosticCallback;
        opts.itemCallback = this.itemCallback;
        return opts;
    }
    /**
     * 检查的key
     */
    key: string = "";

    /**
     * 是否诊断错误，默认值为true
     */
    diagnosticEnabled: boolean = true;
    /**
     * 诊断日志前缀，默认值为""
     */
    diagnosticPrefix: string = "";
    /**
     * 诊断函数
     */
    diagnosticCallback: ((startPosition: number, endPosition: number, message: string) => void) | null = null;
    public doDiagnostic(node: yaml.YAMLNode, message: string) {
        if (this.diagnosticEnabled && this.diagnosticCallback) {
            this.diagnosticCallback(node.startPosition, node.endPosition, `${this.diagnosticPrefix}${message}`);
        }
    }
    /**
     * 检查item的回调
     */
    itemCallback?: (kind: GrammarYamlKind, node: yaml.YAMLNode) => void;
}
export class TypeCheck {
    private static _checkEmpty(options: CheckOptions): boolean {
        const { yamlNode, key } = options;
        if (yamlNode.startPosition === -1 || yamlNode.endPosition === -1) {
            options.doDiagnostic(yamlNode.parent.key, `${key}不能为空`);
            return false;
        }
        return true;
    }
    public static checkVector(options: CheckOptions,): boolean {
        const { yamlNode, scheme, key } = options;
        options.diagnosticEnabled = false;
        if (!this._checkEmpty(options)) {
            return false;
        }
        if (this.checkVec(2, options)) {
            return true;
        }
        if (this.checkVec(3, options)) {
            return true;
        }
        if (this.checkVec(4, options)) {
            return true;
        }
        options.diagnosticEnabled = true;
        options.doDiagnostic(yamlNode, `${key}的类型无效`);
        return false;
    }
    public static checkScalar(options: CheckOptions): boolean {
        const { yamlNode, scheme, key } = options;
        options.diagnosticEnabled = false;
        if (!this._checkEmpty(options)) {
            return false;
        }
        if (this.checkString(options)) {
            return true;
        }
        if (this.checkNumber(options)) {
            return true;
        }
        if (this.checkBool(options)) {
            return true;
        }
        if (this.checkVec(2, options)) {
            return true;
        }
        if (this.checkVec(3, options)) {
            return true;
        }
        if (this.checkVec(4, options)) {
            return true;
        }
        options.diagnosticEnabled = true;
        options.doDiagnostic(yamlNode, `${key}的类型无效`);
        return false;
    }
    public static checkString(options: CheckOptions): boolean {
        const { yamlNode, scheme, itemCallback } = options;
        if (!this._checkEmpty(options)) {
            return false;
        }
        if (yamlNode.kind !== yaml.Kind.SCALAR) {
            options.doDiagnostic(yamlNode, `必须是${scheme!.type}`);
            return false;
        }
        const scalar: yaml.YAMLScalar = yamlNode as yaml.YAMLScalar;
        const str = scalar.value;
        if (!isString(str)) {
            options.doDiagnostic(yamlNode, `必须是${scheme!.type}`);
            return false;
        }
        if (scheme && scheme.values) {
            if (!scheme.values.find(el => el === str)) {
                options.doDiagnostic(yamlNode, `${str}必须是[${scheme!.values.join(', ')}]中的一个`);
                return false;
            }
        }
        itemCallback && itemCallback(GrammarYamlKind.VALUE_STRING, yamlNode);
        return true;
    }
    public static checkBool(options: CheckOptions): boolean {
        const { yamlNode, scheme, itemCallback } = options;
        if (!this._checkEmpty(options)) {
            return false;
        }
        if (yamlNode.kind !== yaml.Kind.SCALAR) {
            options.doDiagnostic(yamlNode, `必须是${scheme!.type}`);
            return false;
        }
        const scalar: yaml.YAMLScalar = yamlNode as yaml.YAMLScalar;
        if (!this._isBool(scalar.value)) {
            options.doDiagnostic(yamlNode, `必须是${scheme!.type}`);
            return false;
        }
        itemCallback && itemCallback(GrammarYamlKind.VALUE_BOOL, yamlNode);
        return true;
    }
    private static _isBool(value: string) {
        return value === 'true' || value === 'false';
    }
    public static checkVec(num: number, options: CheckOptions): boolean {
        const { yamlNode, key, scheme, itemCallback } = options;
        if (!this._checkEmpty(options)) {
            return false;
        }
        if (yamlNode.kind !== yaml.Kind.SEQ) {
            options.doDiagnostic(yamlNode, `必须是${scheme!.type}`);
            return false;
        }
        const seq: yaml.YAMLSequence = yamlNode as yaml.YAMLSequence;
        if (seq.items.length !== num) {
            options.doDiagnostic(yamlNode, `必须是${scheme!.type}`);
            return false;
        }
        let ret = true;
        for (let i = 0; i < seq.items.length; i++) {
            const item = seq.items[i];
            const opts = options.clone(item);
            if (this.checkNumber(opts)) {
                itemCallback && itemCallback(GrammarYamlKind.VALUE_NUMBER, item);
            } else {
                ret = false;
            }
        }
        return ret;
    }
    public static checkNumber(options: CheckOptions): boolean {
        const { yamlNode, scheme, itemCallback } = options;
        if (!this._checkEmpty(options)) {
            return false;
        }
        if (yamlNode.kind !== yaml.Kind.SCALAR) {
            options.doDiagnostic(yamlNode, `必须是常量`);
            return false;
        }
        if (!isNumber(yamlNode.value)) {
            options.doDiagnostic(yamlNode, `必须是数值`);
            return false;
        }
        itemCallback && itemCallback(GrammarYamlKind.VALUE_NUMBER, yamlNode);
        return true;
    }

}