// ==UserScript==
// @id             iitc-plugin-portals-count@yenky
// @name           IITC plugin: Show total counts of portals
// @category       Info
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a list of all localized portals by level and faction.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

/* whatsnew
* 0.1.0  : display graphs
* 0.0.10 : show in nav drawer on mobile devices
* 0.0.9  : fix for new intel map
* 0.0.8  : use dialog() instead of alert()
* 0.0.6  : ignoring outside bounds portals (even if close to)
* 0.0.5  : changed table layout, added some colors
* 0.0.4  : reverse show order of portals, using MAX_PORTAL_LEVEL now for array, changed table layout to be more compact, cleaned up code
* 0.0.3  : fixed incorrect rounded portal levels, adjusted viewport
* 0.0.2  : fixed counts to be reset after scrolling
* 0.0.1  : initial release, show count of portals
*/

// use own namespace for plugin
window.plugin.portalcounts = {
  BAR_TOP: 20,
  BAR_HEIGHT: 180,
  BAR_WIDTH: 25,
  BAR_PADDING: 5,
  RADIUS_INNER: 70,
  RADIUS_OUTER: 100,
  CENTER_X: 200,
  CENTER_Y: 100,
};

//count portals for each level available on the map
window.plugin.portalcounts.getPortals = function (){
  //console.log('** getPortals');
  var self = window.plugin.portalcounts;
  var displayBounds = map.getBounds();
  self.enlP = 0;
  self.resP = 0;
  self.neuP = 0;

  self.PortalsEnl = new Array();
  self.PortalsRes = new Array();
  for(var level = window.MAX_PORTAL_LEVEL; level > 0; level--){
    self.PortalsEnl[level] = 0;
    self.PortalsRes[level] = 0;
  }

  $.each(window.portals, function(i, portal) {
    var level = portal.options.level;
    var team = portal.options.team;
    // just count portals in viewport
    if(!displayBounds.contains(portal.getLatLng())) return true;
    switch (team){
      case 1 :
        self.resP++;
        self.PortalsRes[level]++;
        break;
      case 2 :
        self.enlP++;
        self.PortalsEnl[level]++;
        break;
      default:
        self.neuP++;
        break;
    }
  });

  //get portals informations from IITC
  var minlvl = getMinPortalLevel();
  var total = self.neuP + self.enlP + self.resP;

  var counts = '';
  if(total > 0) {
    counts += '<table><tr><th></th><th class="enl">Enlightened</th><th class="res">Resistance</th></tr>';  //'+self.enlP+' Portal(s)</th></tr>';
    for(var level = window.MAX_PORTAL_LEVEL; level > 0; level--){
      counts += '<tr><td class="L'+level+'">Level '+level+'</td>';
      if(minlvl > level)
        counts += '<td colspan="2">zoom in to see portals in this level</td>';
      else
        counts += '<td class="enl">'+self.PortalsEnl[level]+'</td><td class="res">'+self.PortalsRes[level]+'</td>';
      counts += '</tr>';
    }

    counts += '<tr><th>Total:</th><td class="enl">'+self.enlP+'</td><td class="res">'+self.resP+'</td></tr>';

    counts += '<tr><td>Neutral:</td><td colspan="2">';
    if(minlvl > 0)
      counts += 'zoom in to see unclaimed portals';
    else
      counts += self.neuP;
    counts += '</td></tr></table>';

    var svg = $('<svg width="300" height="200">').css('margin-top', 10);

    var all = self.PortalsRes.map(function(val,i){return val+self.PortalsEnl[i]});
    all[0] = self.neuP;

    // bar graphs
    self.makeBar(self.PortalsEnl, 'Enl', COLORS[2], 0                                    ).appendTo(svg);
    self.makeBar(all            , 'All', '#FFFFFF', 1*(self.BAR_WIDTH + self.BAR_PADDING)).appendTo(svg);
    self.makeBar(self.PortalsRes, 'Res', COLORS[1], 2*(self.BAR_WIDTH + self.BAR_PADDING)).appendTo(svg);

    // pie graph
    var g = $('<g>')
      .attr('transform', self.format('translate(%s,%s)', self.CENTER_X, self.CENTER_Y))
      .appendTo(svg);

    // inner parts - factions
    self.makePie(0,                             self.resP/total,               COLORS[1]).appendTo(g);
    self.makePie(self.resP/total,               (self.neuP + self.resP)/total, COLORS[0]).appendTo(g);
    self.makePie((self.neuP + self.resP)/total, 1,                             COLORS[2]).appendTo(g);

    // outer part - levels
    var angle = 0;
    for(var i=self.PortalsRes.length-1;i>=0;i--) {
      if(!self.PortalsRes[i])
        continue;

      var diff = self.PortalsRes[i] / total;
      self.makeRing(angle, angle+diff, COLORS_LVL[i]).appendTo(g);
      angle += diff;
    }

    var diff = self.neuP / total;
    self.makeRing(angle, angle+diff, COLORS_LVL[0]).appendTo(g);
    angle += diff;

    for(var i=0;i<self.PortalsEnl.length;i++) {
      if(!self.PortalsEnl[i])
        continue;

      var diff = self.PortalsEnl[i] / total;
      self.makeRing(angle, angle+diff, COLORS_LVL[i]).appendTo(g);
      angle += diff;
    }

    // black line from center to top
    $('<line>')
      .attr({
        x1: self.resP<self.enlP ? 0.5 : -0.5,
        y1: 0,
        x2: self.resP<self.enlP ? 0.5 : -0.5,
        y2: -self.RADIUS_OUTER,
        stroke: '#000',
        'stroke-width': 1
      })
      .appendTo(g);

    // if there are no neutral portals, draw a black line between res and enl
    if(self.neuP == 0) {
      var x = Math.sin((0.5 - self.resP/total) * 2 * Math.PI) * self.RADIUS_OUTER;
      var y = Math.cos((0.5 - self.resP/total) * 2 * Math.PI) * self.RADIUS_OUTER;

      $('<line>')
        .attr({
          x1: self.resP<self.enlP ? 0.5 : -0.5,
          y1: 0,
          x2: x,
          y2: y,
          stroke: '#000',
          'stroke-width': 1
        })
        .appendTo(g);
    }

    counts += $('<div>').append(svg).html();
  } else {
    counts += '<p>No Portals in range!</p>';
  }

  // I've only seen the backend reduce the portals returned for L4+ or further out zoom levels - but this could change
  // UPDATE: now seen for L2+ in dense areas (map zoom level 14 or lower)
  if (getMinPortalLevel() >= 2) {
   counts += '<p class="help" title="To reduce data usage and speed up map display, the backend servers only return some portals in dense areas."><b>Warning</b>: Portal counts can be inaccurate when zoomed out</p>';
  }

  var total = self.enlP + self.resP + self.neuP;
  var title = total + ' ' + (total == 1 ? 'portal' : 'portals');

  if(window.useAndroidPanes()) {
    $('<div id="portalcounts" class="mobile">'
    + '<div class="ui-dialog-titlebar"><span class="ui-dialog-title ui-dialog-title-active">' + title + '</span></div>'
    + counts
    + '</div>').appendTo(document.body);
  } else {
    dialog({
      html: '<div id="portalcounts">' + counts + '</div>',
      title: 'Portal counts: ' + title,
      width: 'auto'
    });
  }
}

