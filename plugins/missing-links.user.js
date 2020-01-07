// ==UserScript==
// @id             missing-links@missing
// @name           IITC plugin: Missing Links
// @category       Layer
// @version        0.0.1.@@DATETIMEVERSION@@
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Highlight any missing links (links that would complete a field)
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.missingLinks = function() {};

// const values
window.plugin.missingLinks.MAX_PORTALS_TO_OBSERVE = 1000;
window.plugin.missingLinks.MAX_PORTALS_TO_LINK = 100;
// zoom level used for projecting points between latLng and pixel coordinates. may affect precision of triangulation
window.plugin.missingLinks.PROJECT_ZOOM = 16;

window.plugin.missingLinks.LINE_STYLE = {
    color: COLORS[PLAYER.team == 'RESISTANCE' ? TEAM_RES : TEAM_ENL],
    opacity: 0.5,
    weight: 4,
    clickable: false,
    smoothFactor: 10,
    dashArray: [2,8],
};


window.plugin.missingLinks.layerGroup = null;

window.plugin.missingLinks.updateLayer = function() {
    if (! window.map.hasLayer(window.plugin.missingLinks.layerGroup))
        return;
    
    window.plugin.missingLinks.layerGroup.clearLayers();
    var ctrl = [$('.leaflet-control-layers-selector + span:contains("Missing Links")').parent()];
    if (Object.keys(window.portals).length > window.plugin.missingLinks.MAX_PORTALS_TO_OBSERVE) {
        $.each(ctrl, function(guid, ctl) {ctl.addClass('disabled').attr('title', 'Too many portals: ' + Object.keys(window.portals).length);});
        return;
    }
    
    // portalLinkMap will be a two-level hash of portal guids to the link guid ([originPortalGuid][destinationPortalGuid] = linkGuid)
    var portalLinkMap = {};
    $.each(window.links, function(idx, link) {
        if (link.options.data.team != PLAYER.team) return true; // skip this link if its the wrong faction
        var guid = link.options.guid;
        var d = link.options.data;
        if (!portalLinkMap[d.oGuid]) portalLinkMap[d.oGuid] = {};
        if (!portalLinkMap[d.dGuid]) portalLinkMap[d.dGuid] = {};
        portalLinkMap[d.oGuid][d.dGuid] = guid;
        portalLinkMap[d.dGuid][d.oGuid] = guid;
    });
    
    var now = Date.now();
    var count = 0;
    var newLinks = [];        
    $.each(portalLinkMap, function(guid, map) {
        if (newLinks.length > window.plugin.missingLinks.MAX_PORTALS_TO_LINK)
            return;
        // get the list of all portal guids linked to this portal
        var guids = Object.keys(map).sort();
        if (guids.length < 2) return; // ignore any portal with less than 2 links (we want to highlight only the 3 link so need 2 existing links)
        //console.debug('Found a portal with more than 2 links', guid, guids, guids.length);
        
        // now we have to look at ALL pairs of linked portals since any two might allow for a field
        $.each(guids, function(idx1, guid1) {
            if (newLinks.length > window.plugin.missingLinks.MAX_PORTALS_TO_LINK)
                return;
            
            $.each(guids, function(idx2, guid2) {                 
                if (newLinks.length > window.plugin.missingLinks.MAX_PORTALS_TO_LINK)
                    return;
                
                // order doesn't matter so arbitrarily choose to do them in ascending order
                if (guid2 <= guid1) return;
                // skip if there is already a link between these two
                if (portalLinkMap[guid1][guid2]) return;
                //console.debug('Found a potential pair: ', guid1, guid2);
                
                // now get coordinates for these two
                var fpll = findPortalLatLng;
                var a = fpll(guid1);
                var b = fpll(guid2);
                if (typeof a === 'undefined' || typeof b === 'undefined') {
                    //console.debug('Unable to find coordinates for both portals: ', a, b);
                    return true;
                }
                
                // try to find titles for nicer debugging messages
                var p1 = portals[guid1] || portalDetail.get(guid1);
                var p2 = portals[guid2] || portalDetail.get(guid2);
                var t1 = p1 ? p1.options ? p1.options.data.title : p1.title : guid1;
                var t2 = p2 ? p2.options ? p2.options.data.title : p2.title : guid2;
                //console.debug('Checking potential link from ' + t1 + ' to ' + t2);
                
                // test that potential link does not cross any existing links
                var skip = false;
                $.each(window.links, function(guid, link) {
                    var lll = link.getLatLngs();
                    count++;
                    skip = window.plugin.missingLinks.greatCircleArcIntersect(a, b, lll[0], lll[1]);
                    //console.debug("existing link check: " + skip);
                    return ! skip;
                });
                // test that potential link does not cross any of our new suggested links
                if (! skip) {
                    $.each(newLinks, function(idx, newLink) {
                        count++;
                        skip = window.plugin.missingLinks.greatCircleArcIntersect(a, b, newLink[0], newLink[1]);
                        //console.debug("new link check: " + skip);
                        return ! skip;
                    });
                }
                if (skip) {
                    //console.debug('Skipping potential link from ' + t1 + ' to ' + t2);
                    return true;
                }
                
                
                //console.debug('Drawing new link from ' + t1 + ' to ' + t2);
                var poly = L.geodesicPolyline([a, b], window.plugin.missingLinks.LINE_STYLE);
                                              poly.addTo(window.plugin.missingLinks.layerGroup);
                newLinks.push([a, b]);
            });
        });
    });
    var elapsed = Date.now();
    //console.log('Refresh resulted in ' + Object.keys(window.portals).length + ' portals and ' + Object.keys(window.links).length + ' links and we made ' + count + ' intersection checks and created ' + newLinks.length + ' new links in ' + (elapsed - now) + 'ms');
}

