// ==UserScript==
// @id             iitc-plugin-sync@xelio
// @name           IITC plugin: Sync
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Sync data between clients via Google Realtime API. Only syncs data from specific plugins (currently: Keys). Sign in via the 'Sync' link.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
// Notice for developers:
// 
// You should treat the data stored on Google Realtime API as volatile. 
// Because if there are change in Google API client ID, Google will 
// treat it as another application and could not access the data created 
// by old client ID. Store any important data locally and only use this 
// plugin as syncing function. 
//
// Google Realtime API reference
// https://developers.google.com/drive/realtime/application
////////////////////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.sync = function() {};

window.plugin.sync.KEY_UUID = {key: 'plugin-sync-data-uuid', field: 'uuid'};

// Each client has an unique UUID, to identify remote data is udpated by other clients or not
window.plugin.sync.uuid = null;

window.plugin.sync.dialogHTML = null;
window.plugin.sync.authorizer = null;

// Store registered CollaborativeMap
window.plugin.sync.registerdPluginsFields = null;

// Other plugin call this function to push update to Google Realtime API
// example:
// plugin.sync.updateMap('keys', 'keysdata', ['guid1', 'guid2', 'guid3'])
// Which will push plugin.keys.keysdata['guid1'] etc. to Google Realtime API
window.plugin.sync.updateMap = function(pluginName, fieldName, keyArray) {
  var registeredMap = plugin.sync.registerdPluginsFields.get(pluginName, fieldName);
  if(!registeredMap) return false;
  registeredMap.updateMap(keyArray);
}

// Other plugin call this to register a field as CollaborativeMap to sync with Google Realtime API
// example: plugin.sync.registerMapForSync('keys', 'keysdata', plugin.keys.updateCallback, plugin.keys.initializedCallback)
// which register plugin.keys.keysdata
//
// updateCallback function format: function(pluginName, fieldName, eventObejct, fullUpdated)
// updateCallback will be fired when local or remote pushed update to Google Realtime API
// fullUpdated is true when remote update occur during local client offline, all data is replaced by remote data
// eventObject is a ValueChangedEvent, is null if fullUpdated is true
//
// detail of ValueChangedEvent refer to following url
// https://developers.google.com/drive/realtime/reference/gapi.drive.realtime.ValueChangedEvent
//
// initializedCallback funciton format: function(pluginName, fieldName)
// initializedCallback will be fired when the CollaborativeMap finished initialize and good to use
window.plugin.sync.registerMapForSync = function(pluginName, fieldName, callback, initializedCallback) {
  var options, registeredMap;
  options = {'pluginName': pluginName,
               'fieldName': fieldName,
               'callback': callback,
               'initializedCallback': initializedCallback,
               'authorizer': plugin.sync.authorizer,
               'uuid': plugin.sync.uuid};
  registeredMap = new plugin.sync.RegisteredMap(options);
  plugin.sync.registerdPluginsFields.add(registeredMap);
}



//// RegisteredMap
// Create a file named pluginName[fieldName] in folder specified by authorizer
// The file use as realtime document with CollaborativeMap to store the data and a
// CollaborativeString to store uuid of last update client
// callback will called when any local/remote update happen
// initializedCallback will called when RegisteredMap initialized and good to use.
window.plugin.sync.RegisteredMap = function(options) {
  this.pluginName = options['pluginName'];
  this.fieldName = options['fieldName'];
  this.callback = options['callback'];
  this.initializedCallback = options['initializedCallback'];
  this.authorizer = options['authorizer'];
  this.uuid = options['uuid'];
  this.fileId = null;
  this.doc = null;
  this.model = null;
  this.map = null;
  this.lastUpdateUUID = null;
  this.initializing = false;
  this.initialized = false;
  this.updateListener = this.updateListener.bind(this);
  this.initialize = this.initialize.bind(this);
  this.loadRealtimeDocument = this.loadRealtimeDocument.bind(this);
}

