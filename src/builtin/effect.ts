import { CheckEffectField } from "../core/check-effect-field";
import { MyParser } from "../core/parser";
import { isVarName } from "../core/util";
import { FieldType, ICompletionType, Scheme, } from "./interfaces";
function checkChunk(parser: MyParser, programName: string): string[] {
    const ret: string[] = [];
    if (!isVarName(programName)) {
        ret.push(`无效的program:${programName}`);
    }
    if (!parser.getProgramChunk(programName)) {
        ret.push(`未找到对应的program:${programName}`);
    }
    return ret;
}
export const effect_scheme: Scheme = {
    desc: 'effect desc',
    type: ICompletionType.Object,
    childFieldType: FieldType.Fixed,
    children: {
        'techniques': {
            desc: 'techniques des',
            required: true,
            type: ICompletionType.Array,
            childFieldType: FieldType.Fixed,
            children: {
                'passes': {
                    desc: 'passes desc', required: true,
                    type: ICompletionType.Object,
                    childFieldType: FieldType.Exist,
                    children: {
                        'vert': {
                            desc: 'vert desc', required: true, type: ICompletionType.String,
                            check(checkEffectField: CheckEffectField, programName: string) {
                                const ret: string[] = checkChunk(checkEffectField.myParser, programName);
                                // TODO: 检查program的类型
                                return ret;
                            }
                        },
                        'frag': {
                            desc: 'frag desc', required: true, type: ICompletionType.String,
                            check(checkEffectField: CheckEffectField, programName: string) {
                                const ret: string[] = checkChunk(checkEffectField.myParser, programName);
                                // TODO: 检查program的类型
                                return ret;
                            }
                        },
                        'properties': {
                            desc: 'shader properties', required: false, type: ICompletionType.Object,
                            children: {
                                '*': {
                                    desc: 'property key',
                                    required: false, type: ICompletionType.Object,
                                    childFieldType: FieldType.Exist,
                                    children: {
                                        'value': { desc: 'value desc', required: true, type: ICompletionType.String_Number_Bool_Vec2_Vec3_Vec4 },
                                        'linear': { desc: 'linear desc', required: false, type: ICompletionType.Bool },
                                        'target': { desc: 'target desc', required: false, type: ICompletionType.String },
                                        'editor': {
                                            desc: 'editor desc', required: false, type: ICompletionType.Object,
                                            childFieldType: FieldType.Exist,
                                            children: {
                                                'slider': { desc: 'slider desc', required: false, type: ICompletionType.Bool },
                                                'range': { desc: 'range desc', required: false, type: ICompletionType.Vec2 },
                                                'step': { desc: 'step desc', required: false, type: ICompletionType.Number },
                                                'displayName': { desc: 'displayName desc', required: false, type: ICompletionType.String },
                                                'parent': { desc: 'parent desc', required: false, type: ICompletionType.String },
                                                'type': { desc: 'type desc', required: false, type: ICompletionType.String },
                                            }
                                        },
                                    }
                                }
                            }
                        },
                    }
                }
            }
        }
    }
};


