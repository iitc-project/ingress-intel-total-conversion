// MAP DATA RENDER ////////////////////////////////////////////////
// class to handle rendering into leaflet the JSON data from the servers



window.Render = function() {

}


// start a render pass. called as we start to make the batch of data requests to the servers
window.Render.prototype.startRenderPass = function() {
  this.isRendering = true;

  this.deletedGuid = {};  // object - represents the set of all deleted game entity GUIDs seen in a render pass
}

// process deleted entity list and entity data
window.Render.prototype.processTileData(deleted, entities) {
  this.processDeletedGameEntityGuids(deleted);
  this.processGameEntities(entities);
}


window.Render.prototype.processDeletedGamEntityGuids(deleted) {
  for(var i in deleted) {
    var guid = deleted[i];

    if ( !(guid in this.deletedGuid) ) {
      this.deletedGuid[guid] = true;  // flag this guid as having being processed

      // the original code this is based on checked to see if the guid was for a field - and if so, removed it from the linkedFields of the relevant portals
      // given that the server will also return updated portals - and the linkedFields data is not actively used in IITC, this seems pointless.

      this.deleteEntity(guid);

    }
  }

}

window.Render.prototype.processGameEntities(entities) {
  for (var i in entities) {
    var ent = entities[i];

    this.renderEntity(ent);
  }

  // TODO: reconstruct links 'optimised' out of the data from the portal link data


}

// end a render pass. does any cleaning up required, postponed processing of data, etc. called when the render
// is considered complete
window.Render.prototype.endRenderPass = function() {

  this.isRendering = false;
}