window.plugin.sync.RegisteredMap.prototype.updateMap = function(keyArray) {
  var _this = this;
  // Use compound operation to ensure update pushed as a batch
  this.model.beginCompoundOperation();
  // Remove before set text to ensure full text change
  this.lastUpdateUUID.removeRange(0, this.lastUpdateUUID.length);
  this.lastUpdateUUID.setText(this.uuid);

  $.each(keyArray, function(ind, key) {
    var value = window.plugin[_this.pluginName][_this.fieldName][key];
    if(typeof(value) !== 'undefined') {
      _this.map.set(key, value);
    } else {
      _this.map.delete(key);
    }
  });
  this.model.endCompoundOperation();
}

window.plugin.sync.RegisteredMap.prototype.isUpdatedByOthers = function() {
  return this.lastUpdateUUID.toString() !== this.uuid;
}

window.plugin.sync.RegisteredMap.prototype.getFileName = function() {
  return this.pluginName + '[' + this.fieldName + ']'
}

window.plugin.sync.RegisteredMap.prototype.searchOrCreateFile = function(callback) {
  var searchOption, createOption, assignIdCallback, failedCallback, fileSearcher, _this;
  _this = this;

  searchOption = 'title = "' + this.getFileName() +'" and "' + this.authorizer.folderId + '" in parents and trashed = false';
  createOption = {'convert': 'false'
              , 'ocr': 'false'
              , 'resource': {'title': this.getFileName(),
                             'description': 'IITC plugin data for ' + this.getFileName(),
                             'mimeType': 'application/vnd.google-apps.drive-sdk',
                             'parents': [{'id': this.authorizer.folderId}]
                            }
               };

  assignIdCallback = function(id) {
    _this.fileId = id;
    if(callback) callback();
  };

  failedCallback = function() {
    _this.initializing = false;
    console.log('Plugin Sync: Could not create file ' + _this.getFileName());
  }

  fileSearcher = new plugin.sync.FileSearcher({'searchOption': searchOption,
                                               'createOption': createOption,
                                               'assignIdCallback': assignIdCallback,
                                               'failedCallback': failedCallback})
  fileSearcher.start();
}

window.plugin.sync.RegisteredMap.prototype.updateListener = function(e) {
  if(!e.isLocal) {
    if(!window.plugin[this.pluginName][this.fieldName]) {
      window.plugin[this.pluginName][this.fieldName] = {};
    }
    if(typeof(e.newValue) !== 'undefined' && e.newValue !== null) {
      window.plugin[this.pluginName][this.fieldName][e.property] = e.newValue;
    } else {
      delete window.plugin[this.pluginName][this.fieldName][e.property];
    }
  }
  if(this.callback) this.callback(this.pluginName, this.fieldName, e);
}

window.plugin.sync.RegisteredMap.prototype.initialize = function(callback) {
  this.searchOrCreateFile(this.loadRealtimeDocument);
}

window.plugin.sync.RegisteredMap.prototype.loadRealtimeDocument = function(callback) {
  this.initializing = true;
  var initRealtime, initializeModel, onFileLoaded, handleError, _this;
  _this = this;

  // this function called when the document is created first time
  // and the CollaborativeMap is populated with data in plugin field
  initializeModel = function(model) {
    var map = model.createMap();
    var lastUpdateUUID = model.createString();

    // Init the map values if this map is first created
    $.each(window.plugin[_this.pluginName][_this.fieldName], function(key, val) {
      map.set(key, val);
    });
    lastUpdateUUID.setText(_this.uuid);

    model.getRoot().set('map', map);
    model.getRoot().set('last-udpate-uuid', lastUpdateUUID);
    console.log(_this.pluginName + '[' + _this.fieldName + ']' + ': model initialized');
  };

  // this function called when the document is loaded
  // update local data if the document is updated by other
  // and add update listener to CollaborativeMap
  onFileLoaded = function(doc) {
    _this.doc = doc;
    _this.model = doc.getModel();
    _this.map = doc.getModel().getRoot().get("map");
    _this.lastUpdateUUID = doc.getModel().getRoot().get("last-udpate-uuid");
    _this.map.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, _this.updateListener);

    // Replace local value if data is changed by others
    if(_this.isUpdatedByOthers()) {
      console.log(_this.pluginName + '[' + _this.fieldName + ']' + ': updated by others, replacing content.');
      window.plugin[_this.pluginName][_this.fieldName] = {};
      $.each(_this.map.keys(), function(ind, key) {
        window.plugin[_this.pluginName][_this.fieldName][key] = _this.map.get(key);
      });
      if(_this.callback) _this.callback(_this.pluginName, _this.fieldName, null, true);
    }

    _this.initialized = true;
    _this.initializing = false;
    console.log(_this.pluginName + '[' + _this.fieldName + ']' + ': data loaded');
    if(callback) callback();
    if(_this.initializedCallback) _this.initializedCallback(_this.pluginName, _this.fieldName);
  };

  // Stop the sync if any error occur and try to re-authorize
  handleError = function(e) {
    console.log('Realtime API Error: ' + e.type);
    _this.stopSync();
    _this.authorizer.authorize();
  };

  gapi.drive.realtime.load(_this.fileId, onFileLoaded, initializeModel, handleError);
}

