/*!
 * 模块名称：jTabDoc
 * 模块功能：TabDoc 的官方标准实现。从属于“简计划”。
   　　　　　The official standard implementation of TabDoc. Belong to "Plan J".
 * 模块版本：1.0.0
 * 许可条款：LGPL-3.0
 * 所属作者：龙腾道 <LongTengDao@LongTengDao.com> (www.LongTengDao.com)
 * 问题反馈：https://GitHub.com/LongTengDao/j-tabdoc/issues
 * 项目主页：https://GitHub.com/LongTengDao/j-tabdoc/
 */

var version = '1.0.0';

// Object, Array, Buffer

var undefined$1;
var toString = Object.prototype.toString;
var push = Array.prototype.push;
var isArray = Array.isArray || function (lines) {
	return toString.call(lines)==='[object Array]';
};

if ( typeof Buffer==='function' ) {
	isBuffer = Buffer.isBuffer;
	var from = Buffer.from;
	var toStringFollowBOM = function (buffer) {
		switch ( buffer[0] ) {
			case 0xEF:
				if ( buffer[1]===0xBB && buffer[2]===0xBF ) { return buffer.slice(3).toString('utf8'); }
				break;
			case 0xFF:
				if ( buffer[1]===0xFE ) { return buffer.slice(2).toString('ucs2'); }
				break;
			case 0xFE:
				if ( buffer[1]===0xFF ) {
					buffer = from(buffer);
					return buffer.swap16().slice(2).toString('ucs2');
				}
				break;
		}
		return buffer.toString();
	};
}
else {
	var isBuffer = function () { return false; };
}

var POSITIVE_INTEGER = /^[1-9]\d*$/;

var repeatSpace = ''.repeat
	? function (count) { return ' '.repeat(count); }
	: function (spaces) {
		return function (count) {
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
		levelReviver===null ? [] : call(levelReviver, this, []) :
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
	return levelReviver===null ? level : call(levelReviver, context, level);
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
			level.push(call(regExp_function[1], context, pendingGroup.length===1 ? pendingGroup[0] : pendingGroup));
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
		level.push(call(regExp_function[1], context, count===1 ? pendingGroup.shift() : pendingGroup.splice(0, count)));
		if ( debug ) {
			if ( level[level.length-1]===undefined$1 ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())'); }
		}
		reviverIndex = 0;
		pendingKeys = pendingKeys.slice(keyLength);
	}
	throw new Error('jTabDoc.parse(,reviver.group[!])');
}

