import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { DocumentInfo } from "./document-info";
import { Interval } from "../scope/interval";
import { ParserRuleContext } from "antlr4ts";
import { Scope, ScopeConstructor } from "../scope/scope";

export class Helper {
    public static getIntervalFromTerminalNode(tn: TerminalNode): Interval {
        return new Interval({
            startLine: tn.symbol.line,
            startIndex: tn.symbol.startIndex,
            stopLine: tn.symbol.line,
            stopIndex: tn.symbol.stopIndex + 1,
            text: tn.text,
        });
    }
    public static getIntervalFromParserRuleContext(ctx: ParserRuleContext): Interval {
        return new Interval({
            startLine: ctx.start.line,
            startIndex: ctx.start.startIndex,
            stopLine: ctx.stop?.line || -1,
            stopIndex: ctx.stop?.stopIndex || -1,
            text: ctx.text
        });
    }


}