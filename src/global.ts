import hasOwnProperty from '.Object.prototype.hasOwnProperty';
import toString from '.Object.prototype.toString';
import Array_isArray from '.Array.isArray';
export var isArray = Array_isArray || function isArray (lines :any) :boolean { return toString.call(lines)==='[object Array]'; };

import Buffer from '.Buffer';
export var toStringFollowBOM;
export var isBuffer = /*#__PURE__*/ function () {
	if ( typeof Buffer==='function' ) {
		var isBuffer = Buffer.isBuffer;
		if ( typeof isBuffer==='function' && typeof Buffer.from==='function' ) {
			var from = Buffer.from;
			if ( typeof from==='function' ) {
				if ( !hasOwnProperty.call(Buffer, 'from') ) {
					from = function from (buffer) :Buffer { return new Buffer(buffer); };
				}
				toStringFollowBOM = function toStringFollowBOM (buffer :Buffer) :string {
					switch ( buffer[0] ) {
						case 0xEF: if ( buffer[1]===0xBB && buffer[2]===0xBF ) { return buffer.slice(3).toString('utf8'); } break;
						case 0xFF: if ( buffer[1]===0xFE ) { return buffer.slice(2).toString('ucs2'); } break;
						case 0xFE: if ( buffer[1]===0xFF ) { buffer = from(buffer); return buffer.swap16().slice(2).toString('ucs2'); } break;
					}
					return buffer.toString();
				};
				return isBuffer;
			}
		}
	}
	return function isBuffer () :boolean { return false; };
}();