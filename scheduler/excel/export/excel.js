var zip = require('jszip');
var fs = require('fs');
var scramblePrivateData = require('./datascrambler');
var logger = require("../../../common/logger");

var letters = getAllLetters();
var predefined_styles_count = 21;
var predefined_fills_count = 6;
var predefined_fonts_count = 4;

function getAllLetters(){
	var data = [];

	var letters = [""].concat("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));

	//limit to 2500 columns
	for (var i=0; i<4; i++)
		for (var j= i?1:0; j<=26; j++)
			for (var k=1;  k<=26; k++)
				data.push( letters[i] + letters[j] + letters[k] );

	return data;
}
var flist = [
	"_rels/.rels",
	"docProps/app.xml",
	"docProps/core.xml",
	"xl/styles.xml",
	"xl/sharedStrings.xml",
	"xl/workbook.xml",
	"xl/_rels/workbook.xml.rels",
	"xl/theme/theme1.xml",
	"xl/worksheets/sheet1.xml",
	"[Content_Types].xml"
];
var fcache = {};

for (var i =0; i<flist.length; i++)
	fcache[flist[i]] = fs.readFileSync(__dirname + "/template/"+flist[i]).toString("utf-8");


function tryConvert(config){
	try{
		return convert(config);
	}catch (e){
		logger.captureException(
			e, 
			{extra: { parameters: scramblePrivateData(config) }}
		);
		throw e;
	}
}

function convert(config){
	var cols = config.columns;
	
	var data = config.data;
    var colsLength = cols.length;
    var dataLength = data.length;
    var data_start_row = 2;
    var scales = [];

    var spans = [];
    var colors = { fills: [], styles : [], pull: {}, fonts:[] };

    var fullLength = colsLength;
    if (config.visual){
    	fullLength += config.scales.width;
    	data_start_row += config.scales.height-1;
    	scales = config.scales.data;
    }

    var tcache = {};
    for (var key in fcache) tcache[key] = fcache[key];

	
	var state = { cache:{}, shared:[], count:0 };

	var cols_xml = [];
	var data_xml = [];
	//columns
	for (var i=1; i<=colsLength; i++)
		cols_xml.push('<col min="'+i+'" max="'+i+'" width="'+(cols[i-1].width || 42)+'" customWidth="1"/>');
	for (var i=colsLength+1; i<=fullLength; i++)
		cols_xml.push('<col min="'+i+'" max="'+i+'" width="10" customWidth="1"/>');

	//header
	data_xml.push('<row r="1" spans="1:'+fullLength+'" ht="26.25" customHeight="1">');
	for (var i=0; i<colsLength; i++)
		data_xml.push(add_string(cols[i].header, state, i, 1, (config.visual?8:4)));

	if (config.visual)	
		add_scale_line(data_xml, state, spans, scales[0], colsLength, 1, scales.length>1, colors);

	data_xml.push('</row>');

	if (scales.length > 1){
		for (var i = 1; i < scales.length; i++) {
			data_xml.push('<row r="'+(i+1)+'" spans="1:'+fullLength+'" ht="26.25" customHeight="1">');
			add_scale_line(data_xml, state, spans, scales[i], colsLength, i+1, i != scales.length-1, colors);
			data_xml.push('</row>');
		}

		for (var i=0; i<colsLength; i++)
			add_span(spans, i, 1, i, scales.length)
	}

	//data
	for (var i=0; i<dataLength; i++){
		var rownum = i + data_start_row;
		data_xml.push('<row r="'+(i+data_start_row)+'" spans="1:'+ fullLength + '"'+(config.visual?' thickTop="1" thickBot="1" ':'')+'>');
		for (var j=0; j<colsLength; j++){
			var col = cols[j];
			var style = j === 0 ? (11+data[i].$level*1) : null;
			if (col.type){
				if (col.type == "number"){
					data_xml.push(add_number(data[i][col.id], state, j, rownum ));
				} else if (col.type == "date")
					data_xml.push(add_date(data[i][col.id], state, j, rownum ));
				else if (col.type == "string")
					data_xml.push(add_string(data[i][col.id], state, j, rownum, style));
			} else
				data_xml.push(add_string(data[i][col.id], state, j, rownum, style));
		}

		if (config.visual){
			var row_xml = [];
			var center_xml = [];
			var color_id = (data[i].$type == "project" ? 10 : 9 );
			if (data[i].$color)
				color_id = add_color(colors, data[i].$color);

			var start = j+data[i].$start;
			var end = j+data[i].$end;
			var span = start != end;

			center_xml.push(add_string((span ? data[i].$text : ""), state, start, rownum, color_id));
			for (var k = start+1; k < end; k++)
				center_xml.push(add_string("", state, k, rownum, 9));

			var color_right = add_twin_color(colors, "ffffff", "222222", 11, "left");
			if (!span) end++;

			if (data[i].styles){
				var styles = data[i].styles;
				for (var k=0; k<styles.length; k++){
					var cstyles = styles[k].styles.split(";");
					var cindex = styles[k].index*1+j;
					if (cindex >= start && cindex < end) continue;

					if (cindex == end && data[i].$right){
						color_right = add_twin_color(colors, cstyles[1], "222222", 11, "left");
					} else{
						color_id = add_twin_color(colors, cstyles[1], cstyles[0], 12);
						if (cindex < end)
							data_xml.push(add_string("", state, cindex, rownum, color_id));
						else
							row_xml.push(add_string("", state, cindex, rownum, color_id));
					}
				}
			}

			if (data[i].$right)
				center_xml.push(add_string(data[i].$right, state, end, rownum, color_right));
			
			if (span)	
				add_span(spans, start, rownum, end-1, rownum);

			data_xml.push(center_xml.join(""));
			data_xml.push(row_xml.join(""));
		}
		
		data_xml.push('</row>');
	}

	tcache["xl/sharedStrings.xml"] = tcache["xl/sharedStrings.xml"].
		replace("{{shared_strings}}", shared_strings(state)).
		replace("{{count}}", state.count ).
		replace("{{uniq}}", state.shared.length );

	tcache["xl/workbook.xml"] = tcache["xl/workbook.xml"].
		replace("{{sheet_name}}", (config.title|| "Sheet1"));

	tcache["xl/worksheets/sheet1.xml"] = tcache["xl/worksheets/sheet1.xml"].
		replace("{{columns}}", cols_xml.join("")).
		replace("{{rows}}", data_xml.join("")).
		replace("{{mergeCells}}", (spans.length ? ('<mergeCells count="'+spans.length+'">'+spans.join("")+'</mergeCells>'): ""));


	tcache["xl/styles.xml"] = tcache["xl/styles.xml"].
		replace("{{fills}}",  colors.fills.join("")).
		replace("{{fonts}}",  colors.fonts.join("")).
		replace("{{styles}}", colors.styles.join("")).
		replace("{{fillsCount}}",  predefined_fills_count+colors.fills.length).
		replace("{{fontsCount}}",  predefined_fonts_count+colors.fonts.length).
		replace("{{stylesCount}}", predefined_styles_count+colors.styles.length);

	var file = new zip();
	for (var key in tcache)
		file.file(key, tcache[key].replace("{{dateformat}}", (config.dateFormat || "mmmm dd, yyyy")), { date: new Date(), createFolders:true });

	return file.generate({
		type: 'nodebuffer',
		compression:'DEFLATE'
	});
}

function add_span(spans, x1, y1, x2, y2){
	spans.push('<mergeCell ref="'+letters[x1]+y1+':'+letters[x2]+y2+'"/>');
}
function add_twin_color(colors, color, font, fontSize, align, border){
	color = color.toUpperCase();
	font = font.toUpperCase();
	border = border || "0";
	align = align || "center";
	var id = color+";"+font;

	if (colors.pull[id]) 
		return colors.pull[id];

	colors.fonts.push('<font><sz val="'+fontSize+'"/><color rgb="FF'+font+'"/><name val="Calibri"/><family val="2"/></font>');
	colors.fills.push('<fill><patternFill patternType="solid"><fgColor rgb="FF'+color+'"/><bgColor rgb="FF"/></patternFill></fill>');
	colors.styles.push('<xf numFmtId="0" fontId="'+(colors.fonts.length-1+predefined_fonts_count)+'" fillId="'+(colors.fills.length-1+predefined_fills_count)+'" borderId="'+border+'" xfId="0" applyFont="1" applyBorder="1" applyFill="1" applyAlignment="1"><alignment horizontal="'+align+'" vertical="center"/></xf>');
	return (colors.pull[id] = colors.styles.length-1+predefined_styles_count);
}
function add_color(colors, color){
	color = color.toUpperCase();
	if (colors.pull[color]) 
		return colors.pull[color];

	colors.fills.push('<fill><patternFill patternType="solid"><fgColor rgb="FF'+color+'"/><bgColor indexed="64"/></patternFill></fill>');
	colors.styles.push('<xf numFmtId="0" fontId="0" fillId="'+(colors.fills.length-1+predefined_fills_count)+'" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>');
	return (colors.pull[color] = colors.styles.length-1+predefined_styles_count);
}

function add_scale_line(xml, state, spans, line, start, y, last, colors){
	if (y>1)
		for (var j = 1; j < start; j++){
			xml.push(add_string("", state, j, y, 8));
		}

	for (var i = 0; i < line.length; i++){
		var size = line[i].end - line[i].start;
		var css = last?7:8;
		if (line[i].styles){
			var styles = line[i].styles.split(";");
			css = add_twin_color(colors, styles[1], styles[0], 12, null, "3");
		}

		xml.push(add_string(line[i].text, state, start, y, css));
		if (size > 1){
			for (var j = 1; j < size; j++)
				xml.push(add_string("", state, start+j, y, css));
			add_span(spans, start, y, start+size-1, y);
		}
		start += size;
	}
}

function add_string(text, state, index, row, style, extra){
	if (text !== ""){
		//remove any HTML fragments
		if (text)
			text = text.toString().replace(/<[^>]*>/g,"");
		var num = state.cache[text];
		if (!num){
			num = state.shared.length;
			state.shared.push(text);
			state.cache[text] = num;
		}
		state.count++;
	} else 
		var num = "";

	return '<c r="'+letters[index]+row+'" s="'+(style || 2)+'" t="s"'+(extra||"")+'><v>'+num+'</v></c>';
}
function add_number(text, state, index, row){
	return '<c r="'+letters[index]+row+'" s="2"><v>'+escape(text)+'</v></c>';
}

function add_date(text, state, index, row){
	if((text + "").match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z/)){
		// ISO utc date - "2018-02-02T13:45:33.892Z"
		return '<c t="d" r="'+letters[index]+row+'" s="3"><v>'+text+'</v></c>'
	}else{
		var date = Math.round(25569 + text / (60*60*1000*24));
		if (isNaN(date))
			return add_string(text, state, index, row);
		return '<c r="'+letters[index]+row+'" s="3"><v>'+date+'</v></c>';
	}
}

function shared_strings(state){
	for (var i = 0; i < state.shared.length; i++)
		state.shared[i] = "<si><t>"+escape(state.shared[i])+"</t></si>";

	return state.shared.join("");
}

function escape(s) { 
	if (!s && s !== 0) return "";
	return s.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); 
}

module.exports = tryConvert;