window.plugin.portalcounts.makeBar = function(portals, text, color, shift) {
  var self = window.plugin.portalcounts;
  var g = $('<g>').attr('transform', 'translate('+shift+',0)');
  var sum = portals.reduce(function(a,b){ return a+b });
  var top = self.BAR_TOP;

  if(sum != 0) {
    for(var i=portals.length-1;i>=0;i--) {
      if(!portals[i])
        continue;
      var height = self.BAR_HEIGHT * portals[i] / sum;
      $('<rect>')
        .attr({
          x: 0,
          y: top,
          width: self.BAR_WIDTH,
          height: height,
          fill: COLORS_LVL[i]
        })
        .appendTo(g);
      top += height;
    }
  }

  $('<text>')
    .html(text)
    .attr({
      x: self.BAR_WIDTH * 0.5,
      y: self.BAR_TOP * 0.75,
      fill: color,
      'text-anchor': 'middle'
    })
    .appendTo(g);

  return g;
};

window.plugin.portalcounts.makePie = function(startAngle, endAngle, color) {
  if(startAngle == endAngle)
    return $([]); // return empty element query

  var self = window.plugin.portalcounts;
  var large_arc = (endAngle - startAngle) > 0.5 ? 1 : 0;

  var labelAngle = (endAngle + startAngle) / 2;
  var label = Math.round((endAngle - startAngle) * 100) + '%';

  startAngle = 0.5 - startAngle;
  endAngle   = 0.5 - endAngle;
  labelAngle = 0.5 - labelAngle;

  var p1x = Math.sin(startAngle * 2 * Math.PI) * self.RADIUS_INNER;
  var p1y = Math.cos(startAngle * 2 * Math.PI) * self.RADIUS_INNER;
  var p2x = Math.sin(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var p2y = Math.cos(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var lx  = Math.sin(labelAngle * 2 * Math.PI) * self.RADIUS_INNER / 1.5;
  var ly  = Math.cos(labelAngle * 2 * Math.PI) * self.RADIUS_INNER / 1.5;

  // for a full circle, both coordinates would be identical, so no circle would be drawn
  if(startAngle == 0.5 && endAngle == -0.5)
    p2x -= 1E-5;

  var text = $('<text>')
    .attr({
      'text-anchor': 'middle',
      'dominant-baseline' :'central',
      x: lx,
      y: ly
    })
    .html(label);

  var path = $('<path>')
    .attr({
      fill: color,
      d: self.format('M %s,%s A %s,%s 0 %s 1 %s,%s L 0,0 z', p1x,p1y, self.RADIUS_INNER,self.RADIUS_INNER, large_arc, p2x,p2y)
    });

  return path.add(text); // concat path and text
};

window.plugin.portalcounts.makeRing = function(startAngle, endAngle, color) {
  var self = window.plugin.portalcounts;
  var large_arc = (endAngle - startAngle) > 0.5 ? 1 : 0;

  startAngle = 0.5 - startAngle;
  endAngle   = 0.5 - endAngle;

  var p1x = Math.sin(startAngle * 2 * Math.PI) * self.RADIUS_OUTER;
  var p1y = Math.cos(startAngle * 2 * Math.PI) * self.RADIUS_OUTER;
  var p2x = Math.sin(endAngle   * 2 * Math.PI) * self.RADIUS_OUTER;
  var p2y = Math.cos(endAngle   * 2 * Math.PI) * self.RADIUS_OUTER;
  var p3x = Math.sin(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var p3y = Math.cos(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var p4x = Math.sin(startAngle * 2 * Math.PI) * self.RADIUS_INNER;
  var p4y = Math.cos(startAngle * 2 * Math.PI) * self.RADIUS_INNER;

  // for a full circle, both coordinates would be identical, so no circle would be drawn
  if(startAngle == 0.5 && endAngle == -0.5) {
    p2x -= 1E-5;
    p3x -= 1E-5;
  }

  return $('<path>')
    .attr({
      fill: color,
      d: self.format('M %s,%s ', p1x, p1y)
       + self.format('A %s,%s 0 %s 1 %s,%s ', self.RADIUS_OUTER,self.RADIUS_OUTER, large_arc, p2x,p2y)
       + self.format('L %s,%s ', p3x,p3y)
       + self.format('A %s,%s 0 %s 0 %s,%s ', self.RADIUS_INNER,self.RADIUS_INNER, large_arc, p4x,p4y)
       + 'Z'
    });
};

window.plugin.portalcounts.format = function(str) {
  var re = /%s/;
  for(var i = 1; i < arguments.length; i++) {
    str = str.replace(re, arguments[i]);
  }
  return str;
}

window.plugin.portalcounts.onPaneChanged = function(pane) {
  if(pane == 'plugin-portalcounts')
    window.plugin.portalcounts.getPortals();
  else
    $('#portalcounts').remove()
};

var setup =  function() {
  if(window.useAndroidPanes()) {
    android.addPane('plugin-portalcounts', 'Portal counts', 'ic_action_data_usage');
    addHook('paneChanged', window.plugin.portalcounts.onPaneChanged);
  } else {
    $('#toolbox').append(' <a onclick="window.plugin.portalcounts.getPortals()" title="Display a summary of portals in the current view">Portal counts</a>');
  }

  $('head').append('<style>' +
    '#portalcounts.mobile {background: transparent; border: 0 none !important; height: 100% !important; width: 100% !important; left: 0 !important; top: 0 !important; position: absolute; overflow: auto; z-index: 9000 !important; }' +
    '#portalcounts table {margin-top:5px; border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#portalcounts table td, #portalcounts table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#portalcounts table tr.res th {  background-color: #005684; }' +
    '#portalcounts table tr.enl th {  background-color: #017f01; }' +
    '#portalcounts table th { text-align: center;}' +
    '#portalcounts table td { text-align: center;}' +
    '#portalcounts table td.L0 { background-color: #000000 !important;}' +
    '#portalcounts table td.L1 { background-color: #FECE5A !important;}' +
    '#portalcounts table td.L2 { background-color: #FFA630 !important;}' +
    '#portalcounts table td.L3 { background-color: #FF7315 !important;}' +
    '#portalcounts table td.L4 { background-color: #E40000 !important;}' +
    '#portalcounts table td.L5 { background-color: #FD2992 !important;}' +
    '#portalcounts table td.L6 { background-color: #EB26CD !important;}' +
    '#portalcounts table td.L7 { background-color: #C124E0 !important;}' +
    '#portalcounts table td.L8 { background-color: #9627F4 !important;}' +
    '#portalcounts table td:nth-child(1) { text-align: left;}' +
    '#portalcounts table th:nth-child(1) { text-align: left;}' +
    '</style>');
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
