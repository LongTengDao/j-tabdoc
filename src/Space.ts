import TypeError from '.TypeError';
import RangeError from '.RangeError';
import { POSITIVE_INTEGER, repeatSpace } from './util';

export default function Space (minWidth :number, padding :number) :(keys :string[]) => { keys :typeof keys, indent :string } {
	if ( typeof <unknown>minWidth!=='number' ) { throw new TypeError('jTabDoc.Space(minWidth)'); }
	if ( typeof <unknown>padding!=='number' ) { throw new TypeError('jTabDoc.Space(,padding)'); }
	var multiple :boolean = minWidth<0;
	if ( multiple ) { minWidth = ~minWidth; }
	if ( !POSITIVE_INTEGER.test(minWidth+'') ) { throw new RangeError('jTabDoc.Space(minWidth)'); }
	if ( !POSITIVE_INTEGER.test(padding+'') ) { throw new RangeError('jTabDoc.Space(,padding)'); }
	return function space (keys :string[]) :{ keys :typeof keys, indent :string } {
		return keys_indent(multiple, minWidth, padding, keys);
	};
};

function keys_indent (multiple :boolean, minWidth :number, padding :number, keys :string[]) :{ keys :typeof keys, indent :string } {
	var maxWidth :number = 1;
	var widths :number[] = [];
	for ( var length :number = keys.length, index :number = 0; index<length; ++index ) {
		var width :number = 0;
		var key :string = keys[index];
		if ( key!=='' ) {
			for ( var l :number = key.length-1, i :number = 0; i<l; ++i ) {
				var charCode :number = key.charCodeAt(i);
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
