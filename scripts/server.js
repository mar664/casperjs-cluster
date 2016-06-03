var ip_server = '0.0.0.0:5000';

function qs(url) {
    var qs = url.substring(url.indexOf('?') + 1).split('&');
    for(var i = 0, result = {}; i < qs.length; i++){
        qs[i] = qs[i].split('=');
        result[qs[i][0]] = decodeURIComponent(qs[i][1]);
    }
    return result;
}

var server = require('webserver').create();
var utils = require("utils")
var times = 0;
var service = server.listen(ip_server, function(request, response) {
    vars = qs(request["url"]);
    var casper = require('casper').create();
    casper.options.verbose = true;
    casper.options.logLevel = "debug";
    if(vars["proxy"] != undefined){
        casper.options.pageSettings.proxy = vars["proxy"];
    }
    if(vars["load_images"] == "false"){
        casper.options.pageSettings.loadImages = false
    }
    if(vars["user_agent"] != undefined){
        casper.userAgent(vars["user_agent"]);
    }
    casper.start();
    if(vars["proxy_auth"] != undefined){
        casper.page.customHeaders = {
            'Proxy-Authorization': 'Basic ' + btoa(vars["proxy_auth"])
        };
    }
    casper.log(utils.dump(vars), "debug");

    var html, png;
    ext = request["url"].indexOf('.html')
    if(ext == -1){
        response.statusCode = 400;
        response.write(JSON.stringify({"error":"no type defined", "times": ++times}, null, null));
        response.close();
    } else {
        type = request["url"].substring(1, ext)
        if(type == "capture"){
            if(vars["url"] == undefined){
                    response.statusCode = 200;
                    response.write(JSON.stringify({"error":"no url defined"}, null, null));
                    response.close();
            } else {
                wait = 1000;
                if(vars["wait"] != undefined){
                    wait = vars["wait"];
                }
                casper.open(vars["url"]);

                casper.then(function(){
                    if(vars["viewport"] != undefined){
                        if(vars["viewport"] == "x-small"){
                            width = 568;
                            height = 320;
                        } else if(vars["viewport"] == "small"){
                            width = 768;
                            height = 430;
                        } else if(vars["viewport"] == "medium"){
                            width = 992;
                            height = 557;
                        } else if(vars["viewport"] == "large"){
                            width = 1200;
                            height = 674;
                        } else {
                            width = 992;
                            height = 557;
                        }
                    } else {
                        width = 992;
                        height = 557;
                    }
                    this.viewport(width, height);
                });

                casper.wait(wait, function() {
                    if(vars["selector"] == undefined){
                        png = this.captureBase64('png')
                    } else {
                        if(vars["xpath"] == undefined)
                        {
                            png = this.captureBase64('png', vars["selector"])

                        } else {
                            png = this.captureBase64('png', {
                                    type: 'xpath',
                                    path: vars["selector"],
                                });
                        }
                    }
                });

                casper.run(function() {
                    response.statusCode = 200;
                    response.write(JSON.stringify({png:png}, null, null));
                    response.close();
                });
            }
        } else if(type == "render"){
            if(vars["url"] == undefined){
                response.statusCode = 200;
                response.write(JSON.stringify({"error":"no url defined"}, null, null));
                response.close();
            } else {
                wait = 1000;
                if(vars["wait"] != undefined){
                    wait = vars["wait"];
                }

                casper.open(vars["url"]);

                casper.wait(wait, function() {
                    html = this.getHTML();
                });

                casper.run(function() {
                    response.statusCode = 200;
                    response.write(JSON.stringify(html, null, null));
                    response.close();
                });
            }
        } else if(type== "execute") {
            eval(vars["script"])
        } else {
            response.statusCode = 404;
            response.write(JSON.stringify({"Error":"error"}, null, null));
            response.close();
        }
    }
});
console.log('Server running at http://' + ip_server+'/');