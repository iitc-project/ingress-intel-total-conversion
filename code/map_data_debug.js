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
  var s = {color: '#666', weight: 3, opacity: 0.4, fillColor: '#666', fillOpacity: 0.2, clickable: false};

  var bounds = new L.LatLngBounds(bounds);
  bounds = bounds.pad(-0.02);

  var l = L.rectangle(bounds,s);
  this.debugTileToRectangle[id] = l;
  this.debugTileLayer.addLayer(l);
}

window.RenderDebugTiles.prototype.setColour = function(id,bordercol,fillcol) {
  var l = this.debugTileToRectangle[id];
  if (l) {
    var s = {color: bordercol, weight: 3, opacity: 0.4, fillColor: fillcol, fillOpacity: 0.2, clickable: false};
    l.setStyle(s);
  }
}

window.RenderDebugTiles.prototype.setState = function(id,state) {
  var col = '#666';
  var fill = '#666';
  switch(state) {
    case 'ok': col='#0f0'; fill='#0f0'; break;
    case 'error': col='#f00'; fill='#f00'; break;
    case 'cache-fresh': col='#0f0'; fill='#ff0'; break;
    case 'cache-stale': col='#f00'; fill='#ff0'; break;
    case 'requested': col='#00f'; fill='#00f'; break;
    case 'retrying': col='#666'; fill='#666'; break;
  }
  this.setColour (id, col, fill);
}
