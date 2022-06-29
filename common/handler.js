var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var Promise = require("bluebird");
	Promise.promisifyAll(fs);
var contentDisposition = require("content-disposition");

var contenttypes = {
	"pdf"	: "application/pdf",
	"png"	: "image/png",
	"xlsx"	: "application/vnd.ms-excel",
	"xls"	: "application/vnd.ms-excel",
	"excel"	: "application/vnd.ms-excel",
	"excel-parse"	: "application/json",
	"ical"	: "text/calendar",
	"xml"	: "text/xml",
	"json"	: "application/json",
	"msproject": "application/vnd.ms-project",
	"primaveraP6": "text/xml",
	"mpp"	: "application/vnd.ms-project",
	"msproject-parse"	: "application/json",
	"primaveraP6-parse"	: "application/xml"
};

function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }

  return 'localhost';
}

function get_file_id(base){
	var id = crypto.randomBytes(6).readUInt32LE(0);
	return fs.mkdirAsync(base)
		.catch(function(){})
		.then(function(){
			return fs.statAsync(base + id);
		})
		.then(function(){
			get_file_id(base);
		})
		.catch(function(exists){
			return id;
		});
}

function store_and_send(result, customer){
	//allow temporary storage for all users
	var customer_id = customer.store ? customer.id : "0000";

	var base = module.storage + customer_id+"/";

	return get_file_id(base)
		.then(function(file_id){
			const server = process.env.EXPORT_HTTP;
			result.url = `${server}/${customer_id}/${file_id}/${path.basename(result.name)}`;
			result.storage = base+file_id;

			return fs.writeFileAsync(result.storage, result.data);
		})
		.then(function(){
			return {
				head:{
					"Access-Control-Allow-Origin":"*",
					"Access-Control-Allow-Methods" : "POST",
					"Access-Control-Allow-Headers":"X-Requested-With, Content-Type",
					"Content-Type": "application/json"
				},
				body:JSON.stringify({ url: result.url })
			};
		});
}

function send_file(result, customer){
	var response = {
		head:{
			"Access-Control-Allow-Origin":"*",
			"Access-Control-Allow-Methods" : "POST",
			"Access-Control-Allow-Headers":"X-Requested-With, Content-Type",
			'Content-Type': contenttypes[result.type],
			'Content-Length': Buffer.byteLength(result.data, 'utf8'),
			'Content-Disposition':contentDisposition(result.name)
		},
		body:result.data
	};

	if(result.error){
		response.error = result.error;
	}
	return response;
}

var api_router = Promise.method(
	function (handlers, post, customer, upload){
		var data;
		try{
			console.log("Request data parse", new Date())
			data = JSON.parse(post.data);
		} catch(e){
			if(upload){
				data = {};
			}else{
				return { error:"Invalid JSON Data" };
			}
		}

		var target = post.type;
		if (!target && data.name)
			target = data.name.split(".").pop();

		data.upload = upload;

		console.log("[target] "+target+", "+data.name);
		var start = new Date();

		if (handlers[target])
			return handlers[target]
					.convert(data, customer, target, post.exportID)
					.then(function(result){
						//global.queueStatus--;
						console.log("After convert function", new Date())
						if (post.store)
							return store_and_send(result, customer);
						else
							return send_file(result, customer);
					}).then(function(result){
						var size = Math.round(result.body.length/1000);
						var time = Math.round(((new Date()) - start));
						console.log("[ok] "+size+"kb in "+time+"ms");
						return result;
					});
		else
			return { error: "Unknown export type: "+target };
	}
);


var module = module.exports = {
	convert:api_router,
	storage:process.env.FILES_ROOT+"/exports/"
};
