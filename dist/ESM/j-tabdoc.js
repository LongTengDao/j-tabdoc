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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZlcnNpb24/dGV4dCIsInNyYy9nbG9iYWwuanMiLCJzcmMvdXRpbC5qcyIsInNyYy9wYXJzZS5qcyIsInNyYy9zdHJpbmdpZnkuanMiLCJzcmMvU3BhY2UuanMiLCJzcmMvZXhwb3J0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0ICcxLjAuMCc7IiwiZXhwb3J0IHsgdW5kZWZpbmVkLCBoYXNPd25Qcm9wZXJ0eSwgdG9TdHJpbmcsIHB1c2gsIGlzQXJyYXksIGlzQnVmZmVyLCB0b1N0cmluZ0ZvbGxvd0JPTSB9Oy8vIFR5cGVFcnJvciwgRXJyb3IsIFJhbmdlRXJyb3Jcbi8vIE9iamVjdCwgQXJyYXksIEJ1ZmZlclxuXG52YXIgdW5kZWZpbmVkO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgcHVzaCA9IEFycmF5LnByb3RvdHlwZS5wdXNoO1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChsaW5lcykge1xuXHRyZXR1cm4gdG9TdHJpbmcuY2FsbChsaW5lcyk9PT0nW29iamVjdCBBcnJheV0nO1xufTtcblxuaWYgKCB0eXBlb2YgQnVmZmVyPT09J2Z1bmN0aW9uJyApIHtcblx0aXNCdWZmZXIgPSBCdWZmZXIuaXNCdWZmZXI7XG5cdHZhciBmcm9tID0gQnVmZmVyLmZyb207XG5cdHZhciB0b1N0cmluZ0ZvbGxvd0JPTSA9IGZ1bmN0aW9uIChidWZmZXIpIHtcblx0XHRzd2l0Y2ggKCBidWZmZXJbMF0gKSB7XG5cdFx0XHRjYXNlIDB4RUY6XG5cdFx0XHRcdGlmICggYnVmZmVyWzFdPT09MHhCQiAmJiBidWZmZXJbMl09PT0weEJGICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDMpLnRvU3RyaW5nKCd1dGY4Jyk7IH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDB4RkY6XG5cdFx0XHRcdGlmICggYnVmZmVyWzFdPT09MHhGRSApIHsgcmV0dXJuIGJ1ZmZlci5zbGljZSgyKS50b1N0cmluZygndWNzMicpOyB9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAweEZFOlxuXHRcdFx0XHRpZiAoIGJ1ZmZlclsxXT09PTB4RkYgKSB7XG5cdFx0XHRcdFx0YnVmZmVyID0gZnJvbShidWZmZXIpO1xuXHRcdFx0XHRcdHJldHVybiBidWZmZXIuc3dhcDE2KCkuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdFx0cmV0dXJuIGJ1ZmZlci50b1N0cmluZygpO1xuXHR9O1xufVxuZWxzZSB7XG5cdHZhciBpc0J1ZmZlciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xufVxuIiwiXG5leHBvcnQgdmFyIFBPU0lUSVZFX0lOVEVHRVIgPSAvXlsxLTldXFxkKiQvO1xuXG5leHBvcnQgdmFyIHJlcGVhdFNwYWNlID0gJycucmVwZWF0XG5cdD8gZnVuY3Rpb24gKGNvdW50KSB7IHJldHVybiAnICcucmVwZWF0KGNvdW50KTsgfVxuXHQ6IGZ1bmN0aW9uIChzcGFjZXMpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGNvdW50KSB7XG5cdFx0XHRzcGFjZXMubGVuZ3RoID0gY291bnQrMTtcblx0XHRcdHJldHVybiBzcGFjZXMuam9pbignICcpO1xuXHRcdH07XG5cdH0oW10pO1xuXG5leHBvcnQgZnVuY3Rpb24gbm90U3RyaW5nQXJyYXkgKGFycmF5KSB7XG5cdGZvciAoIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdGlmICggdHlwZW9mIGFycmF5W2luZGV4XSE9PSdzdHJpbmcnICkgeyByZXR1cm4gdHJ1ZTsgfVxuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cbiIsImltcG9ydCB7IHVuZGVmaW5lZCwgaXNBcnJheSwgaXNCdWZmZXIsIHRvU3RyaW5nRm9sbG93Qk9NIH0gZnJvbSAnLi9nbG9iYWwuanMnOy8vIFR5cGVFcnJvciwgUmFuZ2VFcnJvciwgRXJyb3JcbmltcG9ydCB7IFBPU0lUSVZFX0lOVEVHRVIsIG5vdFN0cmluZ0FycmF5IH0gZnJvbSAnLi91dGlsLmpzJztcblxudmFyIEJPTSA9IC9eXFx1RkVGRi87XG52YXIgRU9MID0gL1xcclxcbj98XFxuLztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2UgKHRhYkxpbmVzLCBfcmV2aXZlciwgX251bWJlciwgX2RlYnVnKSB7XG5cdGlmICggIWlzQXJyYXkodGFiTGluZXMpICkge1xuXHRcdGlmICggdHlwZW9mIHRhYkxpbmVzPT09J3N0cmluZycgKSB7IHRhYkxpbmVzID0gdGFiTGluZXMucmVwbGFjZShCT00sICcnKS5zcGxpdChFT0wpOyB9XG5cdFx0ZWxzZSBpZiAoIGlzQnVmZmVyKHRhYkxpbmVzKSApIHsgdGFiTGluZXMgPSB0b1N0cmluZ0ZvbGxvd0JPTSh0YWJMaW5lcykuc3BsaXQoRU9MKTsgfVxuXHR9XG5cdGlmICggX3Jldml2ZXI9PW51bGwgKSB7XG5cdFx0dmFyIGNvdW50RW1wdGllcyA9IHRydWU7XG5cdFx0dmFyIGdyb3VwUmV2aXZlciA9IG51bGw7XG5cdFx0dmFyIGxldmVsUmV2aXZlciA9IG51bGw7XG5cdH1cblx0ZWxzZSB7XG5cdFx0Y291bnRFbXB0aWVzID0gX3Jldml2ZXIuZW1wdHk7XG5cdFx0Z3JvdXBSZXZpdmVyID0gX3Jldml2ZXIuZ3JvdXA7XG5cdFx0bGV2ZWxSZXZpdmVyID0gX3Jldml2ZXIubGV2ZWw7XG5cdFx0aWYgKCBjb3VudEVtcHRpZXM9PT11bmRlZmluZWQgKSB7IGNvdW50RW1wdGllcyA9IHRydWU7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PXVuZGVmaW5lZCApIHsgZ3JvdXBSZXZpdmVyID0gbnVsbDsgfVxuXHRcdGlmICggbGV2ZWxSZXZpdmVyPT09dW5kZWZpbmVkICkgeyBsZXZlbFJldml2ZXIgPSBudWxsOyB9XG5cdH1cblx0aWYgKCBfbnVtYmVyPT09dW5kZWZpbmVkICkgeyBfbnVtYmVyID0gMTsgfVxuXHRpZiAoIF9kZWJ1ZyE9PWZhbHNlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aD40ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXMsIHJldml2ZXIsIG51bWJlciwgZGVidWcsIC4uLiknKTsgfVxuXHRcdGlmICggX2RlYnVnPT09dW5kZWZpbmVkICkgeyBfZGVidWcgPSB0cnVlOyB9XG5cdFx0ZWxzZSBpZiAoIF9kZWJ1ZyE9PXRydWUgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsLGRlYnVnKScpOyB9XG5cdFx0aWYgKCAhaXNBcnJheSh0YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXMpJyk7IH1cblx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KHRhYkxpbmVzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSh0YWJMaW5lc1sqXSknKTsgfVxuXHRcdGlmICggdHlwZW9mIGNvdW50RW1wdGllcyE9PSdib29sZWFuJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5lbXB0eSknKTsgfVxuXHRcdGlmICggZ3JvdXBSZXZpdmVyIT09bnVsbCAmJiB0eXBlb2YgZ3JvdXBSZXZpdmVyIT09J2Jvb2xlYW4nICkge1xuXHRcdFx0aWYgKCAhaXNBcnJheShncm91cFJldml2ZXIpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwKScpOyB9XG5cdFx0XHRmb3IgKCB2YXIgbGVuZ3RoID0gZ3JvdXBSZXZpdmVyLmxlbmd0aCwgaW5kZXggPSAwOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0XHRcdHZhciBlYWNoID0gZ3JvdXBSZXZpdmVyW2luZGV4XTtcblx0XHRcdFx0aWYgKCAhaXNBcnJheShlYWNoKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXSknKTsgfVxuXHRcdFx0XHRpZiAoICFlYWNoWzBdIHx8IHR5cGVvZiBlYWNoWzBdLmV4ZWMhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdKScpOyB9XG5cdFx0XHRcdGlmICggdHlwZW9mIGVhY2hbMV0hPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzFdKScpOyB9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICggbGV2ZWxSZXZpdmVyIT09bnVsbCAmJiB0eXBlb2YgbGV2ZWxSZXZpdmVyIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5sZXZlbCknKTsgfVxuXHRcdGlmICggdHlwZW9mIF9udW1iZXIhPT0nbnVtYmVyJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgsLG51bWJlciknKTsgfVxuXHRcdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChfbnVtYmVyKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLCxudW1iZXIpJyk7IH1cblx0fVxuXHRyZXR1cm4gdGFiTGluZXMubGVuZ3RoPT09MCA/XG5cdFx0bGV2ZWxSZXZpdmVyPT09bnVsbCA/IFtdIDogY2FsbChsZXZlbFJldml2ZXIsIHRoaXMsIFtdKSA6XG5cdFx0TGV2ZWwodGhpcywgdGFiTGluZXMsIGdyb3VwUmV2aXZlciA/IGFwcGVuZEdyb3VwIDogYXBwZW5kRmxhdCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgX251bWJlciwgX2RlYnVnKTtcbn07XG5cbmZ1bmN0aW9uIExldmVsIChjb250ZXh0LCB0YWJMaW5lcywgYXBwZW5kLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKSB7XG5cdHZhciBsZXZlbCAgICAgPSBbXSxcblx0XHRsYXN0SW5kZXggPSB0YWJMaW5lcy5sZW5ndGgtMSxcblx0XHRpbmRleCAgICAgPSAwLFxuXHRcdGJsYW5rICAgICA9IHRhYkxpbmVzWzBdLmxlbmd0aD09PTA7XG5cdG91dGVyOiBmb3IgKCA7IDsgKSB7XG5cdFx0dmFyIGZyb20gPSBpbmRleDtcblx0XHRpZiAoIGJsYW5rICkge1xuXHRcdFx0aWYgKCBjb3VudEVtcHRpZXMgKSB7XG5cdFx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkge1xuXHRcdFx0XHRcdFx0bGV2ZWwucHVzaChpbmRleCsxLWZyb20pO1xuXHRcdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoIT09MCApIHtcblx0XHRcdFx0XHRcdGxldmVsLnB1c2goaW5kZXgtZnJvbSk7XG5cdFx0XHRcdFx0XHRibGFuayA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdFx0aWYgKCB0YWJMaW5lc1srK2luZGV4XS5sZW5ndGghPT0wICkge1xuXHRcdFx0XHRcdFx0YmxhbmsgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRhcHBlbmQoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmcm9tLCBpbmRleCwgbnVtYmVyLCBkZWJ1Zyk7XG5cdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0YWJMaW5lc1srK2luZGV4XS5sZW5ndGg9PT0wICkge1xuXHRcdFx0XHRcdGFwcGVuZChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZyb20sIGluZGV4LTEsIG51bWJlciwgZGVidWcpO1xuXHRcdFx0XHRcdGJsYW5rID0gdHJ1ZTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRsZXZlbC5udW1iZXIgPSBudW1iZXI7XG5cdHJldHVybiBsZXZlbFJldml2ZXI9PT1udWxsID8gbGV2ZWwgOiBjYWxsKGxldmVsUmV2aXZlciwgY29udGV4dCwgbGV2ZWwpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRGbGF0IChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZpcnN0SW5kZXgsIGxhc3RJbmRleCwgYmFzZU51bWJlciwgZGVidWcpIHtcblx0dmFyIGtleSxcblx0XHR2YWx1ZSxcblx0XHRudW1iZXI7XG5cdG91dGVyOiBmb3IgKCB2YXIgbGluZUluZGV4ID0gZmlyc3RJbmRleCwgbGluZSA9IHRhYkxpbmVzW2xpbmVJbmRleF0sIHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTsgOyApIHtcblx0XHR2YWx1ZSA9IFtdO1xuXHRcdG51bWJlciA9IGJhc2VOdW1iZXIrbGluZUluZGV4O1xuXHRcdGlmICggdGFiSW5kZXg9PT0gLTEgKSB7XG5cdFx0XHRrZXkgPSAnJztcblx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRsaW5lID0gdGFiTGluZXNbKytsaW5lSW5kZXhdO1xuXHRcdFx0XHR0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7XG5cdFx0XHRcdGlmICggdGFiSW5kZXghPT0gLTEgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCB0YWJJbmRleD09PTAgKSB7XG5cdFx0XHRcdGtleSA9ICdcXHQnO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGtleSA9IGxpbmUuc2xpY2UoMCwgdGFiSW5kZXgrMSk7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSh0YWJJbmRleCsxKSk7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkge1xuXHRcdFx0XHRcdGlmICggZ3JvdXBSZXZpdmVyPT09bnVsbCApIHsgdmFsdWUgPSBMZXZlbChjb250ZXh0LCB2YWx1ZSwgYXBwZW5kRmxhdCwgY291bnRFbXB0aWVzLCBudWxsLCBsZXZlbFJldml2ZXIsIG51bWJlciwgZGVidWcpOyB9XG5cdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09MCApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHRcdGlmICggZ3JvdXBSZXZpdmVyPT09bnVsbCApIHsgdmFsdWUgPSBMZXZlbChjb250ZXh0LCB2YWx1ZSwgYXBwZW5kRmxhdCwgY291bnRFbXB0aWVzLCBudWxsLCBsZXZlbFJldml2ZXIsIG51bWJlciwgZGVidWcpOyB9XG5cdFx0fVxuXHRcdGxldmVsLnB1c2goe1xuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0XHRudW1iZXI6IG51bWJlclxuXHRcdH0pO1xuXHR9XG5cdGxldmVsLnB1c2goe1xuXHRcdGtleToga2V5LFxuXHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRudW1iZXI6IG51bWJlclxuXHR9KTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kR3JvdXAgKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZmlyc3RJbmRleCwgbGFzdEluZGV4LCBiYXNlTnVtYmVyLCBkZWJ1Zykge1xuXHR2YXIgcGVuZGluZ0dyb3VwID0gW10sXG5cdFx0cGVuZGluZ0tleXMgID0gJycsXG5cdFx0a2V5LFxuXHRcdHZhbHVlLFxuXHRcdG51bWJlcjtcblx0b3V0ZXI6IGZvciAoIHZhciBsaW5lSW5kZXggPSBmaXJzdEluZGV4LCBsaW5lID0gdGFiTGluZXNbbGluZUluZGV4XSwgdGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpOyA7ICkge1xuXHRcdHZhbHVlID0gW107XG5cdFx0bnVtYmVyID0gYmFzZU51bWJlcitsaW5lSW5kZXg7XG5cdFx0aWYgKCB0YWJJbmRleD09PSAtMSApIHtcblx0XHRcdGtleSA9ICcnO1xuXHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdHBlbmRpbmdLZXlzICs9ICdcXG4nO1xuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09IC0xICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggdGFiSW5kZXg9PT0wICkge1xuXHRcdFx0XHRrZXkgPSAnXFx0Jztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdFx0cGVuZGluZ0tleXMgKz0gJ1xcdFxcbic7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0a2V5ID0gbGluZS5zbGljZSgwLCB0YWJJbmRleCsxKTtcblx0XHRcdFx0cGVuZGluZ0tleXMgKz0ga2V5KydcXG4nO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UodGFiSW5kZXgrMSkpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09MCApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cGVuZGluZ0dyb3VwLnB1c2goe1xuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0XHRudW1iZXI6IG51bWJlclxuXHRcdH0pO1xuXHR9XG5cdHBlbmRpbmdHcm91cC5wdXNoKHtcblx0XHRrZXk6IGtleSxcblx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0bnVtYmVyOiBudW1iZXJcblx0fSk7XG5cdGlmICggZ3JvdXBSZXZpdmVyPT09dHJ1ZSApIHtcblx0XHRsZXZlbC5wdXNoKHBlbmRpbmdHcm91cC5sZW5ndGg9PT0xID8gcGVuZGluZ0dyb3VwWzBdIDogcGVuZGluZ0dyb3VwKTtcblx0XHRyZXR1cm47XG5cdH1cblx0Zm9yICggdmFyIHJldml2ZXJMZW5ndGggPSBncm91cFJldml2ZXIubGVuZ3RoLCByZXZpdmVySW5kZXggPSAwOyByZXZpdmVySW5kZXg8cmV2aXZlckxlbmd0aDsgKytyZXZpdmVySW5kZXggKSB7XG5cdFx0dmFyIHJlZ0V4cF9mdW5jdGlvbiA9IGdyb3VwUmV2aXZlcltyZXZpdmVySW5kZXhdO1xuXHRcdHZhciBtYXRjaGVkID0gcmVnRXhwX2Z1bmN0aW9uWzBdLmV4ZWMocGVuZGluZ0tleXMpO1xuXHRcdGlmICggbWF0Y2hlZD09PW51bGwgKSB7IGNvbnRpbnVlOyB9XG5cdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdGlmICggbWF0Y2hlZD09PXVuZGVmaW5lZCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKSknKTsgfVxuXHRcdFx0aWYgKCBtYXRjaGVkLmluZGV4ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpLmluZGV4KScpOyB9XG5cdFx0XHRpZiAoIHR5cGVvZiBtYXRjaGVkWzBdIT09J3N0cmluZycgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpWzBdKScpOyB9XG5cdFx0XHRpZiAoIG1hdGNoZWRbMF0ubGVuZ3RoPT09MCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXS5sZW5ndGgpJyk7IH1cblx0XHRcdGlmICggbWF0Y2hlZFswXS5jaGFyQXQobWF0Y2hlZFswXS5sZW5ndGgtMSkhPT0nXFxuJyApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXSknKTsgfVxuXHRcdH1cblx0XHR2YXIgdGhpc0tleXMgPSBtYXRjaGVkWzBdO1xuXHRcdHZhciBrZXlMZW5ndGggPSB0aGlzS2V5cy5sZW5ndGg7XG5cdFx0aWYgKCBwZW5kaW5nS2V5cy5sZW5ndGg9PT1rZXlMZW5ndGggKSB7XG5cdFx0XHRsZXZlbC5wdXNoKGNhbGwocmVnRXhwX2Z1bmN0aW9uWzFdLCBjb250ZXh0LCBwZW5kaW5nR3JvdXAubGVuZ3RoPT09MSA/IHBlbmRpbmdHcm91cFswXSA6IHBlbmRpbmdHcm91cCkpO1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR2YXIgY291bnQgPSAxO1xuXHRcdGZvciAoIHZhciBpbmRleE9mTEYgPSB0aGlzS2V5cy5pbmRleE9mKCdcXG4nKTsgOyArK2NvdW50ICkge1xuXHRcdFx0aW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJywgaW5kZXhPZkxGKzEpO1xuXHRcdFx0aWYgKCBpbmRleE9mTEY8MCApIHsgYnJlYWs7IH1cblx0XHR9XG5cdFx0bGV2ZWwucHVzaChjYWxsKHJlZ0V4cF9mdW5jdGlvblsxXSwgY29udGV4dCwgY291bnQ9PT0xID8gcGVuZGluZ0dyb3VwLnNoaWZ0KCkgOiBwZW5kaW5nR3JvdXAuc3BsaWNlKDAsIGNvdW50KSkpO1xuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRpZiAoIGxldmVsW2xldmVsLmxlbmd0aC0xXT09PXVuZGVmaW5lZCApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVsxXSgpKScpOyB9XG5cdFx0fVxuXHRcdHJldml2ZXJJbmRleCA9IDA7XG5cdFx0cGVuZGluZ0tleXMgPSBwZW5kaW5nS2V5cy5zbGljZShrZXlMZW5ndGgpO1xuXHR9XG5cdHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFshXSknKTtcbn1cblxuZnVuY3Rpb24gY2FsbCAocmV2aXZlciwgY29udGV4dCwgYXJndW1lbnQpIHtcblx0cmV0dXJuIHJldml2ZXIucHJvdG90eXBlPT1udWxsXG5cdFx0PyByZXZpdmVyKGFyZ3VtZW50LCBjb250ZXh0KVxuXHRcdDogbmV3IHJldml2ZXIoYXJndW1lbnQsIGNvbnRleHQpO1xufVxuIiwiaW1wb3J0IHsgdW5kZWZpbmVkLCBpc0FycmF5LCBwdXNoIH0gZnJvbSAnLi9nbG9iYWwuanMnOy8vIFR5cGVFcnJvciwgRXJyb3JcbmltcG9ydCB7IG5vdFN0cmluZ0FycmF5IH0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc3RyaW5naWZ5IChsZXZlbCwgX3JlcGxhY2VyLCBfc3BhY2UsIF9kZWJ1Zykge1xuXHRpZiAoIF9kZWJ1ZyE9PWZhbHNlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aD40ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KGxldmVsLCByZXBsYWNlciwgc3BhY2UsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggX3JlcGxhY2VyIT1udWxsICYmIHR5cGVvZiBfcmVwbGFjZXIhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgscmVwbGFjZXIpJyk7IH1cblx0XHRpZiAoIF9zcGFjZSE9bnVsbCAmJiB0eXBlb2YgX3NwYWNlIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSknKTsgfVxuXHR9XG5cdGlmICggX3JlcGxhY2VyPT09dW5kZWZpbmVkICkgeyBfcmVwbGFjZXIgPSBudWxsOyB9XG5cdGlmICggX3NwYWNlPT09dW5kZWZpbmVkICkgeyBfc3BhY2UgPSBudWxsOyB9XG5cdHJldHVybiBMaW5lcyh0aGlzLCBsZXZlbCwgX3JlcGxhY2VyLCBfc3BhY2UsIF9kZWJ1Zyk7XG59O1xuXG5mdW5jdGlvbiBMaW5lcyAoY29udGV4dCwgbGV2ZWwsIHJlcGxhY2VyLCBzcGFjZSwgZGVidWcpIHtcblx0aWYgKCByZXBsYWNlciE9PW51bGwgKSB7IGxldmVsID0gcmVwbGFjZXIobGV2ZWwsIGNvbnRleHQpOyB9XG5cdGlmICggZGVidWcgKSB7XG5cdFx0aWYgKCAhaXNBcnJheShsZXZlbCkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KGxldmVsKScpOyB9XG5cdH1cblx0dmFyIGxpbmVzID0gW107XG5cdGZvciAoIHZhciBsZXZlbExlbmd0aCA9IGxldmVsLmxlbmd0aCwgbGV2ZWxJbmRleCA9IDA7IGxldmVsSW5kZXg8bGV2ZWxMZW5ndGg7ICsrbGV2ZWxJbmRleCApIHtcblx0XHR2YXIgZWFjaCA9IGxldmVsW2xldmVsSW5kZXhdO1xuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0fVxuXHRcdGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHsgd2hpbGUgKCBlYWNoLS0gKSB7IGxpbmVzLnB1c2goJycpOyB9IH1cblx0XHRlbHNlIGlmICggZWFjaC5rZXk9PT0nJyApIHsgcHVzaC5hcHBseShsaW5lcywgZWFjaC52YWx1ZSk7IH1cblx0XHRlbHNlIGlmICggc3BhY2U9PT1udWxsICkge1xuXHRcdFx0cHVzaGVzKGxpbmVzLCBlYWNoLmtleSwgJ1xcdCcsIHJlcGxhY2VyPT09bnVsbFxuXHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIGVhY2gudmFsdWUsIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0OiBlYWNoLnZhbHVlXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHZhciBrZXlzID0gW2VhY2gua2V5XTtcblx0XHRcdHZhciB2YWx1ZXMgPSBbZWFjaC52YWx1ZV07XG5cdFx0XHR3aGlsZSAoICsrbGV2ZWxJbmRleDxsZXZlbExlbmd0aCApIHtcblx0XHRcdFx0ZWFjaCA9IGxldmVsW2xldmVsSW5kZXhdO1xuXHRcdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRcdGNoZWNrKGVhY2gsIHJlcGxhY2VyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBlYWNoPT09J251bWJlcicgKSB7XG5cdFx0XHRcdFx0LS1sZXZlbEluZGV4O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGtleXMucHVzaChlYWNoLmtleSk7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKGVhY2gudmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGtleXNfaW5kZW50ID0gc3BhY2Uoa2V5cywgY29udGV4dCk7XG5cdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBrZXlzX2luZGVudCE9PSdvYmplY3QnIHx8IGtleXNfaW5kZW50PT09bnVsbCApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpKScpOyB9XG5cdFx0XHRcdGlmICggISggJ2tleXMnIGluIGtleXNfaW5kZW50ICkgfHwgISggJ2luZGVudCcgaW4ga2V5c19pbmRlbnQgKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkpJyk7IH1cblx0XHRcdFx0aWYgKCAhaXNBcnJheShrZXlzX2luZGVudC5rZXlzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmtleXMpJyk7IH1cblx0XHRcdFx0aWYgKCBrZXlzX2luZGVudC5rZXlzLmxlbmd0aCE9PXZhbHVlcy5sZW5ndGggKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmtleXMubGVuZ3RoKScpOyB9XG5cdFx0XHRcdGlmICggbm90U3RyaW5nQXJyYXkoa2V5c19pbmRlbnQua2V5cykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzWypdKScpOyB9XG5cdFx0XHRcdGlmICggdHlwZW9mIGtleXNfaW5kZW50LmluZGVudCE9PSdzdHJpbmcnICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkuaW5kZW50KScpOyB9XG5cdFx0XHR9XG5cdFx0XHRrZXlzID0ga2V5c19pbmRlbnQua2V5cztcblx0XHRcdHZhciBpbmRlbnQgPSBrZXlzX2luZGVudC5pbmRlbnQ7XG5cdFx0XHRmb3IgKCB2YXIgbGVuZ3RoID0gdmFsdWVzLmxlbmd0aCwgaW5kZXggPSAwOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0XHRcdGlmICgga2V5c1tpbmRleF09PT0nJyApIHsgcHVzaC5hcHBseShsaW5lcywgdmFsdWVzW2luZGV4XSk7IH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0cHVzaGVzKGxpbmVzLCBrZXlzW2luZGV4XSwgaW5kZW50LCByZXBsYWNlcj09PW51bGxcblx0XHRcdFx0XHRcdD8gTGluZXMoY29udGV4dCwgdmFsdWVzW2luZGV4XSwgbnVsbCwgc3BhY2UsIGRlYnVnKVxuXHRcdFx0XHRcdFx0OiB2YWx1ZXNbaW5kZXhdXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gbGluZXM7XG59XG5cbmZ1bmN0aW9uIHB1c2hlcyAobGluZXMsIGtleSwgaW5kZW50LCBzdWJMaW5lcykge1xuXHR2YXIgbGVuZ3RoID0gc3ViTGluZXMubGVuZ3RoO1xuXHRpZiAoIGxlbmd0aD09PTAgKSB7IGxpbmVzLnB1c2goa2V5KTsgfVxuXHRlbHNlIHtcblx0XHRsaW5lcy5wdXNoKGtleStzdWJMaW5lc1swXSk7XG5cdFx0Zm9yICggdmFyIGluZGV4ID0gMTsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0bGluZXMucHVzaChpbmRlbnQrc3ViTGluZXNbaW5kZXhdKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gY2hlY2sgKGVhY2gsIHJlcGxhY2VyKSB7XG5cdGlmICggdHlwZW9mIGVhY2g9PT0nb2JqZWN0JyAmJiBlYWNoIT09bnVsbCApIHtcblx0XHRpZiAoICEoICdrZXknIGluIGVhY2ggKSB8fCAhKCAndmFsdWUnIGluIGVhY2ggKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0KScpOyB9XG5cdFx0aWYgKCB0eXBlb2YgZWFjaC5rZXkhPT0nc3RyaW5nJyB8fCAhL14oPzpbXlxcdFxcblxccl0qXFx0KT8kLy50ZXN0KGVhY2gua2V5KSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LmtleSknKTsgfVxuXHRcdGlmICggcmVwbGFjZXIhPT1udWxsIHx8IGVhY2gua2V5PT09JycgKSB7XG5cdFx0XHRpZiAoICFpc0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlKScpOyB9XG5cdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlWypdKScpOyB9XG5cdFx0fVxuXHR9XG5cdGVsc2UgaWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdGlmICggIS9eXFxkKyQvLnRlc3QoZWFjaCkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm51bWJlciknKTsgfVxuXHR9XG5cdGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl0pJyk7IH1cbn1cbiIsIi8vIFR5cGVFcnJvciwgUmFuZ2VFcnJvclxuaW1wb3J0IHsgUE9TSVRJVkVfSU5URUdFUiwgcmVwZWF0U3BhY2UgfSBmcm9tICcuL3V0aWwuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTcGFjZSAobWluV2lkdGgsIHBhZGRpbmcpIHtcblx0aWYgKCB0eXBlb2YgbWluV2lkdGghPT0nbnVtYmVyJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5TcGFjZShtaW5XaWR0aCknKTsgfVxuXHRpZiAoIHR5cGVvZiBwYWRkaW5nIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MuU3BhY2UoLHBhZGRpbmcpJyk7IH1cblx0dmFyIG11bHRpcGxlID0gbWluV2lkdGg8MDtcblx0aWYgKCBtdWx0aXBsZSApIHsgbWluV2lkdGggPSB+bWluV2lkdGg7IH1cblx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KG1pbldpZHRoKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MuU3BhY2UobWluV2lkdGgpJyk7IH1cblx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KHBhZGRpbmcpICkgeyB0aHJvdyBuZXcgUmFuZ2VFcnJvcignalRhYkRvYy5TcGFjZSgscGFkZGluZyknKTsgfVxuXHRyZXR1cm4gZnVuY3Rpb24gc3BhY2UgKGtleXMpIHtcblx0XHRyZXR1cm4ga2V5c19pbmRlbnQobXVsdGlwbGUsIG1pbldpZHRoLCBwYWRkaW5nLCBrZXlzKTtcblx0fTtcbn07XG5cbmZ1bmN0aW9uIGtleXNfaW5kZW50IChtdWx0aXBsZSwgbWluV2lkdGgsIHBhZGRpbmcsIGtleXMpIHtcblx0dmFyIG1heFdpZHRoID0gMTtcblx0dmFyIHdpZHRocyA9IFtdO1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdHZhciB3aWR0aCA9IDA7XG5cdFx0dmFyIGtleSA9IGtleXNbaW5kZXhdO1xuXHRcdGlmICgga2V5IT09JycgKSB7XG5cdFx0XHRmb3IgKCB2YXIgbCA9IGtleS5sZW5ndGgtMSwgaSA9IDA7IGk8bDsgKytpICkge1xuXHRcdFx0XHR2YXIgY2hhckNvZGUgPSBrZXkuY2hhckNvZGVBdChpKTtcblx0XHRcdFx0aWYgKCBjaGFyQ29kZTwweDgwICkgeyB3aWR0aCArPSAxOyB9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHdpZHRoICs9IDI7XG5cdFx0XHRcdFx0aWYgKCBjaGFyQ29kZT49MHhEODAwICYmIGNoYXJDb2RlPD0weERCRkYgJiYgaSsxPGwgKSB7XG5cdFx0XHRcdFx0XHRjaGFyQ29kZSA9IGtleS5jaGFyQ29kZUF0KGkrMSk7XG5cdFx0XHRcdFx0XHRjaGFyQ29kZT49MHhEQzAwICYmIGNoYXJDb2RlPD0weERGRkYgJiYgKytpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCB3aWR0aD5tYXhXaWR0aCApIHsgbWF4V2lkdGggPSB3aWR0aDsgfVxuXHRcdH1cblx0XHR3aWR0aHMucHVzaCh3aWR0aCk7XG5cdH1cblx0d2lkdGggPSBtYXhXaWR0aCtwYWRkaW5nO1xuXHRpZiAoIG11bHRpcGxlICkge1xuXHRcdGlmICggd2lkdGglbWluV2lkdGggKSB7IHdpZHRoICs9IG1pbldpZHRoLXdpZHRoJW1pbldpZHRoOyB9XG5cdH1cblx0ZWxzZSB7XG5cdFx0aWYgKCB3aWR0aDxtaW5XaWR0aCApIHsgd2lkdGggPSBtaW5XaWR0aDsgfVxuXHR9XG5cdGZvciAoIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdGtleSA9IGtleXNbaW5kZXhdO1xuXHRcdGlmICgga2V5IT09JycgKSB7XG5cdFx0XHRrZXlzW2luZGV4XSA9IGtleS5zbGljZSgwLCAtMSkrcmVwZWF0U3BhY2Uod2lkdGgtd2lkdGhzW2luZGV4XSk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB7IGtleXM6IGtleXMsIGluZGVudDogcmVwZWF0U3BhY2Uod2lkdGgpIH07XG59XG4iLCJpbXBvcnQgdmVyc2lvbiBmcm9tICcuLi92ZXJzaW9uP3RleHQnO1xuaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UuanMnO1xuaW1wb3J0IHN0cmluZ2lmeSBmcm9tICcuL3N0cmluZ2lmeS5qcyc7XG5pbXBvcnQgU3BhY2UgZnJvbSAnLi9TcGFjZS5qcyc7XG52YXIgalRhYkRvYyA9IHtcblx0cGFyc2U6IHBhcnNlLFxuXHRzdHJpbmdpZnk6IHN0cmluZ2lmeSxcblx0U3BhY2U6IFNwYWNlLFxuXHR2ZXJzaW9uOiB2ZXJzaW9uXG59O1xualRhYkRvY1snZGVmYXVsdCddID0galRhYkRvYztcbmV4cG9ydCB7XG5cdHBhcnNlLFxuXHRzdHJpbmdpZnksXG5cdFNwYWNlLFxuXHR2ZXJzaW9uXG59O1xuZXhwb3J0IGRlZmF1bHQgalRhYkRvYzsiXSwibmFtZXMiOlsidW5kZWZpbmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLGNBQWUsT0FBTzs7c0JBQUMsdEJDQ3ZCOztBQUVBLElBQUlBLFdBQVMsQ0FBQztBQUNkLEFBQ0EsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDekMsSUFBSSxJQUFJLEdB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