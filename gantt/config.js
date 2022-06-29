module.exports = {
	"pdf" 	: require("./pdf"),
	"png" 	: require("./png"),
	"xls" 	: require("./excel/export"),
	"xlsx" 	: require("./excel/export"),
	"excel" : require("./excel/export"),
	"excel-parse" : require("./excel/import"),
	"ical" 	: require("./ical"),
	"json" 	: require("./json"),
	"msproject" : require("./msproject"),
	"msproject-parse" : require("./msproject"),
	"primaveraP6" : require("./msproject"),
	"primaveraP6-parse" : require("./msproject"),
	"mpp" 		: require("./msproject")
};