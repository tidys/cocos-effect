import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import { CocosEffectVisitor } from '../antlr/CocosEffectVisitor';
import { InputBoxOptions, Uri } from 'vscode';
import { EffectContext, MainContext, ProgramContext, YamlContext, Yaml_arrayContext, Yaml_keyContext, Yaml_key_valueContext, Yaml_valueContext, } from '../antlr/CocosEffectParser';
import { DocumentInfo } from './document-info';
import { Editor } from './editor';
import { Scope, ScopeConstructor } from '../scope/scope';
import { Interval, IntervalOptions } from '../scope/interval';
import { ProgramDeclaration } from '../scope/chunk/program/program-declaration';
import { ParserRuleContext } from 'antlr4ts';
import { Helper } from './helper';
import { ScopeYamlObject, YamlPair } from '../scope/chunk/effect/scope-yaml-object';
import { ScopeYamlString } from '../scope/chunk/effect/scope-yaml-string';
import { ScopeYamlNumber } from '../scope/chunk/effect/scope-yaml-number';
import { ScopeYamlBool } from '../scope/chunk/effect/scope-yaml-bool';
import { ScopeYamlArray } from '../scope/chunk/effect/scope-yaml-array';
import { ScopeYaml, ScopeYamlCtor } from '../scope/chunk/effect/scope-yaml';
import { ScopeChunk, ScopeChunkCtor } from '../scope/chunk/scope-chunks';
import { Element } from '../scope/chunk/effect/element';
import { TerminalNode } from 'antlr4ts/tree/TerminalNode';
import { ScopeRoot } from '../scope/scope-root';

export class Visitor extends AbstractParseTreeVisitor<void> implements CocosEffectVisitor<void> {
    private uri: Uri;
    private di: DocumentInfo | null = null;
    private scope: Scope | null = null;
    public constructor(uri: Uri) {
        super();
        this.uri = uri;
    }
    private initialize(): void {
        this.di = Editor.getDocumentInfo(this.uri);
        this.di.reset();
        this.scope = this.di.getRootScope();
    }
    visitMain(ctx: MainContext): void {
        this.initialize();
        this.visitChildren(ctx);
    }
    getScopeParent(): Scope | null {
        return this.scope!.parent || null;
    }
    visitEffect(ctx: EffectContext): void {
        // effect 必须是个object，不允许是array，这是creator的规则
        this.scope = this.createChunkScope(ctx, this.scope!);
        this.visitChildren(ctx);
        this.scope = this.getScopeParent();
    }
    public createChunkScope(ctx: EffectContext | ProgramContext, scope: Scope): ScopeChunk | null {
        let chunkName = "";
        let nameInterval: Interval | null = null;
        if (ctx instanceof EffectContext) {
            chunkName = 'CCEffect';
        } else if (ctx instanceof ProgramContext) {
            chunkName = `CCProgram ${ctx.ID().text}`;
            nameInterval = Helper.getIntervalFromTerminalNode(ctx.ID());
        }
        if (scope instanceof ScopeRoot) {
            const newScope = new ScopeChunk(scope);
            newScope.name = chunkName;
            newScope.nameInterval = nameInterval;
            newScope.interval = new Interval({
                startLine: ctx.start.line,
                startIndex: ctx.RANGE_BEGIN().symbol.startIndex,
                stopLine: ctx.stop?.line || -1,
                stopIndex: ctx.RANGE_END().symbol.stopIndex,
                text: ctx.text,
            });
            newScope.bindCompletion(() => {
                return [];
            });
            scope.chunks.push(newScope);
            return newScope;
        }
        return null;
    }

    visitYaml(ctx: YamlContext) {
        // 这里面都是object
        if (this.scope instanceof ScopeChunk) {
            const obj = new ScopeYamlObject(ctx, this.scope);
            this.scope.value = obj;
            this.scope = obj;
            this.visitChildren(ctx);
            this.scope = this.getScopeParent();
        }
    }

    private getValueElement(ctx_value: Yaml_valueContext, scope: ScopeYamlObject | ScopeYamlArray): ScopeYaml | null {
        let node: TerminalNode | undefined =
            ctx_value.STRING();
        if (node) {
            return new ScopeYamlString(node, scope);
        }
        node = ctx_value.NUMBER();
        if (node) {
            return new ScopeYamlNumber(node, scope);
        }
        node = ctx_value.ID();
        if (node) {
            // a: true    bool
            // a: str     字符串
            const text = node.text.trim();
            if ('true' === text || 'false' === text) {
                return new ScopeYamlBool(node, scope);
            } else {
                return new ScopeYamlString(node, scope);
            }
        }
        return null;
    }
    visitYaml_key_value(ctx: Yaml_key_valueContext) {
        const ctx_value = ctx.yaml_value();
        const ctx_key = ctx.yaml_key();
        const keyID = ctx_key.ID()!;
        if (this.scope instanceof ScopeYamlObject || this.scope instanceof ScopeYamlArray) {
            const key = new ScopeYamlString(keyID, this.scope);
            const pair = new YamlPair(key);
            if (this.scope instanceof ScopeYamlObject) {
                this.scope.addKeyValue(pair);
            } else {
                // todo
            }
            const value = this.getValueElement(ctx_value, this.scope);
            if (value) {
                // 普通的数值
                pair.value = value;
            } else {
                // 数组/对象
                if (ctx_value.yaml_array_inline()) {
                    //
                } else if (ctx_value.yaml_array().length) {
                    // this.scope = pair.value = new ScopeYamlArray(ctx_value.yaml_array(), this.scope);
                } else if (ctx_value.yaml_key_value()) {
                    this.scope = pair.value = new ScopeYamlObject(ctx_value.yaml_key_value()!, this.scope);
                    this.visitChildren(ctx);
                    this.scope = this.getScopeParent();
                } else if (ctx_value.yaml_object_inline()) {
                    //
                }
            }
        } else {
            // 
            console.log('error');
        }

    }
    visitYaml_key(ctx: Yaml_keyContext) {
        //
    }
    visitYaml_array(ctx: Yaml_arrayContext) {
        this.visitChildren(ctx);
    }
    visitYaml_value(ctx: Yaml_valueContext) {
        this.visitChildren(ctx);
    }
    protected defaultResult(): void {
        // do nothing
    }
}