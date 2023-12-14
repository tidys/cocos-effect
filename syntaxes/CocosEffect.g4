grammar CocosEffect;
main: (COMMENT | effect | SPACE* NEWLINE | SPACE+)* EOF;
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
	| yaml_array1
	| (yaml_array2)+
	| yaml_object;

yaml_array1: '[' NUMBER (',' NUMBER)* ']' NEWLINE*;
yaml_array2:
	YAML_ARRAY_FLAG (SPACE+ (NEWLINE)* yaml_key_value)+;
yaml_object:
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
COLON: ':';
ID: [a-zA-Z_] [a-zA-Z_0-9-]*;