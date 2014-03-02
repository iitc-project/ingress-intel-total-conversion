// MAP DATA DEBUG //////////////////////////////////////
// useful bits to assist debugging map data tiles


window.RenderDebugTiles = function() {
  this.debugTileLayer = L.layerGroup();
  window.addLayerGroup("DEBUG Data Tiles", this.debugTileLayer, false);

  this.debugTileToRectangle = {};
}

window.RenderDebugTiles.prototype.reset = function() {
  this.debugTileLayer.clearLayers();
  this.debugTileToRectangle = {};
}

window.RenderDebugTiles.prototype.create = function(id,bounds) {
  var s = {color: '#666', weight: 2, opacity: 0.4, fillColor: '#666', fillOpacity: 0.1, clickable: false};

  var bounds = new L.LatLngBounds(bounds);
  bounds = bounds.pad(-0.02);

  var l = L.rectangle(bounds,s);
  this.debugTileToRectangle[id] = l;
  this.debugTileLayer.addLayer(l);
}

window.RenderDebugTiles.prototype.setColour = function(id,bordercol,fillcol) {
  var l = this.debugTileToRectangle[id];
  if (l) {
    var s = {color: bordercol, fillColor: fillcol};
    l.setStyle(s);
  }
}

window.RenderDebugTiles.prototype.setState = function(id,state) {
  var col = '#f0f';
  var fill = '#f0f';
  switch(state) {
    case 'ok': col='#0f0'; fill='#0f0'; break;
    case 'error': col='#f00'; fill='#f00'; break;
    case 'cache-fresh': col='#0f0'; fill='#ff0'; break;
    case 'cache-stale': col='#f00'; fill='#ff0'; break;
    case 'requested': col='#66f'; fill='#66f'; break;
    case 'retrying': col='#666'; fill='#666'; break;
    case 'request-fail': col='#a00'; fill='#666'; break;
    case 'tile-fail': col='#f00'; fill='#666'; break;
    case 'tile-timeout': col='#ff0'; fill='#666'; break;
  }
  this.setColour (id, col, fill);
}


window.RenderDebugTiles.prototype.removeOkTiles = function() {
  var _this = this;
  $.each(this.debugTileToRectangle, function(id,layer) {
    if (layer.options.color == '#0f0' && layer.options.color == '#0f0') {
      _this.debugTileLayer.removeLayer(layer);
      delete _this.debugTileToRectangle[id];
    }
  });
}
