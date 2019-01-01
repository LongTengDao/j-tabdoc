export var POSITIVE_INTEGER = /^[1-9]\d*$/;

export var repeatSpace = ''.repeat
	? function repeatSpace (count) { return ' '.repeat(count); }
	: function (spaces) {
		return function repeatSpace (count) {
			spaces.length = count+1;
			return spaces.join(' ');
		};
	}([]);

export function notStringArray (array) {
	for ( var length = array.length, index = 0; index<length; ++index ) {
		if ( typeof array[index]!=='string' ) { return true; }
	}
	return false;
}