window.plugin.sync.RegisteredMap.prototype.stopSync = function() {
  this.map.removeEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.updateListener);
  this.fileId = null;
  this.doc = null;
  this.model = null;
  this.map = null;
  this.lastUpdateUUID = null;
  this.initializing = false;
  this.initialized = false;
  plugin.sync.registerdPluginsFields.addToWaitingInitialize(this.pluginName, this.fieldName);
}
//// end RegisteredMap



//// RegisterdPluginsFields
// Store RegisteredMap and handle initialization of RegisteredMap
window.plugin.sync.RegisterdPluginsFields = function(options) {
  this.authorizer = options['authorizer'];
  this.pluginsfields = {};
  this.waitingInitialize = [];
  this.initializeRegistered = this.initializeRegistered.bind(this);
  this.cleanWaitingInitialize = this.cleanWaitingInitialize.bind(this);
  this.initializeWorker = this.initializeWorker.bind(this);
  this.authorizer.addAuthCallback(this.initializeRegistered);
}

window.plugin.sync.RegisterdPluginsFields.prototype.add = function(registeredMap) {
  var pluginName, fieldName;
  pluginName = registeredMap.pluginName;
  fieldName = registeredMap.fieldName;
  this.pluginsfields[pluginName] = this.pluginsfields[pluginName] || {};

  if(this.pluginsfields[pluginName][fieldName]) return false;

  this.pluginsfields[pluginName][fieldName] = registeredMap;
  this.waitingInitialize.push(registeredMap);

  this.initializeWorker();
}

window.plugin.sync.RegisterdPluginsFields.prototype.addToWaitingInitialize = function(pluginName, fieldName) {
  var registeredMap = this.get(pluginName, fieldName);
  if(!registeredMap) return;
  this.waitingInitialize.push(registeredMap);

  this.initializeWorker();
}

window.plugin.sync.RegisterdPluginsFields.prototype.get = function(pluginName, fieldName) {
  if(!this.pluginsfields[pluginName]) return;
  return this.pluginsfields[pluginName][fieldName];
}

window.plugin.sync.RegisterdPluginsFields.prototype.initializeRegistered = function() {
  var _this = this;
  if(this.authorizer.isAuthed()) {
    $.each(this.waitingInitialize, function(ind, map) {
      if(!map.initializing && !map.initialized) {
        map.initialize(_this.cleanWaitingInitialize);
      }
    });
  }
}

window.plugin.sync.RegisterdPluginsFields.prototype.cleanWaitingInitialize = function() {
  this.waitingInitialize = $.grep(this.waitingInitialize, function(map, ind) {return !map.initialized;});
}

window.plugin.sync.RegisterdPluginsFields.prototype.initializeWorker = function() {
  var _this = this;

  if(this.authorizer.isAuthed()) {
    this.initializeRegistered();
  }

  clearTimeout(this.timer);
  if(this.waitingInitialize.length > 0) {
    this.timer = setTimeout(function() {_this.initializeWorker()}, 10000);
  }
}
//// end RegisterdPluginsFields




