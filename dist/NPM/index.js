'use strict';

var version = '2.0.0';

// Object, Array, Buffer
var undefined$1;
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

var POSITIVE_INTEGER = /^[1-9]\d*$/;

var repeatSpace = ''.repeat
	? function repeatSpace (count) { return ' '.repeat(count); }
	: function (spaces) {
		return function repeatSpace (count) {
			spaces.length = count+1;
			return spaces.join(' ');
		};
	}([]);

function notStringArray (array) {
	for ( var length = array.length, index = 0; index<length; ++index ) {
		if ( typeof array[index]!=='string' ) { return true; }
	}
	return false;
}

var BOM = /^\uFEFF/;
var EOL = /\r\n?|\n/;

function parse (tabLines, _reviver, _number, _debug) {
	if ( !isArray(tabLines) ) {
		if ( typeof tabLines==='string' ) { tabLines = tabLines.replace(BOM, '').split(EOL); }
		else if ( isBuffer(tabLines) ) { tabLines = toStringFollowBOM(tabLines).split(EOL); }
	}
	if ( _reviver==null ) {
		var countEmpties = true;
		var groupReviver = null;
		var levelReviver = null;
	}
	else {
		countEmpties = _reviver.empty;
		groupReviver = _reviver.group;
		levelReviver = _reviver.level;
		if ( countEmpties===undefined$1 ) { countEmpties = true; }
		if ( groupReviver===undefined$1 ) { groupReviver = null; }
		if ( levelReviver===undefined$1 ) { levelReviver = null; }
	}
	if ( _number===undefined$1 ) { _number = 1; }
	if ( _debug!==false ) {
		if ( arguments.length>4 ) { throw new Error('jTabDoc.parse(tabLines, reviver, number, debug, ...)'); }
		if ( _debug===undefined$1 ) { _debug = true; }
		else if ( _debug!==true ) { throw new TypeError('jTabDoc.stringify(,,,debug)'); }
		if ( !isArray(tabLines) ) { throw new TypeError('jTabDoc.parse(tabLines)'); }
		if ( notStringArray(tabLines) ) { throw new TypeError('jTabDoc.parse(tabLines[*])'); }
		if ( typeof countEmpties!=='boolean' ) { throw new TypeError('jTabDoc.parse(,reviver.empty)'); }
		if ( groupReviver!==null && typeof groupReviver!=='boolean' ) {
			if ( !isArray(groupReviver) ) { throw new TypeError('jTabDoc.parse(,reviver.group)'); }
			for ( var length = groupReviver.length, index = 0; index<length; ++index ) {
				var each = groupReviver[index];
				if ( !isArray(each) ) { throw new TypeError('jTabDoc.parse(,reviver.group[*])'); }
				if ( !each[0] || typeof each[0].exec!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][0])'); }
				if ( typeof each[1]!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1])'); }
			}
		}
		if ( levelReviver!==null && typeof levelReviver!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.level)'); }
		if ( typeof _number!=='number' ) { throw new TypeError('jTabDoc.parse(,,number)'); }
		if ( !POSITIVE_INTEGER.test(_number) ) { throw new RangeError('jTabDoc.parse(,,number)'); }
	}
	return tabLines.length===0 ?
		levelReviver===null ? [] : levelReviver([], this) :
		Level(this, tabLines, groupReviver ? appendGroup : appendFlat, countEmpties, groupReviver, levelReviver, _number, _debug);
}
function Level (context, tabLines, append, countEmpties, groupReviver, levelReviver, number, debug) {
	var level     = [],
		lastIndex = tabLines.length-1,
		index     = 0,
		blank     = tabLines[0].length===0;
	outer: for ( ; ; ) {
		var from = index;
		if ( blank ) {
			if ( countEmpties ) {
				for ( ; ; ) {
					if ( index===lastIndex ) {
						level.push(index+1-from);
						break outer;
					}
					if ( tabLines[++index].length!==0 ) {
						level.push(index-from);
						blank = false;
						break;
					}
				}
			}
			else {
				for ( ; ; ) {
					if ( index===lastIndex ) { break outer; }
					if ( tabLines[++index].length!==0 ) {
						blank = false;
						break;
					}
				}
			}
		}
		else {
			for ( ; ; ) {
				if ( index===lastIndex ) {
					append(context, level, countEmpties, groupReviver, levelReviver, tabLines, from, index, number, debug);
					break outer;
				}
				if ( tabLines[++index].length===0 ) {
					append(context, level, countEmpties, groupReviver, levelReviver, tabLines, from, index-1, number, debug);
					blank = true;
					break;
				}
			}
		}
	}
	level.number = number;
	return levelReviver===null ? level : levelReviver(level, context);
}