// stolen from crossLinks plugin
// FIXME: it would be nice to move this to a shared location
window.plugin.missingLinks.greatCircleArcIntersect = function(a0,a1,b0,b1) {
    // based on the formula at http://williams.best.vwh.net/avform.htm#Int
    
    // method:
    // check to ensure no line segment is zero length - if so, cannot cross
    // check to see if either of the lines start/end at the same point. if so, then they cannot cross
    // check to see if the line segments overlap in longitude. if not, no crossing
    // if overlap, clip each line to the overlapping longitudes, then see if latitudes cross 
    
    // anti-meridian handling. this code will not sensibly handle a case where one point is
    // close to -180 degrees and the other +180 degrees. unwrap coordinates in this case, so one point
    // is beyond +-180 degrees. this is already true in IITC
    // FIXME? if the two lines have been 'unwrapped' differently - one positive, one negative - it will fail
    
    // zero length line tests
    if (a0.equals(a1)) return false;
    if (b0.equals(b1)) return false;
    
    // lines have a common point
    if (a0.equals(b0) || a0.equals(b1)) return false;
    if (a1.equals(b0) || a1.equals(b1)) return false;
    
    
    // check for 'horizontal' overlap in lngitude
    if (Math.min(a0.lng,a1.lng) > Math.max(b0.lng,b1.lng)) return false;
    if (Math.max(a0.lng,a1.lng) < Math.min(b0.lng,b1.lng)) return false;
    
    
    // ok, our two lines have some horizontal overlap in longitude
    // 1. calculate the overlapping min/max longitude
    // 2. calculate each line latitude at each point
    // 3. if latitudes change place between overlapping range, the lines cross
    
    
    // class to hold the pre-calculated maths for a geodesic line
    // TODO: move this outside this function, so it can be pre-calculated once for each line we test
    var GeodesicLine = function(start,end) {
        var d2r = Math.PI/180.0;
        var r2d = 180.0/Math.PI;
        
        // maths based on http://williams.best.vwh.net/avform.htm#Int
        
        if (start.lng == end.lng) {
            throw 'Error: cannot calculate latitude for meridians';
        }
        
        // only the variables needed to calculate a latitude for a given longitude are stored in 'this'
        this.lat1 = start.lat * d2r;
        this.lat2 = end.lat * d2r;
        this.lng1 = start.lng * d2r;
        this.lng2 = end.lng * d2r;
        
        var dLng = this.lng1-this.lng2;
        
        var sinLat1 = Math.sin(this.lat1);
        var sinLat2 = Math.sin(this.lat2);
        var cosLat1 = Math.cos(this.lat1);
        var cosLat2 = Math.cos(this.lat2);
        
        this.sinLat1CosLat2 = sinLat1*cosLat2;
        this.sinLat2CosLat1 = sinLat2*cosLat1;
        
        this.cosLat1CosLat2SinDLng = cosLat1*cosLat2*Math.sin(dLng);
    }
    
    GeodesicLine.prototype.isMeridian = function() {
        return this.lng1 == this.lng2;
    }
    
    GeodesicLine.prototype.latAtLng = function(lng) {
        lng = lng * Math.PI / 180; //to radians
        
        var lat;
        // if we're testing the start/end point, return that directly rather than calculating
        // 1. this may be fractionally faster, no complex maths
        // 2. there's odd rounding issues that occur on some browsers (noticed on IITC MObile) for very short links - this may help
        if (lng == this.lng1) {
            lat = this.lat1;
        } else if (lng == this.lng2) {
            lat = this.lat2;
        } else {
            lat = Math.atan ( (this.sinLat1CosLat2*Math.sin(lng-this.lng2) - this.sinLat2CosLat1*Math.sin(lng-this.lng1))
                             / this.cosLat1CosLat2SinDLng);
        }
        return lat * 180 / Math.PI; // return value in degrees
    }
    
    
    
    // calculate the longitude of the overlapping region
    var leftLng = Math.max( Math.min(a0.lng,a1.lng), Math.min(b0.lng,b1.lng) );
    var rightLng = Math.min( Math.max(a0.lng,a1.lng), Math.max(b0.lng,b1.lng) );
    
    // calculate the latitudes for each line at left + right longitudes
    // NOTE: need a special case for meridians - as GeodesicLine.latAtLng method is invalid in that case
    var aLeftLat, aRightLat;
    if (a0.lng == a1.lng) {
        // 'left' and 'right' now become 'top' and 'bottom' (in some order) - which is fine for the below intersection code
        aLeftLat = a0.lat;
        aRightLat = a1.lat;
    } else {
        var aGeo = new GeodesicLine(a0,a1);
        aLeftLat = aGeo.latAtLng(leftLng);
        aRightLat = aGeo.latAtLng(rightLng);
    }
    
    var bLeftLat, bRightLat;
    if (b0.lng == b1.lng) {
        // 'left' and 'right' now become 'top' and 'bottom' (in some order) - which is fine for the below intersection code
        bLeftLat = b0.lat;
        bRightLat = b1.lat;
    } else {
        var bGeo = new GeodesicLine(b0,b1);
        bLeftLat = bGeo.latAtLng(leftLng);
        bRightLat = bGeo.latAtLng(rightLng);
    }
    
    // if both a are less or greater than both b, then lines do not cross
    
    if (aLeftLat < bLeftLat && aRightLat < bRightLat) return false;
    if (aLeftLat > bLeftLat && aRightLat > bRightLat) return false;
    
    // latitudes cross between left and right - so geodesic lines cross
    return true;
}


window.plugin.missingLinks.setup = function() {
    window.plugin.missingLinks.layerGroup = new L.LayerGroup();
    
    window.addHook('mapDataRefreshEnd', function(e) {
        window.plugin.missingLinks.updateLayer();
    });
    
    window.map.on('moveend', function() {
        window.plugin.missingLinks.updateLayer();
    });
    
    window.addLayerGroup('Finish fields', window.plugin.missingLinks.layerGroup, false);
}
var setup = window.plugin.missingLinks.setup;

// PLUGIN END //////////////////////////////////////////////////////////


@@PLUGINEND@@   
