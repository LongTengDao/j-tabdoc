import { undefined, isArray, isBuffer, toStringFollowBOM } from './global.js';// TypeError, RangeError, Error
import { POSITIVE_INTEGER, notStringArray } from './util.js';

var BOM = /^\uFEFF/;
var EOL = /\r\n?|\n/;

export default function parse (tabLines, _reviver, _number, _debug) {
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
		if ( countEmpties===undefined ) { countEmpties = true; }
		if ( groupReviver===undefined ) { groupReviver = null; }
		if ( levelReviver===undefined ) { levelReviver = null; }
	}
	if ( _number===undefined ) { _number = 1; }
	if ( _debug!==false ) {
		if ( arguments.length>4 ) { throw new Error('jTabDoc.parse(tabLines, reviver, number, debug, ...)'); }
		if ( _debug===undefined ) { _debug = true; }
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
};

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
			if ( matched===undefined ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec())'); }
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
				if ( level[level.length-1]===undefined ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())'); }
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
			if ( level[level.length-1]===undefined ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())'); }
		}
		reviverIndex = 0;
		pendingKeys = pendingKeys.slice(keyLength);
	}
	throw new Error('jTabDoc.parse(,reviver.group[!])');
}
