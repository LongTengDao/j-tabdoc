export var POSITIVE_INTEGER = /^[1-9]\d*$/;

export var repeatSpace = ''.repeat
	? function repeatSpace (count :number) :string { return ' '.repeat(count); }
	: function (spaces :undefined[]) :typeof repeatSpace {
		return function repeatSpace (count :number) :string {
			spaces.length = count+1;
			return spaces.join(' ');
		};
	}([]);

export function notStringArray (array :any[]) :boolean {
	for ( var length :number = array.length, index :number = 0; index<length; ++index ) {
		if ( typeof array[index]!=='string' ) { return true; }
	}
	return false;
}
