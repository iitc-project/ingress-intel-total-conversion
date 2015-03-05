// PLUGIN HOOKS ////////////////////////////////////////////////////////
// Plugins may listen to any number of events by specifying the name of
// the event to listen to and handing a function that should be exe-
// cuted when an event occurs. Callbacks will receive additional data
// the event created as their first parameter. The value is always a
// hash that contains more details.
//
// For example, this line will listen for portals to be added and print
// the data generated by the event to the console:
// window.addHook('portalAdded', function(data) { console.log(data) });
//
// Boot hook: booting is handled differently because IITC may not yet
//            be available. Have a look at the plugins in plugins/. All
//            code before “// PLUGIN START” and after “// PLUGIN END” is
//            required to successfully boot the plugin.
//
// Here’s more specific information about each event:
// portalSelected: called when portal on map is selected/unselected.
//              Provide guid of selected and unselected portal.
// mapDataRefreshStart: called when we start refreshing map data
// mapDataRefreshEnd: called when we complete the map data load
// portalAdded: called when a portal has been received and is about to
//              be added to its layer group. Note that this does NOT
//              mean it is already visible or will be, shortly after.
//              If a portal is added to a hidden layer it may never be
//              shown at all. Injection point is in
//              code/map_data.js#renderPortal near the end. Will hand
//              the Leaflet CircleMarker for the portal in "portal" var.
// linkAdded:   called when a link is about to be added to the map
// fieldAdded:  called when a field is about to be added to the map
// portalDetailsUpdated: fired after the details in the sidebar have
//              been (re-)rendered Provides data about the portal that
//              has been selected.
// publicChatDataAvailable: this hook runs after data for any of the
//              public chats has been received and processed, but not
//              yet been displayed. The data hash contains both the un-
//              processed raw ajax response as well as the processed
//              chat data that is going to be used for display.
// factionChatDataAvailable: this hook runs after data for the faction
//              chat has been received and processed, but not yet been
//              displayed. The data hash contains both the unprocessed
//              raw ajax response as well as the processed chat data
//              that is going to be used for display.
// requestFinished: DEPRECATED: best to use mapDataRefreshEnd instead
//              called after each map data request finished. Argument is
//              {success: boolean} indicated the request success or fail.
// iitcLoaded: called after IITC and all plugins loaded
// portalDetailLoaded: called when a request to load full portal detail
//              completes. guid, success, details parameters
// paneChanged  called when the current pane has changed. On desktop,
//              this only selects the current chat pane; on mobile, it
//              also switches between map, info and other panes defined
//              by plugins

window._hooks = {}
window.VALID_HOOKS = [
  'portalSelected', 'portalDetailsUpdated',
  'mapDataRefreshStart', 'mapDataRefreshEnd',
  'portalAdded', 'linkAdded', 'fieldAdded',
  'publicChatDataAvailable', 'factionChatDataAvailable',
  'requestFinished', 'nicknameClicked',
  'geoSearch', 'search', 'iitcLoaded',
  'portalDetailLoaded', 'paneChanged'];

window.runHooks = function(event, data) {
  if(VALID_HOOKS.indexOf(event) === -1) throw('Unknown event type: ' + event);

  if(!_hooks[event]) return true;
  var interrupted = false;
  $.each(_hooks[event], function(ind, callback) {
    try {
      if (callback(data) === false) {
        interrupted = true;
        return false;  //break from $.each
      }
    } catch(err) {
      console.error('error running hook '+event+', error: '+err);
      debugger;
    }
  });
  return !interrupted;
}

// helper method to allow plugins to create new hooks
window.pluginCreateHook = function(event) {
  if($.inArray(event, window.VALID_HOOKS) < 0) {
    window.VALID_HOOKS.push(event);
  }
}


window.addHook = function(event, callback) {
  if(VALID_HOOKS.indexOf(event) === -1) {
    console.error('addHook: Unknown event type: ' + event + ' - ignoring');
    debugger;
    return;
  }

  if(typeof callback !== 'function') throw('Callback must be a function.');

  if(!_hooks[event])
    _hooks[event] = [callback];
  else
    _hooks[event].push(callback);
}
