export function isVarName(name: string) {
    return /^[a-zA-Z][a-zA-Z0-9_-]*/g.test(name);
}
export function isNumber(value: string) {
    return /^[0-9]*(\.[0-9]*)?$/g.test(value);
}
// 正则表达式判断是否为字符串，可以有双引号
export function isString(value: string) {
    return /[a-zA-Z0-9_-]*$/g.test(value);
}