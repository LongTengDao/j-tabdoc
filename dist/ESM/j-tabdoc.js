/*!
 * 模块名称：jTabDoc
 * 模块功能：TabDoc 的官方标准实现。从属于“简计划”。
   　　　　　The official standard implementation of TabDoc. Belong to "Plan J".
 * 模块版本：2.1.0
 * 许可条款：LGPL-3.0
 * 所属作者：龙腾道 <LongTengDao@LongTengDao.com> (www.LongTengDao.com)
 * 问题反馈：https://GitHub.com/LongTengDao/j-tabdoc/issues
 * 项目主页：https://GitHub.com/LongTengDao/j-tabdoc/
 */

var version = '2.1.0';

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
				if ( !each ) { throw new TypeError('jTabDoc.parse(,reviver.group[*])'); }
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

export default jTabDoc;
export { parse, stringify, Space, version };

/*¡ jTabDoc */

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZlcnNpb24/dGV4dCIsImdsb2JhbC5qcyIsInV0aWwuanMiLCJwYXJzZS5qcyIsInN0cmluZ2lmeS5qcyIsIlNwYWNlLmpzIiwiZXhwb3J0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0ICcyLjEuMCc7IiwiLy8gT2JqZWN0LCBBcnJheSwgQnVmZmVyXG52YXIgdW5kZWZpbmVkO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgcHVzaCA9IEFycmF5LnByb3RvdHlwZS5wdXNoO1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIGlzQXJyYXkgKGxpbmVzKSB7IHJldHVybiB0b1N0cmluZy5jYWxsKGxpbmVzKT09PSdbb2JqZWN0IEFycmF5XSc7IH07XG5cbmlmICggdHlwZW9mIEJ1ZmZlcj09PSdmdW5jdGlvbicgKSB7XG5cdHZhciBpc0J1ZmZlciA9IEJ1ZmZlci5pc0J1ZmZlcjtcblx0aWYgKCB0eXBlb2YgaXNCdWZmZXI9PT0nZnVuY3Rpb24nICYmIHR5cGVvZiBCdWZmZXIuZnJvbT09PSdmdW5jdGlvbicgKSB7XG5cdFx0dmFyIGZyb20gPSBCdWZmZXIuaGFzT3duUHJvcGVydHkoJ2Zyb20nKSA/IEJ1ZmZlci5mcm9tIDogZnVuY3Rpb24gZnJvbSAoYnVmZmVyKSB7IHJldHVybiBuZXcgQnVmZmVyKGJ1ZmZlcik7IH07XG5cdFx0dmFyIHRvU3RyaW5nRm9sbG93Qk9NID0gZnVuY3Rpb24gdG9TdHJpbmdGb2xsb3dCT00gKGJ1ZmZlcikge1xuXHRcdFx0c3dpdGNoICggYnVmZmVyWzBdICkge1xuXHRcdFx0XHRjYXNlIDB4RUY6IGlmICggYnVmZmVyWzFdPT09MHhCQiAmJiBidWZmZXJbMl09PT0weEJGICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDMpLnRvU3RyaW5nKCd1dGY4Jyk7IH0gYnJlYWs7XG5cdFx0XHRcdGNhc2UgMHhGRjogaWYgKCBidWZmZXJbMV09PT0weEZFICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDIpLnRvU3RyaW5nKCd1Y3MyJyk7IH0gYnJlYWs7XG5cdFx0XHRcdGNhc2UgMHhGRTogaWYgKCBidWZmZXJbMV09PT0weEZGICkgeyBidWZmZXIgPSBmcm9tKGJ1ZmZlcik7IHJldHVybiBidWZmZXIuc3dhcDE2KCkuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTsgfSBicmVhaztcblx0XHRcdH1cblx0XHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoKTtcblx0XHR9O1xuXHR9XG5cdGVsc2UgeyBpc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9OyB9XG59XG5lbHNlIHsgaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoKSB7IHJldHVybiBmYWxzZTsgfTsgfVxuXG5leHBvcnQgeyB1bmRlZmluZWQsIGhhc093blByb3BlcnR5LCB0b1N0cmluZywgcHVzaCwgaXNBcnJheSwgaXNCdWZmZXIsIHRvU3RyaW5nRm9sbG93Qk9NIH07Ly8gVHlwZUVycm9yLCBFcnJvciwgUmFuZ2VFcnJvclxuIiwiZXhwb3J0IHZhciBQT1NJVElWRV9JTlRFR0VSID0gL15bMS05XVxcZCokLztcblxuZXhwb3J0IHZhciByZXBlYXRTcGFjZSA9ICcnLnJlcGVhdFxuXHQ/IGZ1bmN0aW9uIHJlcGVhdFNwYWNlIChjb3VudCkgeyByZXR1cm4gJyAnLnJlcGVhdChjb3VudCk7IH1cblx0OiBmdW5jdGlvbiAoc3BhY2VzKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHJlcGVhdFNwYWNlIChjb3VudCkge1xuXHRcdFx0c3BhY2VzLmxlbmd0aCA9IGNvdW50KzE7XG5cdFx0XHRyZXR1cm4gc3BhY2VzLmpvaW4oJyAnKTtcblx0XHR9O1xuXHR9KFtdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vdFN0cmluZ0FycmF5IChhcnJheSkge1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRpZiAoIHR5cGVvZiBhcnJheVtpbmRleF0hPT0nc3RyaW5nJyApIHsgcmV0dXJuIHRydWU7IH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyB1bmRlZmluZWQsIGlzQXJyYXksIGlzQnVmZmVyLCB0b1N0cmluZ0ZvbGxvd0JPTSB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBQT1NJVElWRV9JTlRFR0VSLCBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbnZhciBCT00gPSAvXlxcdUZFRkYvO1xudmFyIEVPTCA9IC9cXHJcXG4/fFxcbi87XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlICh0YWJMaW5lcywgX3Jldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zykge1xuXHRpZiAoICFpc0FycmF5KHRhYkxpbmVzKSApIHtcblx0XHRpZiAoIHR5cGVvZiB0YWJMaW5lcz09PSdzdHJpbmcnICkgeyB0YWJMaW5lcyA9IHRhYkxpbmVzLnJlcGxhY2UoQk9NLCAnJykuc3BsaXQoRU9MKTsgfVxuXHRcdGVsc2UgaWYgKCBpc0J1ZmZlcih0YWJMaW5lcykgKSB7IHRhYkxpbmVzID0gdG9TdHJpbmdGb2xsb3dCT00odGFiTGluZXMpLnNwbGl0KEVPTCk7IH1cblx0fVxuXHRpZiAoIF9yZXZpdmVyPT1udWxsICkge1xuXHRcdHZhciBjb3VudEVtcHRpZXMgPSB0cnVlO1xuXHRcdHZhciBncm91cFJldml2ZXIgPSBudWxsO1xuXHRcdHZhciBsZXZlbFJldml2ZXIgPSBudWxsO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGNvdW50RW1wdGllcyA9IF9yZXZpdmVyLmVtcHR5O1xuXHRcdGdyb3VwUmV2aXZlciA9IF9yZXZpdmVyLmdyb3VwO1xuXHRcdGxldmVsUmV2aXZlciA9IF9yZXZpdmVyLmxldmVsO1xuXHRcdGlmICggY291bnRFbXB0aWVzPT09dW5kZWZpbmVkICkgeyBjb3VudEVtcHRpZXMgPSB0cnVlOyB9XG5cdFx0aWYgKCBncm91cFJldml2ZXI9PT11bmRlZmluZWQgKSB7IGdyb3VwUmV2aXZlciA9IG51bGw7IH1cblx0XHRpZiAoIGxldmVsUmV2aXZlcj09PXVuZGVmaW5lZCApIHsgbGV2ZWxSZXZpdmVyID0gbnVsbDsgfVxuXHR9XG5cdGlmICggX251bWJlcj09PXVuZGVmaW5lZCApIHsgX251bWJlciA9IDE7IH1cblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzLCByZXZpdmVyLCBudW1iZXIsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggIWlzQXJyYXkodGFiTGluZXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzKScpOyB9XG5cdFx0aWYgKCBub3RTdHJpbmdBcnJheSh0YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXNbKl0pJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBjb3VudEVtcHRpZXMhPT0nYm9vbGVhbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZW1wdHkpJyk7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGdyb3VwUmV2aXZlciE9PSdib29sZWFuJyApIHtcblx0XHRcdGlmICggIWlzQXJyYXkoZ3JvdXBSZXZpdmVyKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cCknKTsgfVxuXHRcdFx0Zm9yICggdmFyIGxlbmd0aCA9IGdyb3VwUmV2aXZlci5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHR2YXIgZWFjaCA9IGdyb3VwUmV2aXZlcltpbmRleF07XG5cdFx0XHRcdGlmICggIWVhY2ggKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl0pJyk7IH1cblx0XHRcdFx0aWYgKCAhZWFjaFswXSB8fCB0eXBlb2YgZWFjaFswXS5leGVjIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBlYWNoWzFdIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVsxXSknKTsgfVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIGxldmVsUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGxldmVsUmV2aXZlciE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIubGV2ZWwpJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBfbnVtYmVyIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLCxudW1iZXIpJyk7IH1cblx0XHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QoX251bWJlcikgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLnBhcnNlKCwsbnVtYmVyKScpOyB9XG5cdH1cblx0cmV0dXJuIHRhYkxpbmVzLmxlbmd0aD09PTAgP1xuXHRcdGxldmVsUmV2aXZlcj09PW51bGwgPyBbXSA6IGxldmVsUmV2aXZlcihbXSwgdGhpcykgOlxuXHRcdExldmVsKHRoaXMsIHRhYkxpbmVzLCBncm91cFJldml2ZXIgPyBhcHBlbmRHcm91cCA6IGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zyk7XG59O1xuXG5mdW5jdGlvbiBMZXZlbCAoY29udGV4dCwgdGFiTGluZXMsIGFwcGVuZCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgbnVtYmVyLCBkZWJ1Zykge1xuXHR2YXIgbGV2ZWwgICAgID0gW10sXG5cdFx0bGFzdEluZGV4ID0gdGFiTGluZXMubGVuZ3RoLTEsXG5cdFx0aW5kZXggICAgID0gMCxcblx0XHRibGFuayAgICAgPSB0YWJMaW5lc1swXS5sZW5ndGg9PT0wO1xuXHRvdXRlcjogZm9yICggOyA7ICkge1xuXHRcdHZhciBmcm9tID0gaW5kZXg7XG5cdFx0aWYgKCBibGFuayApIHtcblx0XHRcdGlmICggY291bnRFbXB0aWVzICkge1xuXHRcdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRcdGxldmVsLnB1c2goaW5kZXgrMS1mcm9tKTtcblx0XHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIHRhYkxpbmVzWysraW5kZXhdLmxlbmd0aCE9PTAgKSB7XG5cdFx0XHRcdFx0XHRsZXZlbC5wdXNoKGluZGV4LWZyb20pO1xuXHRcdFx0XHRcdFx0YmxhbmsgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoIT09MCApIHtcblx0XHRcdFx0XHRcdGJsYW5rID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7XG5cdFx0XHRcdFx0YXBwZW5kKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZnJvbSwgaW5kZXgsIG51bWJlciwgZGVidWcpO1xuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoPT09MCApIHtcblx0XHRcdFx0XHRhcHBlbmQoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmcm9tLCBpbmRleC0xLCBudW1iZXIsIGRlYnVnKTtcblx0XHRcdFx0XHRibGFuayA9IHRydWU7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0bGV2ZWwubnVtYmVyID0gbnVtYmVyO1xuXHRyZXR1cm4gbGV2ZWxSZXZpdmVyPT09bnVsbCA/IGxldmVsIDogbGV2ZWxSZXZpdmVyKGxldmVsLCBjb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kRmxhdCAoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmaXJzdEluZGV4LCBsYXN0SW5kZXgsIGJhc2VOdW1iZXIsIGRlYnVnKSB7XG5cdHZhciBrZXksXG5cdFx0dmFsdWUsXG5cdFx0bnVtYmVyO1xuXHRvdXRlcjogZm9yICggdmFyIGxpbmVJbmRleCA9IGZpcnN0SW5kZXgsIGxpbmUgPSB0YWJMaW5lc1tsaW5lSW5kZXhdLCB0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7IDsgKSB7XG5cdFx0dmFsdWUgPSBbXTtcblx0XHRudW1iZXIgPSBiYXNlTnVtYmVyK2xpbmVJbmRleDtcblx0XHRpZiAoIHRhYkluZGV4PT09IC0xICkge1xuXHRcdFx0a2V5ID0gJyc7XG5cdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09IC0xICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggdGFiSW5kZXg9PT0wICkge1xuXHRcdFx0XHRrZXkgPSAnXFx0Jztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBsaW5lLnNsaWNlKDAsIHRhYkluZGV4KzEpO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UodGFiSW5kZXgrMSkpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdH1cblx0XHRsZXZlbC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRsZXZlbC5wdXNoKHtcblx0XHRrZXk6IGtleSxcblx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0bnVtYmVyOiBudW1iZXJcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEdyb3VwIChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZpcnN0SW5kZXgsIGxhc3RJbmRleCwgYmFzZU51bWJlciwgZGVidWcpIHtcblx0dmFyIHBlbmRpbmdHcm91cCA9IFtdLFxuXHRcdHBlbmRpbmdLZXlzICA9ICcnLFxuXHRcdGtleSxcblx0XHR2YWx1ZSxcblx0XHRudW1iZXI7XG5cdG91dGVyOiBmb3IgKCB2YXIgbGluZUluZGV4ID0gZmlyc3RJbmRleCwgbGluZSA9IHRhYkxpbmVzW2xpbmVJbmRleF0sIHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTsgOyApIHtcblx0XHR2YWx1ZSA9IFtdO1xuXHRcdG51bWJlciA9IGJhc2VOdW1iZXIrbGluZUluZGV4O1xuXHRcdGlmICggdGFiSW5kZXg9PT0gLTEgKSB7XG5cdFx0XHRrZXkgPSAnJztcblx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHRwZW5kaW5nS2V5cyArPSAnXFxuJztcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PSAtMSApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIHRhYkluZGV4PT09MCApIHtcblx0XHRcdFx0a2V5ID0gJ1xcdCc7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9ICdcXHRcXG4nO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGtleSA9IGxpbmUuc2xpY2UoMCwgdGFiSW5kZXgrMSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9IGtleSsnXFxuJztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKHRhYkluZGV4KzEpKTtcblx0XHRcdH1cblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBlbmRpbmdHcm91cC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRwZW5kaW5nR3JvdXAucHVzaCh7XG5cdFx0a2V5OiBrZXksXG5cdFx0dmFsdWU6IHZhbHVlLFxuXHRcdG51bWJlcjogbnVtYmVyXG5cdH0pO1xuXHRpZiAoIGdyb3VwUmV2aXZlcj09PXRydWUgKSB7XG5cdFx0bGV2ZWwucHVzaChwZW5kaW5nR3JvdXAubGVuZ3RoPT09MSA/IHBlbmRpbmdHcm91cFswXSA6IHBlbmRpbmdHcm91cCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGZvciAoIHZhciByZXZpdmVyTGVuZ3RoID0gZ3JvdXBSZXZpdmVyLmxlbmd0aCwgcmV2aXZlckluZGV4ID0gMDsgcmV2aXZlckluZGV4PHJldml2ZXJMZW5ndGg7ICsrcmV2aXZlckluZGV4ICkge1xuXHRcdHZhciByZWdFeHBfZnVuY3Rpb24gPSBncm91cFJldml2ZXJbcmV2aXZlckluZGV4XTtcblx0XHR2YXIgbWF0Y2hlZCA9IHJlZ0V4cF9mdW5jdGlvblswXS5leGVjKHBlbmRpbmdLZXlzKTtcblx0XHRpZiAoIG1hdGNoZWQ9PT1udWxsICkgeyBjb250aW51ZTsgfVxuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRpZiAoIG1hdGNoZWQ9PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKCkpJyk7IH1cblx0XHRcdGlmICggbWF0Y2hlZC5pbmRleCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKS5pbmRleCknKTsgfVxuXHRcdFx0aWYgKCB0eXBlb2YgbWF0Y2hlZFswXSE9PSdzdHJpbmcnICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXSknKTsgfVxuXHRcdFx0aWYgKCBtYXRjaGVkWzBdLmxlbmd0aD09PTAgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0ubGVuZ3RoKScpOyB9XG5cdFx0XHRpZiAoIG1hdGNoZWRbMF0uY2hhckF0KG1hdGNoZWRbMF0ubGVuZ3RoLTEpIT09J1xcbicgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0pJyk7IH1cblx0XHR9XG5cdFx0dmFyIHRoaXNLZXlzID0gbWF0Y2hlZFswXTtcblx0XHR2YXIga2V5TGVuZ3RoID0gdGhpc0tleXMubGVuZ3RoO1xuXHRcdGlmICggcGVuZGluZ0tleXMubGVuZ3RoPT09a2V5TGVuZ3RoICkge1xuXHRcdFx0bGV2ZWwucHVzaChyZWdFeHBfZnVuY3Rpb25bMV0ocGVuZGluZ0dyb3VwLmxlbmd0aD09PTEgPyBwZW5kaW5nR3JvdXBbMF0gOiBwZW5kaW5nR3JvdXAsIGNvbnRleHQpKTtcblx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdGlmICggbGV2ZWxbbGV2ZWwubGVuZ3RoLTFdPT09dW5kZWZpbmVkICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzFdKCkpJyk7IH1cblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dmFyIGNvdW50ID0gMTtcblx0XHRmb3IgKCB2YXIgaW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJyk7IDsgKytjb3VudCApIHtcblx0XHRcdGluZGV4T2ZMRiA9IHRoaXNLZXlzLmluZGV4T2YoJ1xcbicsIGluZGV4T2ZMRisxKTtcblx0XHRcdGlmICggaW5kZXhPZkxGPDAgKSB7IGJyZWFrOyB9XG5cdFx0fVxuXHRcdGxldmVsLnB1c2gocmVnRXhwX2Z1bmN0aW9uWzFdKGNvdW50PT09MSA/IHBlbmRpbmdHcm91cC5zaGlmdCgpIDogcGVuZGluZ0dyb3VwLnNwbGljZSgwLCBjb3VudCksIGNvbnRleHQpKTtcblx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdH1cblx0XHRyZXZpdmVySW5kZXggPSAwO1xuXHRcdHBlbmRpbmdLZXlzID0gcGVuZGluZ0tleXMuc2xpY2Uoa2V5TGVuZ3RoKTtcblx0fVxuXHR0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbIV0pJyk7XG59XG4iLCJpbXBvcnQgeyB1bmRlZmluZWQsIGlzQXJyYXksIHB1c2ggfSBmcm9tICcuL2dsb2JhbC5qcyc7Ly8gVHlwZUVycm9yLCBFcnJvclxuaW1wb3J0IHsgbm90U3RyaW5nQXJyYXkgfSBmcm9tICcuL3V0aWwuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzdHJpbmdpZnkgKGxldmVsLCBfcmVwbGFjZXIsIF9zcGFjZSwgX2RlYnVnKSB7XG5cdGlmICggX2RlYnVnIT09ZmFsc2UgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoPjQgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkobGV2ZWwsIHJlcGxhY2VyLCBzcGFjZSwgZGVidWcsIC4uLiknKTsgfVxuXHRcdGlmICggX2RlYnVnPT09dW5kZWZpbmVkICkgeyBfZGVidWcgPSB0cnVlOyB9XG5cdFx0ZWxzZSBpZiAoIF9kZWJ1ZyE9PXRydWUgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsLGRlYnVnKScpOyB9XG5cdFx0aWYgKCBfcmVwbGFjZXIhPW51bGwgJiYgdHlwZW9mIF9yZXBsYWNlciE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCxyZXBsYWNlciknKTsgfVxuXHRcdGlmICggX3NwYWNlIT1udWxsICYmIHR5cGVvZiBfc3BhY2UhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKScpOyB9XG5cdH1cblx0aWYgKCBfcmVwbGFjZXI9PT11bmRlZmluZWQgKSB7IF9yZXBsYWNlciA9IG51bGw7IH1cblx0aWYgKCBfc3BhY2U9PT11bmRlZmluZWQgKSB7IF9zcGFjZSA9IG51bGw7IH1cblx0cmV0dXJuIExpbmVzKHRoaXMsIGxldmVsLCBfcmVwbGFjZXIsIF9zcGFjZSwgX2RlYnVnKTtcbn07XG5cbmZ1bmN0aW9uIExpbmVzIChjb250ZXh0LCBsZXZlbCwgcmVwbGFjZXIsIHNwYWNlLCBkZWJ1Zykge1xuXHRpZiAoIHJlcGxhY2VyIT09bnVsbCApIHsgbGV2ZWwgPSByZXBsYWNlcihsZXZlbCwgY29udGV4dCk7IH1cblx0aWYgKCBkZWJ1ZyApIHtcblx0XHRpZiAoICFpc0FycmF5KGxldmVsKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkobGV2ZWwpJyk7IH1cblx0fVxuXHR2YXIgbGluZXMgPSBbXTtcblx0Zm9yICggdmFyIGxldmVsTGVuZ3RoID0gbGV2ZWwubGVuZ3RoLCBsZXZlbEluZGV4ID0gMDsgbGV2ZWxJbmRleDxsZXZlbExlbmd0aDsgKytsZXZlbEluZGV4ICkge1xuXHRcdHZhciBlYWNoID0gbGV2ZWxbbGV2ZWxJbmRleF07XG5cdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdGNoZWNrKGVhY2gsIHJlcGxhY2VyKTtcblx0XHR9XG5cdFx0aWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkgeyB3aGlsZSAoIGVhY2gtLSApIHsgbGluZXMucHVzaCgnJyk7IH0gfVxuXHRcdGVsc2UgaWYgKCBlYWNoLmtleT09PScnICkgeyBwdXNoLmFwcGx5KGxpbmVzLCBlYWNoLnZhbHVlKTsgfVxuXHRcdGVsc2UgaWYgKCBzcGFjZT09PW51bGwgKSB7XG5cdFx0XHRwdXNoZXMobGluZXMsIGVhY2gua2V5LCAnXFx0JywgcmVwbGFjZXI9PT1udWxsXG5cdFx0XHRcdD8gTGluZXMoY29udGV4dCwgZWFjaC52YWx1ZSwgbnVsbCwgc3BhY2UsIGRlYnVnKVxuXHRcdFx0XHQ6IGVhY2gudmFsdWVcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dmFyIGtleXMgPSBbZWFjaC5rZXldO1xuXHRcdFx0dmFyIHZhbHVlcyA9IFtlYWNoLnZhbHVlXTtcblx0XHRcdHdoaWxlICggKytsZXZlbEluZGV4PGxldmVsTGVuZ3RoICkge1xuXHRcdFx0XHRlYWNoID0gbGV2ZWxbbGV2ZWxJbmRleF07XG5cdFx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdFx0Y2hlY2soZWFjaCwgcmVwbGFjZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHtcblx0XHRcdFx0XHQtLWxldmVsSW5kZXg7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0a2V5cy5wdXNoKGVhY2gua2V5KTtcblx0XHRcdFx0dmFsdWVzLnB1c2goZWFjaC52YWx1ZSk7XG5cdFx0XHR9XG5cdFx0XHR2YXIga2V5c19pbmRlbnQgPSBzcGFjZShrZXlzLCBjb250ZXh0KTtcblx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIGtleXNfaW5kZW50IT09J29iamVjdCcgfHwga2V5c19pbmRlbnQ9PT1udWxsICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkpJyk7IH1cblx0XHRcdFx0aWYgKCAhKCAna2V5cycgaW4ga2V5c19pbmRlbnQgKSB8fCAhKCAnaW5kZW50JyBpbiBrZXlzX2luZGVudCApICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKSknKTsgfVxuXHRcdFx0XHRpZiAoICFpc0FycmF5KGtleXNfaW5kZW50LmtleXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkua2V5cyknKTsgfVxuXHRcdFx0XHRpZiAoIGtleXNfaW5kZW50LmtleXMubGVuZ3RoIT09dmFsdWVzLmxlbmd0aCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkua2V5cy5sZW5ndGgpJyk7IH1cblx0XHRcdFx0aWYgKCBub3RTdHJpbmdBcnJheShrZXlzX2luZGVudC5rZXlzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmtleXNbKl0pJyk7IH1cblx0XHRcdFx0aWYgKCB0eXBlb2Yga2V5c19pbmRlbnQuaW5kZW50IT09J3N0cmluZycgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5pbmRlbnQpJyk7IH1cblx0XHRcdH1cblx0XHRcdGtleXMgPSBrZXlzX2luZGVudC5rZXlzO1xuXHRcdFx0dmFyIGluZGVudCA9IGtleXNfaW5kZW50LmluZGVudDtcblx0XHRcdGZvciAoIHZhciBsZW5ndGggPSB2YWx1ZXMubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRcdFx0aWYgKCBrZXlzW2luZGV4XT09PScnICkgeyBwdXNoLmFwcGx5KGxpbmVzLCB2YWx1ZXNbaW5kZXhdKTsgfVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRwdXNoZXMobGluZXMsIGtleXNbaW5kZXhdLCBpbmRlbnQsIHJlcGxhY2VyPT09bnVsbFxuXHRcdFx0XHRcdFx0PyBMaW5lcyhjb250ZXh0LCB2YWx1ZXNbaW5kZXhdLCBudWxsLCBzcGFjZSwgZGVidWcpXG5cdFx0XHRcdFx0XHQ6IHZhbHVlc1tpbmRleF1cblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiBsaW5lcztcbn1cblxuZnVuY3Rpb24gcHVzaGVzIChsaW5lcywga2V5LCBpbmRlbnQsIHN1YkxpbmVzKSB7XG5cdHZhciBsZW5ndGggPSBzdWJMaW5lcy5sZW5ndGg7XG5cdGlmICggbGVuZ3RoPT09MCApIHsgbGluZXMucHVzaChrZXkpOyB9XG5cdGVsc2Uge1xuXHRcdGxpbmVzLnB1c2goa2V5K3N1YkxpbmVzWzBdKTtcblx0XHRmb3IgKCB2YXIgaW5kZXggPSAxOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0XHRsaW5lcy5wdXNoKGluZGVudCtzdWJMaW5lc1tpbmRleF0pO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBjaGVjayAoZWFjaCwgcmVwbGFjZXIpIHtcblx0aWYgKCB0eXBlb2YgZWFjaD09PSdvYmplY3QnICYmIGVhY2ghPT1udWxsICkge1xuXHRcdGlmICggISggJ2tleScgaW4gZWFjaCApIHx8ICEoICd2YWx1ZScgaW4gZWFjaCApICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXTpvYmplY3QpJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBlYWNoLmtleSE9PSdzdHJpbmcnIHx8ICEvXig/OlteXFx0XFxuXFxyXSpcXHQpPyQvLnRlc3QoZWFjaC5rZXkpICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXTpvYmplY3Qua2V5KScpOyB9XG5cdFx0aWYgKCByZXBsYWNlciE9PW51bGwgfHwgZWFjaC5rZXk9PT0nJyApIHtcblx0XHRcdGlmICggIWlzQXJyYXkoZWFjaC52YWx1ZSkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXTpvYmplY3QudmFsdWUpJyk7IH1cblx0XHRcdGlmICggbm90U3RyaW5nQXJyYXkoZWFjaC52YWx1ZSkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXTpvYmplY3QudmFsdWVbKl0pJyk7IH1cblx0XHR9XG5cdH1cblx0ZWxzZSBpZiAoIHR5cGVvZiBlYWNoPT09J251bWJlcicgKSB7XG5cdFx0aWYgKCAhL15cXGQrJC8udGVzdChlYWNoKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06bnVtYmVyKScpOyB9XG5cdH1cblx0ZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXSknKTsgfVxufVxuIiwiLy8gVHlwZUVycm9yLCBSYW5nZUVycm9yXG5pbXBvcnQgeyBQT1NJVElWRV9JTlRFR0VSLCByZXBlYXRTcGFjZSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFNwYWNlIChtaW5XaWR0aCwgcGFkZGluZykge1xuXHRpZiAoIHR5cGVvZiBtaW5XaWR0aCE9PSdudW1iZXInICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLlNwYWNlKG1pbldpZHRoKScpOyB9XG5cdGlmICggdHlwZW9mIHBhZGRpbmchPT0nbnVtYmVyJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5TcGFjZSgscGFkZGluZyknKTsgfVxuXHR2YXIgbXVsdGlwbGUgPSBtaW5XaWR0aDwwO1xuXHRpZiAoIG11bHRpcGxlICkgeyBtaW5XaWR0aCA9IH5taW5XaWR0aDsgfVxuXHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QobWluV2lkdGgpICkgeyB0aHJvdyBuZXcgUmFuZ2VFcnJvcignalRhYkRvYy5TcGFjZShtaW5XaWR0aCknKTsgfVxuXHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QocGFkZGluZykgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLlNwYWNlKCxwYWRkaW5nKScpOyB9XG5cdHJldHVybiBmdW5jdGlvbiBzcGFjZSAoa2V5cykge1xuXHRcdHJldHVybiBrZXlzX2luZGVudChtdWx0aXBsZSwgbWluV2lkdGgsIHBhZGRpbmcsIGtleXMpO1xuXHR9O1xufTtcblxuZnVuY3Rpb24ga2V5c19pbmRlbnQgKG11bHRpcGxlLCBtaW5XaWR0aCwgcGFkZGluZywga2V5cykge1xuXHR2YXIgbWF4V2lkdGggPSAxO1xuXHR2YXIgd2lkdGhzID0gW107XG5cdGZvciAoIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aCwgaW5kZXggPSAwOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0dmFyIHdpZHRoID0gMDtcblx0XHR2YXIga2V5ID0ga2V5c1tpbmRleF07XG5cdFx0aWYgKCBrZXkhPT0nJyApIHtcblx0XHRcdGZvciAoIHZhciBsID0ga2V5Lmxlbmd0aC0xLCBpID0gMDsgaTxsOyArK2kgKSB7XG5cdFx0XHRcdHZhciBjaGFyQ29kZSA9IGtleS5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0XHRpZiAoIGNoYXJDb2RlPDB4ODAgKSB7IHdpZHRoICs9IDE7IH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0d2lkdGggKz0gMjtcblx0XHRcdFx0XHRpZiAoIGNoYXJDb2RlPj0weEQ4MDAgJiYgY2hhckNvZGU8PTB4REJGRiAmJiBpKzE8bCApIHtcblx0XHRcdFx0XHRcdGNoYXJDb2RlID0ga2V5LmNoYXJDb2RlQXQoaSsxKTtcblx0XHRcdFx0XHRcdGNoYXJDb2RlPj0weERDMDAgJiYgY2hhckNvZGU8PTB4REZGRiAmJiArK2k7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHdpZHRoPm1heFdpZHRoICkgeyBtYXhXaWR0aCA9IHdpZHRoOyB9XG5cdFx0fVxuXHRcdHdpZHRocy5wdXNoKHdpZHRoKTtcblx0fVxuXHR3aWR0aCA9IG1heFdpZHRoK3BhZGRpbmc7XG5cdGlmICggbXVsdGlwbGUgKSB7XG5cdFx0aWYgKCB3aWR0aCVtaW5XaWR0aCApIHsgd2lkdGggKz0gbWluV2lkdGgtd2lkdGglbWluV2lkdGg7IH1cblx0fVxuXHRlbHNlIHtcblx0XHRpZiAoIHdpZHRoPG1pbldpZHRoICkgeyB3aWR0aCA9IG1pbldpZHRoOyB9XG5cdH1cblx0Zm9yICggaW5kZXggPSAwOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0a2V5ID0ga2V5c1tpbmRleF07XG5cdFx0aWYgKCBrZXkhPT0nJyApIHtcblx0XHRcdGtleXNbaW5kZXhdID0ga2V5LnNsaWNlKDAsIC0xKStyZXBlYXRTcGFjZSh3aWR0aC13aWR0aHNbaW5kZXhdKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHsga2V5czoga2V5cywgaW5kZW50OiByZXBlYXRTcGFjZSh3aWR0aCkgfTtcbn1cbiIsImltcG9ydCB2ZXJzaW9uIGZyb20gJy4vdmVyc2lvbj90ZXh0JztcbmltcG9ydCBwYXJzZSBmcm9tICcuL3BhcnNlLmpzJztcbmltcG9ydCBzdHJpbmdpZnkgZnJvbSAnLi9zdHJpbmdpZnkuanMnO1xuaW1wb3J0IFNwYWNlIGZyb20gJy4vU3BhY2UuanMnO1xudmFyIGpUYWJEb2MgPSB7XG5cdHBhcnNlOiBwYXJzZSxcblx0c3RyaW5naWZ5OiBzdHJpbmdpZnksXG5cdFNwYWNlOiBTcGFjZSxcblx0dmVyc2lvbjogdmVyc2lvblxufTtcbmpUYWJEb2NbJ2RlZmF1bHQnXSA9IGpUYWJEb2M7XG5leHBvcnQge1xuXHRwYXJzZSxcblx0c3RyaW5naWZ5LFxuXHRTcGFjZSxcblx0dmVyc2lvblxufTtcbmV4cG9ydCBkZWZhdWx0IGpUYWJEb2M7Il0sIm5hbWVzIjpbInVuZGVmaW5lZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxjQUFlLE9BQU87O0FDQXRCO0FBQ0EsSUFBSUEsV0FBUyxDQUFDO0FBQ2QsQUFDQSxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztBQUN6QyxJQUFJLElBQUksR0FBRyxLQUFLLENB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