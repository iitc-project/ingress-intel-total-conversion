describe("Link object tests", function(){
    var json_loader = require('./json_loader.user.js');
    var Link = json_loader.Link;

    describe("Can create a Link object", function() {
        it("builds a link object", function(){
            var l = new Link();
            expect(Link.prototype.isPrototypeOf(l)).toBe(true);
        });
    });
});

describe("json_loader_tests", function() {
    var json;
    var json_loader = require('./json_loader.user.js');
    var load_json = json_loader.load_json;
    var get_links = json_loader.get_links;
    var get_link_id_from_latlng = json_loader.get_link_id_from_latlng;

    beforeEach(function() {
        json = load_json("./test1.json");
    });

    describe("json loads", function(){

        it("loads the json file into a var", function(){
                //var json = load_json("./test1.json");
                expect(json).not.toBe(undefined);
            }
        );
    });

    describe("finds links", function(){
        it("only returns objects with an array of two latlngs", function(){
            var Link = json_loader.Link;
            var links = get_links(json);

            expect(Link.prototype.isPrototypeOf(links[Object.keys(links)[0]][0])).toBe(true);
            expect((links[Object.keys(links)[0]][0]).isValid()).toBe(true);

            for (var item of json) {
                if (item.latLngs.length === 2) {
                    var id0 = get_link_id_from_latlng(item.latLngs[0]);
                    var id1 = get_link_id_from_latlng(item.latLngs[1]);
                    expect(links[id0]).toBeDefined();
                    expect(links[id1]).toBeDefined();
                    expect(links[id0].length).toBeGreaterThan(0);
                    expect(links[id1].length).toBeGreaterThan(0);

                    var elem;
                    var srcsnksin0 = [];
                    for (elem of links[id0]) {
                        expect(elem.source).toBeDefined();
                        expect(elem.sink).toBeDefined();
                        srcsnksin0.push(elem.source);
                        srcsnksin0.push(elem.sink);
                    }
                    var srcsnksin1 = [];
                    for (elem of links[id1]) {
                        expect(elem.source).toBeDefined();
                        expect(elem.sink).toBeDefined();
                        srcsnksin1.push(elem.source);
                        srcsnksin1.push(elem.sink);
                    }
                    expect(srcsnksin0.indexOf(item.latLngs[0])).not.toBe(-1);
                    expect(srcsnksin1.indexOf(item.latLngs[1])).not.toBe(-1);
                }
            }
        });
    });

    describe("Link object is valid", function(){
        var Link = json_loader.Link;
        var link;
        beforeEach(function(){
            link = new Link({lat: 51.231533, lng:-1.132772}, {lat: 51.231217, lng: -1.133562});
        });
        it("has a source", function(){
            expect(link.source).toBeDefined();
        });
        it("has a sink", function(){
           expect(link.sink).toBeDefined(); 
        });
        it("validates itself if source and sink are defined", function(){
            expect(link.isValid()).toBe(true);
        });
        it("does not validate itself if source is undefined and sink is defined", function(){
            link = new Link();
            link.sink = {lat: 51.231217, lng: -1.133562};
            expect(link.isValid()).toBe(false);
        });
        it("does not validate itself if source is defined and sink is undefined", function(){
            link = new Link();
            link.source = {lat: 51.231217, lng: -1.133562};
            expect(link.isValid()).toBe(false);
        });
        it("does not validate itself if source and sink are both undefined", function(){
            link = new Link();
            expect(link.isValid()).toBe(false);
        });
        it("produces a string representation of itself", function(){
           expect(link.toString()).toBeDefined(); 
        });

    });
    describe("get_link_id_from_latlng produces an id", function(){
        it("produces an id which is a concatenation of its component lat and lng in e6 form", function(){
            var ll = {lat: 51.231533, lng:-1.132772};
            expect(get_link_id_from_latlng(ll)).toBe("51231533-1132772");
        });
    });
});