var XLSX = require('xlsx');
var Promise = require("bluebird");

function toFixed(num) {
	if (num < 10) return "0" + num;
	return num;
}

function convert(data, user, mode) {

	var uploads = data.upload;

	if(!(uploads && uploads.file)){
		throw "Export from Excel - invalid upload";
	}

	var workbook = XLSX.readFile(uploads.file.path, {cellDates: true});
	var sheet_name_list = workbook.SheetNames;

	var sheetNumber = data.sheet || 0;
	var worksheet = workbook.Sheets[sheet_name_list[sheetNumber]];

	if(!worksheet){
		throw new Error(`Excel import failed, sheet %{0} not found`);
	}

	var json = [];
	var headers = {};
	var dateRegexp = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$");
	for(var sheet in worksheet) {
		// all keys that do not begin with "!" correspond to cell addresses
		if(sheet[0] === '!') continue;
		//parse out the column, row, and value
		var tt = 0;
		for (var i = 0; i < sheet.length; i++) {
			if (!isNaN(sheet[i])) {
				tt = i;
				break;
			}
		}
		var col = sheet.substring(0,tt);
		var row = parseInt(sheet.substring(tt));

		var value = worksheet[sheet].v;

		if(value && value.getFullYear){
			var dateValue = new Date(value);
			value = dateValue.getFullYear() + '-' + toFixed(dateValue.getMonth() + 1) + '-' + toFixed(dateValue.getDate())
				+ ' ' + toFixed(dateValue.getHours()) + ':' + toFixed(dateValue.getMinutes()) + ':' + toFixed(dateValue.getSeconds());
		}
		//store header names
		if(row == 1 && value) {
			headers[col] = value;
			continue;
		}

		if(!json[row]) json[row]={};
		json[row][headers[col]] = value;
	}
	//drop those first two rows which are empty
	json.shift();
	json.shift();


	return {
		type: mode,
		name: data.name,
		head:{
			"Access-Control-Allow-Origin":"*",
			"Access-Control-Allow-Methods" : "POST",
			"Access-Control-Allow-Headers":"X-Requested-With, Content-Type"
		},
		data: JSON.stringify(json,"", "\t")
	};
}

module.exports = {
	convert:Promise.method(convert)
};