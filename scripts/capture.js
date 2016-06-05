var casper = require('casper').create();
utils = require("utils");
casper.options.verbose = true;
casper.options.logLevel = "debug";
v_width = 1024;
v_height = 768;
wait = 500;
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
casper.viewport(v_width, v_height);
casper.open(decodeURIComponent(casper.cli.get("url")));
casper.wait(wait);
casper.then(function() {
    image_type = casper.cli.get("image-type");

    if(casper.cli.has("selector")){
        selector = decodeURIComponent(casper.cli.get("selector"));
        if(casper.cli.has("xpath")){
            img = this.captureBase64(image_type, {
                type: 'xpath',
                path: selector,
            });
        } else {
            img = this.captureBase64(image_type, selector);
        }
    } else {
        img = this.captureBase64(image_type);
    }

    this.echo(img);
});
casper.run();


