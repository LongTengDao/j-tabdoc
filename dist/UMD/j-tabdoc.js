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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZlcnNpb24/dGV4dCIsInNyYy9nbG9iYWwuanMiLCJzcmMvdXRpbC5qcyIsInNyYy9wYXJzZS5qcyIsInNyYy9zdHJpbmdpZnkuanMiLCJzcmMvU3BhY2UuanMiLCJzcmMvZXhwb3J0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0ICcxLjAuMCc7IiwiZXhwb3J0IHsgdW5kZWZpbmVkLCBoYXNPd25Qcm9wZXJ0eSwgdG9TdHJpbmcsIHB1c2gsIGlzQXJyYXksIGlzQnVmZmVyLCB0b1N0cmluZ0ZvbGxvd0JPTSB9Oy8vIFR5cGVFcnJvciwgRXJyb3IsIFJhbmdlRXJyb3Jcbi8vIE9iamVjdCwgQXJyYXksIEJ1ZmZlclxuXG52YXIgdW5kZWZpbmVkO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgcHVzaCA9IEFycmF5LnByb3RvdHlwZS5wdXNoO1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChsaW5lcykge1xuXHRyZXR1cm4gdG9TdHJpbmcuY2FsbChsaW5lcyk9PT0nW29iamVjdCBBcnJheV0nO1xufTtcblxuaWYgKCB0eXBlb2YgQnVmZmVyPT09J2Z1bmN0aW9uJyApIHtcblx0aXNCdWZmZXIgPSBCdWZmZXIuaXNCdWZmZXI7XG5cdHZhciBmcm9tID0gQnVmZmVyLmZyb207XG5cdHZhciB0b1N0cmluZ0ZvbGxvd0JPTSA9IGZ1bmN0aW9uIChidWZmZXIpIHtcblx0XHRzd2l0Y2ggKCBidWZmZXJbMF0gKSB7XG5cdFx0XHRjYXNlIDB4RUY6XG5cdFx0XHRcdGlmICggYnVmZmVyWzFdPT09MHhCQiAmJiBidWZmZXJbMl09PT0weEJGICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDMpLnRvU3RyaW5nKCd1dGY4Jyk7IH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDB4RkY6XG5cdFx0XHRcdGlmICggYnVmZmVyWzFdPT09MHhGRSApIHsgcmV0dXJuIGJ1ZmZlci5zbGljZSgyKS50b1N0cmluZygndWNzMicpOyB9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAweEZFOlxuXHRcdFx0XHRpZiAoIGJ1ZmZlclsxXT09PTB4RkYgKSB7XG5cdFx0XHRcdFx0YnVmZmVyID0gZnJvbShidWZmZXIpO1xuXHRcdFx0XHRcdHJldHVybiBidWZmZXIuc3dhcDE2KCkuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdFx0cmV0dXJuIGJ1ZmZlci50b1N0cmluZygpO1xuXHR9O1xufVxuZWxzZSB7XG5cdHZhciBpc0J1ZmZlciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xufVxuIiwiXG5leHBvcnQgdmFyIFBPU0lUSVZFX0lOVEVHRVIgPSAvXlsxLTldXFxkKiQvO1xuXG5leHBvcnQgdmFyIHJlcGVhdFNwYWNlID0gJycucmVwZWF0XG5cdD8gZnVuY3Rpb24gKGNvdW50KSB7IHJldHVybiAnICcucmVwZWF0KGNvdW50KTsgfVxuXHQ6IGZ1bmN0aW9uIChzcGFjZXMpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGNvdW50KSB7XG5cdFx0XHRzcGFjZXMubGVuZ3RoID0gY291bnQrMTtcblx0XHRcdHJldHVybiBzcGFjZXMuam9pbignICcpO1xuXHRcdH07XG5cdH0oW10pO1xuXG5leHBvcnQgZnVuY3Rpb24gbm90U3RyaW5nQXJyYXkgKGFycmF5KSB7XG5cdGZvciAoIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdGlmICggdHlwZW9mIGFycmF5W2luZGV4XSE9PSdzdHJpbmcnICkgeyByZXR1cm4gdHJ1ZTsgfVxuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cbiIsImltcG9ydCB7IHVuZGVmaW5lZCwgaXNBcnJheSwgaXNCdWZmZXIsIHRvU3RyaW5nRm9sbG93Qk9NIH0gZnJvbSAnLi9nbG9iYWwuanMnOy8vIFR5cGVFcnJvciwgUmFuZ2VFcnJvciwgRXJyb3JcbmltcG9ydCB7IFBPU0lUSVZFX0lOVEVHRVIsIG5vdFN0cmluZ0FycmF5IH0gZnJvbSAnLi91dGlsLmpzJztcblxudmFyIEJPTSA9IC9eXFx1RkVGRi87XG52YXIgRU9MID0gL1xcclxcbj98XFxuLztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2UgKHRhYkxpbmVzLCBfcmV2aXZlciwgX251bWJlciwgX2RlYnVnKSB7XG5cdGlmICggIWlzQXJyYXkodGFiTGluZXMpICkge1xuXHRcdGlmICggdHlwZW9mIHRhYkxpbmVzPT09J3N0cmluZycgKSB7IHRhYkxpbmVzID0gdGFiTGluZXMucmVwbGFjZShCT00sICcnKS5zcGxpdChFT0wpOyB9XG5cdFx0ZWxzZSBpZiAoIGlzQnVmZmVyKHRhYkxpbmVzKSApIHsgdGFiTGluZXMgPSB0b1N0cmluZ0ZvbGxvd0JPTSh0YWJMaW5lcykuc3BsaXQoRU9MKTsgfVxuXHR9XG5cdGlmICggX3Jldml2ZXI9PW51bGwgKSB7XG5cdFx0dmFyIGNvdW50RW1wdGllcyA9IHRydWU7XG5cdFx0dmFyIGdyb3VwUmV2aXZlciA9IG51bGw7XG5cdFx0dmFyIGxldmVsUmV2aXZlciA9IG51bGw7XG5cdH1cblx0ZWxzZSB7XG5cdFx0Y291bnRFbXB0aWVzID0gX3Jldml2ZXIuZW1wdHk7XG5cdFx0Z3JvdXBSZXZpdmVyID0gX3Jldml2ZXIuZ3JvdXA7XG5cdFx0bGV2ZWxSZXZpdmVyID0gX3Jldml2ZXIubGV2ZWw7XG5cdFx0aWYgKCBjb3VudEVtcHRpZXM9PT11bmRlZmluZWQgKSB7IGNvdW50RW1wdGllcyA9IHRydWU7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PXVuZGVmaW5lZCApIHsgZ3JvdXBSZXZpdmVyID0gbnVsbDsgfVxuXHRcdGlmICggbGV2ZWxSZXZpdmVyPT09dW5kZWZpbmVkICkgeyBsZXZlbFJldml2ZXIgPSBudWxsOyB9XG5cdH1cblx0aWYgKCBfbnVtYmVyPT09dW5kZWZpbmVkICkgeyBfbnVtYmVyID0gMTsgfVxuXHRpZiAoIF9kZWJ1ZyE9PWZhbHNlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aD40ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXMsIHJldml2ZXIsIG51bWJlciwgZGVidWcsIC4uLiknKTsgfVxuXHRcdGlmICggX2RlYnVnPT09dW5kZWZpbmVkICkgeyBfZGVidWcgPSB0cnVlOyB9XG5cdFx0ZWxzZSBpZiAoIF9kZWJ1ZyE9PXRydWUgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsLGRlYnVnKScpOyB9XG5cdFx0aWYgKCAhaXNBcnJheSh0YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXMpJyk7IH1cblx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KHRhYkxpbmVzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSh0YWJMaW5lc1sqXSknKTsgfVxuXHRcdGlmICggdHlwZW9mIGNvdW50RW1wdGllcyE9PSdib29sZWFuJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5lbXB0eSknKTsgfVxuXHRcdGlmICggZ3JvdXBSZXZpdmVyIT09bnVsbCAmJiB0eXBlb2YgZ3JvdXBSZXZpdmVyIT09J2Jvb2xlYW4nICkge1xuXHRcdFx0aWYgKCAhaXNBcnJheShncm91cFJldml2ZXIpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwKScpOyB9XG5cdFx0XHRmb3IgKCB2YXIgbGVuZ3RoID0gZ3JvdXBSZXZpdmVyLmxlbmd0aCwgaW5kZXggPSAwOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0XHRcdHZhciBlYWNoID0gZ3JvdXBSZXZpdmVyW2luZGV4XTtcblx0XHRcdFx0aWYgKCAhaXNBcnJheShlYWNoKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXSknKTsgfVxuXHRcdFx0XHRpZiAoICFlYWNoWzBdIHx8IHR5cGVvZiBlYWNoWzBdLmV4ZWMhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdKScpOyB9XG5cdFx0XHRcdGlmICggdHlwZW9mIGVhY2hbMV0hPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzFdKScpOyB9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICggbGV2ZWxSZXZpdmVyIT09bnVsbCAmJiB0eXBlb2YgbGV2ZWxSZXZpdmVyIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5sZXZlbCknKTsgfVxuXHRcdGlmICggdHlwZW9mIF9udW1iZXIhPT0nbnVtYmVyJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgsLG51bWJlciknKTsgfVxuXHRcdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChfbnVtYmVyKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLCxudW1iZXIpJyk7IH1cblx0fVxuXHRyZXR1cm4gdGFiTGluZXMubGVuZ3RoPT09MCA/XG5cdFx0bGV2ZWxSZXZpdmVyPT09bnVsbCA/IFtdIDogY2FsbChsZXZlbFJldml2ZXIsIHRoaXMsIFtdKSA6XG5cdFx0TGV2ZWwodGhpcywgdGFiTGluZXMsIGdyb3VwUmV2aXZlciA/IGFwcGVuZEdyb3VwIDogYXBwZW5kRmxhdCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgX251bWJlciwgX2RlYnVnKTtcbn07XG5cbmZ1bmN0aW9uIExldmVsIChjb250ZXh0LCB0YWJMaW5lcywgYXBwZW5kLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKSB7XG5cdHZhciBsZXZlbCAgICAgPSBbXSxcblx0XHRsYXN0SW5kZXggPSB0YWJMaW5lcy5sZW5ndGgtMSxcblx0XHRpbmRleCAgICAgPSAwLFxuXHRcdGJsYW5rICAgICA9IHRhYkxpbmVzWzBdLmxlbmd0aD09PTA7XG5cdG91dGVyOiBmb3IgKCA7IDsgKSB7XG5cdFx0dmFyIGZyb20gPSBpbmRleDtcblx0XHRpZiAoIGJsYW5rICkge1xuXHRcdFx0aWYgKCBjb3VudEVtcHRpZXMgKSB7XG5cdFx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkge1xuXHRcdFx0XHRcdFx0bGV2ZWwucHVzaChpbmRleCsxLWZyb20pO1xuXHRcdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoIT09MCApIHtcblx0XHRcdFx0XHRcdGxldmVsLnB1c2goaW5kZXgtZnJvbSk7XG5cdFx0XHRcdFx0XHRibGFuayA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdFx0aWYgKCB0YWJMaW5lc1srK2luZGV4XS5sZW5ndGghPT0wICkge1xuXHRcdFx0XHRcdFx0YmxhbmsgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRhcHBlbmQoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmcm9tLCBpbmRleCwgbnVtYmVyLCBkZWJ1Zyk7XG5cdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0YWJMaW5lc1srK2luZGV4XS5sZW5ndGg9PT0wICkge1xuXHRcdFx0XHRcdGFwcGVuZChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZyb20sIGluZGV4LTEsIG51bWJlciwgZGVidWcpO1xuXHRcdFx0XHRcdGJsYW5rID0gdHJ1ZTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRsZXZlbC5udW1iZXIgPSBudW1iZXI7XG5cdHJldHVybiBsZXZlbFJldml2ZXI9PT1udWxsID8gbGV2ZWwgOiBjYWxsKGxldmVsUmV2aXZlciwgY29udGV4dCwgbGV2ZWwpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRGbGF0IChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZpcnN0SW5kZXgsIGxhc3RJbmRleCwgYmFzZU51bWJlciwgZGVidWcpIHtcblx0dmFyIGtleSxcblx0XHR2YWx1ZSxcblx0XHRudW1iZXI7XG5cdG91dGVyOiBmb3IgKCB2YXIgbGluZUluZGV4ID0gZmlyc3RJbmRleCwgbGluZSA9IHRhYkxpbmVzW2xpbmVJbmRleF0sIHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTsgOyApIHtcblx0XHR2YWx1ZSA9IFtdO1xuXHRcdG51bWJlciA9IGJhc2VOdW1iZXIrbGluZUluZGV4O1xuXHRcdGlmICggdGFiSW5kZXg9PT0gLTEgKSB7XG5cdFx0XHRrZXkgPSAnJztcblx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRsaW5lID0gdGFiTGluZXNbKytsaW5lSW5kZXhdO1xuXHRcdFx0XHR0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7XG5cdFx0XHRcdGlmICggdGFiSW5kZXghPT0gLTEgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCB0YWJJbmRleD09PTAgKSB7XG5cdFx0XHRcdGtleSA9ICdcXHQnO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGtleSA9IGxpbmUuc2xpY2UoMCwgdGFiSW5kZXgrMSk7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSh0YWJJbmRleCsxKSk7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkge1xuXHRcdFx0XHRcdGlmICggZ3JvdXBSZXZpdmVyPT09bnVsbCApIHsgdmFsdWUgPSBMZXZlbChjb250ZXh0LCB2YWx1ZSwgYXBwZW5kRmxhdCwgY291bnRFbXB0aWVzLCBudWxsLCBsZXZlbFJldml2ZXIsIG51bWJlciwgZGVidWcpOyB9XG5cdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09MCApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHRcdGlmICggZ3JvdXBSZXZpdmVyPT09bnVsbCApIHsgdmFsdWUgPSBMZXZlbChjb250ZXh0LCB2YWx1ZSwgYXBwZW5kRmxhdCwgY291bnRFbXB0aWVzLCBudWxsLCBsZXZlbFJldml2ZXIsIG51bWJlciwgZGVidWcpOyB9XG5cdFx0fVxuXHRcdGxldmVsLnB1c2goe1xuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0XHRudW1iZXI6IG51bWJlclxuXHRcdH0pO1xuXHR9XG5cdGxldmVsLnB1c2goe1xuXHRcdGtleToga2V5LFxuXHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRudW1iZXI6IG51bWJlclxuXHR9KTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kR3JvdXAgKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZmlyc3RJbmRleCwgbGFzdEluZGV4LCBiYXNlTnVtYmVyLCBkZWJ1Zykge1xuXHR2YXIgcGVuZGluZ0dyb3VwID0gW10sXG5cdFx0cGVuZGluZ0tleXMgID0gJycsXG5cdFx0a2V5LFxuXHRcdHZhbHVlLFxuXHRcdG51bWJlcjtcblx0b3V0ZXI6IGZvciAoIHZhciBsaW5lSW5kZXggPSBmaXJzdEluZGV4LCBsaW5lID0gdGFiTGluZXNbbGluZUluZGV4XSwgdGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpOyA7ICkge1xuXHRcdHZhbHVlID0gW107XG5cdFx0bnVtYmVyID0gYmFzZU51bWJlcitsaW5lSW5kZXg7XG5cdFx0aWYgKCB0YWJJbmRleD09PSAtMSApIHtcblx0XHRcdGtleSA9ICcnO1xuXHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdHBlbmRpbmdLZXlzICs9ICdcXG4nO1xuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09IC0xICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggdGFiSW5kZXg9PT0wICkge1xuXHRcdFx0XHRrZXkgPSAnXFx0Jztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdFx0cGVuZGluZ0tleXMgKz0gJ1xcdFxcbic7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0a2V5ID0gbGluZS5zbGljZSgwLCB0YWJJbmRleCsxKTtcblx0XHRcdFx0cGVuZGluZ0tleXMgKz0ga2V5KydcXG4nO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UodGFiSW5kZXgrMSkpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09MCApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cGVuZGluZ0dyb3VwLnB1c2goe1xuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0XHRudW1iZXI6IG51bWJlclxuXHRcdH0pO1xuXHR9XG5cdHBlbmRpbmdHcm91cC5wdXNoKHtcblx0XHRrZXk6IGtleSxcblx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0bnVtYmVyOiBudW1iZXJcblx0fSk7XG5cdGlmICggZ3JvdXBSZXZpdmVyPT09dHJ1ZSApIHtcblx0XHRsZXZlbC5wdXNoKHBlbmRpbmdHcm91cC5sZW5ndGg9PT0xID8gcGVuZGluZ0dyb3VwWzBdIDogcGVuZGluZ0dyb3VwKTtcblx0XHRyZXR1cm47XG5cdH1cblx0Zm9yICggdmFyIHJldml2ZXJMZW5ndGggPSBncm91cFJldml2ZXIubGVuZ3RoLCByZXZpdmVySW5kZXggPSAwOyByZXZpdmVySW5kZXg8cmV2aXZlckxlbmd0aDsgKytyZXZpdmVySW5kZXggKSB7XG5cdFx0dmFyIHJlZ0V4cF9mdW5jdGlvbiA9IGdyb3VwUmV2aXZlcltyZXZpdmVySW5kZXhdO1xuXHRcdHZhciBtYXRjaGVkID0gcmVnRXhwX2Z1bmN0aW9uWzBdLmV4ZWMocGVuZGluZ0tleXMpO1xuXHRcdGlmICggbWF0Y2hlZD09PW51bGwgKSB7IGNvbnRpbnVlOyB9XG5cdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdGlmICggbWF0Y2hlZD09PXVuZGVmaW5lZCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKSknKTsgfVxuXHRcdFx0aWYgKCBtYXRjaGVkLmluZGV4ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpLmluZGV4KScpOyB9XG5cdFx0XHRpZiAoIHR5cGVvZiBtYXRjaGVkWzBdIT09J3N0cmluZycgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpWzBdKScpOyB9XG5cdFx0XHRpZiAoIG1hdGNoZWRbMF0ubGVuZ3RoPT09MCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXS5sZW5ndGgpJyk7IH1cblx0XHRcdGlmICggbWF0Y2hlZFswXS5jaGFyQXQobWF0Y2hlZFswXS5sZW5ndGgtMSkhPT0nXFxuJyApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXSknKTsgfVxuXHRcdH1cblx0XHR2YXIgdGhpc0tleXMgPSBtYXRjaGVkWzBdO1xuXHRcdHZhciBrZXlMZW5ndGggPSB0aGlzS2V5cy5sZW5ndGg7XG5cdFx0aWYgKCBwZW5kaW5nS2V5cy5sZW5ndGg9PT1rZXlMZW5ndGggKSB7XG5cdFx0XHRsZXZlbC5wdXNoKGNhbGwocmVnRXhwX2Z1bmN0aW9uWzFdLCBjb250ZXh0LCBwZW5kaW5nR3JvdXAubGVuZ3RoPT09MSA/IHBlbmRpbmdHcm91cFswXSA6IHBlbmRpbmdHcm91cCkpO1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR2YXIgY291bnQgPSAxO1xuXHRcdGZvciAoIHZhciBpbmRleE9mTEYgPSB0aGlzS2V5cy5pbmRleE9mKCdcXG4nKTsgOyArK2NvdW50ICkge1xuXHRcdFx0aW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJywgaW5kZXhPZkxGKzEpO1xuXHRcdFx0aWYgKCBpbmRleE9mTEY8MCApIHsgYnJlYWs7IH1cblx0XHR9XG5cdFx0bGV2ZWwucHVzaChjYWxsKHJlZ0V4cF9mdW5jdGlvblsxXSwgY29udGV4dCwgY291bnQ9PT0xID8gcGVuZGluZ0dyb3VwLnNoaWZ0KCkgOiBwZW5kaW5nR3JvdXAuc3BsaWNlKDAsIGNvdW50KSkpO1xuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRpZiAoIGxldmVsW2xldmVsLmxlbmd0aC0xXT09PXVuZGVmaW5lZCApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVsxXSgpKScpOyB9XG5cdFx0fVxuXHRcdHJldml2ZXJJbmRleCA9IDA7XG5cdFx0cGVuZGluZ0tleXMgPSBwZW5kaW5nS2V5cy5zbGljZShrZXlMZW5ndGgpO1xuXHR9XG5cdHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFshXSknKTtcbn1cblxuZnVuY3Rpb24gY2FsbCAocmV2aXZlciwgY29udGV4dCwgYXJndW1lbnQpIHtcblx0cmV0dXJuIHJldml2ZXIucHJvdG90eXBlPT1udWxsXG5cdFx0PyByZXZpdmVyKGFyZ3VtZW50LCBjb250ZXh0KVxuXHRcdDogbmV3IHJldml2ZXIoYXJndW1lbnQsIGNvbnRleHQpO1xufVxuIiwiaW1wb3J0IHsgdW5kZWZpbmVkLCBpc0FycmF5LCBwdXNoIH0gZnJvbSAnLi9nbG9iYWwuanMnOy8vIFR5cGVFcnJvciwgRXJyb3JcbmltcG9ydCB7IG5vdFN0cmluZ0FycmF5IH0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc3RyaW5naWZ5IChsZXZlbCwgX3JlcGxhY2VyLCBfc3BhY2UsIF9kZWJ1Zykge1xuXHRpZiAoIF9kZWJ1ZyE9PWZhbHNlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aD40ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KGxldmVsLCByZXBsYWNlciwgc3BhY2UsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggX3JlcGxhY2VyIT1udWxsICYmIHR5cGVvZiBfcmVwbGFjZXIhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgscmVwbGFjZXIpJyk7IH1cblx0XHRpZiAoIF9zcGFjZSE9bnVsbCAmJiB0eXBlb2YgX3NwYWNlIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSknKTsgfVxuXHR9XG5cdGlmICggX3JlcGxhY2VyPT09dW5kZWZpbmVkICkgeyBfcmVwbGFjZXIgPSBudWxsOyB9XG5cdGlmICggX3NwYWNlPT09dW5kZWZpbmVkICkgeyBfc3BhY2UgPSBudWxsOyB9XG5cdHJldHVybiBMaW5lcyh0aGlzLCBsZXZlbCwgX3JlcGxhY2VyLCBfc3BhY2UsIF9kZWJ1Zyk7XG59O1xuXG5mdW5jdGlvbiBMaW5lcyAoY29udGV4dCwgbGV2ZWwsIHJlcGxhY2VyLCBzcGFjZSwgZGVidWcpIHtcblx0aWYgKCByZXBsYWNlciE9PW51bGwgKSB7IGxldmVsID0gcmVwbGFjZXIobGV2ZWwsIGNvbnRleHQpOyB9XG5cdGlmICggZGVidWcgKSB7XG5cdFx0aWYgKCAhaXNBcnJheShsZXZlbCkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KGxldmVsKScpOyB9XG5cdH1cblx0dmFyIGxpbmVzID0gW107XG5cdGZvciAoIHZhciBsZXZlbExlbmd0aCA9IGxldmVsLmxlbmd0aCwgbGV2ZWxJbmRleCA9IDA7IGxldmVsSW5kZXg8bGV2ZWxMZW5ndGg7ICsrbGV2ZWxJbmRleCApIHtcblx0XHR2YXIgZWFjaCA9IGxldmVsW2xldmVsSW5kZXhdO1xuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0fVxuXHRcdGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHsgd2hpbGUgKCBlYWNoLS0gKSB7IGxpbmVzLnB1c2goJycpOyB9IH1cblx0XHRlbHNlIGlmICggZWFjaC5rZXk9PT0nJyApIHsgcHVzaC5hcHBseShsaW5lcywgZWFjaC52YWx1ZSk7IH1cblx0XHRlbHNlIGlmICggc3BhY2U9PT1udWxsICkge1xuXHRcdFx0cHVzaGVzKGxpbmVzLCBlYWNoLmtleSwgJ1xcdCcsIHJlcGxhY2VyPT09bnVsbFxuXHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIGVhY2gudmFsdWUsIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0OiBlYWNoLnZhbHVlXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHZhciBrZXlzID0gW2VhY2gua2V5XTtcblx0XHRcdHZhciB2YWx1ZXMgPSBbZWFjaC52YWx1ZV07XG5cdFx0XHR3aGlsZSAoICsrbGV2ZWxJbmRleDxsZXZlbExlbmd0aCApIHtcblx0XHRcdFx0ZWFjaCA9IGxldmVsW2xldmVsSW5kZXhdO1xuXHRcdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRcdGNoZWNrKGVhY2gsIHJlcGxhY2VyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBlYWNoPT09J251bWJlcicgKSB7XG5cdFx0XHRcdFx0LS1sZXZlbEluZGV4O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGtleXMucHVzaChlYWNoLmtleSk7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKGVhY2gudmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGtleXNfaW5kZW50ID0gc3BhY2Uoa2V5cywgY29udGV4dCk7XG5cdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBrZXlzX2luZGVudCE9PSdvYmplY3QnIHx8IGtleXNfaW5kZW50PT09bnVsbCApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpKScpOyB9XG5cdFx0XHRcdGlmICggISggJ2tleXMnIGluIGtleXNfaW5kZW50ICkgfHwgISggJ2luZGVudCcgaW4ga2V5c19pbmRlbnQgKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkpJyk7IH1cblx0XHRcdFx0aWYgKCAhaXNBcnJheShrZXlzX2luZGVudC5rZXlzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmtleXMpJyk7IH1cblx0XHRcdFx0aWYgKCBrZXlzX2luZGVudC5rZXlzLmxlbmd0aCE9PXZhbHVlcy5sZW5ndGggKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmtleXMubGVuZ3RoKScpOyB9XG5cdFx0XHRcdGlmICggbm90U3RyaW5nQXJyYXkoa2V5c19pbmRlbnQua2V5cykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzWypdKScpOyB9XG5cdFx0XHRcdGlmICggdHlwZW9mIGtleXNfaW5kZW50LmluZGVudCE9PSdzdHJpbmcnICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkuaW5kZW50KScpOyB9XG5cdFx0XHR9XG5cdFx0XHRrZXlzID0ga2V5c19pbmRlbnQua2V5cztcblx0XHRcdHZhciBpbmRlbnQgPSBrZXlzX2luZGVudC5pbmRlbnQ7XG5cdFx0XHRmb3IgKCB2YXIgbGVuZ3RoID0gdmFsdWVzLmxlbmd0aCwgaW5kZXggPSAwOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0XHRcdGlmICgga2V5c1tpbmRleF09PT0nJyApIHsgcHVzaC5hcHBseShsaW5lcywgdmFsdWVzW2luZGV4XSk7IH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0cHVzaGVzKGxpbmVzLCBrZXlzW2luZGV4XSwgaW5kZW50LCByZXBsYWNlcj09PW51bGxcblx0XHRcdFx0XHRcdD8gTGluZXMoY29udGV4dCwgdmFsdWVzW2luZGV4XSwgbnVsbCwgc3BhY2UsIGRlYnVnKVxuXHRcdFx0XHRcdFx0OiB2YWx1ZXNbaW5kZXhdXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gbGluZXM7XG59XG5cbmZ1bmN0aW9uIHB1c2hlcyAobGluZXMsIGtleSwgaW5kZW50LCBzdWJMaW5lcykge1xuXHR2YXIgbGVuZ3RoID0gc3ViTGluZXMubGVuZ3RoO1xuXHRpZiAoIGxlbmd0aD09PTAgKSB7IGxpbmVzLnB1c2goa2V5KTsgfVxuXHRlbHNlIHtcblx0XHRsaW5lcy5wdXNoKGtleStzdWJMaW5lc1swXSk7XG5cdFx0Zm9yICggdmFyIGluZGV4ID0gMTsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0bGluZXMucHVzaChpbmRlbnQrc3ViTGluZXNbaW5kZXhdKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gY2hlY2sgKGVhY2gsIHJlcGxhY2VyKSB7XG5cdGlmICggdHlwZW9mIGVhY2g9PT0nb2JqZWN0JyAmJiBlYWNoIT09bnVsbCApIHtcblx0XHRpZiAoICEoICdrZXknIGluIGVhY2ggKSB8fCAhKCAndmFsdWUnIGluIGVhY2ggKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0KScpOyB9XG5cdFx0aWYgKCB0eXBlb2YgZWFjaC5rZXkhPT0nc3RyaW5nJyB8fCAhL14oPzpbXlxcdFxcblxccl0qXFx0KT8kLy50ZXN0KGVhY2gua2V5KSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LmtleSknKTsgfVxuXHRcdGlmICggcmVwbGFjZXIhPT1udWxsIHx8IGVhY2gua2V5PT09JycgKSB7XG5cdFx0XHRpZiAoICFpc0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlKScpOyB9XG5cdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlWypdKScpOyB9XG5cdFx0fVxuXHR9XG5cdGVsc2UgaWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdGlmICggIS9eXFxkKyQvLnRlc3QoZWFjaCkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm51bWJlciknKTsgfVxuXHR9XG5cdGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl0pJyk7IH1cbn1cbiIsIi8vIFR5cGVFcnJvciwgUmFuZ2VFcnJvclxuaW1wb3J0IHsgUE9TSVRJVkVfSU5URUdFUiwgcmVwZWF0U3BhY2UgfSBmcm9tICcuL3V0aWwuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTcGFjZSAobWluV2lkdGgsIHBhZGRpbmcpIHtcblx0aWYgKCB0eXBlb2YgbWluV2lkdGghPT0nbnVtYmVyJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5TcGFjZShtaW5XaWR0aCknKTsgfVxuXHRpZiAoIHR5cGVvZiBwYWRkaW5nIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MuU3BhY2UoLHBhZGRpbmcpJyk7IH1cblx0dmFyIG11bHRpcGxlID0gbWluV2lkdGg8MDtcblx0aWYgKCBtdWx0aXBsZSApIHsgbWluV2lkdGggPSB+bWluV2lkdGg7IH1cblx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KG1pbldpZHRoKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MuU3BhY2UobWluV2lkdGgpJyk7IH1cblx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KHBhZGRpbmcpICkgeyB0aHJvdyBuZXcgUmFuZ2VFcnJvcignalRhYkRvYy5TcGFjZSgscGFkZGluZyknKTsgfVxuXHRyZXR1cm4gZnVuY3Rpb24gc3BhY2UgKGtleXMpIHtcblx0XHRyZXR1cm4ga2V5c19pbmRlbnQobXVsdGlwbGUsIG1pbldpZHRoLCBwYWRkaW5nLCBrZXlzKTtcblx0fTtcbn07XG5cbmZ1bmN0aW9uIGtleXNfaW5kZW50IChtdWx0aXBsZSwgbWluV2lkdGgsIHBhZGRpbmcsIGtleXMpIHtcblx0dmFyIG1heFdpZHRoID0gMTtcblx0dmFyIHdpZHRocyA9IFtdO1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdHZhciB3aWR0aCA9IDA7XG5cdFx0dmFyIGtleSA9IGtleXNbaW5kZXhdO1xuXHRcdGlmICgga2V5IT09JycgKSB7XG5cdFx0XHRmb3IgKCB2YXIgbCA9IGtleS5sZW5ndGgtMSwgaSA9IDA7IGk8bDsgKytpICkge1xuXHRcdFx0XHR2YXIgY2hhckNvZGUgPSBrZXkuY2hhckNvZGVBdChpKTtcblx0XHRcdFx0aWYgKCBjaGFyQ29kZTwweDgwICkgeyB3aWR0aCArPSAxOyB9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHdpZHRoICs9IDI7XG5cdFx0XHRcdFx0aWYgKCBjaGFyQ29kZT49MHhEODAwICYmIGNoYXJDb2RlPD0weERCRkYgJiYgaSsxPGwgKSB7XG5cdFx0XHRcdFx0XHRjaGFyQ29kZSA9IGtleS5jaGFyQ29kZUF0KGkrMSk7XG5cdFx0XHRcdFx0XHRjaGFyQ29kZT49MHhEQzAwICYmIGNoYXJDb2RlPD0weERGRkYgJiYgKytpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCB3aWR0aD5tYXhXaWR0aCApIHsgbWF4V2lkdGggPSB3aWR0aDsgfVxuXHRcdH1cblx0XHR3aWR0aHMucHVzaCh3aWR0aCk7XG5cdH1cblx0d2lkdGggPSBtYXhXaWR0aCtwYWRkaW5nO1xuXHRpZiAoIG11bHRpcGxlICkge1xuXHRcdGlmICggd2lkdGglbWluV2lkdGggKSB7IHdpZHRoICs9IG1pbldpZHRoLXdpZHRoJW1pbldpZHRoOyB9XG5cdH1cblx0ZWxzZSB7XG5cdFx0aWYgKCB3aWR0aDxtaW5XaWR0aCApIHsgd2lkdGggPSBtaW5XaWR0aDsgfVxuXHR9XG5cdGZvciAoIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdGtleSA9IGtleXNbaW5kZXhdO1xuXHRcdGlmICgga2V5IT09JycgKSB7XG5cdFx0XHRrZXlzW2luZGV4XSA9IGtleS5zbGljZSgwLCAtMSkrcmVwZWF0U3BhY2Uod2lkdGgtd2lkdGhzW2luZGV4XSk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB7IGtleXM6IGtleXMsIGluZGVudDogcmVwZWF0U3BhY2Uod2lkdGgpIH07XG59XG4iLCJpbXBvcnQgdmVyc2lvbiBmcm9tICcuLi92ZXJzaW9uP3RleHQnO1xuaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UuanMnO1xuaW1wb3J0IHN0cmluZ2lmeSBmcm9tICcuL3N0cmluZ2lmeS5qcyc7XG5pbXBvcnQgU3BhY2UgZnJvbSAnLi9TcGFjZS5qcyc7XG52YXIgalRhYkRvYyA9IHtcblx0cGFyc2U6IHBhcnNlLFxuXHRzdHJpbmdpZnk6IHN0cmluZ2lmeSxcblx0U3BhY2U6IFNwYWNlLFxuXHR2ZXJzaW9uOiB2ZXJzaW9uXG59O1xualRhYkRvY1snZGVmYXVsdCddID0galRhYkRvYztcbmV4cG9ydCB7XG5cdHBhcnNlLFxuXHRzdHJpbmdpZnksXG5cdFNwYWNlLFxuXHR2ZXJzaW9uXG59O1xuZXhwb3J0IGRlZmF1bHQgalRhYkRvYzsiXSwibmFtZXMiOlsidW5kZWZpbmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGVBQWUsT0FBTzs7dUJBQUMsdEJDQ3ZCOztDQUVBLElBQUlBLFdBQVMsQ0FBQztBQUNkLENBQ0EsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7Q0FDekMsSUFBSSxJ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