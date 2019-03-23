import undefined from '.void';
import isArray from '.Array.isArray?=';
import { isBuffer, toStringFollowBOM } from './global';
import TypeError from '.TypeError';
import RangeError from '.RangeError';
import Error from '.Error';
import { POSITIVE_INTEGER, notStringArray } from './util';

var BOM = /^\uFEFF/;
var EOL = /\r\n?|\n/;

type element = { key :string, value :string[], number :number };
type groupReviver = {
	0 :{ exec :(string :string) => RegExpExecArray },
	1 :(group :element | element[], context :any) => any,
};
declare class level extends Array {
	[index :number] :number | element | element[];
	number? :number;
}
type levelReviver = (level :level, context :any) => any;

export default function parse (
	this :any,
	tabLines :string[] | string | Buffer,
	_reviver? :{
		empty? :true | false,
		group? :null | boolean | groupReviver[],
		level? :null | levelReviver,
	},
	_number? :number,
	_debug? :true | false
) :any {
	if ( !isArray(tabLines) ) {
		if ( typeof tabLines==='string' ) { tabLines = tabLines.replace(BOM, '').split(EOL); }
		else if ( isBuffer(tabLines) ) { tabLines = toStringFollowBOM(tabLines).split(EOL); }
	}
	if ( _reviver==null ) {
		var countEmpties :undefined | boolean = true;
		var groupRevivers :undefined | null | boolean | groupReviver[] = null;
		var levelReviver :undefined | null | levelReviver = null;
	}
	else {
		countEmpties = _reviver.empty;
		groupRevivers = _reviver.group;
		levelReviver = _reviver.level;
		if ( countEmpties===undefined ) { countEmpties = true; }
		if ( groupRevivers===undefined ) { groupRevivers = null; }
		if ( levelReviver===undefined ) { levelReviver = null; }
	}
	if ( _number===undefined ) { _number = 1; }
	if ( _debug!==false ) {
		if ( arguments.length>4 ) { throw new Error('jTabDoc.parse(tabLines, reviver, number, debug, ...)'); }
		if ( <unknown>_debug===undefined ) { _debug = true; }
		else if ( _debug!==true ) { throw new TypeError('jTabDoc.stringify(,,,debug)'); }
		if ( !isArray(tabLines) ) { throw new TypeError('jTabDoc.parse(tabLines)'); }
		if ( notStringArray(<unknown[]>tabLines) ) { throw new TypeError('jTabDoc.parse(tabLines[*])'); }
		if ( typeof <unknown>countEmpties!=='boolean' ) { throw new TypeError('jTabDoc.parse(,reviver.empty)'); }
		if ( groupRevivers!==null && typeof groupRevivers!=='boolean' ) {
			if ( !isArray(groupRevivers) ) { throw new TypeError('jTabDoc.parse(,reviver.group)'); }
			var length :number = groupRevivers.length;
			if ( !length ) { throw new Error('jTabDoc.parse(,reviver.group.length)'); }
			var index :number = 0;
			do {
				var each :groupReviver = groupRevivers[index];
				if ( !each ) { throw new TypeError('jTabDoc.parse(,reviver.group[*])'); }
				if ( !each[0] || typeof each[0].exec!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][0])'); }
				if ( typeof each[1]!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1])'); }
			}
			while ( ++index<length );
		}
		if ( levelReviver!==null && typeof levelReviver!=='function' ) { throw new TypeError('jTabDoc.parse(,reviver.level)'); }
		if ( typeof _number!=='number' ) { throw new TypeError('jTabDoc.parse(,,number)'); }
		if ( !POSITIVE_INTEGER.test(_number+'') ) { throw new RangeError('jTabDoc.parse(,,number)'); }
	}
	return tabLines.length===0
		? levelReviver===null ? [] : levelReviver([], this)
		: Level(
			this,
			<string[]>tabLines,
			groupRevivers
				? appendGroup
				: appendFlat,
			countEmpties,
			groupRevivers,
			levelReviver,
			_number,
			_debug
		);
};

