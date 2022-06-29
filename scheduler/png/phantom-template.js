var page = require('webpage').create();
var system = require('system');

var address = system.args[1];
var output = system.args[2];

page.open(address, function (status) {
    if (status !== 'success') {
        console.log('Unable to load the address!');
        phantom.exit();
    } else {
        window.setTimeout(function () {
            var size = page.evaluate(function() {
                var el = document.getElementById("component_container");
                var zoom = parseFloat(el.style.zoom) || 1;
                return {
                    x: Math.ceil(parseInt(el.scrollWidth) * zoom),
                    y: Math.ceil(parseInt(el.scrollHeight) * zoom)
                };
            });

            if (output.indexOf(".pdf")) {
                var offset = 20;
                offset += Math.ceil(size.y/size.x)*8;
                page.paperSize = { width: Math.ceil(size.x/9.6)/10+"in", height: Math.ceil((size.y+offset)/9.6)/10+"in" };
            }
            else
                page.paperSize = { width: size.x+"px", height: size.y+"px" };

            page.render(output);
            phantom.exit();
        }, 200);
    }
}); 