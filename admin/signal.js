var querystring = require('querystring');
var http = require('http');


function signal(host, path, post_data){
  post_data = querystring.stringify(post_data);

  var post_options = {
      host: host,
      port: '80',
      path: path,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': post_data.length
      }
  };

 // Set up the request
  var post_req = http.request(post_options, function(res) {
      console.log("Sending signal");
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Signal Response: ' + chunk);
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
}


module.exports = signal;