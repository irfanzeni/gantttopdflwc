var raven = require('raven');
var ravenURI = process.env.EXPORT_TRACK_ERRORS || "";
var client;

function isReady(){
	return ravenURI && client;
}

module.exports = {
	start: function(version){
		if (ravenURI){
			client = new raven.Client(ravenURI,{
				release: version
			});
			
			client.patchGlobal();
			console.log("Error logging has started");
		}
	},
	captureException: function(exception, data){
		if (isReady()){
			client.captureException(
				exception, 
				data
			);
		}
	},
};