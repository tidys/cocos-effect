grammar CocosEffect;
main: ((SINGLE_LINE_COMMENT | effect | program) NEWLINE)*;

effect: 'CCEffect' ' '+ '%{' techniques '}%';
techniques: 'techniques:' (passes)+;
passes: '- passes:' ('- ' pass)+;
pass: vert frag blendState? rasterizerState? properties?;

vert: 'vert: ' Identifier;

frag: 'frag: ' Identifier;

blendState: 'blendState:' targets?;
targets: 'targets:' blend?;
blend: '- blend:' Boolean;

rasterizerState: 'rasterizerState:' cullMode?;
cullMode: 'cullMode:' 'none';

properties: 'properties:' property*;
property: Identifier ':' '{' value editor? '}';
value: 'value' ':' Number | Boolean | vec2 | vec3 | vec4;
editor: 'editor' ':' '{' editor_type? '}';
editor_type: 'type' ':' '"color"';

vec2: '[' Number ',' Number ']';
vec3: '[' Number ',' Number ',' Number ']';
vec4: '[' Number ',' Number ',' Number ',' Number ']';

program: KEY_CCPROGRAM ' ' SYMBOL_PERCENTAGE LCB RCB;

KEY_CCEFFECT: 'CCEffect';
KEY_CCPROGRAM: 'CCProgram';
SYMBOL_PERCENTAGE: '%';
NEWLINE: [\r\n]+;
SINGLE_LINE_COMMENT: '//' ~[\r\n]* -> channel(HIDDEN);
Identifier: [a-zA-Z_] [a-zA-Z_0-9]*;
LCB: '{';
RCB: '}';
KEY_TECHNIQUES: 'techniques:';
KEY_PASSES: '- passes:';
KEY_VERT: 'vert:';
Boolean: 'true' | 'false';
Number: ('-' | '+')? [0-9]+ ('.' [0-9]*)?;