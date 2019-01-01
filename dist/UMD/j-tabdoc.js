﻿/*!
 * 模块名称：jTabDoc
 * 模块功能：TabDoc 的官方标准实现。从属于“简计划”。
   　　　　　The official standard implementation of TabDoc. Belong to "Plan J".
 * 模块版本：1.0.1
 * 许可条款：LGPL-3.0
 * 所属作者：龙腾道 <LongTengDao@LongTengDao.com> (www.LongTengDao.com)
 * 问题反馈：https://GitHub.com/LongTengDao/j-tabdoc/issues
 * 项目主页：https://GitHub.com/LongTengDao/j-tabdoc/
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.jTabDoc = factory());
}(this, function () { 'use strict';

	var version = '1.0.1';

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

}));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZlcnNpb24/dGV4dCIsImdsb2JhbC5qcyIsInV0aWwuanMiLCJwYXJzZS5qcyIsInN0cmluZ2lmeS5qcyIsIlNwYWNlLmpzIiwiZXhwb3J0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0ICcxLjAuMSc7IiwiLy8gT2JqZWN0LCBBcnJheSwgQnVmZmVyXG52YXIgdW5kZWZpbmVkO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgcHVzaCA9IEFycmF5LnByb3RvdHlwZS5wdXNoO1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIGlzQXJyYXkgKGxpbmVzKSB7IHJldHVybiB0b1N0cmluZy5jYWxsKGxpbmVzKT09PSdbb2JqZWN0IEFycmF5XSc7IH07XG5cbmlmICggdHlwZW9mIEJ1ZmZlcj09PSdmdW5jdGlvbicgKSB7XG5cdHZhciBpc0J1ZmZlciA9IEJ1ZmZlci5pc0J1ZmZlcjtcblx0aWYgKCB0eXBlb2YgaXNCdWZmZXI9PT0nZnVuY3Rpb24nICYmIHR5cGVvZiBCdWZmZXIuZnJvbT09PSdmdW5jdGlvbicgKSB7XG5cdFx0dmFyIGZyb20gPSBCdWZmZXIuaGFzT3duUHJvcGVydHkoJ2Zyb20nKSA/IEJ1ZmZlci5mcm9tIDogZnVuY3Rpb24gZnJvbSAoYnVmZmVyKSB7IHJldHVybiBuZXcgQnVmZmVyKGJ1ZmZlcik7IH07XG5cdFx0dmFyIHRvU3RyaW5nRm9sbG93Qk9NID0gZnVuY3Rpb24gdG9TdHJpbmdGb2xsb3dCT00gKGJ1ZmZlcikge1xuXHRcdFx0c3dpdGNoICggYnVmZmVyWzBdICkge1xuXHRcdFx0XHRjYXNlIDB4RUY6IGlmICggYnVmZmVyWzFdPT09MHhCQiAmJiBidWZmZXJbMl09PT0weEJGICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDMpLnRvU3RyaW5nKCd1dGY4Jyk7IH0gYnJlYWs7XG5cdFx0XHRcdGNhc2UgMHhGRjogaWYgKCBidWZmZXJbMV09PT0weEZFICkgeyByZXR1cm4gYnVmZmVyLnNsaWNlKDIpLnRvU3RyaW5nKCd1Y3MyJyk7IH0gYnJlYWs7XG5cdFx0XHRcdGNhc2UgMHhGRTogaWYgKCBidWZmZXJbMV09PT0weEZGICkgeyBidWZmZXIgPSBmcm9tKGJ1ZmZlcik7IHJldHVybiBidWZmZXIuc3dhcDE2KCkuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTsgfSBicmVhaztcblx0XHRcdH1cblx0XHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoKTtcblx0XHR9O1xuXHR9XG5cdGVsc2UgeyBpc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9OyB9XG59XG5lbHNlIHsgaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoKSB7IHJldHVybiBmYWxzZTsgfTsgfVxuXG5leHBvcnQgeyB1bmRlZmluZWQsIGhhc093blByb3BlcnR5LCB0b1N0cmluZywgcHVzaCwgaXNBcnJheSwgaXNCdWZmZXIsIHRvU3RyaW5nRm9sbG93Qk9NIH07Ly8gVHlwZUVycm9yLCBFcnJvciwgUmFuZ2VFcnJvclxuIiwiZXhwb3J0IHZhciBQT1NJVElWRV9JTlRFR0VSID0gL15bMS05XVxcZCokLztcblxuZXhwb3J0IHZhciByZXBlYXRTcGFjZSA9ICcnLnJlcGVhdFxuXHQ/IGZ1bmN0aW9uIHJlcGVhdFNwYWNlIChjb3VudCkgeyByZXR1cm4gJyAnLnJlcGVhdChjb3VudCk7IH1cblx0OiBmdW5jdGlvbiAoc3BhY2VzKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHJlcGVhdFNwYWNlIChjb3VudCkge1xuXHRcdFx0c3BhY2VzLmxlbmd0aCA9IGNvdW50KzE7XG5cdFx0XHRyZXR1cm4gc3BhY2VzLmpvaW4oJyAnKTtcblx0XHR9O1xuXHR9KFtdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vdFN0cmluZ0FycmF5IChhcnJheSkge1xuXHRmb3IgKCB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRpZiAoIHR5cGVvZiBhcnJheVtpbmRleF0hPT0nc3RyaW5nJyApIHsgcmV0dXJuIHRydWU7IH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyB1bmRlZmluZWQsIGlzQXJyYXksIGlzQnVmZmVyLCB0b1N0cmluZ0ZvbGxvd0JPTSB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBQT1NJVElWRV9JTlRFR0VSLCBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbnZhciBCT00gPSAvXlxcdUZFRkYvO1xudmFyIEVPTCA9IC9cXHJcXG4/fFxcbi87XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlICh0YWJMaW5lcywgX3Jldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zykge1xuXHRpZiAoICFpc0FycmF5KHRhYkxpbmVzKSApIHtcblx0XHRpZiAoIHR5cGVvZiB0YWJMaW5lcz09PSdzdHJpbmcnICkgeyB0YWJMaW5lcyA9IHRhYkxpbmVzLnJlcGxhY2UoQk9NLCAnJykuc3BsaXQoRU9MKTsgfVxuXHRcdGVsc2UgaWYgKCBpc0J1ZmZlcih0YWJMaW5lcykgKSB7IHRhYkxpbmVzID0gdG9TdHJpbmdGb2xsb3dCT00odGFiTGluZXMpLnNwbGl0KEVPTCk7IH1cblx0fVxuXHRpZiAoIF9yZXZpdmVyPT1udWxsICkge1xuXHRcdHZhciBjb3VudEVtcHRpZXMgPSB0cnVlO1xuXHRcdHZhciBncm91cFJldml2ZXIgPSBudWxsO1xuXHRcdHZhciBsZXZlbFJldml2ZXIgPSBudWxsO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGNvdW50RW1wdGllcyA9IF9yZXZpdmVyLmVtcHR5O1xuXHRcdGdyb3VwUmV2aXZlciA9IF9yZXZpdmVyLmdyb3VwO1xuXHRcdGxldmVsUmV2aXZlciA9IF9yZXZpdmVyLmxldmVsO1xuXHRcdGlmICggY291bnRFbXB0aWVzPT09dW5kZWZpbmVkICkgeyBjb3VudEVtcHRpZXMgPSB0cnVlOyB9XG5cdFx0aWYgKCBncm91cFJldml2ZXI9PT11bmRlZmluZWQgKSB7IGdyb3VwUmV2aXZlciA9IG51bGw7IH1cblx0XHRpZiAoIGxldmVsUmV2aXZlcj09PXVuZGVmaW5lZCApIHsgbGV2ZWxSZXZpdmVyID0gbnVsbDsgfVxuXHR9XG5cdGlmICggX251bWJlcj09PXVuZGVmaW5lZCApIHsgX251bWJlciA9IDE7IH1cblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzLCByZXZpdmVyLCBudW1iZXIsIGRlYnVnLCAuLi4pJyk7IH1cblx0XHRpZiAoIF9kZWJ1Zz09PXVuZGVmaW5lZCApIHsgX2RlYnVnID0gdHJ1ZTsgfVxuXHRcdGVsc2UgaWYgKCBfZGVidWchPT10cnVlICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLCxkZWJ1ZyknKTsgfVxuXHRcdGlmICggIWlzQXJyYXkodGFiTGluZXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKHRhYkxpbmVzKScpOyB9XG5cdFx0aWYgKCBub3RTdHJpbmdBcnJheSh0YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXNbKl0pJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBjb3VudEVtcHRpZXMhPT0nYm9vbGVhbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZW1wdHkpJyk7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGdyb3VwUmV2aXZlciE9PSdib29sZWFuJyApIHtcblx0XHRcdGlmICggIWlzQXJyYXkoZ3JvdXBSZXZpdmVyKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cCknKTsgfVxuXHRcdFx0Zm9yICggdmFyIGxlbmd0aCA9IGdyb3VwUmV2aXZlci5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHR2YXIgZWFjaCA9IGdyb3VwUmV2aXZlcltpbmRleF07XG5cdFx0XHRcdGlmICggIWlzQXJyYXkoZWFjaCkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl0pJyk7IH1cblx0XHRcdFx0aWYgKCAhZWFjaFswXSB8fCB0eXBlb2YgZWFjaFswXS5leGVjIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBlYWNoWzFdIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVsxXSknKTsgfVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIGxldmVsUmV2aXZlciE9PW51bGwgJiYgdHlwZW9mIGxldmVsUmV2aXZlciE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIubGV2ZWwpJyk7IH1cblx0XHRpZiAoIHR5cGVvZiBfbnVtYmVyIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLCxudW1iZXIpJyk7IH1cblx0XHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QoX251bWJlcikgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLnBhcnNlKCwsbnVtYmVyKScpOyB9XG5cdH1cblx0cmV0dXJuIHRhYkxpbmVzLmxlbmd0aD09PTAgP1xuXHRcdGxldmVsUmV2aXZlcj09PW51bGwgPyBbXSA6IGNhbGwobGV2ZWxSZXZpdmVyLCB0aGlzLCBbXSkgOlxuXHRcdExldmVsKHRoaXMsIHRhYkxpbmVzLCBncm91cFJldml2ZXIgPyBhcHBlbmRHcm91cCA6IGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIF9udW1iZXIsIF9kZWJ1Zyk7XG59O1xuXG5mdW5jdGlvbiBMZXZlbCAoY29udGV4dCwgdGFiTGluZXMsIGFwcGVuZCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgbnVtYmVyLCBkZWJ1Zykge1xuXHR2YXIgbGV2ZWwgICAgID0gW10sXG5cdFx0bGFzdEluZGV4ID0gdGFiTGluZXMubGVuZ3RoLTEsXG5cdFx0aW5kZXggICAgID0gMCxcblx0XHRibGFuayAgICAgPSB0YWJMaW5lc1swXS5sZW5ndGg9PT0wO1xuXHRvdXRlcjogZm9yICggOyA7ICkge1xuXHRcdHZhciBmcm9tID0gaW5kZXg7XG5cdFx0aWYgKCBibGFuayApIHtcblx0XHRcdGlmICggY291bnRFbXB0aWVzICkge1xuXHRcdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRcdGxldmVsLnB1c2goaW5kZXgrMS1mcm9tKTtcblx0XHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIHRhYkxpbmVzWysraW5kZXhdLmxlbmd0aCE9PTAgKSB7XG5cdFx0XHRcdFx0XHRsZXZlbC5wdXNoKGluZGV4LWZyb20pO1xuXHRcdFx0XHRcdFx0YmxhbmsgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoIT09MCApIHtcblx0XHRcdFx0XHRcdGJsYW5rID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7XG5cdFx0XHRcdFx0YXBwZW5kKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIGdyb3VwUmV2aXZlciwgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZnJvbSwgaW5kZXgsIG51bWJlciwgZGVidWcpO1xuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoPT09MCApIHtcblx0XHRcdFx0XHRhcHBlbmQoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmcm9tLCBpbmRleC0xLCBudW1iZXIsIGRlYnVnKTtcblx0XHRcdFx0XHRibGFuayA9IHRydWU7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0bGV2ZWwubnVtYmVyID0gbnVtYmVyO1xuXHRyZXR1cm4gbGV2ZWxSZXZpdmVyPT09bnVsbCA/IGxldmVsIDogY2FsbChsZXZlbFJldml2ZXIsIGNvbnRleHQsIGxldmVsKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kRmxhdCAoY29udGV4dCwgbGV2ZWwsIGNvdW50RW1wdGllcywgZ3JvdXBSZXZpdmVyLCBsZXZlbFJldml2ZXIsIHRhYkxpbmVzLCBmaXJzdEluZGV4LCBsYXN0SW5kZXgsIGJhc2VOdW1iZXIsIGRlYnVnKSB7XG5cdHZhciBrZXksXG5cdFx0dmFsdWUsXG5cdFx0bnVtYmVyO1xuXHRvdXRlcjogZm9yICggdmFyIGxpbmVJbmRleCA9IGZpcnN0SW5kZXgsIGxpbmUgPSB0YWJMaW5lc1tsaW5lSW5kZXhdLCB0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7IDsgKSB7XG5cdFx0dmFsdWUgPSBbXTtcblx0XHRudW1iZXIgPSBiYXNlTnVtYmVyK2xpbmVJbmRleDtcblx0XHRpZiAoIHRhYkluZGV4PT09IC0xICkge1xuXHRcdFx0a2V5ID0gJyc7XG5cdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHsgYnJlYWsgb3V0ZXI7IH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09IC0xICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICggdGFiSW5kZXg9PT0wICkge1xuXHRcdFx0XHRrZXkgPSAnXFx0Jztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBsaW5lLnNsaWNlKDAsIHRhYkluZGV4KzEpO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UodGFiSW5kZXgrMSkpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRpZiAoIGxpbmVJbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIGdyb3VwUmV2aXZlcj09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdH1cblx0XHRsZXZlbC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRsZXZlbC5wdXNoKHtcblx0XHRrZXk6IGtleSxcblx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0bnVtYmVyOiBudW1iZXJcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEdyb3VwIChjb250ZXh0LCBsZXZlbCwgY291bnRFbXB0aWVzLCBncm91cFJldml2ZXIsIGxldmVsUmV2aXZlciwgdGFiTGluZXMsIGZpcnN0SW5kZXgsIGxhc3RJbmRleCwgYmFzZU51bWJlciwgZGVidWcpIHtcblx0dmFyIHBlbmRpbmdHcm91cCA9IFtdLFxuXHRcdHBlbmRpbmdLZXlzICA9ICcnLFxuXHRcdGtleSxcblx0XHR2YWx1ZSxcblx0XHRudW1iZXI7XG5cdG91dGVyOiBmb3IgKCB2YXIgbGluZUluZGV4ID0gZmlyc3RJbmRleCwgbGluZSA9IHRhYkxpbmVzW2xpbmVJbmRleF0sIHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTsgOyApIHtcblx0XHR2YWx1ZSA9IFtdO1xuXHRcdG51bWJlciA9IGJhc2VOdW1iZXIrbGluZUluZGV4O1xuXHRcdGlmICggdGFiSW5kZXg9PT0gLTEgKSB7XG5cdFx0XHRrZXkgPSAnJztcblx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHRwZW5kaW5nS2V5cyArPSAnXFxuJztcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PSAtMSApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIHRhYkluZGV4PT09MCApIHtcblx0XHRcdFx0a2V5ID0gJ1xcdCc7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9ICdcXHRcXG4nO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGtleSA9IGxpbmUuc2xpY2UoMCwgdGFiSW5kZXgrMSk7XG5cdFx0XHRcdHBlbmRpbmdLZXlzICs9IGtleSsnXFxuJztcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKHRhYkluZGV4KzEpKTtcblx0XHRcdH1cblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PTAgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBlbmRpbmdHcm91cC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRwZW5kaW5nR3JvdXAucHVzaCh7XG5cdFx0a2V5OiBrZXksXG5cdFx0dmFsdWU6IHZhbHVlLFxuXHRcdG51bWJlcjogbnVtYmVyXG5cdH0pO1xuXHRpZiAoIGdyb3VwUmV2aXZlcj09PXRydWUgKSB7XG5cdFx0bGV2ZWwucHVzaChwZW5kaW5nR3JvdXAubGVuZ3RoPT09MSA/IHBlbmRpbmdHcm91cFswXSA6IHBlbmRpbmdHcm91cCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGZvciAoIHZhciByZXZpdmVyTGVuZ3RoID0gZ3JvdXBSZXZpdmVyLmxlbmd0aCwgcmV2aXZlckluZGV4ID0gMDsgcmV2aXZlckluZGV4PHJldml2ZXJMZW5ndGg7ICsrcmV2aXZlckluZGV4ICkge1xuXHRcdHZhciByZWdFeHBfZnVuY3Rpb24gPSBncm91cFJldml2ZXJbcmV2aXZlckluZGV4XTtcblx0XHR2YXIgbWF0Y2hlZCA9IHJlZ0V4cF9mdW5jdGlvblswXS5leGVjKHBlbmRpbmdLZXlzKTtcblx0XHRpZiAoIG1hdGNoZWQ9PT1udWxsICkgeyBjb250aW51ZTsgfVxuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRpZiAoIG1hdGNoZWQ9PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKCkpJyk7IH1cblx0XHRcdGlmICggbWF0Y2hlZC5pbmRleCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKS5pbmRleCknKTsgfVxuXHRcdFx0aWYgKCB0eXBlb2YgbWF0Y2hlZFswXSE9PSdzdHJpbmcnICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXSknKTsgfVxuXHRcdFx0aWYgKCBtYXRjaGVkWzBdLmxlbmd0aD09PTAgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0ubGVuZ3RoKScpOyB9XG5cdFx0XHRpZiAoIG1hdGNoZWRbMF0uY2hhckF0KG1hdGNoZWRbMF0ubGVuZ3RoLTEpIT09J1xcbicgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0pJyk7IH1cblx0XHR9XG5cdFx0dmFyIHRoaXNLZXlzID0gbWF0Y2hlZFswXTtcblx0XHR2YXIga2V5TGVuZ3RoID0gdGhpc0tleXMubGVuZ3RoO1xuXHRcdGlmICggcGVuZGluZ0tleXMubGVuZ3RoPT09a2V5TGVuZ3RoICkge1xuXHRcdFx0bGV2ZWwucHVzaChjYWxsKHJlZ0V4cF9mdW5jdGlvblsxXSwgY29udGV4dCwgcGVuZGluZ0dyb3VwLmxlbmd0aD09PTEgPyBwZW5kaW5nR3JvdXBbMF0gOiBwZW5kaW5nR3JvdXApKTtcblx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdGlmICggbGV2ZWxbbGV2ZWwubGVuZ3RoLTFdPT09dW5kZWZpbmVkICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzFdKCkpJyk7IH1cblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dmFyIGNvdW50ID0gMTtcblx0XHRmb3IgKCB2YXIgaW5kZXhPZkxGID0gdGhpc0tleXMuaW5kZXhPZignXFxuJyk7IDsgKytjb3VudCApIHtcblx0XHRcdGluZGV4T2ZMRiA9IHRoaXNLZXlzLmluZGV4T2YoJ1xcbicsIGluZGV4T2ZMRisxKTtcblx0XHRcdGlmICggaW5kZXhPZkxGPDAgKSB7IGJyZWFrOyB9XG5cdFx0fVxuXHRcdGxldmVsLnB1c2goY2FsbChyZWdFeHBfZnVuY3Rpb25bMV0sIGNvbnRleHQsIGNvdW50PT09MSA/IHBlbmRpbmdHcm91cC5zaGlmdCgpIDogcGVuZGluZ0dyb3VwLnNwbGljZSgwLCBjb3VudCkpKTtcblx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdH1cblx0XHRyZXZpdmVySW5kZXggPSAwO1xuXHRcdHBlbmRpbmdLZXlzID0gcGVuZGluZ0tleXMuc2xpY2Uoa2V5TGVuZ3RoKTtcblx0fVxuXHR0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbIV0pJyk7XG59XG5cbmZ1bmN0aW9uIGNhbGwgKHJldml2ZXIsIGNvbnRleHQsIGFyZ3VtZW50KSB7XG5cdHJldHVybiByZXZpdmVyLnByb3RvdHlwZT09bnVsbFxuXHRcdD8gcmV2aXZlcihhcmd1bWVudCwgY29udGV4dClcblx0XHQ6IG5ldyByZXZpdmVyKGFyZ3VtZW50LCBjb250ZXh0KTtcbn1cbiIsImltcG9ydCB7IHVuZGVmaW5lZCwgaXNBcnJheSwgcHVzaCB9IGZyb20gJy4vZ2xvYmFsLmpzJzsvLyBUeXBlRXJyb3IsIEVycm9yXG5pbXBvcnQgeyBub3RTdHJpbmdBcnJheSB9IGZyb20gJy4vdXRpbC5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHN0cmluZ2lmeSAobGV2ZWwsIF9yZXBsYWNlciwgX3NwYWNlLCBfZGVidWcpIHtcblx0aWYgKCBfZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeShsZXZlbCwgcmVwbGFjZXIsIHNwYWNlLCBkZWJ1ZywgLi4uKScpOyB9XG5cdFx0aWYgKCBfZGVidWc9PT11bmRlZmluZWQgKSB7IF9kZWJ1ZyA9IHRydWU7IH1cblx0XHRlbHNlIGlmICggX2RlYnVnIT09dHJ1ZSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCwsZGVidWcpJyk7IH1cblx0XHRpZiAoIF9yZXBsYWNlciE9bnVsbCAmJiB0eXBlb2YgX3JlcGxhY2VyIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLHJlcGxhY2VyKScpOyB9XG5cdFx0aWYgKCBfc3BhY2UhPW51bGwgJiYgdHlwZW9mIF9zcGFjZSE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UpJyk7IH1cblx0fVxuXHRpZiAoIF9yZXBsYWNlcj09PXVuZGVmaW5lZCApIHsgX3JlcGxhY2VyID0gbnVsbDsgfVxuXHRpZiAoIF9zcGFjZT09PXVuZGVmaW5lZCApIHsgX3NwYWNlID0gbnVsbDsgfVxuXHRyZXR1cm4gTGluZXModGhpcywgbGV2ZWwsIF9yZXBsYWNlciwgX3NwYWNlLCBfZGVidWcpO1xufTtcblxuZnVuY3Rpb24gTGluZXMgKGNvbnRleHQsIGxldmVsLCByZXBsYWNlciwgc3BhY2UsIGRlYnVnKSB7XG5cdGlmICggcmVwbGFjZXIhPT1udWxsICkgeyBsZXZlbCA9IHJlcGxhY2VyKGxldmVsLCBjb250ZXh0KTsgfVxuXHRpZiAoIGRlYnVnICkge1xuXHRcdGlmICggIWlzQXJyYXkobGV2ZWwpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeShsZXZlbCknKTsgfVxuXHR9XG5cdHZhciBsaW5lcyA9IFtdO1xuXHRmb3IgKCB2YXIgbGV2ZWxMZW5ndGggPSBsZXZlbC5sZW5ndGgsIGxldmVsSW5kZXggPSAwOyBsZXZlbEluZGV4PGxldmVsTGVuZ3RoOyArK2xldmVsSW5kZXggKSB7XG5cdFx0dmFyIGVhY2ggPSBsZXZlbFtsZXZlbEluZGV4XTtcblx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0Y2hlY2soZWFjaCwgcmVwbGFjZXIpO1xuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBlYWNoPT09J251bWJlcicgKSB7IHdoaWxlICggZWFjaC0tICkgeyBsaW5lcy5wdXNoKCcnKTsgfSB9XG5cdFx0ZWxzZSBpZiAoIGVhY2gua2V5PT09JycgKSB7IHB1c2guYXBwbHkobGluZXMsIGVhY2gudmFsdWUpOyB9XG5cdFx0ZWxzZSBpZiAoIHNwYWNlPT09bnVsbCApIHtcblx0XHRcdHB1c2hlcyhsaW5lcywgZWFjaC5rZXksICdcXHQnLCByZXBsYWNlcj09PW51bGxcblx0XHRcdFx0PyBMaW5lcyhjb250ZXh0LCBlYWNoLnZhbHVlLCBudWxsLCBzcGFjZSwgZGVidWcpXG5cdFx0XHRcdDogZWFjaC52YWx1ZVxuXHRcdFx0KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR2YXIga2V5cyA9IFtlYWNoLmtleV07XG5cdFx0XHR2YXIgdmFsdWVzID0gW2VhY2gudmFsdWVdO1xuXHRcdFx0d2hpbGUgKCArK2xldmVsSW5kZXg8bGV2ZWxMZW5ndGggKSB7XG5cdFx0XHRcdGVhY2ggPSBsZXZlbFtsZXZlbEluZGV4XTtcblx0XHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdFx0XHRcdC0tbGV2ZWxJbmRleDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRrZXlzLnB1c2goZWFjaC5rZXkpO1xuXHRcdFx0XHR2YWx1ZXMucHVzaChlYWNoLnZhbHVlKTtcblx0XHRcdH1cblx0XHRcdHZhciBrZXlzX2luZGVudCA9IHNwYWNlKGtleXMsIGNvbnRleHQpO1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Yga2V5c19pbmRlbnQhPT0nb2JqZWN0JyB8fCBrZXlzX2luZGVudD09PW51bGwgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKSknKTsgfVxuXHRcdFx0XHRpZiAoICEoICdrZXlzJyBpbiBrZXlzX2luZGVudCApIHx8ICEoICdpbmRlbnQnIGluIGtleXNfaW5kZW50ICkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpKScpOyB9XG5cdFx0XHRcdGlmICggIWlzQXJyYXkoa2V5c19pbmRlbnQua2V5cykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzKScpOyB9XG5cdFx0XHRcdGlmICgga2V5c19pbmRlbnQua2V5cy5sZW5ndGghPT12YWx1ZXMubGVuZ3RoICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzLmxlbmd0aCknKTsgfVxuXHRcdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGtleXNfaW5kZW50LmtleXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkua2V5c1sqXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiBrZXlzX2luZGVudC5pbmRlbnQhPT0nc3RyaW5nJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmluZGVudCknKTsgfVxuXHRcdFx0fVxuXHRcdFx0a2V5cyA9IGtleXNfaW5kZW50LmtleXM7XG5cdFx0XHR2YXIgaW5kZW50ID0ga2V5c19pbmRlbnQuaW5kZW50O1xuXHRcdFx0Zm9yICggdmFyIGxlbmd0aCA9IHZhbHVlcy5sZW5ndGgsIGluZGV4ID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHRpZiAoIGtleXNbaW5kZXhdPT09JycgKSB7IHB1c2guYXBwbHkobGluZXMsIHZhbHVlc1tpbmRleF0pOyB9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHB1c2hlcyhsaW5lcywga2V5c1tpbmRleF0sIGluZGVudCwgcmVwbGFjZXI9PT1udWxsXG5cdFx0XHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIHZhbHVlc1tpbmRleF0sIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0XHRcdDogdmFsdWVzW2luZGV4XVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIGxpbmVzO1xufVxuXG5mdW5jdGlvbiBwdXNoZXMgKGxpbmVzLCBrZXksIGluZGVudCwgc3ViTGluZXMpIHtcblx0dmFyIGxlbmd0aCA9IHN1YkxpbmVzLmxlbmd0aDtcblx0aWYgKCBsZW5ndGg9PT0wICkgeyBsaW5lcy5wdXNoKGtleSk7IH1cblx0ZWxzZSB7XG5cdFx0bGluZXMucHVzaChrZXkrc3ViTGluZXNbMF0pO1xuXHRcdGZvciAoIHZhciBpbmRleCA9IDE7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRcdGxpbmVzLnB1c2goaW5kZW50K3N1YkxpbmVzW2luZGV4XSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGNoZWNrIChlYWNoLCByZXBsYWNlcikge1xuXHRpZiAoIHR5cGVvZiBlYWNoPT09J29iamVjdCcgJiYgZWFjaCE9PW51bGwgKSB7XG5cdFx0aWYgKCAhKCAna2V5JyBpbiBlYWNoICkgfHwgISggJ3ZhbHVlJyBpbiBlYWNoICkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdCknKTsgfVxuXHRcdGlmICggdHlwZW9mIGVhY2gua2V5IT09J3N0cmluZycgfHwgIS9eKD86W15cXHRcXG5cXHJdKlxcdCk/JC8udGVzdChlYWNoLmtleSkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC5rZXkpJyk7IH1cblx0XHRpZiAoIHJlcGxhY2VyIT09bnVsbCB8fCBlYWNoLmtleT09PScnICkge1xuXHRcdFx0aWYgKCAhaXNBcnJheShlYWNoLnZhbHVlKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC52YWx1ZSknKTsgfVxuXHRcdFx0aWYgKCBub3RTdHJpbmdBcnJheShlYWNoLnZhbHVlKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm9iamVjdC52YWx1ZVsqXSknKTsgfVxuXHRcdH1cblx0fVxuXHRlbHNlIGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHtcblx0XHRpZiAoICEvXlxcZCskLy50ZXN0KGVhY2gpICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCcrKCByZXBsYWNlciA/ICcscmVwbGFjZXIoKScgOiAnbGV2ZWwnICkrJ1sqXTpudW1iZXIpJyk7IH1cblx0fVxuXHRlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdKScpOyB9XG59XG4iLCIvLyBUeXBlRXJyb3IsIFJhbmdlRXJyb3JcbmltcG9ydCB7IFBPU0lUSVZFX0lOVEVHRVIsIHJlcGVhdFNwYWNlIH0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU3BhY2UgKG1pbldpZHRoLCBwYWRkaW5nKSB7XG5cdGlmICggdHlwZW9mIG1pbldpZHRoIT09J251bWJlcicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MuU3BhY2UobWluV2lkdGgpJyk7IH1cblx0aWYgKCB0eXBlb2YgcGFkZGluZyE9PSdudW1iZXInICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLlNwYWNlKCxwYWRkaW5nKScpOyB9XG5cdHZhciBtdWx0aXBsZSA9IG1pbldpZHRoPDA7XG5cdGlmICggbXVsdGlwbGUgKSB7IG1pbldpZHRoID0gfm1pbldpZHRoOyB9XG5cdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChtaW5XaWR0aCkgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLlNwYWNlKG1pbldpZHRoKScpOyB9XG5cdGlmICggIVBPU0lUSVZFX0lOVEVHRVIudGVzdChwYWRkaW5nKSApIHsgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2pUYWJEb2MuU3BhY2UoLHBhZGRpbmcpJyk7IH1cblx0cmV0dXJuIGZ1bmN0aW9uIHNwYWNlIChrZXlzKSB7XG5cdFx0cmV0dXJuIGtleXNfaW5kZW50KG11bHRpcGxlLCBtaW5XaWR0aCwgcGFkZGluZywga2V5cyk7XG5cdH07XG59O1xuXG5mdW5jdGlvbiBrZXlzX2luZGVudCAobXVsdGlwbGUsIG1pbldpZHRoLCBwYWRkaW5nLCBrZXlzKSB7XG5cdHZhciBtYXhXaWR0aCA9IDE7XG5cdHZhciB3aWR0aHMgPSBbXTtcblx0Zm9yICggdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoLCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHR2YXIgd2lkdGggPSAwO1xuXHRcdHZhciBrZXkgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0Zm9yICggdmFyIGwgPSBrZXkubGVuZ3RoLTEsIGkgPSAwOyBpPGw7ICsraSApIHtcblx0XHRcdFx0dmFyIGNoYXJDb2RlID0ga2V5LmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRcdGlmICggY2hhckNvZGU8MHg4MCApIHsgd2lkdGggKz0gMTsgfVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHR3aWR0aCArPSAyO1xuXHRcdFx0XHRcdGlmICggY2hhckNvZGU+PTB4RDgwMCAmJiBjaGFyQ29kZTw9MHhEQkZGICYmIGkrMTxsICkge1xuXHRcdFx0XHRcdFx0Y2hhckNvZGUgPSBrZXkuY2hhckNvZGVBdChpKzEpO1xuXHRcdFx0XHRcdFx0Y2hhckNvZGU+PTB4REMwMCAmJiBjaGFyQ29kZTw9MHhERkZGICYmICsraTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggd2lkdGg+bWF4V2lkdGggKSB7IG1heFdpZHRoID0gd2lkdGg7IH1cblx0XHR9XG5cdFx0d2lkdGhzLnB1c2god2lkdGgpO1xuXHR9XG5cdHdpZHRoID0gbWF4V2lkdGgrcGFkZGluZztcblx0aWYgKCBtdWx0aXBsZSApIHtcblx0XHRpZiAoIHdpZHRoJW1pbldpZHRoICkgeyB3aWR0aCArPSBtaW5XaWR0aC13aWR0aCVtaW5XaWR0aDsgfVxuXHR9XG5cdGVsc2Uge1xuXHRcdGlmICggd2lkdGg8bWluV2lkdGggKSB7IHdpZHRoID0gbWluV2lkdGg7IH1cblx0fVxuXHRmb3IgKCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRrZXkgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0a2V5c1tpbmRleF0gPSBrZXkuc2xpY2UoMCwgLTEpK3JlcGVhdFNwYWNlKHdpZHRoLXdpZHRoc1tpbmRleF0pO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4geyBrZXlzOiBrZXlzLCBpbmRlbnQ6IHJlcGVhdFNwYWNlKHdpZHRoKSB9O1xufVxuIiwiaW1wb3J0IHZlcnNpb24gZnJvbSAnLi92ZXJzaW9uP3RleHQnO1xuaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UuanMnO1xuaW1wb3J0IHN0cmluZ2lmeSBmcm9tICcuL3N0cmluZ2lmeS5qcyc7XG5pbXBvcnQgU3BhY2UgZnJvbSAnLi9TcGFjZS5qcyc7XG52YXIgalRhYkRvYyA9IHtcblx0cGFyc2U6IHBhcnNlLFxuXHRzdHJpbmdpZnk6IHN0cmluZ2lmeSxcblx0U3BhY2U6IFNwYWNlLFxuXHR2ZXJzaW9uOiB2ZXJzaW9uXG59O1xualRhYkRvY1snZGVmYXVsdCddID0galRhYkRvYztcbmV4cG9ydCB7XG5cdHBhcnNlLFxuXHRzdHJpbmdpZnksXG5cdFNwYWNlLFxuXHR2ZXJzaW9uXG59O1xuZXhwb3J0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QUFJLENBQUMsQ0FBQztDQUN4RCxFQUFFLENBQUM7Q0FDSCxDQUFDLEFBQ0Q7Q0FDQSxTQUFTLFdBQVcsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Q0FDekQsQ0FBQyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7Q0FDbEIsQ0FBQyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7Q0FDakIsQ0FBQyxNQUFNLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxHQUFHO0NBQ3BFLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0NBQ2hCLEVBQUUsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3hCLEVBQUUsS0FBSyxHQUFHLEdBQUcsRUFBRSxHQUFHO0NBQ2xCLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUc7Q0FDakQsSUFBSSxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3JDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxHQUFHLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFO0NBQ3hDLFNBQVM7Q0FDVCxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUM7Q0FDaEIsS0FBSyxLQUFLLFFBQVEsRUFBRSxNQUFNLElBQUksUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRztDQUMxRCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNyQyxNQUFNLFFBQVEsRUFBRSxNQUFNLElBQUksUUFBUSxFQUFFLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQztDQUNsRCxNQUFNO0NBQ04sS0FBSztDQUNMLElBQUk7Q0FDSixHQUFHLEtBQUssS0FBSyxDQUFDLFFBQVEsR0FBRyxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsRUFBRTtDQUM5QyxHQUFHO0NBQ0gsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3JCLEVBQUU7Q0FDRixDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO0NBQzFCLENBQUMsS0FBSyxRQUFRLEdBQUc7Q0FDakIsRUFBRSxLQUFLLEtBQUssQ0FBQyxRQUFRLEdBQUcsRUFBRSxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRTtDQUM3RCxFQUFFO0NBQ0YsTUFBTTtDQUNOLEVBQUUsS0FBSyxLQUFLLENBQUMsUUFBUSxHQUFHLEVBQUUsS0FBSyxHQUFHLFFBQVEsQ0FBQyxFQUFFO0NBQzdDLEVBQUU7Q0FDRixDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxHQUFHO0NBQzFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUNwQixFQUFFLEtBQUssR0FBRyxHQUFHLEVBQUUsR0FBRztDQUNsQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Q0FDbkUsR0FBRztDQUNILEVBQUU7Q0FDRixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztDQUNuRCxDQUFDOztDQy9DRCxJQUFJLE9BQU8sR0FBRztDQUNkLENBQUMsS0FBSyxFQUFFLEtBQUs7Q0FDYixDQUFDLFNBQVMsRUFBRSxTQUFTO0NBQ3JCLENBQUMsS0FBSyxFQUFFLEtBQUs7Q0FDYixDQUFDLE9BQU8sRUFBRSxPQUFPO0NBQ2pCLENBQUMsQ0FBQztDQUNGLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUM7Ozs7Ozs7OyJ9