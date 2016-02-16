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
       
        var links = get_links(json);

        expect(links).toBeDefined();
        for (var item of json) {
            if (item.latLngs.length === 2) {
                var id0 = "" + item.latLngs[0].lat + item.latLngs[0].lng;
                var id1 = "" + item.latLngs[0].lat + item.latLngs[0].lng;
                expect(links.indexOf(id0)).not.toBe(-1);
                expect(links.indexOf(id1)).not.toBe(-1);
                expect([
                    links[id0].source,
                    links[id0].sink
                ]).toContain(item.latLngs[0]);
                expect([
                    links[id1].source,
                    links[id1].sink
                ]).toContain(item.latLngs[1]);
            }
        }
    });

    });
});