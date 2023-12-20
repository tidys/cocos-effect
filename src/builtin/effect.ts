import { Kind, YAMLMapping, YAMLNode, YAMLScalar, YamlMap } from "yaml-ast-parser";
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

const desc = {
    techniques: `Technique 下拉框会列出当前使用的 Effect 资源中所有的 Technique。Effect 资源中可能会存在多个 Technique，每个 Technique 适用于不同的情况，比如效果差一点但是性能更好的 Technique 更适合用于手机平台。当切换了 Technique 后 Pass 列表也会同步更新。`,
    pass: `Pass 列表会列出当前使用的 Technique 中所有的 Pass。每个 Pass 可能会有不同的属性和定义，开发者可以分别设置这些属性和定义。如果属性是被定义包裹住的，需要先勾上定义才能看到对应的属性。`,
    vert: `当前 pass 使用的 shader, 格式为 片段名:入口函数名，这个名字可以是本文件中声明的 shader 片段名, 也可以是引擎提供的标准头文件。 片段中不应出现 main 函数入口, 在 effect 编译期会插入 wrapper，将指定入口函数的返回值赋值给当前 shader 的输出（gl_Position 或最终的输出颜色）。`,
    properties: `存储着这个Pass有哪些可定制的参数需要在 Inspector 上显示，这些参数可以是 shader 中的某个 uniform 的完整映射，也可以是具体某个分量的映射 (使用 target 参数)：`,
};
const blendValues = ['one', 'zero', 'src_alpha_saturate',
    'src_alpha', 'one_minus_src_alpha',
    'dst_alpha', 'one_minus_dst_alpha',
    'src_color', 'one_minus_src_color',
    'dst_color', 'one_minus_dst_color',
    'constant_color', 'one_minus_constant_color',
    'constant_alpha', 'one_minus_constant_alpha'];