function Level (
	context :any,
	tabLines :string[],
	append :typeof appendGroup | typeof appendFlat,
	countEmpties :boolean,
	groupRevivers :null | boolean | groupReviver[],
	levelReviver :null | levelReviver,
	number :number,
	debug :boolean
) :any {
	var level :level      = [],
		lastIndex :number = tabLines.length-1,
		index :number     = 0,
		blank :boolean    = tabLines[0].length===0;
	outer: for ( ; ; ) {
		var from :number = index;
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
					// @ts-ignore
					append(context, level, countEmpties, <null | false>groupRevivers, levelReviver, tabLines, from, index, number, debug);
					break outer;
				}
				if ( tabLines[++index].length===0 ) {
					// @ts-ignore
					append(context, level, countEmpties, <true | groupReviver[]>groupRevivers, levelReviver, tabLines, from, index-1, number, debug);
					blank = true;
					break;
				}
			}
		}
	}
	level.number = number;
	return levelReviver===null ? level : levelReviver(level, context);
}

function appendFlat (
	context :any,
	level :level,
	countEmpties :boolean,
	groupRevivers :null | false,
	levelReviver :null | levelReviver,
	tabLines :string[],
	firstIndex :number,
	lastIndex :number,
	baseNumber :number,
	debug :boolean
) :void {
	var key :string,
		value :string[],
		number :number;
	outer: for ( var lineIndex :number = firstIndex, line :string = tabLines[lineIndex], tabIndex :number = line.indexOf('\t'); ; ) {
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
					if ( groupRevivers===null ) { value = Level(context, value, appendFlat, countEmpties, null, levelReviver, number, debug); }
					break outer;
				}
				line = tabLines[++lineIndex];
				tabIndex = line.indexOf('\t');
				if ( tabIndex!==0 ) { break; }
				value.push(line.slice(1));
			}
			if ( groupRevivers===null ) { value = Level(context, value, appendFlat, countEmpties, null, levelReviver, number, debug); }
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

function appendGroup (
	context :any,
	level :level,
	countEmpties :boolean,
	groupRevivers :true | groupReviver[],
	levelReviver :null | levelReviver,
	tabLines :string[],
	firstIndex :number,
	lastIndex :number,
	baseNumber :number,
	debug :boolean
) :void {
	var pendingGroup :element[] = [],
		pendingKeys :string     = '',
		key :string,
		value :string[],
		number :number;
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
	if ( groupRevivers===true ) {
		level.push(pendingGroup.length===1 ? pendingGroup[0] : pendingGroup);
		return;
	}
	for ( var first :groupReviver = groupRevivers[0], reviverLength :number = groupRevivers.length, reviverIndex = 0, regExp_function = first; ; ) {
		var matched :null | RegExpExecArray = regExp_function[0].exec(pendingKeys);
		if ( matched===null ) {
			if ( ++reviverIndex===reviverLength ) { throw new Error('jTabDoc.parse(,reviver.group[!])'); }
			regExp_function = groupRevivers[reviverIndex];
		}
		else {
			if ( debug ) {
				if ( matched===undefined ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec())'); }
				if ( matched.index ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec().index)'); }
				if ( typeof matched[0]!=='string' ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][0].exec()[0])'); }
				if ( matched[0].length===0 ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec()[0].length)'); }
				if ( matched[0].charAt(matched[0].length-1)!=='\n' ) { throw new Error('jTabDoc.parse(,reviver.group[*][0].exec()[0])'); }
			}
			var thisKeys :string = matched[0];
			var keyLength :number = thisKeys.length;
			if ( pendingKeys.length===keyLength ) {
				level.push(regExp_function[1](pendingGroup.length===1 ? pendingGroup[0] : pendingGroup, context));
				if ( debug ) {
					if ( level[level.length-1]===undefined ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())'); }
				}
				return;
			}
			var count :number = 1;
			for ( var indexOfLF :number = thisKeys.indexOf('\n'); ; ++count ) {
				indexOfLF = thisKeys.indexOf('\n', indexOfLF+1);
				if ( indexOfLF<0 ) { break; }
			}
			level.push(regExp_function[1](<element>( count===1 ? pendingGroup.shift() : pendingGroup.splice(0, count) ), context));
			if ( debug ) {
				if ( level[level.length-1]===undefined ) { throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())'); }
			}
			pendingKeys = pendingKeys.slice(keyLength);
			reviverIndex = 0;
			regExp_function = first;
		}
	}
}