function appendFlat (context, level, countEmpties, groupReviver, levelReviver, tabLines, firstIndex, lastIndex, baseNumber, debug) {
	var key,
		value,
		number;
	outer: for ( var lineIndex = firstIndex, line = tabLines[lineIndex], tabIndex = line.indexOf('\t'); ; ) {
		value = [];
		number = baseNumber+lineIndex;
		if ( tabIndex=== -1 ) {
			key = '';
			value.push(line);
			for ( ; ; ) {
				if ( lineIndex===lastIndex ) { break outer; }
				line = tabLines[++lineIndex];
				tabIndex = line.indexOf('\t');
				if ( tabIndex!== -1 ) { break; }
				value.push(line);
			}
		}
		else {
			if ( tabIndex===0 ) {
				key = '\t';
				value.push(line.slice(1));
			}
			else {
				key = line.slice(0, tabIndex+1);
				value.push(line.slice(tabIndex+1));
			}
			for ( ; ; ) {
				if ( lineIndex===lastIndex ) {
					if ( groupReviver===null ) { value = Level(context, value, appendFlat, countEmpties, null, levelReviver, number, debug); }
					break outer;
				}
				line = tabLines[++lineIndex];
				tabIndex = line.indexOf('\t');
				if ( tabIndex!==0 ) { break; }
				value.push(line.slice(1));
			}
			if ( groupReviver===null ) { value = Level(context, value, appendFlat, countEmpties, null, levelReviver, number, debug); }
		}
		level.push({
			key: key,
			value: value,
			number: number
		});
	}
	level.push({
		key: key,
		value: value,
		number: number
	});
}

function appendGroup (context, level, countEmpties, groupReviver, levelReviver, tabLines, firstIndex, lastIndex, baseNumber, debug) {
	var pendingGroup = [],
		pendingKeys  = '',
		key,
		value,
		number;
	outer: for ( var lineIndex = firstIndex, line = tabLines[lineIndex], tabIndex = line.indexOf('\t'); ; ) {
		value = [];
		number = baseNumber+lineIndex;
		if ( tabIndex=== -1 ) {
			key = '';
			value.push(line);
			pendingKeys += '\n';
			for ( ; ; ) {
				if ( lineIndex===lastIndex ) { break outer; }
				line = tabLines[++lineIndex];
				tabIndex = line.indexOf('\t');
				if ( tabIndex!== -1 ) { break; }
				value.push(line);
			}
		}
		else {
			if ( tabIndex===0 ) {
				key = '\t';
				value.push(line.slice(1));
				pendingKeys += '\t\n';
			}
			else {
				key = line.slice(0, tabIndex+1);
				pendingKeys += key+'\n';
				value.push(line.slice(tabIndex+1));
			}
			for ( ; ; ) {
				if ( lineIndex===lastIndex ) { break outer; }
				line = tabLines[++lineIndex];
				tabIndex = line.indexOf('\t');
				if ( tabIndex!==0 ) { break; }
				value.push(line.slice(1));
			}
		}
		pendingGroup.push({
			key: key,
			value: value,
			number: number
		});
	}
	pendingGroup.push({
		key: key,
		value: value,
		number: number
	});
	if ( groupReviver===true ) {
		level.push(pendingGroup.length===1 ? pendingGroup[0] : pendingGroup);
		return;
	}
	for ( var reviverLength = groupReviver.length, reviverIndex = 0; reviverIndex<reviverLength; ++reviverIndex ) {
		var regExp_function = groupReviver[reviverIndex];
		var matched = regExp_function[0].exec(pendingKeys);
		if ( matched===null ) { continue; }
		if ( debug ) {
			if ( matched===undefined$1 ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec())'); }
			if ( matched.index ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec().index)'); }
			if ( typeof matched[0]!=='string' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][0].exec()[0])'); }
			if ( matched[0].length===0 ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec()[0].length)'); }
			if ( matched[0].charAt(matched[0].length-1)!=='\n' ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec()[0])'); }
		}
		var thisKeys = matched[0];
		var keyLength = thisKeys.length;
		if ( pendingKeys.length===keyLength ) {
			level.push(regExp_function[1](pendingGroup.length===1 ? pendingGroup[0] : pendingGroup, context));
			if ( debug ) {
				if ( level[level.length-1]===undefined$1 ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())'); }
			}
			return;
		}
		var count = 1;
		for ( var indexOfLF = thisKeys.indexOf('\n'); ; ++count ) {
			indexOfLF = thisKeys.indexOf('\n', indexOfLF+1);
			if ( indexOfLF<0 ) { break; }
		}
		level.push(regExp_function[1](count===1 ? pendingGroup.shift() : pendingGroup.splice(0, count), context));
		if ( debug ) {
			if ( level[level.length-1]===undefined$1 ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())'); }
		}
		reviverIndex = 0;
		pendingKeys = pendingKeys.slice(keyLength);
	}
	throw new Error('jTabDoc.parse(,reviver.group[!])');
}