//// FileSearcher
//
// assignIdCallback function format: function(id)
// allow you to assign the file/folder id elsewhere
//
// failedCallback function format: function()
// call when the file/folder couldn't create
window.plugin.sync.FileSearcher = function(options) {
  this.searchOption = options['searchOption'];
  this.createOption = options['createOption'];
  this.assignIdCallback = options['assignIdCallback'];
  this.failedCallback = options['failedCallback'];
}

window.plugin.sync.FileSearcher.prototype.start = function() {
  var searchCallback, createCallback, _this;

  _this = this;

  createCallback = function(resp) {
    if(resp.id) {
      _this.assignIdCallback(resp.id); // file created
    } else {
      _this.failedCallback(); // could not creat file
    }
  }

  searchCallback = function(resp) {
    if(resp.items) {
      _this.assignIdCallback(resp.items[0].id); // file found
    } else {
      _this.createFileOrFolder(_this.createOption, createCallback); // file not found, create file
    }
  }

  this.searchFileOrFolder(this.searchOption, searchCallback);
}

window.plugin.sync.FileSearcher.prototype.createFileOrFolder = function(createOption, callback) {
  gapi.client.load('drive', 'v2', function() {
    gapi.client.drive.files.insert(createOption).execute(callback);
  });
}

window.plugin.sync.FileSearcher.prototype.searchFileOrFolder = function(searchOption, callback) {
  gapi.client.load('drive', 'v2', function() {
    var option = {'q': searchOption};
    gapi.client.drive.files.list(option).execute(callback);
  });
}
//// end FileSearcher




//// Authorizer
// authorize user google account and create a folder 'IITC-SYNC-DATA' to store Realtime document
window.plugin.sync.Authorizer = function(options) {
  this.authCallback = options['authCallback'];
  this.folderId = null;
  this.authorize = this.authorize.bind(this);
}

window.plugin.sync.Authorizer.prototype.CLIENT_ID = '893806110732.apps.googleusercontent.com';
window.plugin.sync.Authorizer.prototype.SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'];

window.plugin.sync.Authorizer.prototype.isAuthed = function() {
  return this.folderId !== null;
}

window.plugin.sync.Authorizer.prototype.addAuthCallback = function(callback) {
  if(typeof(this.authCallback) === 'function') this.authCallback = [this.authCallback];
  this.authCallback.push(callback);
}

window.plugin.sync.Authorizer.prototype.authComplete = function() {
  if(this.authCallback) {
    if(typeof(this.authCallback) === 'function') this.authCallback();
    if(this.authCallback instanceof Array && this.authCallback.length > 0) {
      $.each(this.authCallback, function(ind, func) {
        func();
      });
    }
  }
}

window.plugin.sync.Authorizer.prototype.initFolder = function() {
  var searchOption, createOption, assignIdCallback, failedCallback, fileSearcher, _this;
  _this = this;

  searchOption = 'title = "IITC-SYNC-DATA" and mimeType = "application/vnd.google-apps.folder" and trashed = false';
  createOption = {'convert': 'false'
                , 'ocr': 'false'
                , 'resource': {'title': 'IITC-SYNC-DATA',
                               'description': 'Store IITC sync data',
                               'mimeType': 'application/vnd.google-apps.folder'
                              }
                 };

  assignIdCallback = function(id) {
    _this.folderId = id;
    _this.authComplete();
  };

  failedCallback = function() {
    _this.authComplete();
    console.log('Could not create "IITC-SYNC-DATA" folder');
  }

  fileSearcher = new plugin.sync.FileSearcher({'searchOption': searchOption,
                                               'createOption': createOption,
                                               'assignIdCallback': assignIdCallback,
                                               'failedCallback': failedCallback})
  fileSearcher.start();
}

window.plugin.sync.Authorizer.prototype.authorize = function(popup) {
  var handleAuthResult, _this;
  _this = this;

  handleAuthResult = function(authResult) {
    if(authResult && !authResult.error) {
      _this.initFolder();
    } else {
      _this.folderId = null;
      _this.authComplete();
      console.log('Plugin Sync: Authorization error.');
    }
  };

  gapi.auth.authorize({'client_id': this.CLIENT_ID, 'scope': this.SCOPES, 'immediate': !popup}
    , handleAuthResult);
}
//// end Authorizer




