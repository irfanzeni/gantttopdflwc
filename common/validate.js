var sanitizeHtml = require("sanitize-html");
var sanitizeFilename = require("sanitize-filename");
var HTML_ALLOWED = {
	allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
	'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong',
	'em', 'strike', 'code', 'hr', 'br', 'div',
	'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td',
	'pre', 'img', 'link', 'span', 'style'],
	allowedAttributes: {
	  a: [ 'href', 'name', 'target', 'style', 'id', 'class'],
	  img: [ 'src', 'style', 'id', 'class'],
	  link: ['rel', 'href', 'charset', 'type']
	},
	selfClosing: [ 'img', 'br', 'hr', 'area', 'base',
	  'basefont', 'input', 'link', 'meta' ]
};
for (var key in HTML_ALLOWED.allowedTags){
	var tag = HTML_ALLOWED.allowedTags[key];
	if (!HTML_ALLOWED.allowedAttributes[tag])
		HTML_ALLOWED.allowedAttributes[tag] = ['style', 'id', 'class'];
}


function validate(value, mask, def, post){
	var result = def;
	if (value){
		if (typeof mask == "function")
			result = mask(value) ? value : def;
		else
			result = (mask[value] === true) ? value :def;
	}

	return post ? post(result) : result;
}

module.exports = {
	validate:validate,

	VALID_GANTT_SKIN : { "meadow":true, "skyblue":true, "terrace":true, "broadway":true, "material":true, "contrast_white":true, "contrast_black":true },
	VALID_SCHEDULER_SKIN : { "glossy":true, "flat":true, "classic":true, "terrace":true, "material":true, "contrast_white":true, "contrast_black":true  },
	VALID_NAME : function(val){ return !!sanitizeFilename(val); },
	SANITIZE_FILENAME : function(val){ return sanitizeFilename(val); },
	VALID_DATE : function(val){ return typeof val == "string" && val.match(/^[0-9\-\: ]*$/g); },
	VALID_OBJECT : function(val){ return typeof val == "object"; },
	VALID_LOCALE : function(val){ return typeof val == "string" && val.match(/^[a-z]*$/g); },
	VALID_HTML : function(val){ return typeof val == "string" && val },
	SANITIZE_HTML : function(value){ return value ? sanitizeHtml(value, HTML_ALLOWED) : value; },
	VALID_FLOAT : function(val){ return parseFloat(val); },
	VALID_FORMAT : { "A5":true, "A4" : true, "A3" : true, "A2" : true, "A1" : true, "A0" : true, "full" : true },
	VALID_ORIENTATION : { "portrait" : true, "landscape" : true }
};