function stringify (level, _replacer, _space, _debug) {
	if ( _debug!==false ) {
		if ( arguments.length>4 ) { throw new Error('jTabDoc.stringify(level, replacer, space, debug, ...)'); }
		if ( _debug===undefined$1 ) { _debug = true; }
		else if ( _debug!==true ) { throw new TypeError('jTabDoc.stringify(,,,debug)'); }
		if ( _replacer!=null && typeof _replacer!=='function' ) { throw new TypeError('jTabDoc.stringify(,replacer)'); }
		if ( _space!=null && typeof _space!=='function' ) { throw new TypeError('jTabDoc.stringify(,,space)'); }
	}
	if ( _replacer===undefined$1 ) { _replacer = null; }
	if ( _space===undefined$1 ) { _space = null; }
	return Lines(this, level, _replacer, _space, _debug);
}
function Lines (context, level, replacer, space, debug) {
	if ( replacer!==null ) { level = replacer(level, context); }
	if ( debug ) {
		if ( !isArray(level) ) { throw new TypeError('jTabDoc.stringify(level)'); }
	}
	var lines = [];
	for ( var levelLength = level.length, levelIndex = 0; levelIndex<levelLength; ++levelIndex ) {
		var each = level[levelIndex];
		if ( debug ) {
			check(each, replacer);
		}
		if ( typeof each==='number' ) { while ( each-- ) { lines.push(''); } }
		else if ( each.key==='' ) { push.apply(lines, each.value); }
		else if ( space===null ) {
			pushes(lines, each.key, '\t', replacer===null
				? Lines(context, each.value, null, space, debug)
				: each.value
			);
		}
		else {
			var keys = [each.key];
			var values = [each.value];
			while ( ++levelIndex<levelLength ) {
				each = level[levelIndex];
				if ( debug ) {
					check(each, replacer);
				}
				if ( typeof each==='number' ) {
					--levelIndex;
					break;
				}
				keys.push(each.key);
				values.push(each.value);
			}
			var keys_indent = space(keys, context);
			if ( debug ) {
				if ( typeof keys_indent!=='object' || keys_indent===null ) { throw new TypeError('jTabDoc.stringify(,,space())'); }
				if ( !( 'keys' in keys_indent ) || !( 'indent' in keys_indent ) ) { throw new Error('jTabDoc.stringify(,,space())'); }
				if ( !isArray(keys_indent.keys) ) { throw new TypeError('jTabDoc.stringify(,,space().keys)'); }
				if ( keys_indent.keys.length!==values.length ) { throw new Error('jTabDoc.stringify(,,space().keys.length)'); }
				if ( notStringArray(keys_indent.keys) ) { throw new TypeError('jTabDoc.stringify(,,space().keys[*])'); }
				if ( typeof keys_indent.indent!=='string' ) { throw new TypeError('jTabDoc.stringify(,,space().indent)'); }
			}
			keys = keys_indent.keys;
			var indent = keys_indent.indent;
			for ( var length = values.length, index = 0; index<length; ++index ) {
				if ( keys[index]==='' ) { push.apply(lines, values[index]); }
				else {
					pushes(lines, keys[index], indent, replacer===null
						? Lines(context, values[index], null, space, debug)
						: values[index]
					);
				}
			}
		}
	}
	return lines;
}

