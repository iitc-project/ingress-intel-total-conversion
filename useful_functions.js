(function(ll) {
    selectPortal(findPortalGuidByPositionE6(ll.lat * 1e6, ll.lng * 1e6));
    window.map.setView(
        {
            "lat": ll.lat,
            "lng": ll.lng
        },
        16
    );
 }
)(
    {
        "lat": 51.232423,
        "lng": -1.142643
    }
);

var names_list = [
"Alton Town Map",
"Alton Train Station",
"Crown Hotel in Alton",
"John Henry Newman Plaque",
"Midhants Watercress Access",
"Miss Bells Fountain Sign",
"Ropley Manor Visitors Centre",
"Ropley Station",
"Ropley Station Topiary",
"Watercress Line Alresford",
"Watercress Line Ropley",
"Methodist Church, Hartley Wintney",
"A Heathland Haven",
"Farnham Park Rangers House",
"Intech Planetarium",
"Laverstoke Park Farm",
"Maltings Ceramic Wall Art",
"Phoenix Centre",
"Sarsens Plaque",
"Corn Exchange, Newbury",
"Couple in Conversation",
"First Phone Box in Newbury",
"Greenham Roundabout Mural",
"Last Phone Box",
"National Cycle Network Marker",
"Newbury Town Hall",
"Post Office 1",
"Snelsmore Common Entrance",
"Sun Dial, Cheap Street",
"The Castle Pub",
"The Cock Inn,Newbury",
"Bombay Sapphire",
"Decorative Cross on Border",
"Micheldever Station",
"Recreation Ground Peace",
"Whitchurch Methodist Church",
"Whitchurch Parish Hall",
"1902 Anno Domini",
"Clock Tower",
"Fancy Brickwork",
"Kiksports",
"Reading Station Clock Tower",
"Reading Station North Entrance",
"the Greyfriar",
"Chapman's Hall Sign",
"Chesil Rectory",
"Chesil Theatre",
"Dinosaur Mural",
"Kings Walk Crown",
"Morley College",
"St. Lawrence Church Rectory",
"Sundial in Winchester",
"The Old Minster",
"The Welcome Church",
"The William Walker",
"The Willow Tree Public House",
"Two Little Fishes",
"Winchester City Mill"];

var find_portal_by_partial_name = function(text) {
    for (var guid in portals) {
        try {
            var re = new RegExp(".*" + text + ".*", "i");
            if (portals[guid].options.data.title.match(re)) {
                var p = portals[guid].options.data;
                console.log(p.title + "\t" + p.latE6 + "\t" + p.lngE6 + "\t" + guid);
            }
        }
        catch(err) {
            ;
        } 
    }
};
for (var idx = 0; idx < names_list.length; idx++) { 
    find_portal_by_partial_name(names_list[idx]);
}


(function(text) {
    for (var guid in portals) {
        try {
            var re = new RegExp(".*" + text + ".*", "i");
            if (portals[guid].options.data.title.match(re)) {
                var p = portals[guid].options.data;
                console.log(p.title + "\t" + p.latE6 + "\t" + p.lngE6 + "\t" + guid);
            }
        }
        catch(err) {
            ;
        } 
    }
}
)("Fisher");


var q = (function() {
    for (var o of lst) {
    	console.log(o);
    	for (var ll of o.latLngs) {
     	   var guid = findPortalGuidByPositionE6(ll.lat * 1e6, ll.lng * 1e6);
           console.log(portals[guid].options.data);
    	}
    }
});

var LinkedList = function() {
  this._root = null;
  this._length = 0;
  this.makeNode = function(key, data) {
    var node = {
      key: typeof key !== 'undefined' ? key : null,
      item: typeof data !== 'undefined' ? data : null,
      left: null,
      right: null
    };
    return node;
  };
  this.add = function(key, data) {
    if (this._root === null) {
      this._root = this.makeNode(key, data);
      this._length++;
      return this._root;
    } else {
      // Find place to insert based on key
      node = this._root;
      while (node !== null) {
        var next_node = null;
        if (key < node.key) {
          next_node = node.left;
          if (next_node===null) {
            node.left = this.makeNode(key, data);
            this._length++;
            return node.left;
          }
        } else if (key > node.key) {
          next_node = node.right;
          if (next_node===null) {
            node.right = this.makeNode(key, data);
            this._length++;
            return node.right;
          }
        }
        node = next_node;
      }
    }
    return null;
  };
  this.get = function(key) {
    // Find node based on key
    node = this._root;
    while (node !== null) {
      if (node.key === key) {
        return node;
      }
      if (key <= node.key) {
        node = node.left;
      } else if (key > node.key) {
        node = node.right;
      }
    }
    return null;
  };

  this.length = function() {
    return this._length;
  };
};

var portal = {
    guid: null,
    latlng : {},
    name: null,
};

function _key_search(links, ll) {
    var car = links[0];
    var cdr = links[1:];

    if (car !== undefined) {
        p = car[0];
        ll.left = ll.makeNode(p.guid, p);
        _key_search(cdr, ll.left);
        p = car[1];
        ll.right = ll.makenode(p.guid, p);
        _key_search(cdr, ll.right);
    }
}

function key_search(links) {
    var ll = new LinkedList();
    ll.add(ll.makeNode(0, null));

    // construct tree - no_keys root - binary connection - one for each end of link. 
    _key_search(links, ll);

    // count number of keys along each path

    // choose lowest count
}

var id = 2742;

// {guid: guid, portal: portal, portalDetails: details, portalData: data})
function gen_portdetails_closure(guid, id, m, names) { 
    return function(data) {
        console.log("data: " + data); 
        console.log("this: " + this); 
        if(data.guid == guid) {
            add_name(guid, id, m, names, data);
        }
    };
}


test = {
    m: {},
    pending_guids: [],
 
    add_name: function(data) {
        var self = this;
        var idx = self.pending_guids.length;
        while (idx--) {
            if (data.guid === self.pending_guids[idx].guid) {
                mdata = self.pending_guids.splice(idx, 1);
                var name = data.portalData.title;
                var o = {name: name, guid: mdata.guid};
                if (self.m[mdata.id]) {
                    self.names[mdata.id].push(o);
                } else { 
                    self.m[mdata.id] = [o]; 
                }
            }
        }
    },
    run: function() {
        var self = this;
        var drawnitems = plugin.drawTools.drawnItems._layers;
        for (var id in drawnitems) {
            var drawnitem = drawnitems[id];
            if (drawnitem._latlngs) {
                console.log(id + ": "); console.log(drawnitem);
                for (var ll_idx = 0; ll_idx < drawnitem._latlngs.length; ll_idx++) {
                    var lat = drawnitem._latlngs[ll_idx].lat;
                    var lng = drawnitem._latlngs[ll_idx].lng;
                    var guid = findPortalGuidByPositionE6(lat * 1e6, lng * 1e6);
                    selectPortalByLatLng(lat, lng);
                    self.pending_guids.push({ id: id, guid: guid});
                    renderPortalDetails(guid); 
                }
            }
            if (self.pending_guids.length !== 0) {
                addHook('portalDetailsUpdated', self.add_name);
            }
        }
 
    }
};

test.run();