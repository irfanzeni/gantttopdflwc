var Promise = require("bluebird");

module.exports = function(stream){
	return new Promise(function(resolve, reject){
		stream.on("end", resolve);
		stream.on("close", resolve);
		stream.on("error", reject);
	});
}