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

Link.prototype = {
    isValid: function() { return this.source !== undefined && this.sink !== undefined; },
    toString: function() {
        return "".concat(
            "{",
            "{", this.source.lat, ", ", this.source.lng, "}, ",
            "{", this.sink.lat,   ", ", this.sink.lng,   "}",
            "}");
    }
};

function get_link_id_from_latlng(latlng) {
            var lat = (latlng.lat * 1e6).toString();
            var lng = (latlng.lng * 1e6).toString();
            var id = "".concat(lat, lng);
            return id;
}

function get_links(json_data) {
    links = {};
    for (var item of json_data) {
        if (item.latLngs.length == 2) {
            var link = new Link(item.latLngs[0], item.latLngs[1]);
            var id0 = get_link_id_from_latlng(item.latLngs[0]);
            var id1 = get_link_id_from_latlng(item.latLngs[1]);
            if (!(id0 in links)) {
                links[id0] = [];
            }
            if (!(id1 in links)) {
                links[id1] = [];
            }
            links[id0].push(link);
            links[id1].push(link);
        }
    }
    return links;
}

module.exports = {
    load_json: load_json,
    get_links: get_links,
    get_link_id_from_latlng: get_link_id_from_latlng,
    Link: Link
};