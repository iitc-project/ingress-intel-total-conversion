// MAP DATA DEBUG //////////////////////////////////////
// useful bits to assist debugging map data tiles


window.RenderDebugTiles = function() {
  this.CLEAR_CHECK_TIME = 2; // check for tiles to clear every 2 seconds

  this.debugTileLayer = L.layerGroup();
  window.addLayerGroup("DEBUG Data Tiles", this.debugTileLayer, false);

  this.debugTileToRectangle = {};
  this.debugTileClearTimes = {};
  this.timer();
}

window.RenderDebugTiles.prototype.reset = function() {
  this.debugTileLayer.clearLayers();
  this.debugTileToRectangle = {};
  this.debugTileClearTimes = {};
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
  var clearDelay = -1;
  switch(state) {
    case 'ok': col='#0f0'; fill='#0f0'; clearDelay = 2; break;
    case 'error': col='#f00'; fill='#f00'; clearDelay = 30; break;
    case 'cache-fresh': col='#0f0'; fill='#ff0'; clearDelay = 2; break;
    case 'cache-stale': col='#f00'; fill='#ff0'; clearDelay = 10; break;
    case 'requested': col='#66f'; fill='#66f'; break;
    case 'retrying': col='#666'; fill='#666'; break;
    case 'request-fail': col='#a00'; fill='#666'; break;
    case 'tile-fail': col='#f00'; fill='#666'; break;
    case 'tile-timeout': col='#ff0'; fill='#666'; break;
  }
  this.setColour (id, col, fill);
  if (clearDelay >= 0) {
    var clearAt = Date.now() + clearDelay*1000;
    this.debugTileClearTimes[id] = clearAt;
  }
}


window.RenderDebugTiles.prototype.timer = function() {

  var now = Date.now();
  for (var id in this.debugTileClearTimes) {
    if (this.debugTileClearTimes[id] <= now) {
      this.debugTileLayer.removeLayer(this.debugTileToRectangle[id]);
      delete this.debugTileClearTimes[id];
    }
  }

  var _this = this;
  setTimeout ( function() { _this.timer(); }, this.CLEAR_CHECK_TIME*1000 );
}
