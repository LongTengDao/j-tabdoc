import version from '../version?text';
import parse from './parse.js';
import stringify from './stringify.js';
import Space from './Space.js';
var jTabDoc = {
	parse: parse,
	stringify: stringify,
	Space: Space,
	version: version
};
jTabDoc['default'] = jTabDoc;
export {
	parse,
	stringify,
	Space,
	version
};
export default jTabDoc;