function call (reviver, context, argument) {
	return reviver.prototype==null
		? reviver(argument, context)
		: new reviver(argument, context);
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy92ZXJzaW9uP3RleHQiLCJzcmMvZ2xvYmFsLmpzIiwic3JjL3V0aWwuanMiLCJzcmMvcGFyc2UuanMiLCJzcmMvc3RyaW5naWZ5LmpzIiwic3JjL1NwYWNlLmpzIiwic3JjL2V4cG9ydC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCAnMS4wLjAnOyIsImV4cG9ydCB7IHVuZGVmaW5lZCwgaGFzT3duUHJvcGVydHksIHRvU3RyaW5nLCBwdXNoLCBpc0FycmF5LCBpc0J1ZmZlciwgdG9TdHJpbmdGb2xsb3dCT00gfTsvLyBUeXBlRXJyb3IsIEVycm9yLCBSYW5nZUVycm9yXG4vLyBPYmplY3QsIEFycmF5LCBCdWZmZXJcblxudmFyIHVuZGVmaW5lZDtcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIHB1c2ggPSBBcnJheS5wcm90b3R5cGUucHVzaDtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAobGluZXMpIHtcblx0cmV0dXJuIHRvU3RyaW5nLmNhbGwobGluZXMpPT09J1tvYmplY3QgQXJyYXldJztcbn07XG5cbmlmICggdHlwZW9mIEJ1ZmZlcj09PSdmdW5jdGlvbicgKSB7XG5cdGlzQnVmZmVyID0gQnVmZmVyLmlzQnVmZmVyO1xuXHR2YXIgZnJvbSA9IEJ1ZmZlci5mcm9tO1xuXHR2YXIgdG9TdHJpbmdGb2xsb3dCT00gPSBmdW5jdGlvbiAoYnVmZmVyKSB7XG5cdFx0c3dpdGNoICggYnVmZmVyWzBdICkge1xuXHRcdFx0Y2FzZSAweEVGOlxuXHRcdFx0XHRpZiAoIGJ1ZmZlclsxXT09PTB4QkIgJiYgYnVmZmVyWzJdPT09MHhCRiApIHsgcmV0dXJuIGJ1ZmZlci5zbGljZSgzKS50b1N0cmluZygndXRmOCcpOyB9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAweEZGOlxuXHRcdFx0XHRpZiAoIGJ1ZmZlclsxXT09PTB4RkUgKSB7IHJldHVybiBidWZmZXIuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTsgfVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgMHhGRTpcblx0XHRcdFx0aWYgKCBidWZmZXJbMV09PT0weEZGICkge1xuXHRcdFx0XHRcdGJ1ZmZlciA9IGZyb20oYnVmZmVyKTtcblx0XHRcdFx0XHRyZXR1cm4gYnVmZmVyLnN3YXAxNigpLnNsaWNlKDIpLnRvU3RyaW5nKCd1Y3MyJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoKTtcblx0fTtcbn1cbmVsc2Uge1xuXHR2YXIgaXNCdWZmZXIgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcbn1cbiIsIlxuZXhwb3J0IHZhciBQT1NJVElWRV9JTlRFR0VSID0gL15bMS05XVxcZCokLztcblxuZXhwb3J0IHZhciByZXBlYXRTcGFjZSA9ICcnLnJlcGVhdFxuXHQ/IGZ1bmN0aW9uIChjb3VudCkgeyByZXR1cm4gJyAnLnJlcGVhdChjb3VudCk7IH1cblx0OiBmdW5jdGlvbiAoc3BhY2VzKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChjb3VudCkge1xuXHRcdFx0c3BhY2VzLmxlbmd0aCA9IGNvdW50KzE7XG5cdFx0XHRyZXR1cm4gc3BhY2VzLmpvaW4oJyAnKTtcblx0XHR9O1xuXHR9KFtdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vdFN0cmluZ0FycmF5IChhcnJheSkge1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRpZiAoIHR5cGVvZiBhcnJheVtpbmRleF0hPT0nc3RyaW5nJyApIHsgcmV0dXJuIHRydWU7IH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyB1bmRlZmluZWQsIGlzQXJyYXksIGlzQnVmZmVyLCB0b1N0cmluZ0ZvbGxvd0JPTSB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBQT1NJVElWRV9JTlRFR0VSLCBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbnZhciBCT00gPSAvXlxcdUZFRkYvO1xudmFyIEVPTCA9IC9cXHJcXG4/fFxcbi87XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlICh0YWJMaW5lcywgX3Jldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zykge1xuXHRpZiAoICFpc0FycmF5KHRhYkxpbmVzKSApIHtcblx0XHRpZiAoIHR5cGVvZiB0YWJMaW5lcz09PSdzdHJpbmcnICkgeyB0YWJMaW5lcyA9IHRhYkxpbmVzLnJlcGxhY2UoQk9NLCAnJykuc3BsaXQoRU9MKTsgfVxuXHRcdGVsc2UgaWYgKCBpc0J1ZmZlcih0YWJMaW5lcykgKSB7IHRhYkxpbmVzID0gdG9TdHJpbmdGb2xsb3dCT00odGFiTGluZXMpLnNwbGl0KEVPTCk7IH1cblx0fVxuXHRpZiAoIF9yZXZpdmVyPT1udWxsICkge1xuXHRcdHZhciBjb3VudEVtcHRpZXMgPSB0cnVlO1xuXHRcdHZhciBncm91cFJldml2ZXIgPSBudWxsO1xuXHRcdHZhciBsZXZlbFJldml2ZXIgPSBudWxsO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGNvdW50RW1wdGllcyA9IF9yZXZpdmVyLmVtcHR5O1xuXHRcdGdyb3VwUmV2aXZlciA9IF9yZXZpdmVyLmdyb3VwO1xuXHRcdGxldmVsUmV2aXZlciA9IF9yZXZpdmVyLmxldmVsO1xuXHRcdGlmICggY291bnRFbXB0aWVzPT09dW5kZWZpbmVkICkgeyBjb3VudEVtcHRpZXMgPSB0cnVlOyB9XG5cdFx0aWYgKCBncm91cFJldml2ZXI9PT11bmRlZmluZWQgKSB7IGdyb3VwUmV2aXZlciA9IG51bGw7IH1cblx0XHRpZiAoIGxldmVsUmV2aXZlcj09PXVuZGVmaW5lZCApIHsgbGV2ZWxSZXZpdmVyID0gbnVsbDsgfVxuXHR9XG5cdGlmICggX251bWJlcj09PXVuZGVmaW5lZCApIHsgX251bWJlciA9IDE7IH1cblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzLCByZXZpdmVyLCBudW1iZXIsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggIWlzQXJyYXkodGFiTGluZXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzKScpOyB9XG5cdFx0aWYgKCBub3RTdHJpbmdBcnJheSh0YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXNbKl0pJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBjb3VudEVtcHRpZXMhPT0nYm9vbGVhbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZW1wdHkpJyk7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGdyb3VwUmV2aXZlciE9PSdib29sZWFuJyApIHtcblx0XHRcdGlmICggIWlzQXJyYXkoZ3JvdXBSZXZpdmVyKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cCknKTsgfVxuXHRcdFx0Zm9yICggdmFyIGxlbmd0aCA9IGdyb3VwUmV2aXZlci5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHR2YXIgZWFjaCA9IGdyb3VwUmV2aXZlcltpbmRleF07XG5cdFx0XHRcdGlmICggIWlzQXJyYXkoZWFjaCkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl0pJyk7IH1cblx0XHRcdFx0aWYgKCAhZWFjaFswXSB8fCB0eXBlb2YgZWFjaFswXS5leGVjIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBlYWNoWzFdIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVsxXSknKTsgfVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIGxldmVsUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGxldmVsUmV2aXZlciE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIubGV2ZWwpJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBfbnVtYmVyIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLCxudW1iZXIpJyk7IH1cblx0XHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QoX251bWJlcikgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLnBhcnNlKCwsbnVtYmVyKScpOyB9XG5cdH1cblx0cmV0dXJuIHRhYkxpbmVzLmxlbmd0aD09PTAgP1xuXHRcdGxldmVsUmV2aXZlcj09PW51bGwgPyBbXSA6IGNhbGwobGV2ZWxSZXZpdmVyLCB0aGlzLCBbXSkgOlxuXHRcdExldmVsKHRoaXMsIHRhYkxpbmVzLCBncm91cFJldml2ZXIgPyBhcHBlbmRHcm91cCA6IGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zyk7XG59O1xuXG5mdW5jdGlvbiBMZXZlbCAoY29udGV4dCwgdGFiTGluZXMsIGFwcGVuZCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgbnVtYmVyLCBkZWJ1Zykge1xuXHR2YXIgbGV2ZWwgICAgID0gW10sXG5cdFx0bGFzdEluZGV4ID0gdGFiTGluZXMubGVuZ3RoLTEsXG5cdFx0aW5kZXggICAgID0gMCxcblx0XHRibGFuayAgICAgPSB0YWJMaW5lc1swXS5sZW5ndGg9PT0wO1xuXHRvdXRlcjogZm9yICggOyA7ICkge1xuXHRcdHZhciBmcm9tID0gaW5kZXg7XG5cdFx0aWYgKCBibGFuayApIHtcblx0XHRcdGlmICggY291bnRFbXB0aWVzICkge1xuXHRcdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRcdGxldmVsLnB1c2goaW5kZXgrMS1mcm9tKTtcblx0XHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIHRhYkxpbmVzWysraW5kZXhdLmxlbmd0aCE9PTAgKSB7XG5cdFx0XHRcdFx0XHRsZXZlbC5wdXNoKGluZGV4LWZyb20pO1xuXHRcdFx0XHRcdFx0YmxhbmsgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoIT09MCApIHtcblx0XHRcdFx0XHRcdGJsYW5rID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7XG5cdFx0XHRcdFx0YXBwZW5kKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZnJvbSwgaW5kZXgsIG51bWJlciwgZGVidWcpO1xuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoPT09MCApIHtcblx0XHRcdFx0XHRhcHBlbmQoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmcm9tLCBpbmRleC0xLCBudW1iZXIsIGRlYnVnKTtcblx0XHRcdFx0XHRibGFuayA9IHRydWU7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0bGV2ZWwubnVtYmVyID0gbnVtYmVyO1xuXHRyZXR1cm4gbGV2ZWxSZXZpdmVyPT09bnVsbCA/IGxldmVsIDogY2FsbChsZXZlbFJldml2ZXIsIGNvbnRleHQsIGxldmVsKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kRmxhdCAoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmaXJzdEluZGV4LCBsYXN0SW5kZXgsIGJhc2VOdW1iZXIsIGRlYnVnKSB7XG5cdHZhciBrZXksXG5cdFx0dmFsdWUsXG5cdFx0bnVtYmVyO1xuXHRvdXRlcjogZm9yICggdmFyIGxpbmVJbmRleCA9IGZpcnN0SW5kZXgsIGxpbmUgPSB0YWJMaW5lc1tsaW5lSW5kZXhdLCB0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7IDsgKSB7XG5cdFx0dmFsdWUgPSBbXTtcblx0XHRudW1iZXIgPSBiYXNlTnVtYmVyK2xpbmVJbmRleDtcblx0XHRpZiAoIHRhYkluZGV4PT09IC0xICkge1xuXHRcdFx0a2V5ID0gJyc7XG5cdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09IC0xICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggdGFiSW5kZXg9PT0wICkge1xuXHRcdFx0XHRrZXkgPSAnXFx0Jztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBsaW5lLnNsaWNlKDAsIHRhYkluZGV4KzEpO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UodGFiSW5kZXgrMSkpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdH1cblx0XHRsZXZlbC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRsZXZlbC5wdXNoKHtcblx0XHRrZXk6IGtleSxcblx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0bnVtYmVyOiBudW1iZXJcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEdyb3VwIChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZpcnN0SW5kZXgsIGxhc3RJbmRleCwgYmFzZU51bWJlciwgZGVidWcpIHtcblx0dmFyIHBlbmRpbmdHcm91cCA9IFtdLFxuXHRcdHBlbmRpbmdLZXlzICA9ICcnLFxuXHRcdGtleSxcblx0XHR2YWx1ZSxcblx0XHRudW1iZXI7XG5cdG91dGVyOiBmb3IgKCB2YXIgbGluZUluZGV4ID0gZmlyc3RJbmRleCwgbGluZSA9IHRhYkxpbmVzW2xpbmVJbmRleF0sIHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTsgOyApIHtcblx0XHR2YWx1ZSA9IFtdO1xuXHRcdG51bWJlciA9IGJhc2VOdW1iZXIrbGluZUluZGV4O1xuXHRcdGlmICggdGFiSW5kZXg9PT0gLTEgKSB7XG5cdFx0XHRrZXkgPSAnJztcblx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHRwZW5kaW5nS2V5cyArPSAnXFxuJztcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PSAtMSApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIHRhYkluZGV4PT09MCApIHtcblx0XHRcdFx0a2V5ID0gJ1xcdCc7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9ICdcXHRcXG4nO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGtleSA9IGxpbmUuc2xpY2UoMCwgdGFiSW5kZXgrMSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9IGtleSsnXFxuJztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKHRhYkluZGV4KzEpKTtcblx0XHRcdH1cblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBlbmRpbmdHcm91cC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRwZW5kaW5nR3JvdXAucHVzaCh7XG5cdFx0a2V5OiBrZXksXG5cdFx0dmFsdWU6IHZhbHVlLFxuXHRcdG51bWJlcjogbnVtYmVyXG5cdH0pO1xuXHRpZiAoIGdyb3VwUmV2aXZlcj09PXRydWUgKSB7XG5cdFx0bGV2ZWwucHVzaChwZW5kaW5nR3JvdXAubGVuZ3RoPT09MSA/IHBlbmRpbmdHcm91cFswXSA6IHBlbmRpbmdHcm91cCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGZvciAoIHZhciByZXZpdmVyTGVuZ3RoID0gZ3JvdXBSZXZpdmVyLmxlbmd0aCwgcmV2aXZlckluZGV4ID0gMDsgcmV2aXZlckluZGV4PHJldml2ZXJMZW5ndGg7ICsrcmV2aXZlckluZGV4ICkge1xuXHRcdHZhciByZWdFeHBfZnVuY3Rpb24gPSBncm91cFJldml2ZXJbcmV2aXZlckluZGV4XTtcblx0XHR2YXIgbWF0Y2hlZCA9IHJlZ0V4cF9mdW5jdGlvblswXS5leGVjKHBlbmRpbmdLZXlzKTtcblx0XHRpZiAoIG1hdGNoZWQ9PT1udWxsICkgeyBjb250aW51ZTsgfVxuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRpZiAoIG1hdGNoZWQ9PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKCkpJyk7IH1cblx0XHRcdGlmICggbWF0Y2hlZC5pbmRleCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKS5pbmRleCknKTsgfVxuXHRcdFx0aWYgKCB0eXBlb2YgbWF0Y2hlZFswXSE9PSdzdHJpbmcnICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXSknKTsgfVxuXHRcdFx0aWYgKCBtYXRjaGVkWzBdLmxlbmd0aD09PTAgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0ubGVuZ3RoKScpOyB9XG5cdFx0XHRpZiAoIG1hdGNoZWRbMF0uY2hhckF0KG1hdGNoZWRbMF0ubGVuZ3RoLTEpIT09J1xcbicgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0pJyk7IH1cblx0XHR9XG5cdFx0dmFyIHRoaXNLZXlzID0gbWF0Y2hlZFswXTtcblx0XHR2YXIga2V5TGVuZ3RoID0gdGhpc0tleXMubGVuZ3RoO1xuXHRcdGlmICggcGVuZGluZ0tleXMubGVuZ3RoPT09a2V5TGVuZ3RoICkge1xuXHRcdFx0bGV2ZWwucHVzaChjYWxsKHJlZ0V4cF9mdW5jdGlvblsxXSwgY29udGV4dCwgcGVuZGluZ0dyb3VwLmxlbmd0aD09PTEgPyBwZW5kaW5nR3JvdXBbMF0gOiBwZW5kaW5nR3JvdXApKTtcblx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdGlmICggbGV2ZWxbbGV2ZWwubGVuZ3RoLTFdPT09dW5kZWZpbmVkICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzFdKCkpJyk7IH1cblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dmFyIGNvdW50ID0gMTtcblx0XHRmb3IgKCB2YXIgaW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJyk7IDsgKytjb3VudCApIHtcblx0XHRcdGluZGV4T2ZMRiA9IHRoaXNLZXlzLmluZGV4T2YoJ1xcbicsIGluZGV4T2ZMRisxKTtcblx0XHRcdGlmICggaW5kZXhPZkxGPDAgKSB7IGJyZWFrOyB9XG5cdFx0fVxuXHRcdGxldmVsLnB1c2goY2FsbChyZWdFeHBfZnVuY3Rpb25bMV0sIGNvbnRleHQsIGNvdW50PT09MSA/IHBlbmRpbmdHcm91cC5zaGlmdCgpIDogcGVuZGluZ0dyb3VwLnNwbGljZSgwLCBjb3VudCkpKTtcblx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdH1cblx0XHRyZXZpdmVySW5kZXggPSAwO1xuXHRcdHBlbmRpbmdLZXlzID0gcGVuZGluZ0tleXMuc2xpY2Uoa2V5TGVuZ3RoKTtcblx0fVxuXHR0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbIV0pJyk7XG59XG5cbmZ1bmN0aW9uIGNhbGwgKHJldml2ZXIsIGNvbnRleHQsIGFyZ3VtZW50KSB7XG5cdHJldHVybiByZXZpdmVyLnByb3RvdHlwZT09bnVsbFxuXHRcdD8gcmV2aXZlcihhcmd1bWVudCwgY29udGV4dClcblx0XHQ6IG5ldyByZXZpdmVyKGFyZ3VtZW50LCBjb250ZXh0KTtcbn1cbiIsImltcG9ydCB7IHVuZGVmaW5lZCwgaXNBcnJheSwgcHVzaCB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHN0cmluZ2lmeSAobGV2ZWwsIF9yZXBsYWNlciwgX3NwYWNlLCBfZGVidWcpIHtcblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeShsZXZlbCwgcmVwbGFjZXIsIHNwYWNlLCBkZWJ1ZywgLi4uKScpOyB9XG5cdFx0aWYgKCBfZGVidWc9PT11bmRlZmluZWQgKSB7IF9kZWJ1ZyA9IHRydWU7IH1cblx0XHRlbHNlIGlmICggX2RlYnVnIT09dHJ1ZSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCwsZGVidWcpJyk7IH1cblx0XHRpZiAoIF9yZXBsYWNlciE9bnVsbCAmJiB0eXBlb2YgX3JlcGxhY2VyIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLHJlcGxhY2VyKScpOyB9XG5cdFx0aWYgKCBfc3BhY2UhPW51bGwgJiYgdHlwZW9mIF9zcGFjZSE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UpJyk7IH1cblx0fVxuXHRpZiAoIF9yZXBsYWNlcj09PXVuZGVmaW5lZCApIHsgX3JlcGxhY2VyID0gbnVsbDsgfVxuXHRpZiAoIF9zcGFjZT09PXVuZGVmaW5lZCApIHsgX3NwYWNlID0gbnVsbDsgfVxuXHRyZXR1cm4gTGluZXModGhpcywgbGV2ZWwsIF9yZXBsYWNlciwgX3NwYWNlLCBfZGVidWcpO1xufTtcblxuZnVuY3Rpb24gTGluZXMgKGNvbnRleHQsIGxldmVsLCByZXBsYWNlciwgc3BhY2UsIGRlYnVnKSB7XG5cdGlmICggcmVwbGFjZXIhPT1udWxsICkgeyBsZXZlbCA9IHJlcGxhY2VyKGxldmVsLCBjb250ZXh0KTsgfVxuXHRpZiAoIGRlYnVnICkge1xuXHRcdGlmICggIWlzQXJyYXkobGV2ZWwpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeShsZXZlbCknKTsgfVxuXHR9XG5cdHZhciBsaW5lcyA9IFtdO1xuXHRmb3IgKCB2YXIgbGV2ZWxMZW5ndGggPSBsZXZlbC5sZW5ndGgsIGxldmVsSW5kZXggPSAwOyBsZXZlbEluZGV4PGxldmVsTGVuZ3RoOyArK2xldmVsSW5kZXggKSB7XG5cdFx0dmFyIGVhY2ggPSBsZXZlbFtsZXZlbEluZGV4XTtcblx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0Y2hlY2soZWFjaCwgcmVwbGFjZXIpO1xuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBlYWNoPT09J251bWJlcicgKSB7IHdoaWxlICggZWFjaC0tICkgeyBsaW5lcy5wdXNoKCcnKTsgfSB9XG5cdFx0ZWxzZSBpZiAoIGVhY2gua2V5PT09JycgKSB7IHB1c2guYXBwbHkobGluZXMsIGVhY2gudmFsdWUpOyB9XG5cdFx0ZWxzZSBpZiAoIHNwYWNlPT09bnVsbCApIHtcblx0XHRcdHB1c2hlcyhsaW5lcywgZWFjaC5rZXksICdcXHQnLCByZXBsYWNlcj09PW51bGxcblx0XHRcdFx0PyBMaW5lcyhjb250ZXh0LCBlYWNoLnZhbHVlLCBudWxsLCBzcGFjZSwgZGVidWcpXG5cdFx0XHRcdDogZWFjaC52YWx1ZVxuXHRcdFx0KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR2YXIga2V5cyA9IFtlYWNoLmtleV07XG5cdFx0XHR2YXIgdmFsdWVzID0gW2VhY2gudmFsdWVdO1xuXHRcdFx0d2hpbGUgKCArK2xldmVsSW5kZXg8bGV2ZWxMZW5ndGggKSB7XG5cdFx0XHRcdGVhY2ggPSBsZXZlbFtsZXZlbEluZGV4XTtcblx0XHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdFx0XHRcdC0tbGV2ZWxJbmRleDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRrZXlzLnB1c2goZWFjaC5rZXkpO1xuXHRcdFx0XHR2YWx1ZXMucHVzaChlYWNoLnZhbHVlKTtcblx0XHRcdH1cblx0XHRcdHZhciBrZXlzX2luZGVudCA9IHNwYWNlKGtleXMsIGNvbnRleHQpO1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Yga2V5c19pbmRlbnQhPT0nb2JqZWN0JyB8fCBrZXlzX2luZGVudD09PW51bGwgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKSknKTsgfVxuXHRcdFx0XHRpZiAoICEoICdrZXlzJyBpbiBrZXlzX2luZGVudCApIHx8ICEoICdpbmRlbnQnIGluIGtleXNfaW5kZW50ICkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpKScpOyB9XG5cdFx0XHRcdGlmICggIWlzQXJyYXkoa2V5c19pbmRlbnQua2V5cykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzKScpOyB9XG5cdFx0XHRcdGlmICgga2V5c19pbmRlbnQua2V5cy5sZW5ndGghPT12YWx1ZXMubGVuZ3RoICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzLmxlbmd0aCknKTsgfVxuXHRcdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGtleXNfaW5kZW50LmtleXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkua2V5c1sqXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBrZXlzX2luZGVudC5pbmRlbnQhPT0nc3RyaW5nJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmluZGVudCknKTsgfVxuXHRcdFx0fVxuXHRcdFx0a2V5cyA9IGtleXNfaW5kZW50LmtleXM7XG5cdFx0XHR2YXIgaW5kZW50ID0ga2V5c19pbmRlbnQuaW5kZW50O1xuXHRcdFx0Zm9yICggdmFyIGxlbmd0aCA9IHZhbHVlcy5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHRpZiAoIGtleXNbaW5kZXhdPT09JycgKSB7IHB1c2guYXBwbHkobGluZXMsIHZhbHVlc1tpbmRleF0pOyB9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHB1c2hlcyhsaW5lcywga2V5c1tpbmRleF0sIGluZGVudCwgcmVwbGFjZXI9PT1udWxsXG5cdFx0XHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIHZhbHVlc1tpbmRleF0sIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0XHRcdDogdmFsdWVzW2luZGV4XVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIGxpbmVzO1xufVxuXG5mdW5jdGlvbiBwdXNoZXMgKGxpbmVzLCBrZXksIGluZGVudCwgc3ViTGluZXMpIHtcblx0dmFyIGxlbmd0aCA9IHN1YkxpbmVzLmxlbmd0aDtcblx0aWYgKCBsZW5ndGg9PT0wICkgeyBsaW5lcy5wdXNoKGtleSk7IH1cblx0ZWxzZSB7XG5cdFx0bGluZXMucHVzaChrZXkrc3ViTGluZXNbMF0pO1xuXHRcdGZvciAoIHZhciBpbmRleCA9IDE7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRcdGxpbmVzLnB1c2goaW5kZW50K3N1YkxpbmVzW2luZGV4XSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGNoZWNrIChlYWNoLCByZXBsYWNlcikge1xuXHRpZiAoIHR5cGVvZiBlYWNoPT09J29iamVjdCcgJiYgZWFjaCE9PW51bGwgKSB7XG5cdFx0aWYgKCAhKCAna2V5JyBpbiBlYWNoICkgfHwgISggJ3ZhbHVlJyBpbiBlYWNoICkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdCknKTsgfVxuXHRcdGlmICggdHlwZW9mIGVhY2gua2V5IT09J3N0cmluZycgfHwgIS9eKD86W15cXHRcXG5cXHJdKlxcdCk/JC8udGVzdChlYWNoLmtleSkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC5rZXkpJyk7IH1cblx0XHRpZiAoIHJlcGxhY2VyIT09bnVsbCB8fCBlYWNoLmtleT09PScnICkge1xuXHRcdFx0aWYgKCAhaXNBcnJheShlYWNoLnZhbHVlKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC52YWx1ZSknKTsgfVxuXHRcdFx0aWYgKCBub3RTdHJpbmdBcnJheShlYWNoLnZhbHVlKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC52YWx1ZVsqXSknKTsgfVxuXHRcdH1cblx0fVxuXHRlbHNlIGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHtcblx0XHRpZiAoICEvXlxcZCskLy50ZXN0KGVhY2gpICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXTpudW1iZXIpJyk7IH1cblx0fVxuXHRlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdKScpOyB9XG59XG4iLCIvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3JcbmltcG9ydCB7IFBPU0lUSVZFX0lOVEVHRVIsIHJlcGVhdFNwYWNlIH0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU3BhY2UgKG1pbldpZHRoLCBwYWRkaW5nKSB7XG5cdGlmICggdHlwZW9mIG1pbldpZHRoIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MuU3BhY2UobWluV2lkdGgpJyk7IH1cblx0aWYgKCB0eXBlb2YgcGFkZGluZyE9PSdudW1iZXInICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLlNwYWNlKCxwYWRkaW5nKScpOyB9XG5cdHZhciBtdWx0aXBsZSA9IG1pbldpZHRoPDA7XG5cdGlmICggbXVsdGlwbGUgKSB7IG1pbldpZHRoID0gfm1pbldpZHRoOyB9XG5cdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChtaW5XaWR0aCkgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLlNwYWNlKG1pbldpZHRoKScpOyB9XG5cdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChwYWRkaW5nKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MuU3BhY2UoLHBhZGRpbmcpJyk7IH1cblx0cmV0dXJuIGZ1bmN0aW9uIHNwYWNlIChrZXlzKSB7XG5cdFx0cmV0dXJuIGtleXNfaW5kZW50KG11bHRpcGxlLCBtaW5XaWR0aCwgcGFkZGluZywga2V5cyk7XG5cdH07XG59O1xuXG5mdW5jdGlvbiBrZXlzX2luZGVudCAobXVsdGlwbGUsIG1pbldpZHRoLCBwYWRkaW5nLCBrZXlzKSB7XG5cdHZhciBtYXhXaWR0aCA9IDE7XG5cdHZhciB3aWR0aHMgPSBbXTtcblx0Zm9yICggdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHR2YXIgd2lkdGggPSAwO1xuXHRcdHZhciBrZXkgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0Zm9yICggdmFyIGwgPSBrZXkubGVuZ3RoLTEsIGkgPSAwOyBpPGw7ICsraSApIHtcblx0XHRcdFx0dmFyIGNoYXJDb2RlID0ga2V5LmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRcdGlmICggY2hhckNvZGU8MHg4MCApIHsgd2lkdGggKz0gMTsgfVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHR3aWR0aCArPSAyO1xuXHRcdFx0XHRcdGlmICggY2hhckNvZGU+PTB4RDgwMCAmJiBjaGFyQ29kZTw9MHhEQkZGICYmIGkrMTxsICkge1xuXHRcdFx0XHRcdFx0Y2hhckNvZGUgPSBrZXkuY2hhckNvZGVBdChpKzEpO1xuXHRcdFx0XHRcdFx0Y2hhckNvZGU+PTB4REMwMCAmJiBjaGFyQ29kZTw9MHhERkZGICYmICsraTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggd2lkdGg+bWF4V2lkdGggKSB7IG1heFdpZHRoID0gd2lkdGg7IH1cblx0XHR9XG5cdFx0d2lkdGhzLnB1c2god2lkdGgpO1xuXHR9XG5cdHdpZHRoID0gbWF4V2lkdGgrcGFkZGluZztcblx0aWYgKCBtdWx0aXBsZSApIHtcblx0XHRpZiAoIHdpZHRoJW1pbldpZHRoICkgeyB3aWR0aCArPSBtaW5XaWR0aC13aWR0aCVtaW5XaWR0aDsgfVxuXHR9XG5cdGVsc2Uge1xuXHRcdGlmICggd2lkdGg8bWluV2lkdGggKSB7IHdpZHRoID0gbWluV2lkdGg7IH1cblx0fVxuXHRmb3IgKCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRrZXkgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0a2V5c1tpbmRleF0gPSBrZXkuc2xpY2UoMCwgLTEpK3JlcGVhdFNwYWNlKHdpZHRoLXdpZHRoc1tpbmRleF0pO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4geyBrZXlzOiBrZXlzLCBpbmRlbnQ6IHJlcGVhdFNwYWNlKHdpZHRoKSB9O1xufVxuIiwiaW1wb3J0IHZlcnNpb24gZnJvbSAnLi92ZXJzaW9uP3RleHQnO1xuaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UuanMnO1xuaW1wb3J0IHN0cmluZ2lmeSBmcm9tICcuL3N0cmluZ2lmeS5qcyc7XG5pbXBvcnQgU3BhY2UgZnJvbSAnLi9TcGFjZS5qcyc7XG52YXIgalRhYkRvYyA9IHtcblx0cGFyc2U6IHBhcnNlLFxuXHRzdHJpbmdpZnk6IHN0cmluZ2lmeSxcblx0U3BhY2U6IFNwYWNlLFxuXHR2ZXJzaW9uOiB2ZXJzaW9uXG59O1xualRhYkRvY1snZGVmYXVsdCddID0galRhYkRvYztcbmV4cG9ydCB7XG5cdHBhcnNlLFxuXHRzdHJpbmdpZnksXG5cdFNwYWNlLFxuXHR2ZXJzaW9uXG59O1xuZXhwb3J0IGRlZmF1bHQgalRhYkRvYzsiXSwibmFtZXMiOlsidW5kZWZpbmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLGNBQWUsT0FBTzs7c0JBQUMsdEJDQ3ZCOztBQUVBLElBQUlBLFdBQVMsQ0FBQztBQUNkLEFBQ0EsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDekMsSUFBSSxJQUFJ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