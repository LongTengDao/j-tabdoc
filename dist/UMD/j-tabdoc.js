/*!
 * 模块名称：jTabDoc
 * 模块功能：TabDoc 的官方标准实现。从属于“简计划”。
   　　　　　The official standard implementation of TabDoc. Belong to "Plan J".
 * 模块版本：2.3.0
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

    var version = '2.3.0';

    var undefined$1 = void 0;

    var toString = Object.prototype.toString;

    var isArray = Array.isArray || function isArray (value) { return toString.call(value)==='[object Array]'; };

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var toStringFollowBOM;
    var isBuffer = /*#__PURE__*/ function () {
        if (typeof Buffer === 'function') {
            var isBuffer = Buffer.isBuffer;
            if (typeof isBuffer === 'function' && typeof Buffer.from === 'function') {
                var from = Buffer.from;
                if (typeof from === 'function') {
                    if (!hasOwnProperty.call(Buffer, 'from')) {
                        from = function from(buffer) { return new Buffer(buffer); };
                    }
                    toStringFollowBOM = function toStringFollowBOM(buffer) {
                        switch (buffer[0]) {
                            case 0xEF:
                                if (buffer[1] === 0xBB && buffer[2] === 0xBF) {
                                    return buffer.slice(3).toString('utf8');
                                }
                                break;
                            case 0xFF:
                                if (buffer[1] === 0xFE) {
                                    return buffer.slice(2).toString('ucs2');
                                }
                                break;
                            case 0xFE:
                                if (buffer[1] === 0xFF) {
                                    buffer = from(buffer);
                                    return buffer.swap16().slice(2).toString('ucs2');
                                }
                                break;
                        }
                        return buffer.toString();
                    };
                    return isBuffer;
                }
            }
        }
        return function isBuffer() { return false; };
    }();

    var POSITIVE_INTEGER = /^[1-9]\d*$/;
    var repeatSpace = ''.repeat
        ? function repeatSpace(count) { return ' '.repeat(count); }
        : function (spaces) {
            return function repeatSpace(count) {
                spaces.length = count + 1;
                return spaces.join(' ');
            };
        }([]);
    function notStringArray(array) {
        for (var length = array.length, index = 0; index < length; ++index) {
            if (typeof array[index] !== 'string') {
                return true;
            }
        }
        return false;
    }

    var BOM = /^\uFEFF/;
    var EOL = /\r\n?|\n/;
    function parse(tabLines, _reviver, _number, _debug) {
        if (!isArray(tabLines)) {
            if (typeof tabLines === 'string') {
                tabLines = tabLines.replace(BOM, '').split(EOL);
            }
            else if (isBuffer(tabLines)) {
                tabLines = toStringFollowBOM(tabLines).split(EOL);
            }
        }
        if (_reviver == null) {
            var countEmpties = true;
            var groupRevivers = null;
            var levelReviver = null;
        }
        else {
            countEmpties = _reviver.empty;
            groupRevivers = _reviver.group;
            levelReviver = _reviver.level;
            if (countEmpties === undefined$1) {
                countEmpties = true;
            }
            if (groupRevivers === undefined$1) {
                groupRevivers = null;
            }
            if (levelReviver === undefined$1) {
                levelReviver = null;
            }
        }
        if (_number === undefined$1) {
            _number = 1;
        }
        if (_debug !== false) {
            if (arguments.length > 4) {
                throw new Error('jTabDoc.parse(tabLines, reviver, number, debug, ...)');
            }
            if (_debug === undefined$1) {
                _debug = true;
            }
            else if (_debug !== true) {
                throw new TypeError('jTabDoc.stringify(,,,debug)');
            }
            if (!isArray(tabLines)) {
                throw new TypeError('jTabDoc.parse(tabLines)');
            }
            if (notStringArray(tabLines)) {
                throw new TypeError('jTabDoc.parse(tabLines[*])');
            }
            if (typeof countEmpties !== 'boolean') {
                throw new TypeError('jTabDoc.parse(,reviver.empty)');
            }
            if (groupRevivers !== null && typeof groupRevivers !== 'boolean') {
                if (!isArray(groupRevivers)) {
                    throw new TypeError('jTabDoc.parse(,reviver.group)');
                }
                var length = groupRevivers.length;
                if (!length) {
                    throw new Error('jTabDoc.parse(,reviver.group.length)');
                }
                var index = 0;
                do {
                    var each = groupRevivers[index];
                    if (!each) {
                        throw new TypeError('jTabDoc.parse(,reviver.group[*])');
                    }
                    if (!each[0] || typeof each[0].exec !== 'function') {
                        throw new TypeError('jTabDoc.parse(,reviver.group[*][0])');
                    }
                    if (typeof each[1] !== 'function') {
                        throw new TypeError('jTabDoc.parse(,reviver.group[*][1])');
                    }
                } while (++index < length);
            }
            if (levelReviver !== null && typeof levelReviver !== 'function') {
                throw new TypeError('jTabDoc.parse(,reviver.level)');
            }
            if (typeof _number !== 'number') {
                throw new TypeError('jTabDoc.parse(,,number)');
            }
            if (!POSITIVE_INTEGER.test(_number + '')) {
                throw new RangeError('jTabDoc.parse(,,number)');
            }
        }
        return tabLines.length === 0
            ? levelReviver === null ? [] : levelReviver([], this)
            : Level(this, tabLines, groupRevivers
                ? appendGroup
                : appendFlat, countEmpties, groupRevivers, levelReviver, _number, _debug);
    }
    function Level(context, tabLines, append, countEmpties, groupRevivers, levelReviver, number, debug) {
        var level = [], lastIndex = tabLines.length - 1, index = 0, blank = tabLines[0].length === 0;
        outer: for (;;) {
            var from = index;
            if (blank) {
                if (countEmpties) {
                    for (;;) {
                        if (index === lastIndex) {
                            level.push(index + 1 - from);
                            break outer;
                        }
                        if (tabLines[++index].length !== 0) {
                            level.push(index - from);
                            blank = false;
                            break;
                        }
                    }
                }
                else {
                    for (;;) {
                        if (index === lastIndex) {
                            break outer;
                        }
                        if (tabLines[++index].length !== 0) {
                            blank = false;
                            break;
                        }
                    }
                }
            }
            else {
                for (;;) {
                    if (index === lastIndex) {
                        // @ts-ignore
                        append(context, level, countEmpties, groupRevivers, levelReviver, tabLines, from, index, number, debug);
                        break outer;
                    }
                    if (tabLines[++index].length === 0) {
                        // @ts-ignore
                        append(context, level, countEmpties, groupRevivers, levelReviver, tabLines, from, index - 1, number, debug);
                        blank = true;
                        break;
                    }
                }
            }
        }
        level.number = number;
        return levelReviver === null ? level : levelReviver(level, context);
    }
    function appendFlat(context, level, countEmpties, groupRevivers, levelReviver, tabLines, firstIndex, lastIndex, baseNumber, debug) {
        var key, value, number;
        outer: for (var lineIndex = firstIndex, line = tabLines[lineIndex], tabIndex = line.indexOf('\t');;) {
            value = [];
            number = baseNumber + lineIndex;
            if (tabIndex === -1) {
                key = '';
                value.push(line);
                for (;;) {
                    if (lineIndex === lastIndex) {
                        break outer;
                    }
                    line = tabLines[++lineIndex];
                    tabIndex = line.indexOf('\t');
                    if (tabIndex !== -1) {
                        break;
                    }
                    value.push(line);
                }
            }
            else {
                if (tabIndex === 0) {
                    key = '\t';
                    value.push(line.slice(1));
                }
                else {
                    key = line.slice(0, tabIndex + 1);
                    value.push(line.slice(tabIndex + 1));
                }
                for (;;) {
                    if (lineIndex === lastIndex) {
                        if (groupRevivers === null) {
                            value = Level(context, value, appendFlat, countEmpties, null, levelReviver, number, debug);
                        }
                        break outer;
                    }
                    line = tabLines[++lineIndex];
                    tabIndex = line.indexOf('\t');
                    if (tabIndex !== 0) {
                        break;
                    }
                    value.push(line.slice(1));
                }
                if (groupRevivers === null) {
                    value = Level(context, value, appendFlat, countEmpties, null, levelReviver, number, debug);
                }
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
    function appendGroup(context, level, countEmpties, groupRevivers, levelReviver, tabLines, firstIndex, lastIndex, baseNumber, debug) {
        var pendingGroup = [], pendingKeys = '', key, value, number;
        outer: for (var lineIndex = firstIndex, line = tabLines[lineIndex], tabIndex = line.indexOf('\t');;) {
            value = [];
            number = baseNumber + lineIndex;
            if (tabIndex === -1) {
                key = '';
                value.push(line);
                pendingKeys += '\n';
                for (;;) {
                    if (lineIndex === lastIndex) {
                        break outer;
                    }
                    line = tabLines[++lineIndex];
                    tabIndex = line.indexOf('\t');
                    if (tabIndex !== -1) {
                        break;
                    }
                    value.push(line);
                }
            }
            else {
                if (tabIndex === 0) {
                    key = '\t';
                    value.push(line.slice(1));
                    pendingKeys += '\t\n';
                }
                else {
                    key = line.slice(0, tabIndex + 1);
                    pendingKeys += key + '\n';
                    value.push(line.slice(tabIndex + 1));
                }
                for (;;) {
                    if (lineIndex === lastIndex) {
                        break outer;
                    }
                    line = tabLines[++lineIndex];
                    tabIndex = line.indexOf('\t');
                    if (tabIndex !== 0) {
                        break;
                    }
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
        if (groupRevivers === true) {
            level.push(pendingGroup.length === 1 ? pendingGroup[0] : pendingGroup);
            return;
        }
        for (var first = groupRevivers[0], reviverLength = groupRevivers.length, reviverIndex = 0, regExp_function = first;;) {
            var matched = regExp_function[0].exec(pendingKeys);
            if (matched === null) {
                if (++reviverIndex === reviverLength) {
                    throw new Error('jTabDoc.parse(,reviver.group[!])');
                }
                regExp_function = groupRevivers[reviverIndex];
            }
            else {
                if (debug) {
                    if (matched === undefined$1) {
                        throw new Error('jTabDoc.parse(,reviver.group[*][0].exec())');
                    }
                    if (matched.index) {
                        throw new Error('jTabDoc.parse(,reviver.group[*][0].exec().index)');
                    }
                    if (typeof matched[0] !== 'string') {
                        throw new TypeError('jTabDoc.parse(,reviver.group[*][0].exec()[0])');
                    }
                    if (matched[0].length === 0) {
                        throw new Error('jTabDoc.parse(,reviver.group[*][0].exec()[0].length)');
                    }
                    if (matched[0].charAt(matched[0].length - 1) !== '\n') {
                        throw new Error('jTabDoc.parse(,reviver.group[*][0].exec()[0])');
                    }
                }
                var thisKeys = matched[0];
                var keyLength = thisKeys.length;
                if (pendingKeys.length === keyLength) {
                    level.push(regExp_function[1](pendingGroup.length === 1 ? pendingGroup[0] : pendingGroup, context));
                    if (debug) {
                        if (level[level.length - 1] === undefined$1) {
                            throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())');
                        }
                    }
                    return;
                }
                var count = 1;
                for (var indexOfLF = thisKeys.indexOf('\n');; ++count) {
                    indexOfLF = thisKeys.indexOf('\n', indexOfLF + 1);
                    if (indexOfLF < 0) {
                        break;
                    }
                }
                level.push(regExp_function[1]((count === 1 ? pendingGroup.shift() : pendingGroup.splice(0, count)), context));
                if (debug) {
                    if (level[level.length - 1] === undefined$1) {
                        throw new TypeError('jTabDoc.parse(,reviver.group[*][1]())');
                    }
                }
                pendingKeys = pendingKeys.slice(keyLength);
                reviverIndex = 0;
                regExp_function = first;
            }
        }
    }

    var push = Array.prototype.push;

    function stringify(level, _replacer, _space, _debug) {
        if (_debug !== false) {
            if (arguments.length > 4) {
                throw new Error('jTabDoc.stringify(level, replacer, space, debug, ...)');
            }
            if (_debug === undefined$1) {
                _debug = true;
            }
            else if (_debug !== true) {
                throw new TypeError('jTabDoc.stringify(,,,debug)');
            }
            if (_replacer != null && typeof _replacer !== 'function') {
                throw new TypeError('jTabDoc.stringify(,replacer)');
            }
            if (_space != null && typeof _space !== 'function') {
                throw new TypeError('jTabDoc.stringify(,,space)');
            }
        }
        if (_replacer === undefined$1) {
            _replacer = null;
        }
        if (_space === undefined$1) {
            _space = null;
        }
        return Lines(this, level, _replacer, _space, _debug);
    }
    function Lines(context, level, replacer, space, debug) {
        if (replacer !== null) {
            level = replacer(level, context);
        }
        if (debug) {
            if (!isArray(level)) {
                throw new TypeError('jTabDoc.stringify(level)');
            }
        }
        var lines = [];
        for (var levelLength = level.length, levelIndex = 0; levelIndex < levelLength; ++levelIndex) {
            var each = level[levelIndex];
            if (debug) {
                check(each, replacer);
            }
            if (typeof each === 'number') {
                while (each--) {
                    lines.push('');
                }
            }
            else if (each.key === '') {
                push.apply(lines, each.value);
            }
            else if (space === null) {
                pushes(lines, each.key, '\t', replacer === null
                    ? Lines(context, each.value, null, space, debug)
                    : each.value);
            }
            else {
                var keys = [each.key];
                var values = [each.value];
                while (++levelIndex < levelLength) {
                    each = level[levelIndex];
                    if (debug) {
                        check(each, replacer);
                    }
                    if (typeof each === 'number') {
                        --levelIndex;
                        break;
                    }
                    keys.push(each.key);
                    values.push(each.value);
                }
                var keys_indent = space(keys, context);
                if (debug) {
                    if (typeof keys_indent !== 'object' || keys_indent === null) {
                        throw new TypeError('jTabDoc.stringify(,,space())');
                    }
                    if (!('keys' in keys_indent) || !('indent' in keys_indent)) {
                        throw new Error('jTabDoc.stringify(,,space())');
                    }
                    if (!isArray(keys_indent.keys)) {
                        throw new TypeError('jTabDoc.stringify(,,space().keys)');
                    }
                    if (keys_indent.keys.length !== values.length) {
                        throw new Error('jTabDoc.stringify(,,space().keys.length)');
                    }
                    if (notStringArray(keys_indent.keys)) {
                        throw new TypeError('jTabDoc.stringify(,,space().keys[*])');
                    }
                    if (typeof keys_indent.indent !== 'string') {
                        throw new TypeError('jTabDoc.stringify(,,space().indent)');
                    }
                }
                keys = keys_indent.keys;
                var indent = keys_indent.indent;
                for (var length = values.length, index = 0; index < length; ++index) {
                    if (keys[index] === '') {
                        push.apply(lines, values[index]);
                    }
                    else {
                        pushes(lines, keys[index], indent, replacer === null
                            ? Lines(context, values[index], null, space, debug)
                            : values[index]);
                    }
                }
            }
        }
        return lines;
    }
    function pushes(lines, key, indent, subLines) {
        var length = subLines.length;
        if (length === 0) {
            lines.push(key);
        }
        else {
            lines.push(key + subLines[0]);
            for (var index = 1; index < length; ++index) {
                lines.push(indent + subLines[index]);
            }
        }
    }
    function check(each, replacer) {
        if (typeof each === 'object' && each !== null) {
            // @ts-ignore
            if (!('key' in each) || !('value' in each)) {
                throw new Error('jTabDoc.stringify(' + (replacer ? ',replacer()' : 'level') + '[*]:object)');
            }
            if (typeof each.key !== 'string' || !/^(?:[^\t\n\r]*\t)?$/.test(each.key)) {
                throw new Error('jTabDoc.stringify(' + (replacer ? ',replacer()' : 'level') + '[*]:object.key)');
            }
            if (replacer !== null || each.key === '') {
                if (!isArray(each.value)) {
                    throw new TypeError('jTabDoc.stringify(' + (replacer ? ',replacer()' : 'level') + '[*]:object.value)');
                }
                if (notStringArray(each.value)) {
                    throw new TypeError('jTabDoc.stringify(' + (replacer ? ',replacer()' : 'level') + '[*]:object.value[*])');
                }
            }
        }
        else if (typeof each === 'number') {
            if (!/^\d+$/.test(each + '')) {
                throw new Error('jTabDoc.stringify(' + (replacer ? ',replacer()' : 'level') + '[*]:number)');
            }
        }
        else {
            throw new TypeError('jTabDoc.stringify(' + (replacer ? ',replacer()' : 'level') + '[*])');
        }
    }

    function Space(minWidth, padding) {
        if (typeof minWidth !== 'number') {
            throw new TypeError('jTabDoc.Space(minWidth)');
        }
        if (typeof padding !== 'number') {
            throw new TypeError('jTabDoc.Space(,padding)');
        }
        var multiple = minWidth < 0;
        if (multiple) {
            minWidth = ~minWidth;
        }
        if (!POSITIVE_INTEGER.test(minWidth + '')) {
            throw new RangeError('jTabDoc.Space(minWidth)');
        }
        if (!POSITIVE_INTEGER.test(padding + '')) {
            throw new RangeError('jTabDoc.Space(,padding)');
        }
        return function space(keys) {
            return keys_indent(multiple, minWidth, padding, keys);
        };
    }
    function keys_indent(multiple, minWidth, padding, keys) {
        var maxWidth = 1;
        var widths = [];
        for (var length = keys.length, index = 0; index < length; ++index) {
            var width = 0;
            var key = keys[index];
            if (key !== '') {
                for (var l = key.length - 1, i = 0; i < l; ++i) {
                    var charCode = key.charCodeAt(i);
                    if (charCode < 0x80) {
                        width += 1;
                    }
                    else {
                        width += 2;
                        if (charCode >= 0xD800 && charCode <= 0xDBFF && i + 1 < l) {
                            charCode = key.charCodeAt(i + 1);
                            charCode >= 0xDC00 && charCode <= 0xDFFF && ++i;
                        }
                    }
                }
                if (width > maxWidth) {
                    maxWidth = width;
                }
            }
            widths.push(width);
        }
        width = maxWidth + padding;
        if (multiple) {
            if (width % minWidth) {
                width += minWidth - width % minWidth;
            }
        }
        else {
            if (width < minWidth) {
                width = minWidth;
            }
        }
        for (index = 0; index < length; ++index) {
            key = keys[index];
            if (key !== '') {
                keys[index] = key.slice(0, -1) + repeatSpace(width - widths[index]);
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZlcnNpb24/dGV4dCIsImdsb2JhbC50cyIsInV0aWwudHMiLCJwYXJzZS50cyIsInN0cmluZ2lmeS50cyIsIlNwYWNlLnRzIiwiZXhwb3J0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0ICcyLjMuMCc7IiwiaW1wb3J0IGhhc093blByb3BlcnR5IGZyb20gJy5PYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5JztcblxuaW1wb3J0IEJ1ZmZlciBmcm9tICcuQnVmZmVyJztcbmV4cG9ydCB2YXIgdG9TdHJpbmdGb2xsb3dCT007XG5leHBvcnQgdmFyIGlzQnVmZmVyID0gLyojX19QVVJFX18qLyBmdW5jdGlvbiAoKSB7XG5cdGlmICggdHlwZW9mIEJ1ZmZlcj09PSdmdW5jdGlvbicgKSB7XG5cdFx0dmFyIGlzQnVmZmVyID0gQnVmZmVyLmlzQnVmZmVyO1xuXHRcdGlmICggdHlwZW9mIGlzQnVmZmVyPT09J2Z1bmN0aW9uJyAmJiB0eXBlb2YgQnVmZmVyLmZyb209PT0nZnVuY3Rpb24nICkge1xuXHRcdFx0dmFyIGZyb20gPSBCdWZmZXIuZnJvbTtcblx0XHRcdGlmICggdHlwZW9mIGZyb209PT0nZnVuY3Rpb24nICkge1xuXHRcdFx0XHRpZiAoICFoYXNPd25Qcm9wZXJ0eS5jYWxsKEJ1ZmZlciwgJ2Zyb20nKSApIHtcblx0XHRcdFx0XHRmcm9tID0gZnVuY3Rpb24gZnJvbSAoYnVmZmVyKSA6QnVmZmVyIHsgcmV0dXJuIG5ldyBCdWZmZXIoYnVmZmVyKTsgfTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0b1N0cmluZ0ZvbGxvd0JPTSA9IGZ1bmN0aW9uIHRvU3RyaW5nRm9sbG93Qk9NIChidWZmZXIgOkJ1ZmZlcikgOnN0cmluZyB7XG5cdFx0XHRcdFx0c3dpdGNoICggYnVmZmVyWzBdICkge1xuXHRcdFx0XHRcdFx0Y2FzZSAweEVGOiBpZiAoIGJ1ZmZlclsxXT09PTB4QkIgJiYgYnVmZmVyWzJdPT09MHhCRiApIHsgcmV0dXJuIGJ1ZmZlci5zbGljZSgzKS50b1N0cmluZygndXRmOCcpOyB9IGJyZWFrO1xuXHRcdFx0XHRcdFx0Y2FzZSAweEZGOiBpZiAoIGJ1ZmZlclsxXT09PTB4RkUgKSB7IHJldHVybiBidWZmZXIuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTsgfSBicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgMHhGRTogaWYgKCBidWZmZXJbMV09PT0weEZGICkgeyBidWZmZXIgPSBmcm9tKGJ1ZmZlcik7IHJldHVybiBidWZmZXIuc3dhcDE2KCkuc2xpY2UoMikudG9TdHJpbmcoJ3VjczInKTsgfSBicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIGJ1ZmZlci50b1N0cmluZygpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZXR1cm4gaXNCdWZmZXI7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmdW5jdGlvbiBpc0J1ZmZlciAoKSA6Ym9vbGVhbiB7IHJldHVybiBmYWxzZTsgfTtcbn0oKTsiLCJleHBvcnQgdmFyIFBPU0lUSVZFX0lOVEVHRVIgPSAvXlsxLTldXFxkKiQvO1xuXG5leHBvcnQgdmFyIHJlcGVhdFNwYWNlID0gJycucmVwZWF0XG5cdD8gZnVuY3Rpb24gcmVwZWF0U3BhY2UgKGNvdW50IDpudW1iZXIpIDpzdHJpbmcgeyByZXR1cm4gJyAnLnJlcGVhdChjb3VudCk7IH1cblx0OiBmdW5jdGlvbiAoc3BhY2VzIDp1bmRlZmluZWRbXSkgOnR5cGVvZiByZXBlYXRTcGFjZSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHJlcGVhdFNwYWNlIChjb3VudCA6bnVtYmVyKSA6c3RyaW5nIHtcblx0XHRcdHNwYWNlcy5sZW5ndGggPSBjb3VudCsxO1xuXHRcdFx0cmV0dXJuIHNwYWNlcy5qb2luKCcgJyk7XG5cdFx0fTtcblx0fShbXSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3RTdHJpbmdBcnJheSAoYXJyYXkgOmFueVtdKSA6Ym9vbGVhbiB7XG5cdGZvciAoIHZhciBsZW5ndGggOm51bWJlciA9IGFycmF5Lmxlbmd0aCwgaW5kZXggOm51bWJlciA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRpZiAoIHR5cGVvZiBhcnJheVtpbmRleF0hPT0nc3RyaW5nJyApIHsgcmV0dXJuIHRydWU7IH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgdW5kZWZpbmVkIGZyb20gJy52b2lkJztcbmltcG9ydCBpc0FycmF5IGZyb20gJy5BcnJheS5pc0FycmF5Pz0nO1xuaW1wb3J0IHsgaXNCdWZmZXIsIHRvU3RyaW5nRm9sbG93Qk9NIH0gZnJvbSAnLi9nbG9iYWwnO1xuaW1wb3J0IFR5cGVFcnJvciBmcm9tICcuVHlwZUVycm9yJztcbmltcG9ydCBSYW5nZUVycm9yIGZyb20gJy5SYW5nZUVycm9yJztcbmltcG9ydCBFcnJvciBmcm9tICcuRXJyb3InO1xuaW1wb3J0IHsgUE9TSVRJVkVfSU5URUdFUiwgbm90U3RyaW5nQXJyYXkgfSBmcm9tICcuL3V0aWwnO1xuXG52YXIgQk9NID0gL15cXHVGRUZGLztcbnZhciBFT0wgPSAvXFxyXFxuP3xcXG4vO1xuXG50eXBlIGVsZW1lbnQgPSB7IGtleSA6c3RyaW5nLCB2YWx1ZSA6c3RyaW5nW10sIG51bWJlciA6bnVtYmVyIH07XG50eXBlIGdyb3VwUmV2aXZlciA9IHtcblx0MCA6eyBleGVjIDooc3RyaW5nIDpzdHJpbmcpID0+IFJlZ0V4cEV4ZWNBcnJheSB9LFxuXHQxIDooZ3JvdXAgOmVsZW1lbnQgfCBlbGVtZW50W10sIGNvbnRleHQgOmFueSkgPT4gYW55LFxufTtcbmRlY2xhcmUgY2xhc3MgbGV2ZWwgZXh0ZW5kcyBBcnJheSB7XG5cdFtpbmRleCA6bnVtYmVyXSA6bnVtYmVyIHwgZWxlbWVudCB8IGVsZW1lbnRbXTtcblx0bnVtYmVyPyA6bnVtYmVyO1xufVxudHlwZSBsZXZlbFJldml2ZXIgPSAobGV2ZWwgOmxldmVsLCBjb250ZXh0IDphbnkpID0+IGFueTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2UgKFxuXHR0aGlzIDphbnksXG5cdHRhYkxpbmVzIDpzdHJpbmdbXSB8IHN0cmluZyB8IEJ1ZmZlcixcblx0X3Jldml2ZXI/IDp7XG5cdFx0ZW1wdHk/IDp0cnVlIHwgZmFsc2UsXG5cdFx0Z3JvdXA/IDpudWxsIHwgYm9vbGVhbiB8IGdyb3VwUmV2aXZlcltdLFxuXHRcdGxldmVsPyA6bnVsbCB8IGxldmVsUmV2aXZlcixcblx0fSxcblx0X251bWJlcj8gOm51bWJlcixcblx0X2RlYnVnPyA6dHJ1ZSB8IGZhbHNlXG4pIDphbnkge1xuXHRpZiAoICFpc0FycmF5KHRhYkxpbmVzKSApIHtcblx0XHRpZiAoIHR5cGVvZiB0YWJMaW5lcz09PSdzdHJpbmcnICkgeyB0YWJMaW5lcyA9IHRhYkxpbmVzLnJlcGxhY2UoQk9NLCAnJykuc3BsaXQoRU9MKTsgfVxuXHRcdGVsc2UgaWYgKCBpc0J1ZmZlcih0YWJMaW5lcykgKSB7IHRhYkxpbmVzID0gdG9TdHJpbmdGb2xsb3dCT00odGFiTGluZXMpLnNwbGl0KEVPTCk7IH1cblx0fVxuXHRpZiAoIF9yZXZpdmVyPT1udWxsICkge1xuXHRcdHZhciBjb3VudEVtcHRpZXMgOnVuZGVmaW5lZCB8IGJvb2xlYW4gPSB0cnVlO1xuXHRcdHZhciBncm91cFJldml2ZXJzIDp1bmRlZmluZWQgfCBudWxsIHwgYm9vbGVhbiB8IGdyb3VwUmV2aXZlcltdID0gbnVsbDtcblx0XHR2YXIgbGV2ZWxSZXZpdmVyIDp1bmRlZmluZWQgfCBudWxsIHwgbGV2ZWxSZXZpdmVyID0gbnVsbDtcblx0fVxuXHRlbHNlIHtcblx0XHRjb3VudEVtcHRpZXMgPSBfcmV2aXZlci5lbXB0eTtcblx0XHRncm91cFJldml2ZXJzID0gX3Jldml2ZXIuZ3JvdXA7XG5cdFx0bGV2ZWxSZXZpdmVyID0gX3Jldml2ZXIubGV2ZWw7XG5cdFx0aWYgKCBjb3VudEVtcHRpZXM9PT11bmRlZmluZWQgKSB7IGNvdW50RW1wdGllcyA9IHRydWU7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlcnM9PT11bmRlZmluZWQgKSB7IGdyb3VwUmV2aXZlcnMgPSBudWxsOyB9XG5cdFx0aWYgKCBsZXZlbFJldml2ZXI9PT11bmRlZmluZWQgKSB7IGxldmVsUmV2aXZlciA9IG51bGw7IH1cblx0fVxuXHRpZiAoIF9udW1iZXI9PT11bmRlZmluZWQgKSB7IF9udW1iZXIgPSAxOyB9XG5cdGlmICggX2RlYnVnIT09ZmFsc2UgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoPjQgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSh0YWJMaW5lcywgcmV2aXZlciwgbnVtYmVyLCBkZWJ1ZywgLi4uKScpOyB9XG5cdFx0aWYgKCA8dW5rbm93bj5fZGVidWc9PT11bmRlZmluZWQgKSB7IF9kZWJ1ZyA9IHRydWU7IH1cblx0XHRlbHNlIGlmICggX2RlYnVnIT09dHJ1ZSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCwsZGVidWcpJyk7IH1cblx0XHRpZiAoICFpc0FycmF5KHRhYkxpbmVzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSh0YWJMaW5lcyknKTsgfVxuXHRcdGlmICggbm90U3RyaW5nQXJyYXkoPHVua25vd25bXT50YWJMaW5lcykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UodGFiTGluZXNbKl0pJyk7IH1cblx0XHRpZiAoIHR5cGVvZiA8dW5rbm93bj5jb3VudEVtcHRpZXMhPT0nYm9vbGVhbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZW1wdHkpJyk7IH1cblx0XHRpZiAoIGdyb3VwUmV2aXZlcnMhPT1udWxsICYmIHR5cGVvZiBncm91cFJldml2ZXJzIT09J2Jvb2xlYW4nICkge1xuXHRcdFx0aWYgKCAhaXNBcnJheShncm91cFJldml2ZXJzKSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cCknKTsgfVxuXHRcdFx0dmFyIGxlbmd0aCA6bnVtYmVyID0gZ3JvdXBSZXZpdmVycy5sZW5ndGg7XG5cdFx0XHRpZiAoICFsZW5ndGggKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cC5sZW5ndGgpJyk7IH1cblx0XHRcdHZhciBpbmRleCA6bnVtYmVyID0gMDtcblx0XHRcdGRvIHtcblx0XHRcdFx0dmFyIGVhY2ggOmdyb3VwUmV2aXZlciA9IGdyb3VwUmV2aXZlcnNbaW5kZXhdO1xuXHRcdFx0XHRpZiAoICFlYWNoICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdKScpOyB9XG5cdFx0XHRcdGlmICggIWVhY2hbMF0gfHwgdHlwZW9mIGVhY2hbMF0uZXhlYyE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0pJyk7IH1cblx0XHRcdFx0aWYgKCB0eXBlb2YgZWFjaFsxXSE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0pJyk7IH1cblx0XHRcdH1cblx0XHRcdHdoaWxlICggKytpbmRleDxsZW5ndGggKTtcblx0XHR9XG5cdFx0aWYgKCBsZXZlbFJldml2ZXIhPT1udWxsICYmIHR5cGVvZiBsZXZlbFJldml2ZXIhPT0nZnVuY3Rpb24nICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmxldmVsKScpOyB9XG5cdFx0aWYgKCB0eXBlb2YgX251bWJlciE9PSdudW1iZXInICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnBhcnNlKCwsbnVtYmVyKScpOyB9XG5cdFx0aWYgKCAhUE9TSVRJVkVfSU5URUdFUi50ZXN0KF9udW1iZXIrJycpICkgeyB0aHJvdyBuZXcgUmFuZ2VFcnJvcignalRhYkRvYy5wYXJzZSgsLG51bWJlciknKTsgfVxuXHR9XG5cdHJldHVybiB0YWJMaW5lcy5sZW5ndGg9PT0wXG5cdFx0PyBsZXZlbFJldml2ZXI9PT1udWxsID8gW10gOiBsZXZlbFJldml2ZXIoW10sIHRoaXMpXG5cdFx0OiBMZXZlbChcblx0XHRcdHRoaXMsXG5cdFx0XHQ8c3RyaW5nW10+dGFiTGluZXMsXG5cdFx0XHRncm91cFJldml2ZXJzXG5cdFx0XHRcdD8gYXBwZW5kR3JvdXBcblx0XHRcdFx0OiBhcHBlbmRGbGF0LFxuXHRcdFx0Y291bnRFbXB0aWVzLFxuXHRcdFx0Z3JvdXBSZXZpdmVycyxcblx0XHRcdGxldmVsUmV2aXZlcixcblx0XHRcdF9udW1iZXIsXG5cdFx0XHRfZGVidWdcblx0XHQpO1xufTtcblxuZnVuY3Rpb24gTGV2ZWwgKFxuXHRjb250ZXh0IDphbnksXG5cdHRhYkxpbmVzIDpzdHJpbmdbXSxcblx0YXBwZW5kIDp0eXBlb2YgYXBwZW5kR3JvdXAgfCB0eXBlb2YgYXBwZW5kRmxhdCxcblx0Y291bnRFbXB0aWVzIDpib29sZWFuLFxuXHRncm91cFJldml2ZXJzIDpudWxsIHwgYm9vbGVhbiB8IGdyb3VwUmV2aXZlcltdLFxuXHRsZXZlbFJldml2ZXIgOm51bGwgfCBsZXZlbFJldml2ZXIsXG5cdG51bWJlciA6bnVtYmVyLFxuXHRkZWJ1ZyA6Ym9vbGVhblxuKSA6YW55IHtcblx0dmFyIGxldmVsIDpsZXZlbCAgICAgID0gW10sXG5cdFx0bGFzdEluZGV4IDpudW1iZXIgPSB0YWJMaW5lcy5sZW5ndGgtMSxcblx0XHRpbmRleCA6bnVtYmVyICAgICA9IDAsXG5cdFx0YmxhbmsgOmJvb2xlYW4gICAgPSB0YWJMaW5lc1swXS5sZW5ndGg9PT0wO1xuXHRvdXRlcjogZm9yICggOyA7ICkge1xuXHRcdHZhciBmcm9tIDpudW1iZXIgPSBpbmRleDtcblx0XHRpZiAoIGJsYW5rICkge1xuXHRcdFx0aWYgKCBjb3VudEVtcHRpZXMgKSB7XG5cdFx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0XHRpZiAoIGluZGV4PT09bGFzdEluZGV4ICkge1xuXHRcdFx0XHRcdFx0bGV2ZWwucHVzaChpbmRleCsxLWZyb20pO1xuXHRcdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoIT09MCApIHtcblx0XHRcdFx0XHRcdGxldmVsLnB1c2goaW5kZXgtZnJvbSk7XG5cdFx0XHRcdFx0XHRibGFuayA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Zm9yICggOyA7ICkge1xuXHRcdFx0XHRcdGlmICggaW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdFx0aWYgKCB0YWJMaW5lc1srK2luZGV4XS5sZW5ndGghPT0wICkge1xuXHRcdFx0XHRcdFx0YmxhbmsgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBpbmRleD09PWxhc3RJbmRleCApIHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0YXBwZW5kKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIDxudWxsIHwgZmFsc2U+Z3JvdXBSZXZpdmVycywgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZnJvbSwgaW5kZXgsIG51bWJlciwgZGVidWcpO1xuXHRcdFx0XHRcdGJyZWFrIG91dGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggdGFiTGluZXNbKytpbmRleF0ubGVuZ3RoPT09MCApIHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0YXBwZW5kKGNvbnRleHQsIGxldmVsLCBjb3VudEVtcHRpZXMsIDx0cnVlIHwgZ3JvdXBSZXZpdmVyW10+Z3JvdXBSZXZpdmVycywgbGV2ZWxSZXZpdmVyLCB0YWJMaW5lcywgZnJvbSwgaW5kZXgtMSwgbnVtYmVyLCBkZWJ1Zyk7XG5cdFx0XHRcdFx0YmxhbmsgPSB0cnVlO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdGxldmVsLm51bWJlciA9IG51bWJlcjtcblx0cmV0dXJuIGxldmVsUmV2aXZlcj09PW51bGwgPyBsZXZlbCA6IGxldmVsUmV2aXZlcihsZXZlbCwgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEZsYXQgKFxuXHRjb250ZXh0IDphbnksXG5cdGxldmVsIDpsZXZlbCxcblx0Y291bnRFbXB0aWVzIDpib29sZWFuLFxuXHRncm91cFJldml2ZXJzIDpudWxsIHwgZmFsc2UsXG5cdGxldmVsUmV2aXZlciA6bnVsbCB8IGxldmVsUmV2aXZlcixcblx0dGFiTGluZXMgOnN0cmluZ1tdLFxuXHRmaXJzdEluZGV4IDpudW1iZXIsXG5cdGxhc3RJbmRleCA6bnVtYmVyLFxuXHRiYXNlTnVtYmVyIDpudW1iZXIsXG5cdGRlYnVnIDpib29sZWFuXG4pIDp2b2lkIHtcblx0dmFyIGtleSA6c3RyaW5nLFxuXHRcdHZhbHVlIDpzdHJpbmdbXSxcblx0XHRudW1iZXIgOm51bWJlcjtcblx0b3V0ZXI6IGZvciAoIHZhciBsaW5lSW5kZXggOm51bWJlciA9IGZpcnN0SW5kZXgsIGxpbmUgOnN0cmluZyA9IHRhYkxpbmVzW2xpbmVJbmRleF0sIHRhYkluZGV4IDpudW1iZXIgPSBsaW5lLmluZGV4T2YoJ1xcdCcpOyA7ICkge1xuXHRcdHZhbHVlID0gW107XG5cdFx0bnVtYmVyID0gYmFzZU51bWJlcitsaW5lSW5kZXg7XG5cdFx0aWYgKCB0YWJJbmRleD09PSAtMSApIHtcblx0XHRcdGtleSA9ICcnO1xuXHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7IGJyZWFrIG91dGVyOyB9XG5cdFx0XHRcdGxpbmUgPSB0YWJMaW5lc1srK2xpbmVJbmRleF07XG5cdFx0XHRcdHRhYkluZGV4ID0gbGluZS5pbmRleE9mKCdcXHQnKTtcblx0XHRcdFx0aWYgKCB0YWJJbmRleCE9PSAtMSApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIHRhYkluZGV4PT09MCApIHtcblx0XHRcdFx0a2V5ID0gJ1xcdCc7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0a2V5ID0gbGluZS5zbGljZSgwLCB0YWJJbmRleCsxKTtcblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKHRhYkluZGV4KzEpKTtcblx0XHRcdH1cblx0XHRcdGZvciAoIDsgOyApIHtcblx0XHRcdFx0aWYgKCBsaW5lSW5kZXg9PT1sYXN0SW5kZXggKSB7XG5cdFx0XHRcdFx0aWYgKCBncm91cFJldml2ZXJzPT09bnVsbCApIHsgdmFsdWUgPSBMZXZlbChjb250ZXh0LCB2YWx1ZSwgYXBwZW5kRmxhdCwgY291bnRFbXB0aWVzLCBudWxsLCBsZXZlbFJldml2ZXIsIG51bWJlciwgZGVidWcpOyB9XG5cdFx0XHRcdFx0YnJlYWsgb3V0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0bGluZSA9IHRhYkxpbmVzWysrbGluZUluZGV4XTtcblx0XHRcdFx0dGFiSW5kZXggPSBsaW5lLmluZGV4T2YoJ1xcdCcpO1xuXHRcdFx0XHRpZiAoIHRhYkluZGV4IT09MCApIHsgYnJlYWs7IH1cblx0XHRcdFx0dmFsdWUucHVzaChsaW5lLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHRcdGlmICggZ3JvdXBSZXZpdmVycz09PW51bGwgKSB7IHZhbHVlID0gTGV2ZWwoY29udGV4dCwgdmFsdWUsIGFwcGVuZEZsYXQsIGNvdW50RW1wdGllcywgbnVsbCwgbGV2ZWxSZXZpdmVyLCBudW1iZXIsIGRlYnVnKTsgfVxuXHRcdH1cblx0XHRsZXZlbC5wdXNoKHtcblx0XHRcdGtleToga2V5LFxuXHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0bnVtYmVyOiBudW1iZXJcblx0XHR9KTtcblx0fVxuXHRsZXZlbC5wdXNoKHtcblx0XHRrZXk6IGtleSxcblx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0bnVtYmVyOiBudW1iZXJcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEdyb3VwIChcblx0Y29udGV4dCA6YW55LFxuXHRsZXZlbCA6bGV2ZWwsXG5cdGNvdW50RW1wdGllcyA6Ym9vbGVhbixcblx0Z3JvdXBSZXZpdmVycyA6dHJ1ZSB8IGdyb3VwUmV2aXZlcltdLFxuXHRsZXZlbFJldml2ZXIgOm51bGwgfCBsZXZlbFJldml2ZXIsXG5cdHRhYkxpbmVzIDpzdHJpbmdbXSxcblx0Zmlyc3RJbmRleCA6bnVtYmVyLFxuXHRsYXN0SW5kZXggOm51bWJlcixcblx0YmFzZU51bWJlciA6bnVtYmVyLFxuXHRkZWJ1ZyA6Ym9vbGVhblxuKSA6dm9pZCB7XG5cdHZhciBwZW5kaW5nR3JvdXAgOmVsZW1lbnRbXSA9IFtdLFxuXHRcdHBlbmRpbmdLZXlzIDpzdHJpbmcgICAgID0gJycsXG5cdFx0a2V5IDpzdHJpbmcsXG5cdFx0dmFsdWUgOnN0cmluZ1tdLFxuXHRcdG51bWJlciA6bnVtYmVyO1xuXHRvdXRlcjogZm9yICggdmFyIGxpbmVJbmRleCA9IGZpcnN0SW5kZXgsIGxpbmUgPSB0YWJMaW5lc1tsaW5lSW5kZXhdLCB0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7IDsgKSB7XG5cdFx0dmFsdWUgPSBbXTtcblx0XHRudW1iZXIgPSBiYXNlTnVtYmVyK2xpbmVJbmRleDtcblx0XHRpZiAoIHRhYkluZGV4PT09IC0xICkge1xuXHRcdFx0a2V5ID0gJyc7XG5cdFx0XHR2YWx1ZS5wdXNoKGxpbmUpO1xuXHRcdFx0cGVuZGluZ0tleXMgKz0gJ1xcbic7XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRsaW5lID0gdGFiTGluZXNbKytsaW5lSW5kZXhdO1xuXHRcdFx0XHR0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7XG5cdFx0XHRcdGlmICggdGFiSW5kZXghPT0gLTEgKSB7IGJyZWFrOyB9XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKCB0YWJJbmRleD09PTAgKSB7XG5cdFx0XHRcdGtleSA9ICdcXHQnO1xuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UoMSkpO1xuXHRcdFx0XHRwZW5kaW5nS2V5cyArPSAnXFx0XFxuJztcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBsaW5lLnNsaWNlKDAsIHRhYkluZGV4KzEpO1xuXHRcdFx0XHRwZW5kaW5nS2V5cyArPSBrZXkrJ1xcbic7XG5cdFx0XHRcdHZhbHVlLnB1c2gobGluZS5zbGljZSh0YWJJbmRleCsxKSk7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKCA7IDsgKSB7XG5cdFx0XHRcdGlmICggbGluZUluZGV4PT09bGFzdEluZGV4ICkgeyBicmVhayBvdXRlcjsgfVxuXHRcdFx0XHRsaW5lID0gdGFiTGluZXNbKytsaW5lSW5kZXhdO1xuXHRcdFx0XHR0YWJJbmRleCA9IGxpbmUuaW5kZXhPZignXFx0Jyk7XG5cdFx0XHRcdGlmICggdGFiSW5kZXghPT0wICkgeyBicmVhazsgfVxuXHRcdFx0XHR2YWx1ZS5wdXNoKGxpbmUuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRwZW5kaW5nR3JvdXAucHVzaCh7XG5cdFx0XHRrZXk6IGtleSxcblx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdG51bWJlcjogbnVtYmVyXG5cdFx0fSk7XG5cdH1cblx0cGVuZGluZ0dyb3VwLnB1c2goe1xuXHRcdGtleToga2V5LFxuXHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRudW1iZXI6IG51bWJlclxuXHR9KTtcblx0aWYgKCBncm91cFJldml2ZXJzPT09dHJ1ZSApIHtcblx0XHRsZXZlbC5wdXNoKHBlbmRpbmdHcm91cC5sZW5ndGg9PT0xID8gcGVuZGluZ0dyb3VwWzBdIDogcGVuZGluZ0dyb3VwKTtcblx0XHRyZXR1cm47XG5cdH1cblx0Zm9yICggdmFyIGZpcnN0IDpncm91cFJldml2ZXIgPSBncm91cFJldml2ZXJzWzBdLCByZXZpdmVyTGVuZ3RoIDpudW1iZXIgPSBncm91cFJldml2ZXJzLmxlbmd0aCwgcmV2aXZlckluZGV4ID0gMCwgcmVnRXhwX2Z1bmN0aW9uID0gZmlyc3Q7IDsgKSB7XG5cdFx0dmFyIG1hdGNoZWQgOm51bGwgfCBSZWdFeHBFeGVjQXJyYXkgPSByZWdFeHBfZnVuY3Rpb25bMF0uZXhlYyhwZW5kaW5nS2V5cyk7XG5cdFx0aWYgKCBtYXRjaGVkPT09bnVsbCApIHtcblx0XHRcdGlmICggKytyZXZpdmVySW5kZXg9PT1yZXZpdmVyTGVuZ3RoICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbIV0pJyk7IH1cblx0XHRcdHJlZ0V4cF9mdW5jdGlvbiA9IGdyb3VwUmV2aXZlcnNbcmV2aXZlckluZGV4XTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRpZiAoIG1hdGNoZWQ9PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKCkpJyk7IH1cblx0XHRcdFx0aWYgKCBtYXRjaGVkLmluZGV4ICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMF0uZXhlYygpLmluZGV4KScpOyB9XG5cdFx0XHRcdGlmICggdHlwZW9mIG1hdGNoZWRbMF0hPT0nc3RyaW5nJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0pJyk7IH1cblx0XHRcdFx0aWYgKCBtYXRjaGVkWzBdLmxlbmd0aD09PTAgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVswXS5leGVjKClbMF0ubGVuZ3RoKScpOyB9XG5cdFx0XHRcdGlmICggbWF0Y2hlZFswXS5jaGFyQXQobWF0Y2hlZFswXS5sZW5ndGgtMSkhPT0nXFxuJyApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnBhcnNlKCxyZXZpdmVyLmdyb3VwWypdWzBdLmV4ZWMoKVswXSknKTsgfVxuXHRcdFx0fVxuXHRcdFx0dmFyIHRoaXNLZXlzIDpzdHJpbmcgPSBtYXRjaGVkWzBdO1xuXHRcdFx0dmFyIGtleUxlbmd0aCA6bnVtYmVyID0gdGhpc0tleXMubGVuZ3RoO1xuXHRcdFx0aWYgKCBwZW5kaW5nS2V5cy5sZW5ndGg9PT1rZXlMZW5ndGggKSB7XG5cdFx0XHRcdGxldmVsLnB1c2gocmVnRXhwX2Z1bmN0aW9uWzFdKHBlbmRpbmdHcm91cC5sZW5ndGg9PT0xID8gcGVuZGluZ0dyb3VwWzBdIDogcGVuZGluZ0dyb3VwLCBjb250ZXh0KSk7XG5cdFx0XHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRcdFx0aWYgKCBsZXZlbFtsZXZlbC5sZW5ndGgtMV09PT11bmRlZmluZWQgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2MucGFyc2UoLHJldml2ZXIuZ3JvdXBbKl1bMV0oKSknKTsgfVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHZhciBjb3VudCA6bnVtYmVyID0gMTtcblx0XHRcdGZvciAoIHZhciBpbmRleE9mTEYgOm51bWJlciA9IHRoaXNLZXlzLmluZGV4T2YoJ1xcbicpOyA7ICsrY291bnQgKSB7XG5cdFx0XHRcdGluZGV4T2ZMRiA9IHRoaXNLZXlzLmluZGV4T2YoJ1xcbicsIGluZGV4T2ZMRisxKTtcblx0XHRcdFx0aWYgKCBpbmRleE9mTEY8MCApIHsgYnJlYWs7IH1cblx0XHRcdH1cblx0XHRcdGxldmVsLnB1c2gocmVnRXhwX2Z1bmN0aW9uWzFdKDxlbGVtZW50PiggY291bnQ9PT0xID8gcGVuZGluZ0dyb3VwLnNoaWZ0KCkgOiBwZW5kaW5nR3JvdXAuc3BsaWNlKDAsIGNvdW50KSApLCBjb250ZXh0KSk7XG5cdFx0XHRpZiAoIGRlYnVnICkge1xuXHRcdFx0XHRpZiAoIGxldmVsW2xldmVsLmxlbmd0aC0xXT09PXVuZGVmaW5lZCApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5wYXJzZSgscmV2aXZlci5ncm91cFsqXVsxXSgpKScpOyB9XG5cdFx0XHR9XG5cdFx0XHRwZW5kaW5nS2V5cyA9IHBlbmRpbmdLZXlzLnNsaWNlKGtleUxlbmd0aCk7XG5cdFx0XHRyZXZpdmVySW5kZXggPSAwO1xuXHRcdFx0cmVnRXhwX2Z1bmN0aW9uID0gZmlyc3Q7XG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgdW5kZWZpbmVkIGZyb20gJy52b2lkJztcbmltcG9ydCBpc0FycmF5IGZyb20gJy5BcnJheS5pc0FycmF5Pz0nO1xuaW1wb3J0IHB1c2ggZnJvbSAnLkFycmF5LnByb3RvdHlwZS5wdXNoJztcbmltcG9ydCBUeXBlRXJyb3IgZnJvbSAnLlR5cGVFcnJvcic7XG5pbXBvcnQgRXJyb3IgZnJvbSAnLkVycm9yJztcbmltcG9ydCB7IG5vdFN0cmluZ0FycmF5IH0gZnJvbSAnLi91dGlsJztcblxudHlwZSByZXBsYWNlciA9IChsZXZlbCA6YW55LCBjb250ZW50IDphbnkpID0+ICggbnVtYmVyIHwgeyBrZXkgOnN0cmluZywgdmFsdWUgOnN0cmluZ1tdIH0gKVtdO1xudHlwZSBzcGFjZSA9IChrZXlzIDpzdHJpbmdbXSwgY29udGV4dCA6YW55KSA9PiB7IGtleXMgOnR5cGVvZiBrZXlzLCBpbmRlbnQgOnN0cmluZyB9O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzdHJpbmdpZnkgKFxuXHR0aGlzIDphbnksXG5cdGxldmVsIDphbnksXG5cdF9yZXBsYWNlcj8gOm51bGwgfCByZXBsYWNlcixcblx0X3NwYWNlPyA6bnVsbCB8IHNwYWNlLFxuXHRfZGVidWc/IDp0cnVlIHwgZmFsc2VcbikgOnN0cmluZ1tdIHtcblx0aWYgKCA8dW5rbm93bj5fZGVidWchPT1mYWxzZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGg+NCApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeShsZXZlbCwgcmVwbGFjZXIsIHNwYWNlLCBkZWJ1ZywgLi4uKScpOyB9XG5cdFx0aWYgKCBfZGVidWc9PT11bmRlZmluZWQgKSB7IF9kZWJ1ZyA9IHRydWU7IH1cblx0XHRlbHNlIGlmICggX2RlYnVnIT09dHJ1ZSApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCwsZGVidWcpJyk7IH1cblx0XHRpZiAoIF9yZXBsYWNlciE9bnVsbCAmJiB0eXBlb2YgX3JlcGxhY2VyIT09J2Z1bmN0aW9uJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLHJlcGxhY2VyKScpOyB9XG5cdFx0aWYgKCBfc3BhY2UhPW51bGwgJiYgdHlwZW9mIF9zcGFjZSE9PSdmdW5jdGlvbicgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UpJyk7IH1cblx0fVxuXHRpZiAoIF9yZXBsYWNlcj09PXVuZGVmaW5lZCApIHsgX3JlcGxhY2VyID0gbnVsbDsgfVxuXHRpZiAoIF9zcGFjZT09PXVuZGVmaW5lZCApIHsgX3NwYWNlID0gbnVsbDsgfVxuXHRyZXR1cm4gTGluZXModGhpcywgbGV2ZWwsIF9yZXBsYWNlciwgX3NwYWNlLCA8Ym9vbGVhbj5fZGVidWcpO1xufTtcblxuZnVuY3Rpb24gTGluZXMgKGNvbnRleHQgOmFueSwgbGV2ZWwgOmFueSwgcmVwbGFjZXIgOm51bGwgfCByZXBsYWNlciwgc3BhY2UgOm51bGwgfCBzcGFjZSwgZGVidWcgOmJvb2xlYW4pIHtcblx0aWYgKCByZXBsYWNlciE9PW51bGwgKSB7IGxldmVsID0gcmVwbGFjZXIobGV2ZWwsIGNvbnRleHQpOyB9XG5cdGlmICggZGVidWcgKSB7XG5cdFx0aWYgKCAhaXNBcnJheShsZXZlbCkgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KGxldmVsKScpOyB9XG5cdH1cblx0dmFyIGxpbmVzIDpzdHJpbmdbXSA9IFtdO1xuXHRmb3IgKCB2YXIgbGV2ZWxMZW5ndGggOm51bWJlciA9IGxldmVsLmxlbmd0aCwgbGV2ZWxJbmRleCA6bnVtYmVyID0gMDsgbGV2ZWxJbmRleDxsZXZlbExlbmd0aDsgKytsZXZlbEluZGV4ICkge1xuXHRcdHZhciBlYWNoIDpudW1iZXIgfCB7IGtleSA6c3RyaW5nLCB2YWx1ZSA6c3RyaW5nW10gfSA9IGxldmVsW2xldmVsSW5kZXhdO1xuXHRcdGlmICggZGVidWcgKSB7XG5cdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0fVxuXHRcdGlmICggdHlwZW9mIGVhY2g9PT0nbnVtYmVyJyApIHsgd2hpbGUgKCBlYWNoLS0gKSB7IGxpbmVzLnB1c2goJycpOyB9IH1cblx0XHRlbHNlIGlmICggZWFjaC5rZXk9PT0nJyApIHsgcHVzaC5hcHBseShsaW5lcywgZWFjaC52YWx1ZSk7IH1cblx0XHRlbHNlIGlmICggc3BhY2U9PT1udWxsICkge1xuXHRcdFx0cHVzaGVzKGxpbmVzLCBlYWNoLmtleSwgJ1xcdCcsIHJlcGxhY2VyPT09bnVsbFxuXHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIGVhY2gudmFsdWUsIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0OiBlYWNoLnZhbHVlXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHZhciBrZXlzIDpzdHJpbmdbXSA9IFtlYWNoLmtleV07XG5cdFx0XHR2YXIgdmFsdWVzIDpzdHJpbmdbXVtdID0gW2VhY2gudmFsdWVdO1xuXHRcdFx0d2hpbGUgKCArK2xldmVsSW5kZXg8bGV2ZWxMZW5ndGggKSB7XG5cdFx0XHRcdGVhY2ggPSBsZXZlbFtsZXZlbEluZGV4XTtcblx0XHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0XHRjaGVjayhlYWNoLCByZXBsYWNlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdFx0XHRcdC0tbGV2ZWxJbmRleDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRrZXlzLnB1c2goZWFjaC5rZXkpO1xuXHRcdFx0XHR2YWx1ZXMucHVzaChlYWNoLnZhbHVlKTtcblx0XHRcdH1cblx0XHRcdHZhciBrZXlzX2luZGVudCA6eyBrZXlzIDp0eXBlb2Yga2V5cywgaW5kZW50IDpzdHJpbmcgfSA9IHNwYWNlKGtleXMsIGNvbnRleHQpO1xuXHRcdFx0aWYgKCBkZWJ1ZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Yga2V5c19pbmRlbnQhPT0nb2JqZWN0JyB8fCBrZXlzX2luZGVudD09PW51bGwgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKSknKTsgfVxuXHRcdFx0XHRpZiAoICEoICdrZXlzJyBpbiBrZXlzX2luZGVudCApIHx8ICEoICdpbmRlbnQnIGluIGtleXNfaW5kZW50ICkgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpKScpOyB9XG5cdFx0XHRcdGlmICggIWlzQXJyYXkoa2V5c19pbmRlbnQua2V5cykgKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzKScpOyB9XG5cdFx0XHRcdGlmICgga2V5c19pbmRlbnQua2V5cy5sZW5ndGghPT12YWx1ZXMubGVuZ3RoICkgeyB0aHJvdyBuZXcgRXJyb3IoJ2pUYWJEb2Muc3RyaW5naWZ5KCwsc3BhY2UoKS5rZXlzLmxlbmd0aCknKTsgfVxuXHRcdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGtleXNfaW5kZW50LmtleXMpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgsLHNwYWNlKCkua2V5c1sqXSknKTsgfVxuXHRcdFx0XHRpZiAoIHR5cGVvZiA8dW5rbm93bj5rZXlzX2luZGVudC5pbmRlbnQhPT0nc3RyaW5nJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoLCxzcGFjZSgpLmluZGVudCknKTsgfVxuXHRcdFx0fVxuXHRcdFx0a2V5cyA9IGtleXNfaW5kZW50LmtleXM7XG5cdFx0XHR2YXIgaW5kZW50IDpzdHJpbmcgPSBrZXlzX2luZGVudC5pbmRlbnQ7XG5cdFx0XHRmb3IgKCB2YXIgbGVuZ3RoIDpudW1iZXIgPSB2YWx1ZXMubGVuZ3RoLCBpbmRleCA6bnVtYmVyID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdFx0XHRpZiAoIGtleXNbaW5kZXhdPT09JycgKSB7IHB1c2guYXBwbHkobGluZXMsIHZhbHVlc1tpbmRleF0pOyB9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHB1c2hlcyhsaW5lcywga2V5c1tpbmRleF0sIGluZGVudCwgcmVwbGFjZXI9PT1udWxsXG5cdFx0XHRcdFx0XHQ/IExpbmVzKGNvbnRleHQsIHZhbHVlc1tpbmRleF0sIG51bGwsIHNwYWNlLCBkZWJ1Zylcblx0XHRcdFx0XHRcdDogdmFsdWVzW2luZGV4XVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIGxpbmVzO1xufVxuXG5mdW5jdGlvbiBwdXNoZXMgKGxpbmVzIDpzdHJpbmdbXSwga2V5IDpzdHJpbmcsIGluZGVudCA6c3RyaW5nLCBzdWJMaW5lcyA6c3RyaW5nW10pIDp2b2lkIHtcblx0dmFyIGxlbmd0aCA6bnVtYmVyID0gc3ViTGluZXMubGVuZ3RoO1xuXHRpZiAoIGxlbmd0aD09PTAgKSB7IGxpbmVzLnB1c2goa2V5KTsgfVxuXHRlbHNlIHtcblx0XHRsaW5lcy5wdXNoKGtleStzdWJMaW5lc1swXSk7XG5cdFx0Zm9yICggdmFyIGluZGV4IDpudW1iZXIgPSAxOyBpbmRleDxsZW5ndGg7ICsraW5kZXggKSB7XG5cdFx0XHRsaW5lcy5wdXNoKGluZGVudCtzdWJMaW5lc1tpbmRleF0pO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBjaGVjayAoZWFjaCA6bnVtYmVyIHwgeyBrZXkgOnN0cmluZywgdmFsdWUgOnN0cmluZ1tdIH0sIHJlcGxhY2VyIDpudWxsIHwgcmVwbGFjZXIpIDp2b2lkIHtcblx0aWYgKCB0eXBlb2YgPHVua25vd24+ZWFjaD09PSdvYmplY3QnICYmIGVhY2ghPT1udWxsICkge1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRpZiAoICEoICdrZXknIGluIGVhY2ggKSB8fCAhKCAndmFsdWUnIGluIGVhY2ggKSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0KScpOyB9XG5cdFx0aWYgKCB0eXBlb2YgPHVua25vd24+ZWFjaC5rZXkhPT0nc3RyaW5nJyB8fCAhL14oPzpbXlxcdFxcblxccl0qXFx0KT8kLy50ZXN0KGVhY2gua2V5KSApIHsgdGhyb3cgbmV3IEVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LmtleSknKTsgfVxuXHRcdGlmICggcmVwbGFjZXIhPT1udWxsIHx8IGVhY2gua2V5PT09JycgKSB7XG5cdFx0XHRpZiAoICFpc0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlKScpOyB9XG5cdFx0XHRpZiAoIG5vdFN0cmluZ0FycmF5KGVhY2gudmFsdWUpICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl06b2JqZWN0LnZhbHVlWypdKScpOyB9XG5cdFx0fVxuXHR9XG5cdGVsc2UgaWYgKCB0eXBlb2YgZWFjaD09PSdudW1iZXInICkge1xuXHRcdGlmICggIS9eXFxkKyQvLnRlc3QoZWFjaCsnJykgKSB7IHRocm93IG5ldyBFcnJvcignalRhYkRvYy5zdHJpbmdpZnkoJysoIHJlcGxhY2VyID8gJyxyZXBsYWNlcigpJyA6ICdsZXZlbCcgKSsnWypdOm51bWJlciknKTsgfVxuXHR9XG5cdGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLnN0cmluZ2lmeSgnKyggcmVwbGFjZXIgPyAnLHJlcGxhY2VyKCknIDogJ2xldmVsJyApKydbKl0pJyk7IH1cbn1cbiIsImltcG9ydCBUeXBlRXJyb3IgZnJvbSAnLlR5cGVFcnJvcic7XG5pbXBvcnQgUmFuZ2VFcnJvciBmcm9tICcuUmFuZ2VFcnJvcic7XG5pbXBvcnQgeyBQT1NJVElWRV9JTlRFR0VSLCByZXBlYXRTcGFjZSB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFNwYWNlIChtaW5XaWR0aCA6bnVtYmVyLCBwYWRkaW5nIDpudW1iZXIpIDooa2V5cyA6c3RyaW5nW10pID0+IHsga2V5cyA6dHlwZW9mIGtleXMsIGluZGVudCA6c3RyaW5nIH0ge1xuXHRpZiAoIHR5cGVvZiA8dW5rbm93bj5taW5XaWR0aCE9PSdudW1iZXInICkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdqVGFiRG9jLlNwYWNlKG1pbldpZHRoKScpOyB9XG5cdGlmICggdHlwZW9mIDx1bmtub3duPnBhZGRpbmchPT0nbnVtYmVyJyApIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignalRhYkRvYy5TcGFjZSgscGFkZGluZyknKTsgfVxuXHR2YXIgbXVsdGlwbGUgOmJvb2xlYW4gPSBtaW5XaWR0aDwwO1xuXHRpZiAoIG11bHRpcGxlICkgeyBtaW5XaWR0aCA9IH5taW5XaWR0aDsgfVxuXHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QobWluV2lkdGgrJycpICkgeyB0aHJvdyBuZXcgUmFuZ2VFcnJvcignalRhYkRvYy5TcGFjZShtaW5XaWR0aCknKTsgfVxuXHRpZiAoICFQT1NJVElWRV9JTlRFR0VSLnRlc3QocGFkZGluZysnJykgKSB7IHRocm93IG5ldyBSYW5nZUVycm9yKCdqVGFiRG9jLlNwYWNlKCxwYWRkaW5nKScpOyB9XG5cdHJldHVybiBmdW5jdGlvbiBzcGFjZSAoa2V5cyA6c3RyaW5nW10pIDp7IGtleXMgOnR5cGVvZiBrZXlzLCBpbmRlbnQgOnN0cmluZyB9IHtcblx0XHRyZXR1cm4ga2V5c19pbmRlbnQobXVsdGlwbGUsIG1pbldpZHRoLCBwYWRkaW5nLCBrZXlzKTtcblx0fTtcbn07XG5cbmZ1bmN0aW9uIGtleXNfaW5kZW50IChtdWx0aXBsZSA6Ym9vbGVhbiwgbWluV2lkdGggOm51bWJlciwgcGFkZGluZyA6bnVtYmVyLCBrZXlzIDpzdHJpbmdbXSkgOnsga2V5cyA6dHlwZW9mIGtleXMsIGluZGVudCA6c3RyaW5nIH0ge1xuXHR2YXIgbWF4V2lkdGggOm51bWJlciA9IDE7XG5cdHZhciB3aWR0aHMgOm51bWJlcltdID0gW107XG5cdGZvciAoIHZhciBsZW5ndGggOm51bWJlciA9IGtleXMubGVuZ3RoLCBpbmRleCA6bnVtYmVyID0gMDsgaW5kZXg8bGVuZ3RoOyArK2luZGV4ICkge1xuXHRcdHZhciB3aWR0aCA6bnVtYmVyID0gMDtcblx0XHR2YXIga2V5IDpzdHJpbmcgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0Zm9yICggdmFyIGwgOm51bWJlciA9IGtleS5sZW5ndGgtMSwgaSA6bnVtYmVyID0gMDsgaTxsOyArK2kgKSB7XG5cdFx0XHRcdHZhciBjaGFyQ29kZSA6bnVtYmVyID0ga2V5LmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRcdGlmICggY2hhckNvZGU8MHg4MCApIHsgd2lkdGggKz0gMTsgfVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHR3aWR0aCArPSAyO1xuXHRcdFx0XHRcdGlmICggY2hhckNvZGU+PTB4RDgwMCAmJiBjaGFyQ29kZTw9MHhEQkZGICYmIGkrMTxsICkge1xuXHRcdFx0XHRcdFx0Y2hhckNvZGUgPSBrZXkuY2hhckNvZGVBdChpKzEpO1xuXHRcdFx0XHRcdFx0Y2hhckNvZGU+PTB4REMwMCAmJiBjaGFyQ29kZTw9MHhERkZGICYmICsraTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggd2lkdGg+bWF4V2lkdGggKSB7IG1heFdpZHRoID0gd2lkdGg7IH1cblx0XHR9XG5cdFx0d2lkdGhzLnB1c2god2lkdGgpO1xuXHR9XG5cdHdpZHRoID0gbWF4V2lkdGgrcGFkZGluZztcblx0aWYgKCBtdWx0aXBsZSApIHtcblx0XHRpZiAoIHdpZHRoJW1pbldpZHRoICkgeyB3aWR0aCArPSBtaW5XaWR0aC13aWR0aCVtaW5XaWR0aDsgfVxuXHR9XG5cdGVsc2Uge1xuXHRcdGlmICggd2lkdGg8bWluV2lkdGggKSB7IHdpZHRoID0gbWluV2lkdGg7IH1cblx0fVxuXHRmb3IgKCBpbmRleCA9IDA7IGluZGV4PGxlbmd0aDsgKytpbmRleCApIHtcblx0XHRrZXkgPSBrZXlzW2luZGV4XTtcblx0XHRpZiAoIGtleSE9PScnICkge1xuXHRcdFx0a2V5c1tpbmRleF0gPSBrZXkuc2xpY2UoMCwgLTEpK3JlcGVhdFNwYWNlKHdpZHRoLXdpZHRoc1tpbmRleF0pO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4geyBrZXlzOiBrZXlzLCBpbmRlbnQ6IHJlcGVhdFNwYWNlKHdpZHRoKSB9O1xufVxuIiwiaW1wb3J0IHZlcnNpb24gZnJvbSAnLi92ZXJzaW9uP3RleHQnO1xuaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UnO1xuaW1wb3J0IHN0cmluZ2lmeSBmcm9tICcuL3N0cmluZ2lmeSc7XG5pbXBvcnQgU3BhY2UgZnJvbSAnLi9TcGFjZSc7XG52YXIgalRhYkRvYyA9IHtcblx0cGFyc2U6IHBhcnNlLFxuXHRzdHJpbmdpZnk6IHN0cmluZ2lmeSxcblx0U3BhY2U6IFNwYWNlLFxuXHR2ZXJzaW9uOiB2ZXJzaW9uXG59O1xualRhYkRvY1snZGVmYXVsdCddID0galRhYkRvYztcbmV4cG9ydCB7XG5cdHBhcnNlLFxuXHRzdHJpbmdpZnksXG5cdFNwYWNlLFxuXHR2ZXJzaW9uXG59O1xuZXhwb3J0IGRlZmF1bHQgalRhYkRvYzsiXSwibmFtZXMiOlsidW5kZWZpbmVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtCQUFlLE9BQU87Ozs7Ozs7Ozs7MEJBQUMsdEJDR2hCLElBQUksaUJBQWlCLENBQUM7QUFDN0IsSUFBTyxJQUFJLFFBQVEsaUJBQWlCO1FBQ25DLElBQUssT0FBTyxNQUFNLEtBQUcsVUFBVSxFQUFHO1lBQ2pDLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDL0IsSUFBSyxPQUFPLFFBQVEsS0FBRyxVQUFVLElBQUksT0FBTyxNQUFNLENBQUMsSUFBSSxLQUFHLFVBQVUsRUFBRztnQkFDdEUsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDdkIsSUFBSyxPQUFPLElBQUksS0FBRyxVQUFVLEVBQUc7b0JBQy9CLElBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRzt3QkFDM0MsSUFBSSxHQUFHLFNBQVMsSUFBSSxDQUFFLE1BQU0sSUFBWSxPQUFPLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQztxQkFDckU7b0JBQ0QsaUJBQWlCLEdBQUcsU0FBUyxpQkFBaUIsQ0FBRSxNQUFjO3dCQUM3RCxRQUFTLE1BQU0sQ0FBQyxDQUFDLENBQUM7NEJBQ2pCLEtBQUssSUFBSTtnQ0FBRSxJQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLElBQUksTUFBTSxDQUFD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SUFBSSxFQUFHO3dCQUFFLEtBQUssSUFBSSxDQUFDLENBQUM7cUJBQUU7eUJBQy9CO3dCQUNKLEtBQUssSUFBSSxDQUFDLENBQUM7d0JBQ1gsSUFBSyxRQUFRLElBQUUsTUFBTSxJQUFJLFFBQVEsSUFBRSxNQUFNLElBQUksQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUc7NEJBQ3BELFFBQVEsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDL0IsUUFBUSxJQUFFLE1BQU0sSUFBSSxRQUFRLElBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3lCQUM1QztxQkFDRDtpQkFDRDtnQkFDRCxJQUFLLEtBQUssR0FBQyxRQUFRLEVBQUc7b0JBQUUsUUFBUSxHQUFHLEtBQUssQ0FBQztpQkFBRTthQUMzQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbkI7UUFDRCxLQUFLLEdBQUcsUUFBUSxHQUFDLE9BQU8sQ0FBQztRQUN6QixJQUFLLFFBQVEsRUFBRztZQUNmLElBQUssS0FBSyxHQUFDLFFBQVEsRUFBRztnQkFBRSxLQUFLLElBQUksUUFBUSxHQUFDLEtBQUssR0FBQyxRQUFRLENBQUM7YUFBRTtTQUMzRDthQUNJO1lBQ0osSUFBSyxLQUFLLEdBQUMsUUFBUSxFQUFHO2dCQUFFLEtBQUssR0FBRyxRQUFRLENBQUM7YUFBRTtTQUMzQztRQUNELEtBQU0sS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFHO1lBQ3hDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsSUFBSyxHQUFHLEtBQUcsRUFBRSxFQUFHO2dCQUNmLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDaEU7U0FDRDtRQUNELE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztJQUNuRCxDQUFDOztJQ2hERCxJQUFJLE9BQU8sR0FBRztRQUNiLEtBQUssRUFBRSxLQUFLO1FBQ1osU0FBUyxFQUFFLFNBQVM7UUFDcEIsS0FBSyxFQUFFLEtBQUs7UUFDWixPQUFPLEVBQUUsT0FBTztLQUNoQixDQUFDO0lBQ0YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLE9BQU8sQ0FBQzs7Ozs7Ozs7Iiwic291cmNlUm9vdCI6Ii4uLy4uL3NyYy8ifQ==