import version from './version?text';
import parse from './parse';
import stringify from './stringify';
import Space from './Space';
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