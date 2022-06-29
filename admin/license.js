var root_mode = false;
var defuser = { "id": "0000", "end": 4084549200, watermark:true, store:true, name:"common" };
var rootuser = {  "id": "0100", "end": 4084549200, watermark:false, store:true, name:"root" };

var raw_data = [];
var domains = {
};

function read_config(){
	const fs = require("fs");
	const licensePath = process.env.FILES_ROOT+"/configs/license.json";

	const standaloneCallback = () => {
		root_mode = true;
		console.log("Working in standalone mode");
	}

	if (fs.existsSync(licensePath)) {
		fs.readFile(licensePath, function(err, buff){
			if (err){
				standaloneCallback();
			} else {
				raw_data = JSON.parse(buff.toString("utf8"));

				domains = {};
				for (var i = 0; i < raw_data.length; i++)
					domains[raw_data[i].domain] = raw_data[i];
			}
		});
	}else{
		standaloneCallback();
	}
}

function by_referer(referer){
	if (referer)
		for (var key in domains)
			if (referer.toLowerCase().indexOf(key.toLowerCase()) != -1)
				return check_user(domains[key]);

	return root_mode ? rootuser : defuser;
}

function by_domain(domain){
	return check_user( domains[domain] );
}

function check_user(user){
	user = user || ( root_mode ? rootuser : defuser);
	var active = user && user.end > ((new Date())/1000);

	//change properties of non-active user
	if (!active){
		user.watermark = true;
		user.store = false;

		send_signal( 0, user);
		save_data(JSON.stringify(raw_data));
	}

	return user;	
}

function get_data(){
	return raw_data;
}
function save_data(data){
	var fs = require("fs");
	fs.writeFile(process.env.FILES_ROOT+"/configs/"+Math.round((new Date()).valueOf()/1000)+".json", data, function(){});
	fs.writeFile(process.env.FILES_ROOT+"/configs/license.json", data, read_config);
	return "ok";
}

//read initial config
read_config();

//checkin license expiration
var x30 = 60*60*24*30;
var x10 = 60*60*24*10;
var x3  = 60*60*24*3;
var x1  = 60*60*24*1;

var checker = function(){
	var today = Math.round((new Date())/1000);
	
	var d30  = today + x30;
	var d30s = d30 - x1;

	var d10  = today + x10;
	var d10s = d10 - x1;

	var d3  = today + x3;
	var d3s = d3 - x1;

	for (var i = 0; i < raw_data.length; i++){
		var date  = raw_data[i].end;
		if (date>d30s && date<d30) send_signal(30, raw_data[i]);
		if (date>d10s && date<d10) send_signal(10, raw_data[i]);
		if (date>d3s  && date<d3 ) send_signal( 3, raw_data[i]);
	}

};


var started = false;
function start_user_check(){
	if (!started){
		console.log("User Check started");
		started = true;
		setInterval(checker, 1000*60*60*4);
	}
}

function send_signal(level, data){
	var copy = JSON.parse(JSON.stringify(data));
	copy.days = level;

	require("./signal.js")("xbsoftware.com", "/x-services/export.php", copy);
}

module.exports = {
	userCheck:		start_user_check,
	getByDomain:	by_domain,
	getByReferer:	by_referer,
	refresh: 		read_config,
	getRawData:		get_data,
	saveRawData:	save_data
};