// http://stackoverflow.com/a/8809472/2322660
// http://stackoverflow.com/a/7221797/2322660
// With format fixing: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y in [8,9,a,b]
window.plugin.sync.generateUUID = function() {
  if(window.crypto && window.crypto.getRandomValues) {
    var buf = new Uint16Array(8);
    window.crypto.getRandomValues(buf);
    var S4 = function(num) {
      var ret = num.toString(16);
      return "000".substring(0, 4-ret.length) + ret;
    };
    var yxxx = function(num) {
      return num&0x3fff|0x8000;
    }
    return (S4(buf[0])+S4(buf[1])+"-"+S4(buf[2])+"-4"+S4(buf[3]).substring(1)+"-"+S4(yxxx(buf[4]))+"-"+S4(buf[5])+S4(buf[6])+S4(buf[7]));
  } else {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  }
}

window.plugin.sync.storeLocal = function(mapping) {
  if(typeof(plugin.sync[mapping.field]) !== 'undefined' && plugin.sync[mapping.field] !== null) {
    localStorage[mapping.key] = JSON.stringify(plugin.sync[mapping.field]);
  } else {
    localStorage.removeItem(mapping.key);
  }
}

window.plugin.sync.loadLocal = function(mapping) {
  var objectJSON = localStorage[mapping.key];
  if(!objectJSON) return;
  plugin.sync[mapping.field] = mapping.convertFunc 
                          ? mapping.convertFunc(JSON.parse(objectJSON))
                          : JSON.parse(objectJSON);
}

window.plugin.sync.loadUUID = function() {
  plugin.sync.loadLocal(plugin.sync.KEY_UUID);
  if(!plugin.sync.uuid) {
    plugin.sync.uuid = plugin.sync.generateUUID();
    plugin.sync.storeLocal(plugin.sync.KEY_UUID);
  }
}

window.plugin.sync.toggleAuthButton = function() {
  var authed = plugin.sync.authorizer.isAuthed();
  $('#sync-authButton').attr('disabled', authed);
  $('#sync-authButton').html(authed ? 'Authorized' : 'Authorize');
  if(authed) {
    $('#sync-authButton').addClass('sync-authButton-authed');
    $('#sync-show-dialog').removeClass('sync-show-dialog-error');
  } else {
    $('#sync-authButton').removeClass('sync-authButton-authed');
    $('#sync-show-dialog').addClass('sync-show-dialog-error');
  }
}

window.plugin.sync.showDialog = function() {
  alert(plugin.sync.dialogHTML);
  plugin.sync.toggleAuthButton();
}

window.plugin.sync.setupDialog = function() {
  plugin.sync.dialogHTML = '<div id="sync-dialog">'
                         + '<button id="sync-authButton" class="sync-authButton-authed" onclick="setTimeout(function(){window.plugin.sync.authorizer.authorize(true)}, 1)" disabled="disabled">Authorize</button>'
                         + '</div>';
  $('#toolbox').append('<a id="sync-show-dialog" onclick="window.plugin.sync.showDialog();">Sync</a> ');
}

window.plugin.sync.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html(".sync-authButton-authed {\
            opacity: 0.5;\
          }\
          .sync-show-dialog-error {\
            color: #FF2222;\
          }")
  .appendTo("head");
}

var setup =  function() {
  window.plugin.sync.loadUUID();
  window.plugin.sync.setupCSS();
  window.plugin.sync.setupDialog();

  window.plugin.sync.authorizer = new window.plugin.sync.Authorizer({'authCallback': [plugin.sync.toggleAuthButton]});
  window.plugin.sync.registerdPluginsFields = new window.plugin.sync.RegisterdPluginsFields({'authorizer': window.plugin.sync.authorizer});

  var GOOGLEAPI = 'https://apis.google.com/js/api.js';
  load(GOOGLEAPI).thenRun(function() {
    gapi.load('auth:client,drive-realtime,drive-share', window.plugin.sync.authorizer.authorize);
  });
}

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