function pushes (lines, key, indent, subLines) {
	var length = subLines.length;
	if ( length===0 ) { lines.push(key); }
	else {
		lines.push(key+subLines[0]);
		for ( var index = 1; index<length; ++index ) {
			lines.push(indent+subLines[index]);
		}
	}
}

function check (each, replacer) {
	if ( typeof each==='object' && each!==null ) {
		if ( !( 'key' in each ) || !( 'value' in each ) ) { throw new Error('jTabDoc.stringify('+( replacer ? ',replacer()' : 'level' )+'[*]:object)'); }
		if ( typeof each.key!=='string' || !/^(?:[^\t\n\r]*\t)?$/.test(each.key) ) { throw new Error('jTabDoc.stringify('+( replacer ? ',replacer()' : 'level' )+'[*]:object.key)'); }
		if ( replacer!==null || each.key==='' ) {
			if ( !isArray(each.value) ) { throw new TypeError('jTabDoc.stringify('+( replacer ? ',replacer()' : 'level' )+'[*]:object.value)'); }
			if ( notStringArray(each.value) ) { throw new TypeError('jTabDoc.stringify('+( replacer ? ',replacer()' : 'level' )+'[*]:object.value[*])'); }
		}
	}
	else if ( typeof each==='number' ) {
		if ( !/^\d+$/.test(each) ) { throw new Error('jTabDoc.stringify('+( replacer ? ',replacer()' : 'level' )+'[*]:number)'); }
	}
	else { throw new TypeError('jTabDoc.stringify('+( replacer ? ',replacer()' : 'level' )+'[*])'); }
}

// TypeError, RangeError

function Space (minWidth, padding) {
	if ( typeof minWidth!=='number' ) { throw new TypeError('jTabDoc.Space(minWidth)'); }
	if ( typeof padding!=='number' ) { throw new TypeError('jTabDoc.Space(,padding)'); }
	var multiple = minWidth<0;
	if ( multiple ) { minWidth = ~minWidth; }
	if ( !POSITIVE_INTEGER.test(minWidth) ) { throw new RangeError('jTabDoc.Space(minWidth)'); }
	if ( !POSITIVE_INTEGER.test(padding) ) { throw new RangeError('jTabDoc.Space(,padding)'); }
	return function space (keys) {
		return keys_indent(multiple, minWidth, padding, keys);
	};
}
function keys_indent (multiple, minWidth, padding, keys) {
	var maxWidth = 1;
	var widths = [];
	for ( var length = keys.length, index = 0; index<length; ++index ) {
		var width = 0;
		var key = keys[index];
		if ( key!=='' ) {
			for ( var l = key.length-1, i = 0; i<l; ++i ) {
				var charCode = key.charCodeAt(i);
				if ( charCode<0x80 ) { width += 1; }
				else {
					width += 2;
					if ( charCode>=0xD800 && charCode<=0xDBFF && i+1<l ) {
						charCode = key.charCodeAt(i+1);
						charCode>=0xDC00 && charCode<=0xDFFF && ++i;
					}
				}
			}
			if ( width>maxWidth ) { maxWidth = width; }
		}
		widths.push(width);
	}
	width = maxWidth+padding;
	if ( multiple ) {
		if ( width%minWidth ) { width += minWidth-width%minWidth; }
	}
	else {
		if ( width<minWidth ) { width = minWidth; }
	}
	for ( index = 0; index<length; ++index ) {
		key = keys[index];
		if ( key!=='' ) {
			keys[index] = key.slice(0, -1)+repeatSpace(width-widths[index]);
		}
	}
	return { keys: keys, indent: repeatSpace(width) };
}

var jTabDoc = {
	parse: parse,
	stringify: stringify,
	Space: Space,
	version: version
};
jTabDoc['default'] = jTabDoc;

module.exports = jTabDoc;

//# sourceMappingURL=index.js.map