// Object, Array, Buffer
var undefined;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var push = Array.prototype.push;
var isArray = Array.isArray || function isArray (lines) { return toString.call(lines)==='[object Array]'; };

if ( typeof Buffer==='function' ) {
	var isBuffer = Buffer.isBuffer;
	if ( typeof isBuffer==='function' && typeof Buffer.from==='function' ) {
		var from = Buffer.hasOwnProperty('from') ? Buffer.from : function from (buffer) { return new Buffer(buffer); };
		var toStringFollowBOM = function toStringFollowBOM (buffer) {
			switch ( buffer[0] ) {
				case 0xEF: if ( buffer[1]===0xBB && buffer[2]===0xBF ) { return buffer.slice(3).toString('utf8'); } break;
				case 0xFF: if ( buffer[1]===0xFE ) { return buffer.slice(2).toString('ucs2'); } break;
				case 0xFE: if ( buffer[1]===0xFF ) { buffer = from(buffer); return buffer.swap16().slice(2).toString('ucs2'); } break;
			}
			return buffer.toString();
		};
	}
	else { isBuffer = function isBuffer () { return false; }; }
}
else { isBuffer = function isBuffer () { return false; }; }

export { undefined, hasOwnProperty, toString, push, isArray, isBuffer, toStringFollowBOM };// TypeError, Error, RangeError
