/// PORTAL DATA TOOLS ///////////////////////////////////////////////////
// misc functions to get portal info

// search through the links data for all that link from or to a portal. returns an object with separate lists of in
// and out links. may or may not be as accurate as the portal details, depending on how much data the API returns
window.getPortalLinks = function(guid) {

  var links = { in: [], out: [] };

  $.each(window.links, function(g,l) {
    var d = l.options.data;

    if (d.oGuid == guid) {
      links.out.push(g);
    }
    if (d.dGuid == guid) {
      links.in.push(g);
    }
  });

  return links;
}


// search through the fields for all that reference a portal
window.getPortalFields = function(guid) {
  var fields = [];

  $.each(window.fields, function(g,f) {
    var d = f.options.data;

    if ( d.points[0].guid == guid
      || d.points[1].guid == guid
      || d.points[2].guid == guid ) {

      fields.push(g);
    }
  });

  return fields;
}


// find the lat/lon for a portal, using any and all available data
// (we have the list of portals, the cached portal details, plus links and fields as sources of portal locations)
window.findPortalLatLng = function(guid) {
  if (window.portals[guid]) {
    return window.portals[guid].getLatLng();
  }

  // not found in portals - try the cached (and possibly stale) details - good enough for location
  var details = portalDetail.get(guid);
  if (details) {
    return L.latLng (details.locationE6.latE6/1E6, details.locationE6.lngE6/1E6);
  }

  // now try searching through fields
  for (var fguid in window.fields) {
    var f = window.fields[fguid].options.data;

    for (var i in f.points) {
      if (f.points[i].guid == guid) {
        return L.latLng (f.points[i].latE6/1E6, f.points[i].lngE6/1E6);
      }
    }
  }

  // and finally search through links
  for (var lguid in window.links) {
    var l = window.links[lguid].options.data;
    if (l.oGuid == guid) {
      return L.latLng (l.oLatE6/1E6, l.oLngE6/1E6);
    }
    if (l.dGuid == guid) {
      return L.latLng (l.dLatE6/1E6, l.dLngE6/1E6);
    }
  }

  // no luck finding portal lat/lng
  return undefined;
}
