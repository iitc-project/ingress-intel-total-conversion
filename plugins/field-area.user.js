// ==UserScript==
// @id             iitc-plugin-field-area@bricemciver
// @name           IITC plugin: field area
// @category       Info
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show total field area for a portal in portals list and portal info sidebar.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@
PLUGINSTART
@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.fieldArea = function () {
};

window.plugin.fieldArea.addToSidebar = function () {
  $('#randdetails').find('th').filter(function () {
    return $(this).text() === "fields";
  }).next().attr("title", window.plugin.fieldArea.readableArea(window.plugin.fieldArea.getPortalFieldsArea(window.selectedPortal), false));
};

window.plugin.fieldArea.getPortalFieldsArea = function (guid) {
  var fieldGuids = getPortalFields(guid),
    totalArea = 0.0;
  $.each(fieldGuids, function (i, fguid) {
    var f = window.fields[fguid],
      fd = f.options.data,
      pointsCount = fd.points.length,
      area = 0.0,
      d2r = L.LatLng.DEG_TO_RAD,
      p1, p2, j;
    if (pointsCount === 3) {
      for (j = 0; j < pointsCount; j++) {
        p1 = fd.points[j];
        p2 = fd.points[(j + 1) % pointsCount];
        area += (((p2.lngE6 / 1e6) - (p1.lngE6 / 1e6)) * d2r) *
        (2 + Math.sin((p1.latE6 / 1e6) * d2r) + Math.sin((p2.latE6 / 1e6) * d2r));
      }
      area = area * 6378137.0 * 6378137.0 / 2.0;
    }
    totalArea += Math.abs(area);
  });
  return totalArea;
};

window.plugin.fieldArea.readableArea = function (area, isMetric) {
  var areaStr;
  if (isMetric) {
    if (area >= 10000) {
      areaStr = (area * 0.0001).toFixed(2) + ' ha';
    } else {
      areaStr = area.toFixed(2) + ' m&#x00B2;';
    }
  } else {
    area /= 0.836127; // Square yards in 1 meter
    if (area >= 3097600) { //3097600 square yards in 1 square mile
      areaStr = (area / 3097600).toFixed(2) + ' mi&#x00B2;';
    } else if (area >= 4840) {//48040 square yards in 1 acre
      areaStr = (area / 4840).toFixed(2) + ' acres';
    } else if (area > 0) {
      areaStr = Math.ceil(area) + ' yd&#x00B2;';
    } else {
      areaStr = '0';
    }
  }
  return areaStr;
};

window.plugin.fieldArea.setupPortalsList = function () {
  if (!window.plugin.portalslist) return;

  window.plugin.portalslist.fields.push({
    title: "Field Area",
    value: function (portal) {
      return window.plugin.fieldArea.getPortalFieldsArea(portal.options.guid);
    },
    format: function (cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .html(window.plugin.fieldArea.readableArea(value, false));
    },
    defaultOrder: -1
  });
};

var setup = function () {
  window.addHook('portalDetailsUpdated', window.plugin.fieldArea.addToSidebar);

  if (window.plugin.portalslist) {
    window.plugin.fieldArea.setupPortalsList();
  } else {
    setTimeout(function () {
      if (window.plugin.portalslist)
        window.plugin.fieldArea.setupPortalsList();
    }, 500);
  }
};

// PLUGIN END //////////////////////////////////////////////////////////

@@
PLUGINEND
@@
