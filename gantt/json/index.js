var Promise = require("bluebird");
function convert(data, user, mode){

	return {
		type: mode,
		name: data.name,
		data: JSON.stringify(data,"", "\t")
	};

}

module.exports = {
	convert:Promise.method(convert)
};