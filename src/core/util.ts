export function isProgramName(name: string) {
    return /[a-zA-Z][a-zA-Z0-9_-]*/g.test(name);
}