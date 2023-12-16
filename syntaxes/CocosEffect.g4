grammar CocosEffect;
main: (COMMENT | effect | program+ | SPACE* NEWLINE | SPACE+)* EOF;
effect:
	'CCEffect' SPACE+ RANGE_BEGIN (SPACE* NEWLINE)* (
		(SPACE | NEWLINE)
		| yaml
	) RANGE_END;
yaml: (yaml_key_value)*;
yaml_key_value:
	(SPACE | NEWLINE)* yaml_key COLON (
		SPACE+
		| SPACE? NEWLINE?
		| (SPACE | NEWLINE)*
	) yaml_value;
yaml_key: ID;
yaml_value:
	(NUMBER | STRING | ID) NEWLINE*
	| yaml_array_inline
	| (yaml_array)+
	| yaml_object_inline
	| yaml_key_value;

yaml_array_inline:
	'[' (NUMBER | ID) (',' (NUMBER | ID))* ']' NEWLINE*;
yaml_array: YAML_ARRAY_FLAG (SPACE+ (NEWLINE)* yaml_key_value)+;
yaml_object_inline:
	'{' (SPACE | NEWLINE)* yaml_key_value (
		(SPACE | NEWLINE)* ',' SPACE* yaml_key_value
	)* (SPACE | NEWLINE)* '}' NEWLINE*;
YAML_ARRAY_FLAG: SPACE* '-';
COMMENT: '//' ~[\r\n]* '\r'? '\n'?;
SPACE: ' ';
NEWLINE: ('\r\n' | '\r' | '\n');
RANGE_BEGIN: '%{';
RANGE_END: '}%';
STRING: '"' ~[\r\n"]* '"';
NUMBER: ('-' | '+')? [0-9]+ ('.' [0-9]*)?;
BOOL: ('true' | 'false');
COLON: ':';
ID: [a-zA-Z_] [a-zA-Z_0-9-]*;

program: 'CCProgram' SPACE+ ID SPACE+ RANGE_BEGIN RANGE_END;