const stencilValues = ['keep', 'zero', 'replace', 'incr', 'incr_wrap', 'decr', 'decr_wrap', 'invert'];
export const effect_scheme: Scheme = {
    desc: 'effect desc',
    type: ICompletionType.Object,
    childFieldType: FieldType.Fixed,
    children: {
        'techniques': {
            desc: desc.techniques,
            required: true,
            type: ICompletionType.Array,
            childFieldType: FieldType.Fixed,
            children: {
                'passes': {
                    desc: desc.pass,
                    required: true,
                    type: ICompletionType.Object,
                    childFieldType: FieldType.Exist,
                    children: {
                        'vert': {
                            desc: desc.vert, required: true, type: ICompletionType.String,
                            check(checkEffectField: CheckEffectField, node: YAMLNode) {
                                const programName: string = node.value;
                                const ret: string[] = checkChunk(checkEffectField.myParser, programName);
                                // TODO: 检查program的类型
                                return ret;
                            }
                        },
                        'frag': {
                            desc: desc.vert, required: true, type: ICompletionType.String,
                            check(checkEffectField: CheckEffectField, node: YAMLNode) {
                                const programName: string = node.value;
                                const ret: string[] = checkChunk(checkEffectField.myParser, programName);
                                // TODO: 检查program的类型
                                return ret;
                            }
                        },
                        'switch': {
                            type: ICompletionType.String,
                            desc: `could be any valid macro name that's not defined in the shader,指定这个 pass 的执行依赖于哪个 define，它不应与使用到的 shader 中定义的任何 define 重名。
                            这个字段默认是不存在的，意味着这个 pass 是无条件执行的。`,
                        },
                        'priority': {
                            type: ICompletionType.Number,
                            desc: 'could be any number between max(255) and min(0)指定这个 pass 的渲染优先级，数值越小越优先渲染；default 代表默认优先级 (128)，min 代表最小（0），max 代表最大（255），可结合四则运算符指定相对值。',
                            defaultValue: 128,
                        },
                        'stage': {
                            type: ICompletionType.String,
                            defaultValue: 'default',
                            desc: 'could be the name of any registered stage in your runtime pipeline，指定这个 pass 归属于管线的哪个 stage，对默认 forward 管线，只有 default 一个 stage。',
                        },
                        'phase': {
                            type: ICompletionType.String,
                            defaultValue: 'default',
                            values: ['default', 'forward-add', 'shadow-caster'],
                            desc: `could be the name of any registered phase in your runtime pipeline,指定这个 pass 归属于管线的哪个 stage，对默认 forward 管线，可以是 default, forward-add, shadow-caster 几个。`
                        },
                        'propertyIndex': {
                            type: ICompletionType.String,
                            desc: `could be any valid pass index，指定这个 pass 的运行时 uniform 属性数据要和哪个 pass 保持一致，比如 forward add 等 pass 需要和 base pass 一致才能保证正确的渲染效果。
                            一旦指定了此参数，材质面板上就不再会显示这个 pass 的任何属性。`,
                        },
                        'embeddedMacros': {
                            type: ICompletionType.String,
                            desc: `could be an object containing any macro key-value pairs，指定在这个 pass 的 shader 基础上额外定义的常量宏。在多个 pass 的 shader 只有宏定义不同时可使用此参数来复用 shader 资源。`
                        },
                        'primitive': {
                            desc: ``,
                            defaultValue: 'triangle_list',
                            type: ICompletionType.String,
                            values: ['point_list', 'line_list', 'line_strip', 'line_loop',
                                'triangle_list', 'triangle_strip', 'triangle_fan',
                                'line_list_adjacency', 'line_strip_adjacency',
                                'triangle_list_adjacency', 'triangle_strip_adjacency',
                                'triangle_patch_adjacency', 'quad_patch_list', 'iso_line_list'],
                        },
                        'dynamics': {
                            desc: ` an array containing any of the following`,
                            defaultValue: '[]',
                            type: ICompletionType.String,
                            values: ['viewport', 'scissor', 'line_width', 'depth_bias', 'blend_constants',
                                'depth_bounds', 'stencil_write_mask', 'stencil_compare_mask']
                        },
                        'rasterizerState': {
                            desc: ``,
                            type: ICompletionType.Object,
                            children: {
                                cullMode: {
                                    desc: ``,
                                    type: ICompletionType.String,
                                    defaultValue: 'back',
                                    values: ['front', 'back', 'none']
                                }
                            }
                        },
                        'depthStencilState': {
                            desc: ``,
                            type: ICompletionType.Object,
                            children: {
                                depthTest: {
                                    desc: ``,
                                    defaultValue: true,
                                    type: ICompletionType.Bool,
                                },
                                depthWrite: {
                                    desc: ``,
                                    defaultValue: true,
                                    type: ICompletionType.Bool,
                                },
                                depthFunc: {
                                    desc: ``,
                                    defaultValue: 'less',
                                    type: ICompletionType.String,
                                    values: ['never', 'less', 'equal', 'less_equal', 'greater', 'not_equal', 'greater_equal', 'always']
                                },
                                stencilTest: {
                                    desc: ``,
                                    defaultValue: false,
                                    type: ICompletionType.Bool,
                                },
                                stencilFunc: {
                                    desc: ``,
                                    defaultValue: 'always',
                                    type: ICompletionType.String,
                                    values: ['never', 'less', 'equal', 'less_equal', 'greater', 'not_equal', 'greater_equal', 'always']
                                },
                                stencilReadMask: {
                                    desc: ``,
                                    type: ICompletionType.String,
                                    defaultValue: '0xffffffff',
                                    values: ['0xffffffff', '[1, 1, 1, 1]']
                                },
                                stencilWriteMask: {
                                    desc: ``,
                                    type: ICompletionType.String,
                                    defaultValue: '0xffffffff',
                                    values: ['0xffffffff', '[1, 1, 1, 1]']
                                },
                                stencilFailOp: {
                                    desc: ``,
                                    type: ICompletionType.String,
                                    defaultValue: 'keep',
                                    values: stencilValues,
                                },
                                stencilZFailOp: {
                                    desc: ``,
                                    type: ICompletionType.String,
                                    defaultValue: 'keep',
                                    values: stencilValues,
                                },
                                stencilPassOp: {
                                    desc: ``,
                                    type: ICompletionType.String,
                                    defaultValue: 'keep',
                                    values: stencilValues,
                                },
                                stencilRef: {
                                    desc: ``,
                                    type: ICompletionType.String,
                                    values: ['1', '[0, 0, 0, 1]']
                                },
                                'stencilFront': {
                                    type: ICompletionType.String,
                                    desc: `set above stencil properties for specific side front`,
                                },
                                'stencilBack': {
                                    type: ICompletionType.String,
                                    desc: `set above stencil properties for specific side back`,
                                }
                            }
                        },
                        'blendState': {
                            desc: ``,
                            type: ICompletionType.Object,
                            children: {
                                blendColor: {
                                    desc: ``,
                                    defaultValue: 0,
                                    type: ICompletionType.String,
                                    values: ['0', '[0,0,0,0]']
                                },
                                targets: {
                                    desc: ``,
                                    type: ICompletionType.Array,
                                    children: {
                                        blend: { desc: ``, defaultValue: false, type: ICompletionType.Bool },
                                        blendEq: {
                                            desc: ``,
                                            type: ICompletionType.String,
                                            defaultValue: 'add', values: ['add', 'sub', 'rev_sub']
                                        },
                                        blendSrc: {
                                            desc: ``,
                                            type: ICompletionType.String,
                                            defaultValue: 'one',
                                            values: blendValues,
                                        },
                                        blendDst: {
                                            desc: ``,
                                            type: ICompletionType.String,
                                            defaultValue: 'zero',
                                            values: blendValues,
                                        },
                                        blendSrcAlpha: {
                                            desc: ``,
                                            type: ICompletionType.String, defaultValue: 'one',
                                            values: blendValues
                                        },
                                        blendDstAlpha: {
                                            desc: ``,
                                            type: ICompletionType.String,
                                            defaultValue: 'zero', values: blendValues
                                        },
                                        blendAlphaEq: {
                                            desc: ``,
                                            type: ICompletionType.String,
                                            defaultValue: 'add', values: ['add', 'sub', 'rev_sub']
                                        },
                                        blendColorMask: {
                                            desc: ``,
                                            type: ICompletionType.String,
                                            defaultValue: "all", values: ['all', 'none', 'r', 'g', 'b', 'a', 'rg', 'rb', 'ra', 'gb', 'ga', 'ba', 'rgb', 'rga', 'rba', 'gba']
                                        }
                                    }
                                }
                            }

                        },

                        'properties': {
                            desc: desc.properties, required: false, type: ICompletionType.Object,
                            children: {
                                '*': {
                                    desc: 'property key',
                                    required: false, type: ICompletionType.Object,
                                    childFieldType: FieldType.Exist,
                                    children: {
                                        'value': { desc: '属性的值', required: true, type: ICompletionType.String_Number_Bool_Vec2_Vec3_Vec4 },
                                        'linear': { desc: 'linear desc', required: false, type: ICompletionType.Bool },
                                        'target': { desc: '具体某个分量的映射, any valid uniform components, no random swizzle', required: false, type: ICompletionType.String },
                                        'editor': {
                                            desc: 'editor desc', required: false, type: ICompletionType.Object,
                                            childFieldType: FieldType.Exist,
                                            children: {
                                                'slider': { desc: 'slider desc', required: false, type: ICompletionType.Bool },
                                                'range': {
                                                    desc: '一个长度为 2 的数组，首元素为最小值，末元素为最大值，针对连续数字类型的宏定义，显式指定它的取值范围，范围应当控制到最小，有利于运行时的 shader 管理',
                                                    defaultValue: '[0, 3]',
                                                    required: false, type: ICompletionType.Vec2
                                                },
                                                'step': { desc: 'step desc', required: false, type: ICompletionType.Number },
                                                'displayName': { desc: '面板展示的名字', required: false, type: ICompletionType.String },
                                                'parent': { desc: 'parent desc', required: false, type: ICompletionType.String },
                                                'type': {
                                                    desc: '类型', values: ["vector", 'color'],
                                                    check(field: CheckEffectField, node: YAMLNode) {
                                                        const value: string = node.value;
                                                        const propertyNode = node.parent?.parent?.parent?.parent;
                                                        if (!propertyNode) { return []; }
                                                        if (propertyNode.kind !== Kind.MAP) { return []; }
                                                        const mapNode = propertyNode as YamlMap;
                                                        const mappings = mapNode.mappings;
                                                        const propertyValueNode = mappings.find(el => {
                                                            if (el.kind === Kind.MAPPING && el.key.value === 'value') {
                                                                return true;
                                                            }
                                                            return false;
                                                        });
                                                        if (!propertyValueNode) { return []; }
                                                        if (propertyValueNode.kind !== Kind.MAPPING) { return []; }
                                                        const key_value_node = propertyValueNode as YAMLMapping;
                                                        // 校验值
                                                        if (value === 'color') {
                                                            // 必须是vec4类型
                                                            const scheme: Scheme = {
                                                                desc: ``,
                                                                type: ICompletionType.Vec4,
                                                            };
                                                            field.checkVec(key_value_node.value, scheme, key_value_node.key.value, 4, true, `editor.type=${value}, `);
                                                            // 错误已经在check中处理了
                                                            return [];
                                                        } else if (value === 'vector') {
                                                            const scheme: Scheme = {
                                                                desc: ``,
                                                                type: ICompletionType.Vec2_Vec3_Vec4,
                                                            };
                                                            field.checkVector(key_value_node.value, scheme, key_value_node.key.value, true, `editor.type=${value}, `);
                                                            return [];
                                                        }
                                                        return [];
                                                    },
                                                    required: false, type: ICompletionType.String
                                                },
                                                'visible': { desc: '是否可见', required: false, type: ICompletionType.Bool },
                                                'tooltip': { desc: '提示语', required: false, type: ICompletionType.String },
                                                'deprecated': {
                                                    desc: '是否废弃,for any material using this effect,delete the existing data for this property after next saving',
                                                    required: false, type: ICompletionType.Bool
                                                },
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


