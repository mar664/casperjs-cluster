var casper = require('casper').create();

function qs(url) {
    if(url.indexOf('?') != -1){
        var qs = url.substring(url.indexOf('?') + 1).split('&');
        for(var i = 0, result = {}; i < qs.length; i++){
            qs[i] = qs[i].split('=');
            result[qs[i][0]] = "";
            for(var l = 0; l < qs[i][1].length; l++){
                result[qs[i][0]] += qs[i][1][l].replace("+", " ")
            }
            result[qs[i][0]] = decodeURIComponent(decodeURIComponent(result[qs[i][0]]))
        }
        return result;
    }
}
utils = require("utils");

v_width = 1024;
v_height = 768;

if(casper.cli.has("user-agent")){
    casper.userAgent(decodeURIComponent(casper.cli.get("user-agent")));
}
if(casper.cli.has("viewport")){
    viewport = casper.cli.get("viewport");
    if(viewport == "x-small"){
        v_width = 568;
        v_height = 320;
    } else if(viewport == "small"){
        v_width = 768;
        v_height = 430;
    } else if(viewport == "medium"){
        v_width = 992;
        v_height = 557;
    } else if(viewport == "large"){
        v_width = 1200;
        v_height = 674;
    } else {
        v_width = 992;
        v_height = 557;
    }
}
casper.start();
//casper.viewport(v_width, v_height);

var ip_server = '0.0.0.0:' + casper.cli.get("port");
var server = require('webserver').create();
var service = server.listen(ip_server, function(request, response) {
    if(request["url"] == "/check_is_ready"){
        response.write(request["url"]);
        response.statusCode = 200;
        response.close();
    } else {
        eval(qs(request["url"])["script"]);
        main.call(casper);
        casper.run(function(){
            response.write(this.data);
            response.statusCode = 200;
            response.close();
        });
    }
});