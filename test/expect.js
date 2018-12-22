module.exports = [
	1,
	{ "nodeName": "P", "nodeValue": ["a", "b"] },
	1,
	{
		"nodeName": "Section", "nodeValue": ["c", "d"], "childNodes": [
			{ "nodeName": "P", "nodeValue": ["e", "f"] }
		]
	},
	{
		"nodeName": "Section", "nodeValue": ["g", "h"], "childNodes": [
			{
				"nodeName": "Section", "nodeValue": null, "childNodes": [
					{ "nodeName": "P", "nodeValue": ["x", "y"] }
				]
			}
		]
	},
	2,
	{
		"nodeName": "Table", "nodeValue": [
			"i\tj",
			"k\tl"
		]
	},
	1
];