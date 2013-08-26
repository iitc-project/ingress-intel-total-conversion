// MAP DATA DEBUG //////////////////////////////////////
// useful bits to assist debugging map data tiles


window.RenderDebugTiles = function() {
  this.debugTileLayer = L.layerGroup();
  window.addLayerGroup("DEBUG Data Tiles", this.debugTileLayer);

  this.debugTileToRectangle = {};
}

window.RenderDebugTiles.prototype.reset = function() {
  this.debugTileLayer.clearLayers();
  this.debugTileToRectangle = {};
}

window.RenderDebugTiles.prototype.create = function(id,bounds) {
  var s = {color: '#888', weight: 3, opacity: 0.7, fillColor: '#888', fillOpacity: 0.4, clickable: false};

  var bounds = new L.LatLngBounds(bounds);
  bounds = bounds.pad(-0.02);

  var l = L.rectangle(bounds,s);
  this.debugTileToRectangle[id] = l;
  this.debugTileLayer.addLayer(l);
}

window.RenderDebugTiles.prototype.setColour = function(id,bordercol,fillcol) {
  var l = this.debugTileToRectangle[id];
  if (l) {
    var s = {color: bordercol, weight: 3, opacity: 0.3, fillColor: fillcol, fillOpacity: 0.1, clickable: false};
    l.setStyle(s);
  }
}
