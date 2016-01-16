describe("Link object tests", function(){
    var json_loader = require('./json_loader.user.js');
    var Link = json_loader.Link;
    var portalmap = {
        "130b0a35413a46e4a825972bb75f858b.11": JSON.parse('{"team":"E","latE6":51230892,"lngE6":-1145821,"level":3,"health":49,"resCount":5,"image":"http://lh3.ggpht.com/F24GQ5mtr6tjWm_1e104Ccxuy0Wka-9ka7-z9hCxNye4X0TowtJT9FUVUl6xcwKjiuJW4yjluSB_x_7dCJ8A9gLOx_SUoI9KTolE-6kkDiIpz0XS","title":"Yellow Painted Scooter","ornaments":[],"mission":false,"mission50plus":false,"artifactBrief":null,"timestamp":1451325448393}'),
        "5e7ad9188ddd4b89bf760b59c77632f1.16": JSON.parse('{"team":"N","latE6":51231533,"lngE6":-1132772,"level":1,"health":0,"resCount":0,"image":"http://lh4.ggpht.com/y7c2ey2vRt3WNld0XEQ2SRFSDz0YAfrL7U6paaXe9gktA8M9mbnycSEZHjeqRb_-Bo1NqGGJqxccln3U7pXqEg","title":"Beggarwood Park ","ornaments":[],"mission":false,"mission50plus":false,"artifactBrief":null,"timestamp":1450001130225}'),
        "f3be7f470cc2487abad7d80a3f06bb91.16": JSON.parse('{"team":"N","latE6":51231217,"lngE6":-1133562,"level":1,"health":0,"resCount":0,"image":"http://lh4.ggpht.com/Ad08W8XqluIZt_a78Q4CWQqDlQ2TGMm5mf7Wqf6R1V2mDDr56rNsBIVtRUte5rJTEtS6f3zsaV9apvxqrSMjBg","title":"Beggarwood Maze","ornaments":[],"mission":false,"mission50plus":false,"artifactBrief":null,"timestamp":1450001062426}')
    };

    findPortalGuidByPositionE6 = function(lat, lng) {
       for (var guid in portalmap) {
            test_lat = portalmap[guid].latE6;
            test_lng = portalmap[guid].lngE6;
            if (lat == test_lat && lng == test_lng) {
                return guid;
            }
        }
    };

    describe("Can create a Link object", function() {
        it("builds a link object", function(){
            var l = new Link();
            expect(Link.prototype.isPrototypeOf(l)).toBe(true);
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

    describe("link ends map to portals", function(){
        beforeEach(function(){
            link = new Link({lat: 51.231533, lng:-1.132772}, {lat: 51.231217, lng: -1.133562});
        });
        it("has a source which maps to a portal guid", function(){
            guid = findPortalGuidByPositionE6(link.source.lat*1e6, link.source.lng*1e6);
            expect(guid).toBeDefined();            
        });
        it("has a sink which maps to a portal guid", function(){
            guid = findPortalGuidByPositionE6(link.sink.lat*1e6, link.sink.lng*1e6);
            expect(guid).toBeDefined();            
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
                    expect(srcsnksin0).toEqual(jasmine.arrayContaining([item.latLngs[0]]));
                    expect(srcsnksin1).toEqual(jasmine.arrayContaining([item.latLngs[1]]));
                }
            }
        });
    });


    describe("get_link_id_from_latlng produces an id", function(){
        it("produces an id which is a concatenation of its component lat and lng in e6 form", function(){
            var ll = {lat: 51.231533, lng:-1.132772};
            expect(get_link_id_from_latlng(ll)).toBe("51231533-1132772");
        });
    });
});