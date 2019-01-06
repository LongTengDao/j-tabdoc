/*!
 * 模块名称：jTabDoc
 * 模块功能：TabDoc 的官方标准实现。从属于“简计划”。
   　　　　　The official standard implementation of TabDoc. Belong to "Plan J".
 * 模块版本：2.1.1
 * 许可条款：LGPL-3.0
 * 所属作者：龙腾道 <LongTengDao@LongTengDao.com> (www.LongTengDao.com)
 * 问题反馈：https://GitHub.com/LongTengDao/j-tabdoc/issues
 * 项目主页：https://GitHub.com/LongTengDao/j-tabdoc/
 */

var version = '2.1.1';

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
			var length = groupReviver.length;
			if ( !length ) { throw new Error('jTabDoc.parse(,reviver.group.length)'); }
			var index = 0;
			do {
				var each = groupReviver[index];
				if ( !each ) { throw new TypeError('jTabDoc.parse(,reviver.group[*])'); }
				if ( !each[0] || typeof each[0].exec!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][0])'); }
				if ( typeof each[1]!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1])'); }
			}
			while ( ++index<length )
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
	for ( var first = groupReviver[0], reviverLength = groupReviver.length, reviverIndex = 0, regExp_function = first; ; ) {
		var matched = regExp_function[0].exec(pendingKeys);
		if ( matched===null ) {
			if ( ++reviverIndex===reviverLength ) { throw new Error('jTabDoc.parse(,reviver.group[!])'); }
			regExp_function = groupReviver[reviverIndex];
		}
		else {
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
			pendingKeys = pendingKeys.slice(keyLength);
			reviverIndex = 0;
			regExp_function = first;
		}
	}
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

export default jTabDoc;
export { parse, stringify, Space, version };

