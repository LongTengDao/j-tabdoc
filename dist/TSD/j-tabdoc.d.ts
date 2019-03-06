declare module '@ltd/j-tabdoc' {
	
	type element = {
		key :string,
		value :string[],
		number :number,
	};
	
	type groupReviver = {
		0 :{ exec :(string :string) => RegExpExecArray },
		1 :(group :element | element[], context :any) => any,
	};
	
	class level extends Array {
		[index :number] :number | element | element[];
		number :number;
	}
	
	type levelReviver = (level :level, context :any) => any;
	
	export function parse (
		this :any,
		tabLines :string[] | string | Buffer,
		_reviver? :{
			empty? :true | false,
			group? :null | boolean | groupReviver[],
			level? :null | levelReviver,
		},
		_number? :number,
		_debug? :true | false
	) :any;
	
	type replacer = (level :any, content :any) => ( number | { key :string, value :string[] } )[];
	
	type space = (keys :string[], context :any) => { keys :typeof keys, indent :string };
	
	export function Space (
		minWidth :number,
		padding :number,
	) :space;
	
	export function stringify (
		this :any,
		level :any,
		_replacer? :null | replacer,
		_space? :null | space,
		_debug? :true | false
	) :string[];
	
}