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

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.jTabDoc = factory());
}(this, (function () { 'use strict';

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

	return jTabDoc;

})));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy92ZXJzaW9uP3RleHQiLCJzcmMvZ2xvYmFsLmpzIiwic3JjL3V0aWwuanMiLCJzcmMvcGFyc2UuanMiLCJzcmMvc3RyaW5naWZ5LmpzIiwic3JjL1NwYWNlLmpzIiwic3JjL2V4cG9ydC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCAnMS4wLjAnOyIsImV4cG9ydCB7IHVuZGVmaW5lZCwgaGFzT3duUHJvcGVydHksIHRvU3RyaW5nLCBwdXNoLCBpc0FycmF5LCBpc0J1ZmZlciwgdG9TdHJpbmdGb2xsb3dCT00gfTsvLyBUeXBlRXJyb3IsIEVycm9yLCBSYW5nZUVycm9yXG4vLyBPYmplY3QsIEFycmF5LCBCdWZmZXJcblxudmFyIHVuZGVmaW5lZDtcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIHB1c2ggPSBBcnJheS5wcm90b3R5cGUucHVzaDtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAobGluZXMpIHtcblx0cmV0dXJuIHRvU3RyaW5nLmNhbGwobGluZXMpPT09J1tvYmplY3QgQXJyYXldJztcbn07XG5cbmlmICggdHlwZW9mIEJ1ZmZlcj09PSdmdW5jdGlvbicgKSB7XG5cdGlzQnVmZmVyID0gQnVmZmVyLmlzQnVmZmVyO1xuXHR2YXIgZnJvbSA9IEJ1ZmZlci5mcm9tO1xuXHR2YXIgdG9TdHJpbmdGb2xsb3dCT00gPSBmdW5jdGlvbiAoYnVmZmVyKSB7XG5cdFx0c3dpdGNoICggYnVmZmVyWzBdICkge1xuXHRcdFx0Y2FzZSAweEVGOlxuXHRcdFx0XHRpZiAoIGJ1ZmZlclsxXT09PTB4QkIgJiYgYnVmZmVyWzJdPT09MHhCRiApIHsgcmV0dXJuIGJ1ZmZlci5zbGljZSgzKS50b1N0cmluZygndXRmOCcpOyB9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAweEZGOlxuXHRcdFx0XHRpZiAoIGJ1ZmZlclsxXT09PTB4RkUgKSB7IHJldHVybiBidWZmZXIuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTsgfVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgMHhGRTpcblx0XHRcdFx0aWYgKCBidWZmZXJbMV09PT0weEZGICkge1xuXHRcdFx0XHRcdGJ1ZmZlciA9IGZyb20oYnVmZmVyKTtcblx0XHRcdFx0XHRyZXR1cm4gYnVmZmVyLnN3YXAxNigpLnNsaWNlKDIpLnRvU3RyaW5nKCd1Y3MyJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoKTtcblx0fTtcbn1cbmVsc2Uge1xuXHR2YXIgaXNCdWZmZXIgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcbn1cbiIsIlxuZXhwb3J0IHZhciBQT1NJVElWRV9JTlRFR0VSID0gL15bMS05XVxcZCokLztcblxuZXhwb3J0IHZhciByZXBlYXRTcGFjZSA9ICcnLnJlcGVhdFxuXHQ/IGZ1bmN0aW9uIChjb3VudCkgeyByZXR1cm4gJyAnLnJlcGVhdChjb3VudCk7IH1cblx0OiBmdW5jdGlvbiAoc3BhY2VzKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChjb3VudCkge1xuXHRcdFx0c3BhY2VzLmxlbmd0aCA9IGNvdW50KzE7XG5cdFx0XHRyZXR1cm4gc3BhY2VzLmpvaW4oJyAnKTtcblx0XHR9O1xuXHR9KFtdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vdFN0cmluZ0FycmF5IChhcnJheSkge1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRpZiAoIHR5cGVvZiBhcnJheVtpbmRleF0hPT0nc3RyaW5nJyApIHsgcmV0dXJuIHRydWU7IH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyB1bmRlZmluZWQsIGlzQXJyYXksIGlzQnVmZmVyLCB0b1N0cmluZ0ZvbGxvd0JPTSB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBQT1NJVElWRV9JTlRFR0VSLCBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbnZhciBCT00gPSAvXlxcdUZFRkYvO1xudmFyIEVPTCA9IC9cXHJcXG4/fFxcbi87XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlICh0YWJMaW5lcywgX3Jldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zykge1xuXHRpZiAoICFpc0FycmF5KHRhYkxpbmVzKSApIHtcblx0XHRpZiAoIHR5cGVvZiB0YWJMaW5lcz09PSdzdHJpbmcnICkgeyB0YWJMaW5lcyA9IHRhYkxpbmVzLnJlcGxhY2UoQk9NLCAnJykuc3BsaXQoRU9MKTsgfVxuXHRcdGVsc2UgaWYgKCBpc0J1ZmZlcih0YWJMaW5lcykgKSB7IHRhYkxpbmVzID0gdG9TdHJpbmdGb2xsb3dCT00odGFiTGluZXMpLnNwbGl0KEVPTCk7IH1cblx0fVxuXHRpZiAoIF9yZXZpdmVyPT1udWxsICkge1xuXHRcdHZhciBjb3VudEVtcHRpZXMgPSB0cnVlO1xuXHRcdHZhciBncm91cFJldml2ZXIgPSBudWxsO1xuXHRcdHZhciBsZXZlbFJldml2ZXIgPSBudWxsO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGNvdW50RW1wdGllcyA9IF9yZXZpdmVyLmVtcHR5O1xuXHRcdGdyb3VwUmV2aXZlciA9IF9yZXZpdmVyLmdyb3VwO1xuXHRcdGxldmVsUmV2aXZlciA9IF9yZXZpdmVyLmxldmVsO1xuXHRcdGlmICggY291bnRFbXB0aWVzPT09dW5kZWZpbmVkICkgeyBjb3VudEVtcHRpZXMgPSB0cnVlOyB9XG5cdFx0aWYgKCBncm91cFJldml2ZXI9PT11bmRlZmluZWQgKSB7IGdyb3VwUmV2aXZlciA9IG51bGw7IH1cblx0XHRpZiAoIGxldmVsUmV2aXZlcj09PXVuZGVmaW5lZCApIHsgbGV2ZWxSZXZpdmVyID0gbnVsbDsgfVxuXHR9XG5cdGlmICggX251bWJlcj09PXVuZGVmaW5lZCApIHsgX251bWJlciA9IDE7IH1cblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzLCByZXZpdmVyLCBudW1iZXIsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggIWlzQXJyYXkodGFiTGluZXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzKScpOyB9XG5cdFx0aWYgKCBub3RTdHJpbmdBcnJheSh0YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXNbKl0pJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBjb3VudEVtcHRpZXMhPT0nYm9vbGVhbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZW1wdHkpJyk7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGdyb3VwUmV2aXZlciE9PSdib29sZWFuJyApIHtcblx0XHRcdGlmICggIWlzQXJyYXkoZ3JvdXBSZXZpdmVyKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cCknKTsgfVxuXHRcdFx0Zm9yICggdmFyIGxlbmd0aCA9IGdyb3VwUmV2aXZlci5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHR2YXIgZWFjaCA9IGdyb3VwUmV2aXZlcltpbmRleF07XG5cdFx0XHRcdGlmICggIWlzQXJyYXkoZWFjaCkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl0pJyk7IH1cblx0XHRcdFx0aWYgKCAhZWFjaFswXSB8fCB0eXBlb2YgZWFjaFswXS5leGVjIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBlYWNoWzFdIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVsxXSknKTsgfVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIGxldmVsUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGxldmVsUmV2aXZlciE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIubGV2ZWwpJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBfbnVtYmVyIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLCxudW1iZXIpJyk7IH1cblx0XHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QoX251bWJlcikgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLnBhcnNlKCwsbnVtYmVyKScpOyB9XG5cdH1cblx0cmV0dXJuIHRhYkxpbmVzLmxlbmd0aD09PTAgP1xuXHRcdGxldmVsUmV2aXZlcj09PW51bGwgPyBbXSA6IGNhbGwobGV2ZWxSZXZpdmVyLCB0aGlzLCBbXSkgOlxuXHRcdExldmVsKHRoaXMsIHRhYkxpbmVzLCBncm91cFJldml2ZXIgPyBhcHBlbmRHcm91cCA6IGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zyk7XG59O1xuXG5mdW5jdGlvbiBMZXZlbCAoY29udGV4dCwgdGFiTGluZXMsIGFwcGVuZCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgbnVtYmVyLCBkZWJ1Zykge1xuXHR2YXIgbGV2ZWwgICAgID0gW10sXG5cdFx0bGFzdEluZGV4ID0gdGFiTGluZXMubGVuZ3RoLTEsXG5cdFx0aW5kZXggICAgID0gMCxcblx0XHRibGFuayAgICAgPSB0YWJMaW5lc1swXS5sZW5ndGg9PT0wO1xuXHRvdXRlcjogZm9yICggOyA7ICkge1xuXHRcdHZhciBmcm9tID0gaW5kZXg7XG5cdFx0aWYgKCBibGFuayApIHtcblx0XHRcdGlmICggY291bnRFbXB0aWVzICkge1xuXHRcdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRcdGxldmVsLnB1c2goaW5kZXgrMS1mcm9tKTtcblx0XHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIHRhYkxpbmVzWysraW5kZXhdLmxlbmd0aCE9PTAgKSB7XG5cdFx0XHRcdFx0XHRsZXZlbC5wdXNoKGluZGV4LWZyb20pO1xuXHRcdFx0XHRcdFx0YmxhbmsgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoIT09MCApIHtcblx0XHRcdFx0XHRcdGJsYW5rID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7XG5cdFx0XHRcdFx0YXBwZW5kKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZnJvbSwgaW5kZXgsIG51bWJlciwgZGVidWcpO1xuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoPT09MCApIHtcblx0XHRcdFx0XHRhcHBlbmQoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmcm9tLCBpbmRleC0xLCBudW1iZXIsIGRlYnVnKTtcblx0XHRcdFx0XHRibGFuayA9IHRydWU7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0bGV2ZWwubnVtYmVyID0gbnVtYmVyO1xuXHRyZXR1cm4gbGV2ZWxSZXZpdmVyPT09bnVsbCA/IGxldmVsIDogY2FsbChsZXZlbFJldml2ZXIsIGNvbnRleHQsIGxldmVsKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kRmxhdCAoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmaXJzdEluZGV4LCBsYXN0SW5kZXgsIGJhc2VOdW1iZXIsIGRlYnVnKSB7XG5cdHZhciBrZXksXG5cdFx0dmFsdWUsXG5cdFx0bnVtYmVyO1xuXHRvdXRlcjogZm9yICggdmFyIGxpbmVJbmRleCA9IGZpcnN0SW5kZXgsIGxpbmUgPSB0YWJMaW5lc1tsaW5lSW5kZXhdLCB0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7IDsgKSB7XG5cdFx0dmFsdWUgPSBbXTtcblx0XHRudW1iZXIgPSBiYXNlTnVtYmVyK2xpbmVJbmRleDtcblx0XHRpZiAoIHRhYkluZGV4PT09IC0xICkge1xuXHRcdFx0a2V5ID0gJyc7XG5cdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09IC0xICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggdGFiSW5kZXg9PT0wICkge1xuXHRcdFx0XHRrZXkgPSAnXFx0Jztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBsaW5lLnNsaWNlKDAsIHRhYkluZGV4KzEpO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UodGFiSW5kZXgrMSkpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdH1cblx0XHRsZXZlbC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRsZXZlbC5wdXNoKHtcblx0XHRrZXk6IGtleSxcblx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0bnVtYmVyOiBudW1iZXJcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEdyb3VwIChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZpcnN0SW5kZXgsIGxhc3RJbmRleCwgYmFzZU51bWJlciwgZGVidWcpIHtcblx0dmFyIHBlbmRpbmdHcm91cCA9IFtdLFxuXHRcdHBlbmRpbmdLZXlzICA9ICcnLFxuXHRcdGtleSxcblx0XHR2YWx1ZSxcblx0XHRudW1iZXI7XG5cdG91dGVyOiBmb3IgKCB2YXIgbGluZUluZGV4ID0gZmlyc3RJbmRleCwgbGluZSA9IHRhYkxpbmVzW2xpbmVJbmRleF0sIHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTsgOyApIHtcblx0XHR2YWx1ZSA9IFtdO1xuXHRcdG51bWJlciA9IGJhc2VOdW1iZXIrbGluZUluZGV4O1xuXHRcdGlmICggdGFiSW5kZXg9PT0gLTEgKSB7XG5cdFx0XHRrZXkgPSAnJztcblx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHRwZW5kaW5nS2V5cyArPSAnXFxuJztcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PSAtMSApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIHRhYkluZGV4PT09MCApIHtcblx0XHRcdFx0a2V5ID0gJ1xcdCc7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9ICdcXHRcXG4nO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGtleSA9IGxpbmUuc2xpY2UoMCwgdGFiSW5kZXgrMSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9IGtleSsnXFxuJztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKHRhYkluZGV4KzEpKTtcblx0XHRcdH1cblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBlbmRpbmdHcm91cC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRwZW5kaW5nR3JvdXAucHVzaCh7XG5cdFx0a2V5OiBrZXksXG5cdFx0dmFsdWU6IHZhbHVlLFxuXHRcdG51bWJlcjogbnVtYmVyXG5cdH0pO1xuXHRpZiAoIGdyb3VwUmV2aXZlcj09PXRydWUgKSB7XG5cdFx0bGV2ZWwucHVzaChwZW5kaW5nR3JvdXAubGVuZ3RoPT09MSA/IHBlbmRpbmdHcm91cFswXSA6IHBlbmRpbmdHcm91cCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGZvciAoIHZhciByZXZpdmVyTGVuZ3RoID0gZ3JvdXBSZXZpdmVyLmxlbmd0aCwgcmV2aXZlckluZGV4ID0gMDsgcmV2aXZlckluZGV4PHJldml2ZXJMZW5ndGg7ICsrcmV2aXZlckluZGV4ICkge1xuXHRcdHZhciByZWdFeHBfZnVuY3Rpb24gPSBncm91cFJldml2ZXJbcmV2aXZlckluZGV4XTtcblx0XHR2YXIgbWF0Y2hlZCA9IHJlZ0V4cF9mdW5jdGlvblswXS5leGVjKHBlbmRpbmdLZXlzKTtcblx0XHRpZiAoIG1hdGNoZWQ9PT1udWxsICkgeyBjb250aW51ZTsgfVxuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRpZiAoIG1hdGNoZWQ9PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKCkpJyk7IH1cblx0XHRcdGlmICggbWF0Y2hlZC5pbmRleCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKS5pbmRleCknKTsgfVxuXHRcdFx0aWYgKCB0eXBlb2YgbWF0Y2hlZFswXSE9PSdzdHJpbmcnICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXSknKTsgfVxuXHRcdFx0aWYgKCBtYXRjaGVkWzBdLmxlbmd0aD09PTAgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0ubGVuZ3RoKScpOyB9XG5cdFx0XHRpZiAoIG1hdGNoZWRbMF0uY2hhckF0KG1hdGNoZWRbMF0ubGVuZ3RoLTEpIT09J1xcbicgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0pJyk7IH1cblx0XHR9XG5cdFx0dmFyIHRoaXNLZXlzID0gbWF0Y2hlZFswXTtcblx0XHR2YXIga2V5TGVuZ3RoID0gdGhpc0tleXMubGVuZ3RoO1xuXHRcdGlmICggcGVuZGluZ0tleXMubGVuZ3RoPT09a2V5TGVuZ3RoICkge1xuXHRcdFx0bGV2ZWwucHVzaChjYWxsKHJlZ0V4cF9mdW5jdGlvblsxXSwgY29udGV4dCwgcGVuZGluZ0dyb3VwLmxlbmd0aD09PTEgPyBwZW5kaW5nR3JvdXBbMF0gOiBwZW5kaW5nR3JvdXApKTtcblx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdGlmICggbGV2ZWxbbGV2ZWwubGVuZ3RoLTFdPT09dW5kZWZpbmVkICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzFdKCkpJyk7IH1cblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dmFyIGNvdW50ID0gMTtcblx0XHRmb3IgKCB2YXIgaW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJyk7IDsgKytjb3VudCApIHtcblx0XHRcdGluZGV4T2ZMRiA9IHRoaXNLZXlzLmluZGV4T2YoJ1xcbicsIGluZGV4T2ZMRisxKTtcblx0XHRcdGlmICggaW5kZXhPZkxGPDAgKSB7IGJyZWFrOyB9XG5cdFx0fVxuXHRcdGxldmVsLnB1c2goY2FsbChyZWdFeHBfZnVuY3Rpb25bMV0sIGNvbnRleHQsIGNvdW50PT09MSA/IHBlbmRpbmdHcm91cC5zaGlmdCgpIDogcGVuZGluZ0dyb3VwLnNwbGljZSgwLCBjb3VudCkpKTtcblx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdH1cblx0XHRyZXZpdmVySW5kZXggPSAwO1xuXHRcdHBlbmRpbmdLZXlzID0gcGVuZGluZ0tleXMuc2xpY2Uoa2V5TGVuZ3RoKTtcblx0fVxuXHR0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbIV0pJyk7XG59XG5cbmZ1bmN0aW9uIGNhbGwgKHJldml2ZXIsIGNvbnRleHQsIGFyZ3VtZW50KSB7XG5cdHJldHVybiByZXZpdmVyLnByb3RvdHlwZT09bnVsbFxuXHRcdD8gcmV2aXZlcihhcmd1bWVudCwgY29udGV4dClcblx0XHQ6IG5ldyByZXZpdmVyKGFyZ3VtZW50LCBjb250ZXh0KTtcbn1cbiIsImltcG9ydCB7IHVuZGVmaW5lZCwgaXNBcnJheSwgcHVzaCB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHN0cmluZ2lmeSAobGV2ZWwsIF9yZXBsYWNlciwgX3NwYWNlLCBfZGVidWcpIHtcblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeShsZXZlbCwgcmVwbGFjZXIsIHNwYWNlLCBkZWJ1ZywgLi4uKScpOyB9XG5cdFx0aWYgKCBfZGVidWc9PT11bmRlZmluZWQgKSB7IF9kZWJ1ZyA9IHRydWU7IH1cblx0XHRlbHNlIGlmICggX2RlYnVnIT09dHJ1ZSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCwsZGVidWcpJyk7IH1cblx0XHRpZiAoIF9yZXBsYWNlciE9bnVsbCAmJiB0eXBlb2YgX3JlcGxhY2VyIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLHJlcGxhY2VyKScpOyB9XG5cdFx0aWYgKCBfc3BhY2UhPW51bGwgJiYgdHlwZW9mIF9zcGFjZSE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UpJyk7IH1cblx0fVxuXHRpZiAoIF9yZXBsYWNlcj09PXVuZGVmaW5lZCApIHsgX3JlcGxhY2VyID0gbnVsbDsgfVxuXHRpZiAoIF9zcGFjZT09PXVuZGVmaW5lZCApIHsgX3NwYWNlID0gbnVsbDsgfVxuXHRyZXR1cm4gTGluZXModGhpcywgbGV2ZWwsIF9yZXBsYWNlciwgX3NwYWNlLCBfZGVidWcpO1xufTtcblxuZnVuY3Rpb24gTGluZXMgKGNvbnRleHQsIGxldmVsLCByZXBsYWNlciwgc3BhY2UsIGRlYnVnKSB7XG5cdGlmICggcmVwbGFjZXIhPT1udWxsICkgeyBsZXZlbCA9IHJlcGxhY2VyKGxldmVsLCBjb250ZXh0KTsgfVxuXHRpZiAoIGRlYnVnICkge1xuXHRcdGlmICggIWlzQXJyYXkobGV2ZWwpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeShsZXZlbCknKTsgfVxuXHR9XG5cdHZhciBsaW5lcyA9IFtdO1xuXHRmb3IgKCB2YXIgbGV2ZWxMZW5ndGggPSBsZXZlbC5sZW5ndGgsIGxldmVsSW5kZXggPSAwOyBsZXZlbEluZGV4PGxldmVsTGVuZ3RoOyArK2xldmVsSW5kZXggKSB7XG5cdFx0dmFyIGVhY2ggPSBsZXZlbFtsZXZlbEluZGV4XTtcblx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0Y2hlY2soZWFjaCwgcmVwbGFjZXIpO1xuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBlYWNoPT09J251bWJlcicgKSB7IHdoaWxlICggZWFjaC0tICkgeyBsaW5lcy5wdXNoKCcnKTsgfSB9XG5cdFx0ZWxzZSBpZiAoIGVhY2gua2V5PT09JycgKSB7IHB1c2guYXBwbHkobGluZXMsIGVhY2gudmFsdWUpOyB9XG5cdFx0ZWxzZSBpZiAoIHNwYWNlPT09bnVsbCApIHtcblx0XHRcdHB1c2hlcyhsaW5lcywgZWFjaC5rZXksICdcXHQnLCByZXBsYWNlcj09PW51bGxcblx0XHRcdFx0PyBMaW5lcyhjb250ZXh0LCBlYWNoLnZhbHVlLCBudWxsLCBzcGFjZSwgZGVidWcpXG5cdFx0XHRcdDogZWFjaC52YWx1ZVxuXHRcdFx0KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR2YXIga2V5cyA9IFtlYWNoLmtleV07XG5cdFx0XHR2YXIgdmFsdWVzID0gW2VhY2gudmFsdWVdO1xuXHRcdFx0d2hpbGUgKCArK2xldmVsSW5kZXg8bGV2ZWxMZW5ndGggKSB7XG5cdFx0XHRcdGVhY2ggPSBsZXZlbFtsZXZlbEluZGV4XTtcblx0XHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdFx0XHRcdC0tbGV2ZWxJbmRleDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRrZXlzLnB1c2goZWFjaC5rZXkpO1xuXHRcdFx0XHR2YWx1ZXMucHVzaChlYWNoLnZhbHVlKTtcblx0XHRcdH1cblx0XHRcdHZhciBrZXlzX2luZGVudCA9IHNwYWNlKGtleXMsIGNvbnRleHQpO1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Yga2V5c19pbmRlbnQhPT0nb2JqZWN0JyB8fCBrZXlzX2luZGVudD09PW51bGwgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKSknKTsgfVxuXHRcdFx0XHRpZiAoICEoICdrZXlzJyBpbiBrZXlzX2luZGVudCApIHx8ICEoICdpbmRlbnQnIGluIGtleXNfaW5kZW50ICkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpKScpOyB9XG5cdFx0XHRcdGlmICggIWlzQXJyYXkoa2V5c19pbmRlbnQua2V5cykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzKScpOyB9XG5cdFx0XHRcdGlmICgga2V5c19pbmRlbnQua2V5cy5sZW5ndGghPT12YWx1ZXMubGVuZ3RoICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzLmxlbmd0aCknKTsgfVxuXHRcdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGtleXNfaW5kZW50LmtleXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkua2V5c1sqXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBrZXlzX2luZGVudC5pbmRlbnQhPT0nc3RyaW5nJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmluZGVudCknKTsgfVxuXHRcdFx0fVxuXHRcdFx0a2V5cyA9IGtleXNfaW5kZW50LmtleXM7XG5cdFx0XHR2YXIgaW5kZW50ID0ga2V5c19pbmRlbnQuaW5kZW50O1xuXHRcdFx0Zm9yICggdmFyIGxlbmd0aCA9IHZhbHVlcy5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHRpZiAoIGtleXNbaW5kZXhdPT09JycgKSB7IHB1c2guYXBwbHkobGluZXMsIHZhbHVlc1tpbmRleF0pOyB9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHB1c2hlcyhsaW5lcywga2V5c1tpbmRleF0sIGluZGVudCwgcmVwbGFjZXI9PT1udWxsXG5cdFx0XHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIHZhbHVlc1tpbmRleF0sIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0XHRcdDogdmFsdWVzW2luZGV4XVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIGxpbmVzO1xufVxuXG5mdW5jdGlvbiBwdXNoZXMgKGxpbmVzLCBrZXksIGluZGVudCwgc3ViTGluZXMpIHtcblx0dmFyIGxlbmd0aCA9IHN1YkxpbmVzLmxlbmd0aDtcblx0aWYgKCBsZW5ndGg9PT0wICkgeyBsaW5lcy5wdXNoKGtleSk7IH1cblx0ZWxzZSB7XG5cdFx0bGluZXMucHVzaChrZXkrc3ViTGluZXNbMF0pO1xuXHRcdGZvciAoIHZhciBpbmRleCA9IDE7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRcdGxpbmVzLnB1c2goaW5kZW50K3N1YkxpbmVzW2luZGV4XSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGNoZWNrIChlYWNoLCByZXBsYWNlcikge1xuXHRpZiAoIHR5cGVvZiBlYWNoPT09J29iamVjdCcgJiYgZWFjaCE9PW51bGwgKSB7XG5cdFx0aWYgKCAhKCAna2V5JyBpbiBlYWNoICkgfHwgISggJ3ZhbHVlJyBpbiBlYWNoICkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdCknKTsgfVxuXHRcdGlmICggdHlwZW9mIGVhY2gua2V5IT09J3N0cmluZycgfHwgIS9eKD86W15cXHRcXG5cXHJdKlxcdCk/JC8udGVzdChlYWNoLmtleSkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC5rZXkpJyk7IH1cblx0XHRpZiAoIHJlcGxhY2VyIT09bnVsbCB8fCBlYWNoLmtleT09PScnICkge1xuXHRcdFx0aWYgKCAhaXNBcnJheShlYWNoLnZhbHVlKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC52YWx1ZSknKTsgfVxuXHRcdFx0aWYgKCBub3RTdHJpbmdBcnJheShlYWNoLnZhbHVlKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC52YWx1ZVsqXSknKTsgfVxuXHRcdH1cblx0fVxuXHRlbHNlIGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHtcblx0XHRpZiAoICEvXlxcZCskLy50ZXN0KGVhY2gpICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXTpudW1iZXIpJyk7IH1cblx0fVxuXHRlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdKScpOyB9XG59XG4iLCIvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3JcbmltcG9ydCB7IFBPU0lUSVZFX0lOVEVHRVIsIHJlcGVhdFNwYWNlIH0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU3BhY2UgKG1pbldpZHRoLCBwYWRkaW5nKSB7XG5cdGlmICggdHlwZW9mIG1pbldpZHRoIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MuU3BhY2UobWluV2lkdGgpJyk7IH1cblx0aWYgKCB0eXBlb2YgcGFkZGluZyE9PSdudW1iZXInICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLlNwYWNlKCxwYWRkaW5nKScpOyB9XG5cdHZhciBtdWx0aXBsZSA9IG1pbldpZHRoPDA7XG5cdGlmICggbXVsdGlwbGUgKSB7IG1pbldpZHRoID0gfm1pbldpZHRoOyB9XG5cdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChtaW5XaWR0aCkgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLlNwYWNlKG1pbldpZHRoKScpOyB9XG5cdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChwYWRkaW5nKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MuU3BhY2UoLHBhZGRpbmcpJyk7IH1cblx0cmV0dXJuIGZ1bmN0aW9uIHNwYWNlIChrZXlzKSB7XG5cdFx0cmV0dXJuIGtleXNfaW5kZW50KG11bHRpcGxlLCBtaW5XaWR0aCwgcGFkZGluZywga2V5cyk7XG5cdH07XG59O1xuXG5mdW5jdGlvbiBrZXlzX2luZGVudCAobXVsdGlwbGUsIG1pbldpZHRoLCBwYWRkaW5nLCBrZXlzKSB7XG5cdHZhciBtYXhXaWR0aCA9IDE7XG5cdHZhciB3aWR0aHMgPSBbXTtcblx0Zm9yICggdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHR2YXIgd2lkdGggPSAwO1xuXHRcdHZhciBrZXkgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0Zm9yICggdmFyIGwgPSBrZXkubGVuZ3RoLTEsIGkgPSAwOyBpPGw7ICsraSApIHtcblx0XHRcdFx0dmFyIGNoYXJDb2RlID0ga2V5LmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRcdGlmICggY2hhckNvZGU8MHg4MCApIHsgd2lkdGggKz0gMTsgfVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHR3aWR0aCArPSAyO1xuXHRcdFx0XHRcdGlmICggY2hhckNvZGU+PTB4RDgwMCAmJiBjaGFyQ29kZTw9MHhEQkZGICYmIGkrMTxsICkge1xuXHRcdFx0XHRcdFx0Y2hhckNvZGUgPSBrZXkuY2hhckNvZGVBdChpKzEpO1xuXHRcdFx0XHRcdFx0Y2hhckNvZGU+PTB4REMwMCAmJiBjaGFyQ29kZTw9MHhERkZGICYmICsraTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggd2lkdGg+bWF4V2lkdGggKSB7IG1heFdpZHRoID0gd2lkdGg7IH1cblx0XHR9XG5cdFx0d2lkdGhzLnB1c2god2lkdGgpO1xuXHR9XG5cdHdpZHRoID0gbWF4V2lkdGgrcGFkZGluZztcblx0aWYgKCBtdWx0aXBsZSApIHtcblx0XHRpZiAoIHdpZHRoJW1pbldpZHRoICkgeyB3aWR0aCArPSBtaW5XaWR0aC13aWR0aCVtaW5XaWR0aDsgfVxuXHR9XG5cdGVsc2Uge1xuXHRcdGlmICggd2lkdGg8bWluV2lkdGggKSB7IHdpZHRoID0gbWluV2lkdGg7IH1cblx0fVxuXHRmb3IgKCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRrZXkgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0a2V5c1tpbmRleF0gPSBrZXkuc2xpY2UoMCwgLTEpK3JlcGVhdFNwYWNlKHdpZHRoLXdpZHRoc1tpbmRleF0pO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4geyBrZXlzOiBrZXlzLCBpbmRlbnQ6IHJlcGVhdFNwYWNlKHdpZHRoKSB9O1xufVxuIiwiaW1wb3J0IHZlcnNpb24gZnJvbSAnLi92ZXJzaW9uP3RleHQnO1xuaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UuanMnO1xuaW1wb3J0IHN0cmluZ2lmeSBmcm9tICcuL3N0cmluZ2lmeS5qcyc7XG5pbXBvcnQgU3BhY2UgZnJvbSAnLi9TcGFjZS5qcyc7XG52YXIgalRhYkRvYyA9IHtcblx0cGFyc2U6IHBhcnNlLFxuXHRzdHJpbmdpZnk6IHN0cmluZ2lmeSxcblx0U3BhY2U6IFNwYWNlLFxuXHR2ZXJzaW9uOiB2ZXJzaW9uXG59O1xualRhYkRvY1snZGVmYXVsdCddID0galRhYkRvYztcbmV4cG9ydCB7XG5cdHBhcnNlLFxuXHRzdHJpbmdpZnksXG5cdFNwYWNlLFxuXHR2ZXJzaW9uXG59O1xuZXhwb3J0IGRlZmF1bHQgalRhYkRvYzsiXSwibmFtZXMiOlsidW5kZWZpbmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGVBQWUsT0FBTzs7dUJBQUMsdEJDQ3ZCOztDQUVBLElBQUlBLFdBQVMsQ0FBQztBQUNkLENBQ0EsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7Q0FDekMsSUFB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