/*¡ jTabDoc */

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZlcnNpb24/dGV4dCIsImdsb2JhbC5qcyIsInV0aWwuanMiLCJwYXJzZS5qcyIsInN0cmluZ2lmeS5qcyIsIlNwYWNlLmpzIiwiZXhwb3J0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0ICcyLjEuMSc7IiwiLy8gT2JqZWN0LCBBcnJheSwgQnVmZmVyXG52YXIgdW5kZWZpbmVkO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgcHVzaCA9IEFycmF5LnByb3RvdHlwZS5wdXNoO1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIGlzQXJyYXkgKGxpbmVzKSB7IHJldHVybiB0b1N0cmluZy5jYWxsKGxpbmVzKT09PSdbb2JqZWN0IEFycmF5XSc7IH07XG5cbmlmICggdHlwZW9mIEJ1ZmZlcj09PSdmdW5jdGlvbicgKSB7XG5cdHZhciBpc0J1ZmZlciA9IEJ1ZmZlci5pc0J1ZmZlcjtcblx0aWYgKCB0eXBlb2YgaXNCdWZmZXI9PT0nZnVuY3Rpb24nICYmIHR5cGVvZiBCdWZmZXIuZnJvbT09PSdmdW5jdGlvbicgKSB7XG5cdFx0dmFyIGZyb20gPSBCdWZmZXIuaGFzT3duUHJvcGVydHkoJ2Zyb20nKSA/IEJ1ZmZlci5mcm9tIDogZnVuY3Rpb24gZnJvbSAoYnVmZmVyKSB7IHJldHVybiBuZXcgQnVmZmVyKGJ1ZmZlcik7IH07XG5cdFx0dmFyIHRvU3RyaW5nRm9sbG93Qk9NID0gZnVuY3Rpb24gdG9TdHJpbmdGb2xsb3dCT00gKGJ1ZmZlcikge1xuXHRcdFx0c3dpdGNoICggYnVmZmVyWzBdICkge1xuXHRcdFx0XHRjYXNlIDB4RUY6IGlmICggYnVmZmVyWzFdPT09MHhCQiAmJiBidWZmZXJbMl09PT0weEJGICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDMpLnRvU3RyaW5nKCd1dGY4Jyk7IH0gYnJlYWs7XG5cdFx0XHRcdGNhc2UgMHhGRjogaWYgKCBidWZmZXJbMV09PT0weEZFICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDIpLnRvU3RyaW5nKCd1Y3MyJyk7IH0gYnJlYWs7XG5cdFx0XHRcdGNhc2UgMHhGRTogaWYgKCBidWZmZXJbMV09PT0weEZGICkgeyBidWZmZXIgPSBmcm9tKGJ1ZmZlcik7IHJldHVybiBidWZmZXIuc3dhcDE2KCkuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTsgfSBicmVhaztcblx0XHRcdH1cblx0XHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoKTtcblx0XHR9O1xuXHR9XG5cdGVsc2UgeyBpc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9OyB9XG59XG5lbHNlIHsgaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoKSB7IHJldHVybiBmYWxzZTsgfTsgfVxuXG5leHBvcnQgeyB1bmRlZmluZWQsIGhhc093blByb3BlcnR5LCB0b1N0cmluZywgcHVzaCwgaXNBcnJheSwgaXNCdWZmZXIsIHRvU3RyaW5nRm9sbG93Qk9NIH07Ly8gVHlwZUVycm9yLCBFcnJvciwgUmFuZ2VFcnJvclxuIiwiZXhwb3J0IHZhciBQT1NJVElWRV9JTlRFR0VSID0gL15bMS05XVxcZCokLztcblxuZXhwb3J0IHZhciByZXBlYXRTcGFjZSA9ICcnLnJlcGVhdFxuXHQ/IGZ1bmN0aW9uIHJlcGVhdFNwYWNlIChjb3VudCkgeyByZXR1cm4gJyAnLnJlcGVhdChjb3VudCk7IH1cblx0OiBmdW5jdGlvbiAoc3BhY2VzKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHJlcGVhdFNwYWNlIChjb3VudCkge1xuXHRcdFx0c3BhY2VzLmxlbmd0aCA9IGNvdW50KzE7XG5cdFx0XHRyZXR1cm4gc3BhY2VzLmpvaW4oJyAnKTtcblx0XHR9O1xuXHR9KFtdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vdFN0cmluZ0FycmF5IChhcnJheSkge1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRpZiAoIHR5cGVvZiBhcnJheVtpbmRleF0hPT0nc3RyaW5nJyApIHsgcmV0dXJuIHRydWU7IH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyB1bmRlZmluZWQsIGlzQXJyYXksIGlzQnVmZmVyLCB0b1N0cmluZ0ZvbGxvd0JPTSB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBQT1NJVElWRV9JTlRFR0VSLCBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbnZhciBCT00gPSAvXlxcdUZFRkYvO1xudmFyIEVPTCA9IC9cXHJcXG4/fFxcbi87XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlICh0YWJMaW5lcywgX3Jldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zykge1xuXHRpZiAoICFpc0FycmF5KHRhYkxpbmVzKSApIHtcblx0XHRpZiAoIHR5cGVvZiB0YWJMaW5lcz09PSdzdHJpbmcnICkgeyB0YWJMaW5lcyA9IHRhYkxpbmVzLnJlcGxhY2UoQk9NLCAnJykuc3BsaXQoRU9MKTsgfVxuXHRcdGVsc2UgaWYgKCBpc0J1ZmZlcih0YWJMaW5lcykgKSB7IHRhYkxpbmVzID0gdG9TdHJpbmdGb2xsb3dCT00odGFiTGluZXMpLnNwbGl0KEVPTCk7IH1cblx0fVxuXHRpZiAoIF9yZXZpdmVyPT1udWxsICkge1xuXHRcdHZhciBjb3VudEVtcHRpZXMgPSB0cnVlO1xuXHRcdHZhciBncm91cFJldml2ZXIgPSBudWxsO1xuXHRcdHZhciBsZXZlbFJldml2ZXIgPSBudWxsO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGNvdW50RW1wdGllcyA9IF9yZXZpdmVyLmVtcHR5O1xuXHRcdGdyb3VwUmV2aXZlciA9IF9yZXZpdmVyLmdyb3VwO1xuXHRcdGxldmVsUmV2aXZlciA9IF9yZXZpdmVyLmxldmVsO1xuXHRcdGlmICggY291bnRFbXB0aWVzPT09dW5kZWZpbmVkICkgeyBjb3VudEVtcHRpZXMgPSB0cnVlOyB9XG5cdFx0aWYgKCBncm91cFJldml2ZXI9PT11bmRlZmluZWQgKSB7IGdyb3VwUmV2aXZlciA9IG51bGw7IH1cblx0XHRpZiAoIGxldmVsUmV2aXZlcj09PXVuZGVmaW5lZCApIHsgbGV2ZWxSZXZpdmVyID0gbnVsbDsgfVxuXHR9XG5cdGlmICggX251bWJlcj09PXVuZGVmaW5lZCApIHsgX251bWJlciA9IDE7IH1cblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzLCByZXZpdmVyLCBudW1iZXIsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggIWlzQXJyYXkodGFiTGluZXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzKScpOyB9XG5cdFx0aWYgKCBub3RTdHJpbmdBcnJheSh0YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXNbKl0pJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBjb3VudEVtcHRpZXMhPT0nYm9vbGVhbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZW1wdHkpJyk7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGdyb3VwUmV2aXZlciE9PSdib29sZWFuJyApIHtcblx0XHRcdGlmICggIWlzQXJyYXkoZ3JvdXBSZXZpdmVyKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cCknKTsgfVxuXHRcdFx0dmFyIGxlbmd0aCA9IGdyb3VwUmV2aXZlci5sZW5ndGg7XG5cdFx0XHRpZiAoICFsZW5ndGggKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cC5sZW5ndGgpJyk7IH1cblx0XHRcdHZhciBpbmRleCA9IDA7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdHZhciBlYWNoID0gZ3JvdXBSZXZpdmVyW2luZGV4XTtcblx0XHRcdFx0aWYgKCAhZWFjaCApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXSknKTsgfVxuXHRcdFx0XHRpZiAoICFlYWNoWzBdIHx8IHR5cGVvZiBlYWNoWzBdLmV4ZWMhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdKScpOyB9XG5cdFx0XHRcdGlmICggdHlwZW9mIGVhY2hbMV0hPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzFdKScpOyB9XG5cdFx0XHR9XG5cdFx0XHR3aGlsZSAoICsraW5kZXg8bGVuZ3RoIClcblx0XHR9XG5cdFx0aWYgKCBsZXZlbFJldml2ZXIhPT1udWxsICYmIHR5cGVvZiBsZXZlbFJldml2ZXIhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmxldmVsKScpOyB9XG5cdFx0aWYgKCB0eXBlb2YgX251bWJlciE9PSdudW1iZXInICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCwsbnVtYmVyKScpOyB9XG5cdFx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KF9udW1iZXIpICkgeyB0aHJvdyBuZXcgUmFuZ2VFcnJvcignalRhYkRvYy5wYXJzZSgsLG51bWJlciknKTsgfVxuXHR9XG5cdHJldHVybiB0YWJMaW5lcy5sZW5ndGg9PT0wID9cblx0XHRsZXZlbFJldml2ZXI9PT1udWxsID8gW10gOiBsZXZlbFJldml2ZXIoW10sIHRoaXMpIDpcblx0XHRMZXZlbCh0aGlzLCB0YWJMaW5lcywgZ3JvdXBSZXZpdmVyID8gYXBwZW5kR3JvdXAgOiBhcHBlbmRGbGF0LCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCBfbnVtYmVyLCBfZGVidWcpO1xufTtcblxuZnVuY3Rpb24gTGV2ZWwgKGNvbnRleHQsIHRhYkxpbmVzLCBhcHBlbmQsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIG51bWJlciwgZGVidWcpIHtcblx0dmFyIGxldmVsICAgICA9IFtdLFxuXHRcdGxhc3RJbmRleCA9IHRhYkxpbmVzLmxlbmd0aC0xLFxuXHRcdGluZGV4ICAgICA9IDAsXG5cdFx0YmxhbmsgICAgID0gdGFiTGluZXNbMF0ubGVuZ3RoPT09MDtcblx0b3V0ZXI6IGZvciAoIDsgOyApIHtcblx0XHR2YXIgZnJvbSA9IGluZGV4O1xuXHRcdGlmICggYmxhbmsgKSB7XG5cdFx0XHRpZiAoIGNvdW50RW1wdGllcyApIHtcblx0XHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7XG5cdFx0XHRcdFx0XHRsZXZlbC5wdXNoKGluZGV4KzEtZnJvbSk7XG5cdFx0XHRcdFx0XHRicmVhayBvdXRlcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKCB0YWJMaW5lc1srK2luZGV4XS5sZW5ndGghPT0wICkge1xuXHRcdFx0XHRcdFx0bGV2ZWwucHVzaChpbmRleC1mcm9tKTtcblx0XHRcdFx0XHRcdGJsYW5rID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0XHRpZiAoIHRhYkxpbmVzWysraW5kZXhdLmxlbmd0aCE9PTAgKSB7XG5cdFx0XHRcdFx0XHRibGFuayA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkge1xuXHRcdFx0XHRcdGFwcGVuZChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZyb20sIGluZGV4LCBudW1iZXIsIGRlYnVnKTtcblx0XHRcdFx0XHRicmVhayBvdXRlcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIHRhYkxpbmVzWysraW5kZXhdLmxlbmd0aD09PTAgKSB7XG5cdFx0XHRcdFx0YXBwZW5kKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZnJvbSwgaW5kZXgtMSwgbnVtYmVyLCBkZWJ1Zyk7XG5cdFx0XHRcdFx0YmxhbmsgPSB0cnVlO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdGxldmVsLm51bWJlciA9IG51bWJlcjtcblx0cmV0dXJuIGxldmVsUmV2aXZlcj09PW51bGwgPyBsZXZlbCA6IGxldmVsUmV2aXZlcihsZXZlbCwgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEZsYXQgKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZmlyc3RJbmRleCwgbGFzdEluZGV4LCBiYXNlTnVtYmVyLCBkZWJ1Zykge1xuXHR2YXIga2V5LFxuXHRcdHZhbHVlLFxuXHRcdG51bWJlcjtcblx0b3V0ZXI6IGZvciAoIHZhciBsaW5lSW5kZXggPSBmaXJzdEluZGV4LCBsaW5lID0gdGFiTGluZXNbbGluZUluZGV4XSwgdGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpOyA7ICkge1xuXHRcdHZhbHVlID0gW107XG5cdFx0bnVtYmVyID0gYmFzZU51bWJlcitsaW5lSW5kZXg7XG5cdFx0aWYgKCB0YWJJbmRleD09PSAtMSApIHtcblx0XHRcdGtleSA9ICcnO1xuXHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PSAtMSApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIHRhYkluZGV4PT09MCApIHtcblx0XHRcdFx0a2V5ID0gJ1xcdCc7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0a2V5ID0gbGluZS5zbGljZSgwLCB0YWJJbmRleCsxKTtcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKHRhYkluZGV4KzEpKTtcblx0XHRcdH1cblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7XG5cdFx0XHRcdFx0aWYgKCBncm91cFJldml2ZXI9PT1udWxsICkgeyB2YWx1ZSA9IExldmVsKGNvbnRleHQsIHZhbHVlLCBhcHBlbmRGbGF0LCBjb3VudEVtcHRpZXMsIG51bGwsIGxldmVsUmV2aXZlciwgbnVtYmVyLCBkZWJ1Zyk7IH1cblx0XHRcdFx0XHRicmVhayBvdXRlcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRsaW5lID0gdGFiTGluZXNbKytsaW5lSW5kZXhdO1xuXHRcdFx0XHR0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7XG5cdFx0XHRcdGlmICggdGFiSW5kZXghPT0wICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCBncm91cFJldml2ZXI9PT1udWxsICkgeyB2YWx1ZSA9IExldmVsKGNvbnRleHQsIHZhbHVlLCBhcHBlbmRGbGF0LCBjb3VudEVtcHRpZXMsIG51bGwsIGxldmVsUmV2aXZlciwgbnVtYmVyLCBkZWJ1Zyk7IH1cblx0XHR9XG5cdFx0bGV2ZWwucHVzaCh7XG5cdFx0XHRrZXk6IGtleSxcblx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdG51bWJlcjogbnVtYmVyXG5cdFx0fSk7XG5cdH1cblx0bGV2ZWwucHVzaCh7XG5cdFx0a2V5OiBrZXksXG5cdFx0dmFsdWU6IHZhbHVlLFxuXHRcdG51bWJlcjogbnVtYmVyXG5cdH0pO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRHcm91cCAoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmaXJzdEluZGV4LCBsYXN0SW5kZXgsIGJhc2VOdW1iZXIsIGRlYnVnKSB7XG5cdHZhciBwZW5kaW5nR3JvdXAgPSBbXSxcblx0XHRwZW5kaW5nS2V5cyAgPSAnJyxcblx0XHRrZXksXG5cdFx0dmFsdWUsXG5cdFx0bnVtYmVyO1xuXHRvdXRlcjogZm9yICggdmFyIGxpbmVJbmRleCA9IGZpcnN0SW5kZXgsIGxpbmUgPSB0YWJMaW5lc1tsaW5lSW5kZXhdLCB0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7IDsgKSB7XG5cdFx0dmFsdWUgPSBbXTtcblx0XHRudW1iZXIgPSBiYXNlTnVtYmVyK2xpbmVJbmRleDtcblx0XHRpZiAoIHRhYkluZGV4PT09IC0xICkge1xuXHRcdFx0a2V5ID0gJyc7XG5cdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0cGVuZGluZ0tleXMgKz0gJ1xcbic7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRsaW5lID0gdGFiTGluZXNbKytsaW5lSW5kZXhdO1xuXHRcdFx0XHR0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7XG5cdFx0XHRcdGlmICggdGFiSW5kZXghPT0gLTEgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCB0YWJJbmRleD09PTAgKSB7XG5cdFx0XHRcdGtleSA9ICdcXHQnO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UoMSkpO1xuXHRcdFx0XHRwZW5kaW5nS2V5cyArPSAnXFx0XFxuJztcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBsaW5lLnNsaWNlKDAsIHRhYkluZGV4KzEpO1xuXHRcdFx0XHRwZW5kaW5nS2V5cyArPSBrZXkrJ1xcbic7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSh0YWJJbmRleCsxKSk7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRsaW5lID0gdGFiTGluZXNbKytsaW5lSW5kZXhdO1xuXHRcdFx0XHR0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7XG5cdFx0XHRcdGlmICggdGFiSW5kZXghPT0wICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRwZW5kaW5nR3JvdXAucHVzaCh7XG5cdFx0XHRrZXk6IGtleSxcblx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdG51bWJlcjogbnVtYmVyXG5cdFx0fSk7XG5cdH1cblx0cGVuZGluZ0dyb3VwLnB1c2goe1xuXHRcdGtleToga2V5LFxuXHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRudW1iZXI6IG51bWJlclxuXHR9KTtcblx0aWYgKCBncm91cFJldml2ZXI9PT10cnVlICkge1xuXHRcdGxldmVsLnB1c2gocGVuZGluZ0dyb3VwLmxlbmd0aD09PTEgPyBwZW5kaW5nR3JvdXBbMF0gOiBwZW5kaW5nR3JvdXApO1xuXHRcdHJldHVybjtcblx0fVxuXHRmb3IgKCB2YXIgZmlyc3QgPSBncm91cFJldml2ZXJbMF0sIHJldml2ZXJMZW5ndGggPSBncm91cFJldml2ZXIubGVuZ3RoLCByZXZpdmVySW5kZXggPSAwLCByZWdFeHBfZnVuY3Rpb24gPSBmaXJzdDsgOyApIHtcblx0XHR2YXIgbWF0Y2hlZCA9IHJlZ0V4cF9mdW5jdGlvblswXS5leGVjKHBlbmRpbmdLZXlzKTtcblx0XHRpZiAoIG1hdGNoZWQ9PT1udWxsICkge1xuXHRcdFx0aWYgKCArK3Jldml2ZXJJbmRleD09PXJldml2ZXJMZW5ndGggKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFshXSknKTsgfVxuXHRcdFx0cmVnRXhwX2Z1bmN0aW9uID0gZ3JvdXBSZXZpdmVyW3Jldml2ZXJJbmRleF07XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCBtYXRjaGVkPT09dW5kZWZpbmVkICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpKScpOyB9XG5cdFx0XHRcdGlmICggbWF0Y2hlZC5pbmRleCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKS5pbmRleCknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBtYXRjaGVkWzBdIT09J3N0cmluZycgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpWzBdKScpOyB9XG5cdFx0XHRcdGlmICggbWF0Y2hlZFswXS5sZW5ndGg9PT0wICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpWzBdLmxlbmd0aCknKTsgfVxuXHRcdFx0XHRpZiAoIG1hdGNoZWRbMF0uY2hhckF0KG1hdGNoZWRbMF0ubGVuZ3RoLTEpIT09J1xcbicgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0pJyk7IH1cblx0XHRcdH1cblx0XHRcdHZhciB0aGlzS2V5cyA9IG1hdGNoZWRbMF07XG5cdFx0XHR2YXIga2V5TGVuZ3RoID0gdGhpc0tleXMubGVuZ3RoO1xuXHRcdFx0aWYgKCBwZW5kaW5nS2V5cy5sZW5ndGg9PT1rZXlMZW5ndGggKSB7XG5cdFx0XHRcdGxldmVsLnB1c2gocmVnRXhwX2Z1bmN0aW9uWzFdKHBlbmRpbmdHcm91cC5sZW5ndGg9PT0xID8gcGVuZGluZ0dyb3VwWzBdIDogcGVuZGluZ0dyb3VwLCBjb250ZXh0KSk7XG5cdFx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHZhciBjb3VudCA9IDE7XG5cdFx0XHRmb3IgKCB2YXIgaW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJyk7IDsgKytjb3VudCApIHtcblx0XHRcdFx0aW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJywgaW5kZXhPZkxGKzEpO1xuXHRcdFx0XHRpZiAoIGluZGV4T2ZMRjwwICkgeyBicmVhazsgfVxuXHRcdFx0fVxuXHRcdFx0bGV2ZWwucHVzaChyZWdFeHBfZnVuY3Rpb25bMV0oY291bnQ9PT0xID8gcGVuZGluZ0dyb3VwLnNoaWZ0KCkgOiBwZW5kaW5nR3JvdXAuc3BsaWNlKDAsIGNvdW50KSwgY29udGV4dCkpO1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdFx0fVxuXHRcdFx0cGVuZGluZ0tleXMgPSBwZW5kaW5nS2V5cy5zbGljZShrZXlMZW5ndGgpO1xuXHRcdFx0cmV2aXZlckluZGV4ID0gMDtcblx0XHRcdHJlZ0V4cF9mdW5jdGlvbiA9IGZpcnN0O1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgdW5kZWZpbmVkLCBpc0FycmF5LCBwdXNoIH0gZnJvbSAnLi9nbG9iYWwuanMnOy8vIFR5cGVFcnJvciwgRXJyb3JcbmltcG9ydCB7IG5vdFN0cmluZ0FycmF5IH0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc3RyaW5naWZ5IChsZXZlbCwgX3JlcGxhY2VyLCBfc3BhY2UsIF9kZWJ1Zykge1xuXHRpZiAoIF9kZWJ1ZyE9PWZhbHNlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aD40ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KGxldmVsLCByZXBsYWNlciwgc3BhY2UsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggX3JlcGxhY2VyIT1udWxsICYmIHR5cGVvZiBfcmVwbGFjZXIhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgscmVwbGFjZXIpJyk7IH1cblx0XHRpZiAoIF9zcGFjZSE9bnVsbCAmJiB0eXBlb2YgX3NwYWNlIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSknKTsgfVxuXHR9XG5cdGlmICggX3JlcGxhY2VyPT09dW5kZWZpbmVkICkgeyBfcmVwbGFjZXIgPSBudWxsOyB9XG5cdGlmICggX3NwYWNlPT09dW5kZWZpbmVkICkgeyBfc3BhY2UgPSBudWxsOyB9XG5cdHJldHVybiBMaW5lcyh0aGlzLCBsZXZlbCwgX3JlcGxhY2VyLCBfc3BhY2UsIF9kZWJ1Zyk7XG59O1xuXG5mdW5jdGlvbiBMaW5lcyAoY29udGV4dCwgbGV2ZWwsIHJlcGxhY2VyLCBzcGFjZSwgZGVidWcpIHtcblx0aWYgKCByZXBsYWNlciE9PW51bGwgKSB7IGxldmVsID0gcmVwbGFjZXIobGV2ZWwsIGNvbnRleHQpOyB9XG5cdGlmICggZGVidWcgKSB7XG5cdFx0aWYgKCAhaXNBcnJheShsZXZlbCkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KGxldmVsKScpOyB9XG5cdH1cblx0dmFyIGxpbmVzID0gW107XG5cdGZvciAoIHZhciBsZXZlbExlbmd0aCA9IGxldmVsLmxlbmd0aCwgbGV2ZWxJbmRleCA9IDA7IGxldmVsSW5kZXg8bGV2ZWxMZW5ndGg7ICsrbGV2ZWxJbmRleCApIHtcblx0XHR2YXIgZWFjaCA9IGxldmVsW2xldmVsSW5kZXhdO1xuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0fVxuXHRcdGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHsgd2hpbGUgKCBlYWNoLS0gKSB7IGxpbmVzLnB1c2goJycpOyB9IH1cblx0XHRlbHNlIGlmICggZWFjaC5rZXk9PT0nJyApIHsgcHVzaC5hcHBseShsaW5lcywgZWFjaC52YWx1ZSk7IH1cblx0XHRlbHNlIGlmICggc3BhY2U9PT1udWxsICkge1xuXHRcdFx0cHVzaGVzKGxpbmVzLCBlYWNoLmtleSwgJ1xcdCcsIHJlcGxhY2VyPT09bnVsbFxuXHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIGVhY2gudmFsdWUsIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0OiBlYWNoLnZhbHVlXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHZhciBrZXlzID0gW2VhY2gua2V5XTtcblx0XHRcdHZhciB2YWx1ZXMgPSBbZWFjaC52YWx1ZV07XG5cdFx0XHR3aGlsZSAoICsrbGV2ZWxJbmRleDxsZXZlbExlbmd0aCApIHtcblx0XHRcdFx0ZWFjaCA9IGxldmVsW2xldmVsSW5kZXhdO1xuXHRcdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRcdGNoZWNrKGVhY2gsIHJlcGxhY2VyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBlYWNoPT09J251bWJlcicgKSB7XG5cdFx0XHRcdFx0LS1sZXZlbEluZGV4O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGtleXMucHVzaChlYWNoLmtleSk7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKGVhY2gudmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGtleXNfaW5kZW50ID0gc3BhY2Uoa2V5cywgY29udGV4dCk7XG5cdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBrZXlzX2luZGVudCE9PSdvYmplY3QnIHx8IGtleXNfaW5kZW50PT09bnVsbCApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpKScpOyB9XG5cdFx0XHRcdGlmICggISggJ2tleXMnIGluIGtleXNfaW5kZW50ICkgfHwgISggJ2luZGVudCcgaW4ga2V5c19pbmRlbnQgKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkpJyk7IH1cblx0XHRcdFx0aWYgKCAhaXNBcnJheShrZXlzX2luZGVudC5rZXlzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmtleXMpJyk7IH1cblx0XHRcdFx0aWYgKCBrZXlzX2luZGVudC5rZXlzLmxlbmd0aCE9PXZhbHVlcy5sZW5ndGggKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmtleXMubGVuZ3RoKScpOyB9XG5cdFx0XHRcdGlmICggbm90U3RyaW5nQXJyYXkoa2V5c19pbmRlbnQua2V5cykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzWypdKScpOyB9XG5cdFx0XHRcdGlmICggdHlwZW9mIGtleXNfaW5kZW50LmluZGVudCE9PSdzdHJpbmcnICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkuaW5kZW50KScpOyB9XG5cdFx0XHR9XG5cdFx0XHRrZXlzID0ga2V5c19pbmRlbnQua2V5cztcblx0XHRcdHZhciBpbmRlbnQgPSBrZXlzX2luZGVudC5pbmRlbnQ7XG5cdFx0XHRmb3IgKCB2YXIgbGVuZ3RoID0gdmFsdWVzLmxlbmd0aCwgaW5kZXggPSAwOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0XHRcdGlmICgga2V5c1tpbmRleF09PT0nJyApIHsgcHVzaC5hcHBseShsaW5lcywgdmFsdWVzW2luZGV4XSk7IH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0cHVzaGVzKGxpbmVzLCBrZXlzW2luZGV4XSwgaW5kZW50LCByZXBsYWNlcj09PW51bGxcblx0XHRcdFx0XHRcdD8gTGluZXMoY29udGV4dCwgdmFsdWVzW2luZGV4XSwgbnVsbCwgc3BhY2UsIGRlYnVnKVxuXHRcdFx0XHRcdFx0OiB2YWx1ZXNbaW5kZXhdXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gbGluZXM7XG59XG5cbmZ1bmN0aW9uIHB1c2hlcyAobGluZXMsIGtleSwgaW5kZW50LCBzdWJMaW5lcykge1xuXHR2YXIgbGVuZ3RoID0gc3ViTGluZXMubGVuZ3RoO1xuXHRpZiAoIGxlbmd0aD09PTAgKSB7IGxpbmVzLnB1c2goa2V5KTsgfVxuXHRlbHNlIHtcblx0XHRsaW5lcy5wdXNoKGtleStzdWJMaW5lc1swXSk7XG5cdFx0Zm9yICggdmFyIGluZGV4ID0gMTsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0bGluZXMucHVzaChpbmRlbnQrc3ViTGluZXNbaW5kZXhdKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gY2hlY2sgKGVhY2gsIHJlcGxhY2VyKSB7XG5cdGlmICggdHlwZW9mIGVhY2g9PT0nb2JqZWN0JyAmJiBlYWNoIT09bnVsbCApIHtcblx0XHRpZiAoICEoICdrZXknIGluIGVhY2ggKSB8fCAhKCAndmFsdWUnIGluIGVhY2ggKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0KScpOyB9XG5cdFx0aWYgKCB0eXBlb2YgZWFjaC5rZXkhPT0nc3RyaW5nJyB8fCAhL14oPzpbXlxcdFxcblxccl0qXFx0KT8kLy50ZXN0KGVhY2gua2V5KSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LmtleSknKTsgfVxuXHRcdGlmICggcmVwbGFjZXIhPT1udWxsIHx8IGVhY2gua2V5PT09JycgKSB7XG5cdFx0XHRpZiAoICFpc0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlKScpOyB9XG5cdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlWypdKScpOyB9XG5cdFx0fVxuXHR9XG5cdGVsc2UgaWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdGlmICggIS9eXFxkKyQvLnRlc3QoZWFjaCkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm51bWJlciknKTsgfVxuXHR9XG5cdGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl0pJyk7IH1cbn1cbiIsIi8vIFR5cGVFcnJvciwgUmFuZ2VFcnJvclxuaW1wb3J0IHsgUE9TSVRJVkVfSU5URUdFUiwgcmVwZWF0U3BhY2UgfSBmcm9tICcuL3V0aWwuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTcGFjZSAobWluV2lkdGgsIHBhZGRpbmcpIHtcblx0aWYgKCB0eXBlb2YgbWluV2lkdGghPT0nbnVtYmVyJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5TcGFjZShtaW5XaWR0aCknKTsgfVxuXHRpZiAoIHR5cGVvZiBwYWRkaW5nIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MuU3BhY2UoLHBhZGRpbmcpJyk7IH1cblx0dmFyIG11bHRpcGxlID0gbWluV2lkdGg8MDtcblx0aWYgKCBtdWx0aXBsZSApIHsgbWluV2lkdGggPSB+bWluV2lkdGg7IH1cblx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KG1pbldpZHRoKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MuU3BhY2UobWluV2lkdGgpJyk7IH1cblx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KHBhZGRpbmcpICkgeyB0aHJvdyBuZXcgUmFuZ2VFcnJvcignalRhYkRvYy5TcGFjZSgscGFkZGluZyknKTsgfVxuXHRyZXR1cm4gZnVuY3Rpb24gc3BhY2UgKGtleXMpIHtcblx0XHRyZXR1cm4ga2V5c19pbmRlbnQobXVsdGlwbGUsIG1pbldpZHRoLCBwYWRkaW5nLCBrZXlzKTtcblx0fTtcbn07XG5cbmZ1bmN0aW9uIGtleXNfaW5kZW50IChtdWx0aXBsZSwgbWluV2lkdGgsIHBhZGRpbmcsIGtleXMpIHtcblx0dmFyIG1heFdpZHRoID0gMTtcblx0dmFyIHdpZHRocyA9IFtdO1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdHZhciB3aWR0aCA9IDA7XG5cdFx0dmFyIGtleSA9IGtleXNbaW5kZXhdO1xuXHRcdGlmICgga2V5IT09JycgKSB7XG5cdFx0XHRmb3IgKCB2YXIgbCA9IGtleS5sZW5ndGgtMSwgaSA9IDA7IGk8bDsgKytpICkge1xuXHRcdFx0XHR2YXIgY2hhckNvZGUgPSBrZXkuY2hhckNvZGVBdChpKTtcblx0XHRcdFx0aWYgKCBjaGFyQ29kZTwweDgwICkgeyB3aWR0aCArPSAxOyB9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHdpZHRoICs9IDI7XG5cdFx0XHRcdFx0aWYgKCBjaGFyQ29kZT49MHhEODAwICYmIGNoYXJDb2RlPD0weERCRkYgJiYgaSsxPGwgKSB7XG5cdFx0XHRcdFx0XHRjaGFyQ29kZSA9IGtleS5jaGFyQ29kZUF0KGkrMSk7XG5cdFx0XHRcdFx0XHRjaGFyQ29kZT49MHhEQzAwICYmIGNoYXJDb2RlPD0weERGRkYgJiYgKytpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCB3aWR0aD5tYXhXaWR0aCApIHsgbWF4V2lkdGggPSB3aWR0aDsgfVxuXHRcdH1cblx0XHR3aWR0aHMucHVzaCh3aWR0aCk7XG5cdH1cblx0d2lkdGggPSBtYXhXaWR0aCtwYWRkaW5nO1xuXHRpZiAoIG11bHRpcGxlICkge1xuXHRcdGlmICggd2lkdGglbWluV2lkdGggKSB7IHdpZHRoICs9IG1pbldpZHRoLXdpZHRoJW1pbldpZHRoOyB9XG5cdH1cblx0ZWxzZSB7XG5cdFx0aWYgKCB3aWR0aDxtaW5XaWR0aCApIHsgd2lkdGggPSBtaW5XaWR0aDsgfVxuXHR9XG5cdGZvciAoIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdGtleSA9IGtleXNbaW5kZXhdO1xuXHRcdGlmICgga2V5IT09JycgKSB7XG5cdFx0XHRrZXlzW2luZGV4XSA9IGtleS5zbGljZSgwLCAtMSkrcmVwZWF0U3BhY2Uod2lkdGgtd2lkdGhzW2luZGV4XSk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB7IGtleXM6IGtleXMsIGluZGVudDogcmVwZWF0U3BhY2Uod2lkdGgpIH07XG59XG4iLCJpbXBvcnQgdmVyc2lvbiBmcm9tICcuL3ZlcnNpb24/dGV4dCc7XG5pbXBvcnQgcGFyc2UgZnJvbSAnLi9wYXJzZS5qcyc7XG5pbXBvcnQgc3RyaW5naWZ5IGZyb20gJy4vc3RyaW5naWZ5LmpzJztcbmltcG9ydCBTcGFjZSBmcm9tICcuL1NwYWNlLmpzJztcbnZhciBqVGFiRG9jID0ge1xuXHRwYXJzZTogcGFyc2UsXG5cdHN0cmluZ2lmeTogc3RyaW5naWZ5LFxuXHRTcGFjZTogU3BhY2UsXG5cdHZlcnNpb246IHZlcnNpb25cbn07XG5qVGFiRG9jWydkZWZhdWx0J10gPSBqVGFiRG9jO1xuZXhwb3J0IHtcblx0cGFyc2UsXG5cdHN0cmluZ2lmeSxcblx0U3BhY2UsXG5cdHZlcnNpb25cbn07XG5leHBvcnQgZGVmYXVsdCBqVGFiRG9jOyJdLCJuYW1lcyI6WyJ1bmRlZmluZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsY0FBZSxPQUFPOztBQ0F0QjtBQUNBLElBQUlBLFdBQVMsQ0FBQztBQUNkLEFBQ0EsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDekMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDaEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sSUFBSSxTQUFTLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxDQUFDOztBQUU1RyxLQUFLLE9BQU8sTUFBTSxHQUFHLFVBQVUsR0FBRztDQUNqQyxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0NBQy9CLEtBQUssT0FBTyxRQUFRLEdBQUcsVUFBVSxJQUFJLE9BQU8sTUFBTSxDQUFDLElBQUksR0FBRyxVQUFVLEdBQUc7RUFDdEUsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLFNBQVMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDO0VBQy9HLElBQUksaUJBQWlCLEdBQUcsU0FBUyxpQkFBaUIsRUFBRSxNQUFNLEVBQUU7R0FDM0QsU0FBUyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLEtBQUssSUFBSSxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTTtJQUMxRyxLQUFLLElBQUksRUFBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNO0lBQ3RGLEtBQUssSUFBSSxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNO0lBQ3RIO0dBQ0QsT0FBTyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7R0FDekIsQ0FBQztFQUNGO01BQ0ksRUFBRSxRQUFRLEdBQUcsU0FBUyxRQUFRLElBQUksRUFBRSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUMzRDtLQUNJLEVBQUUsUUFBUSxHQUFHLFNBQVMsUUFBUSxJQUFJLEVBQUUsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUU7O0FDdEJwRCxJQUFJLGdCQUFnQixHQUFHLFlBQVksQ0FBQzs7QUFFM0MsQUFBTyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUMsTUFBTTtHQUMvQixTQUFTLFdBQVcsRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtHQUMxRCxVQUFVLE1BQU0sRUFBRTtFQUNuQixPQUFPLFNBQVMsV0FBVyxFQUFFLEtBQUssRUFBRTtHQUNuQyxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7R0FDeEIsT0FBTyxN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