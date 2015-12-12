function load_json(json_input) {
    json_data = require(json_input);
    /* 
    fs = require('fs');
    var json_data;
    fs.readFile(json_input,'utf8',function(error, data){
        if(error){
            console.log("error",error);
        } else{
            console.log(data);
        }
        json_data = JSON.parse(data);
     });
*/
    return json_data;
}

var Link = function (source, sink) {
    this.source = source;
    this.sink = sink;
};

Link.prototype = function(){
    this.isValid = function() {return this.source !== undefined && this.sink !== undefined; };
};

function get_links(json_data) {
    links = {};
    for (var item of json_data) {
        if (item.latLngs.length == 2) {
            var link = new Link(item.latLngs[0], item.latLngs[1]);
            id0 = "" + item.latLngs[0].lat + item.latLngs[0].lng;
            id1 = "" + item.latLngs[1].lat + item.latLngs[1].lng;
            if (!(id0 in links)) {
                links[id0] = [];
            }
            if (!(id1 in links)) {
                links[id1] = [];
            }
            console.log("Pushing " + link + " onto " + id0 + " and " + id1);
            links[id0].push(link);
            links[id1].push(link);
        }
    }
    return links;
}

module.exports = {
    load_json: load_json,
    get_links: get_links,
    Link: Link
};