import { YAMLNode } from "yaml-ast-parser";
import { CheckEffectField } from "../core/check-effect-field";

export enum ICompletionType {
    Any = 'any',
    Object = 'object',
    Array = 'array',
    /**
     * 标量类型，包括：string, number, bool, vec2, vec3, vec4
     */
    String_Number_Bool_Vec2_Vec3_Vec4 = 'scalar',
    Vec2_Vec3_Vec4 = 'vector',
    String = 'string',
    Bool = 'bool',
    Number = 'number',
    Vec2 = 'vec2',
    Vec4 = 'vec4',
    Vec3 = 'vec3',
}



export interface ICompletion {
    name: string;
    desc: string;
}
export enum FieldType {
    /**
     * 子级的字段是固定的，不能多也不能少
     */
    Fixed = 'fixed',
    /**
     * 子级的字段是已知的，不能出現其他key
     */
    Exist = 'exist',
}
export interface Scheme {
    /**
     * 字段含义
     */
    desc: string;

    /**
     * 默认值
     */
    defaultValue?: string | number | boolean;
    /**
     * 可选值
     */
    values?: string[];
    /**
     * 定义自己的类型
     */
    type: ICompletionType;
    /**
     * 是否必须得有改字段
     */
    required?: boolean;
    /**
     * 字段的类型
     */
    childFieldType?: FieldType;
    /**
     * 子级,<*, Scheme>是一个特殊的类型
     */
    children?: Record<string, Scheme>;

    check?: (field: CheckEffectField, node: YAMLNode) => string[];
}


