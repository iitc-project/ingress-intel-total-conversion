// ==UserScript==
// @id             iitc-plugin-sync@xelio
// @name           IITC plugin: Sync
// @category       Misc
// @version        0.2.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Sync data between clients via Google Realtime API. Only syncs data from specific plugins (currently: Keys, Bookmarks). Sign in via the 'Sync' link.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

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

// Each client has an unique UUID, to identify remote data is updated by other clients or not
window.plugin.sync.uuid = null;

window.plugin.sync.dialogHTML = null;
window.plugin.sync.authorizer = null;

// Store registered CollaborativeMap
window.plugin.sync.registeredPluginsFields = null;
window.plugin.sync.logger = null;

// Other plugin call this function to push update to Google Realtime API
// example:
// plugin.sync.updateMap('keys', 'keysdata', ['guid1', 'guid2', 'guid3'])
// Which will push plugin.keys.keysdata['guid1'] etc. to Google Realtime API
window.plugin.sync.updateMap = function(pluginName, fieldName, keyArray) {
  var registeredMap = plugin.sync.registeredPluginsFields.get(pluginName, fieldName);
  if(!registeredMap) return false;
  registeredMap.updateMap(keyArray);
}

// Other plugin call this to register a field as CollaborativeMap to sync with Google Realtime API
// example: plugin.sync.registerMapForSync('keys', 'keysdata', plugin.keys.updateCallback, plugin.keys.initializedCallback)
// which register plugin.keys.keysdata
//
// updateCallback function format: function(pluginName, fieldName, eventObject, fullUpdated)
// updateCallback will be fired when local or remote pushed update to Google Realtime API
// fullUpdated is true when remote update occur during local client offline, all data is replaced by remote data
// eventObject is a ValueChangedEvent, is null if fullUpdated is true
//
// detail of ValueChangedEvent refer to following url
// https://developers.google.com/drive/realtime/reference/gapi.drive.realtime.ValueChangedEvent
//
// initializedCallback function format: function(pluginName, fieldName)
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
  plugin.sync.registeredPluginsFields.add(registeredMap);
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
  this.fileSearcher = null;

  this.forceFileSearch = false;
  this.initializing = false;
  this.initialized = false;
  this.failed = false;

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
  var remoteUUID = this.lastUpdateUUID.toString();
  return (remoteUUID !== '') && (remoteUUID !== this.uuid);
}

window.plugin.sync.RegisteredMap.prototype.getFileName = function() {
  return this.pluginName + '[' + this.fieldName + ']'
}

window.plugin.sync.RegisteredMap.prototype.initFile = function(callback) {
  var assignIdCallback, failedCallback, _this;
  _this = this;

  assignIdCallback = function(id) {
    _this.forceFileSearch = false;
    _this.fileId = id;
    if(callback) callback();
  };

  failedCallback = function(resp) {
    _this.initializing = false;
    _this.failed = true;
    plugin.sync.logger.log('Could not create file: ' + _this.getFileName() + '. If this problem persist, delete this file in IITC-SYNC-DATA-V2 and empty trash in your Google drive and try again.');
  }

  this.fileSearcher = new plugin.sync.FileSearcher({'fileName': this.getFileName(),
                                                    'description': 'IITC plugin data for ' + this.getFileName()});
  this.fileSearcher.initialize(this.forceFileSearch, assignIdCallback, failedCallback);
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
  this.initFile(this.loadRealtimeDocument);
}

window.plugin.sync.RegisteredMap.prototype.loadRealtimeDocument = function(callback) {
  this.initializing = true;
  var initRealtime, initializeModel, onFileLoaded, handleError, _this;
  _this = this;

  // this function called when the document is created first time
  // and the CollaborativeMap is populated with data in plugin field
  initializeModel = function(model) {
    var empty = true;
    var map = model.createMap();
    var lastUpdateUUID = model.createString();

    // Init the map values if this map is first created
    $.each(window.plugin[_this.pluginName][_this.fieldName], function(key, val) {
      map.set(key, val);
      empty = false;
    });

    // Only set the update client if the map is not empty, avoid clearing data of other clients
    lastUpdateUUID.setText(empty ? '' : _this.uuid);

    model.getRoot().set('map', map);
    model.getRoot().set('last-udpate-uuid', lastUpdateUUID);
    plugin.sync.logger.log('Model initialized: ' + _this.pluginName + '[' + _this.fieldName + ']');
  };

  // this function called when the document is loaded
  // update local data if the document is updated by other
  // and add update listener to CollaborativeMap
  onFileLoaded = function(doc) {
    _this.doc = doc;
    _this.model = doc.getModel();
    _this.map = doc.getModel().getRoot().get('map');
    _this.lastUpdateUUID = doc.getModel().getRoot().get('last-udpate-uuid');
    _this.map.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, _this.updateListener);

    // Replace local value if data is changed by others
    if(_this.isUpdatedByOthers()) {
    plugin.sync.logger.log('Updated by others, replacing content: ' + _this.pluginName + '[' + _this.fieldName + ']');
      window.plugin[_this.pluginName][_this.fieldName] = {};
      $.each(_this.map.keys(), function(ind, key) {
        window.plugin[_this.pluginName][_this.fieldName][key] = _this.map.get(key);
      });
      if(_this.callback) _this.callback(_this.pluginName, _this.fieldName, null, true);
    }

    _this.initialized = true;
    _this.initializing = false;
    plugin.sync.logger.log('Data loaded: ' + _this.pluginName + '[' + _this.fieldName + ']');
    if(callback) callback();
    if(_this.initializedCallback) _this.initializedCallback(_this.pluginName, _this.fieldName);
  };

  // Stop the sync if any error occur and try to re-authorize
  handleError = function(e) {
    plugin.sync.logger.log('Realtime API Error: ' + e.type);
    _this.stopSync();
    if(e.type === gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
      _this.authorizer.authorize();
    } else if(e.type === gapi.drive.realtime.ErrorType.NOT_FOUND) {
      _this.forceFileSearch = true;
    } else if(e.type === gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
      // Workaround: if Realtime API open a second document and the file do not exist, 
      // it will rasie 'CLIENT_ERROR' instead of 'NOT_FOUND'. So we do a force file search here.
      _this.forceFileSearch = true;
    } else {
      alert('Plugin Sync error: ' + e.type + ', ' + e.message);
    }
  };

  gapi.drive.realtime.load(_this.fileId, onFileLoaded, initializeModel, handleError);
}

window.plugin.sync.RegisteredMap.prototype.stopSync = function() {
  if(this.map) this.map.removeEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.updateListener);
  this.fileId = null;
  this.doc = null;
  this.model = null;
  this.map = null;
  this.lastUpdateUUID = null;
  this.initializing = false;
  this.initialized = false;
  plugin.sync.registeredPluginsFields.addToWaitingInitialize(this.pluginName, this.fieldName);
}
//// end RegisteredMap




//// RegisteredPluginsFields
// Store RegisteredMap and handle initialization of RegisteredMap
window.plugin.sync.RegisteredPluginsFields = function(options) {
  this.authorizer = options['authorizer'];
  this.pluginsfields = {};
  this.waitingInitialize = {};

  this.anyFail = false;

  this.initializeRegistered = this.initializeRegistered.bind(this);
  this.cleanWaitingInitialize = this.cleanWaitingInitialize.bind(this);
  this.initializeWorker = this.initializeWorker.bind(this);

  this.authorizer.addAuthCallback(this.initializeRegistered);
}

window.plugin.sync.RegisteredPluginsFields.prototype.add = function(registeredMap) {
  var pluginName, fieldName;
  pluginName = registeredMap.pluginName;
  fieldName = registeredMap.fieldName;
  this.pluginsfields[pluginName] = this.pluginsfields[pluginName] || {};

  if(this.pluginsfields[pluginName][fieldName]) return false;

  this.pluginsfields[pluginName][fieldName] = registeredMap;
  this.waitingInitialize[registeredMap.getFileName()] = registeredMap;

  this.initializeWorker();
}

window.plugin.sync.RegisteredPluginsFields.prototype.addToWaitingInitialize = function(pluginName, fieldName) {
  var registeredMap, _this;
  _this = this;

  registeredMap = this.get(pluginName, fieldName);
  if(!registeredMap) return;
  this.waitingInitialize[registeredMap.getFileName()] = registeredMap;

  clearTimeout(this.timer);
  this.timer = setTimeout(function() {_this.initializeWorker()}, 10000);
  plugin.sync.logger.log('Retry in 10 sec.: ' +  pluginName + '[' + fieldName + ']');
}

window.plugin.sync.RegisteredPluginsFields.prototype.get = function(pluginName, fieldName) {
  if(!this.pluginsfields[pluginName]) return;
  return this.pluginsfields[pluginName][fieldName];
}

window.plugin.sync.RegisteredPluginsFields.prototype.initializeRegistered = function() {
  var _this = this;
  if(this.authorizer.isAuthed()) {
    $.each(this.waitingInitialize, function(key, map) {
      if(!map.initializing && !map.initialized) {
        map.initialize(_this.cleanWaitingInitialize);
      }
    });
  }
}

window.plugin.sync.RegisteredPluginsFields.prototype.cleanWaitingInitialize = function() {
  var newWaitingInitialize, _this;
  _this = this;

  newWaitingInitialize = {};
  $.each(this.waitingInitialize, function(key,map) {
    if(map.failed) _this.anyFail = true;
    if(map.initialized || map.failed) return true;
    newWaitingInitialize[map.getFileName()] = map;
  });
  this.waitingInitialize = newWaitingInitialize;
}

window.plugin.sync.RegisteredPluginsFields.prototype.initializeWorker = function() {
  var _this = this;

  this.cleanWaitingInitialize();
  plugin.sync.toggleDialogLink();
  this.initializeRegistered();

  clearTimeout(this.timer);
  if(Object.keys(this.waitingInitialize).length > 0) {
    this.timer = setTimeout(function() {_this.initializeWorker()}, 10000);
  }
}
//// end RegisteredPluginsFields




//// FileSearcher
//
// assignIdCallback function format: function(id)
// allow you to assign the file/folder id elsewhere
//
// failedCallback function format: function()
// call when the file/folder couldn't create
window.plugin.sync.FileSearcher = function(options) {
  // return object created previously
  if(this.instances[options['fileName']]) return this.instances[options['fileName']];

  this.fileName = options['fileName'];
  this.description = options['description'];
  this.isFolder = options['isFolder'];

  this.force = false;
  this.parent = null;
  this.fileId = null;
  this.retryCount = 0;
  this.loadFileId();

  this.instances[this.fileName] = this;
}

window.plugin.sync.FileSearcher.prototype.instances = {};
window.plugin.sync.FileSearcher.prototype.RETRY_LIMIT = 2;
window.plugin.sync.FileSearcher.prototype.MIMETYPE_FILE = 'application/vnd.google-apps.drive-sdk';
window.plugin.sync.FileSearcher.prototype.MIMETYPE_FOLDER = 'application/vnd.google-apps.folder';
window.plugin.sync.FileSearcher.prototype.parentName = 'IITC-SYNC-DATA-V2';
window.plugin.sync.FileSearcher.prototype.parentDescription = 'Store IITC sync data';

window.plugin.sync.FileSearcher.prototype.initialize = function(force, assignIdCallback, failedCallback) {
  this.force = force;
  // throw error if too many retry
  if(this.retryCount >= this.RETRY_LIMIT) {
    plugin.sync.logger.log('Too many file operation: ' + this.fileName);
    failedCallback();
    return;
  }
  if(this.force) this.retryCount++;

  if(this.isFolder) {
    this.initFile(assignIdCallback, failedCallback);
  } else {
    this.initParent(assignIdCallback, failedCallback);
  }
}

window.plugin.sync.FileSearcher.prototype.initFile = function(assignIdCallback, failedCallback) {
  // If not force search and have cached fileId, return the fileId
  if(!this.force && this.fileId) {
    assignIdCallback(this.fileId);
    return;
  }

  var searchCallback, createCallback, handleFileId, handleFailed, _this;
  _this = this;

  handleFileId = function(id) {
    _this.fileId = id;
    _this.saveFileId();
    assignIdCallback(id);
  };

  handleFailed = function(resp) {
    _this.fileId = null;
    _this.saveFileId();
    plugin.sync.logger.log('File operation failed: ' + (resp.error || 'unknown error'));
    failedCallback(resp);
  }

  createCallback = function(resp) {
    if(resp.id) {
      handleFileId(resp.id); // file created
    } else {
      handleFailed(resp) // could not create file
    }
  };

  searchCallback = function(resp) {
    if(resp.items && resp.items[0]) {
      handleFileId(resp.items[0].id);// file found
    } else if(!resp.error) {
      _this.createFileOrFolder(createCallback); // file not found, create file
    } else {
      handleFailed(resp); // Error
    }
  };

  this.searchFileOrFolder(searchCallback);
}

window.plugin.sync.FileSearcher.prototype.initParent = function(assignIdCallback, failedCallback) {
  var parentAssignIdCallback, parentFailedCallback, _this;
  _this = this;

  parentAssignIdCallback = function(id) {
    _this.initFile(assignIdCallback, failedCallback);
  }

  parentFailedCallback = function(resp) {
    _this.fileId = null;
    _this.saveFileId();
    plugin.sync.logger.log('File operation failed: ' + (resp.error || 'unknown error'));
    failedCallback(resp);
  }

  this.parent = new plugin.sync.FileSearcher({'fileName': this.parentName,
                                  'description': this.parentDescription,
                                  'isFolder': true});
  this.parent.initialize(this.force, parentAssignIdCallback, parentFailedCallback);
}

window.plugin.sync.FileSearcher.prototype.createFileOrFolder = function(callback) {
  var _this = this;
  gapi.client.load('drive', 'v2', function() {
    gapi.client.drive.files.insert(_this.getCreateOption()).execute(callback);
  });
}

window.plugin.sync.FileSearcher.prototype.searchFileOrFolder = function(callback) {
  var _this = this;
  gapi.client.load('drive', 'v2', function() {
    gapi.client.drive.files.list(_this.getSearchOption()).execute(callback);
  });
}

window.plugin.sync.FileSearcher.prototype.getCreateOption = function() {
  var resource = {
    'title': this.fileName,
    'description': this.description,
    'mimeType': (this.isFolder ? this.MIMETYPE_FOLDER : this.MIMETYPE_FILE)
  };
  if(this.parent) $.extend(resource, {'parents': [{'id': this.parent.fileId}]});

  return {'convert': 'false',
          'ocr': 'false',
          'resource': resource};
}

window.plugin.sync.FileSearcher.prototype.getSearchOption = function() {
  var q = 'title = "' + this.fileName +'" and trashed = false';
  if(this.parent) q += ' and "' + this.parent.fileId + '" in parents';
  return {'q': q};
}

window.plugin.sync.FileSearcher.prototype.localStorageKey = function() {
  return 'sync-file-' + this.fileName;
}

window.plugin.sync.FileSearcher.prototype.saveFileId = function() {
  if(this.fileId) {
    localStorage[this.localStorageKey()] = this.fileId;
  } else {
    localStorage.removeItem(this.localStorageKey());
  }
}

window.plugin.sync.FileSearcher.prototype.loadFileId = function() {
  var storedFileId = localStorage[this.localStorageKey()];
  if(storedFileId) this.fileId = storedFileId;
}
//// end FileSearcher




//// Authorizer
// authorize user's google account
window.plugin.sync.Authorizer = function(options) {
  this.authCallback = options['authCallback'];
  this.authorizing = false;
  this.authorized = false;
  this.isAuthed = this.isAuthed.bind(this);
  this.isAuthorizing = this.isAuthorizing.bind(this);
  this.authorize = this.authorize.bind(this);
}

window.plugin.sync.Authorizer.prototype.CLIENT_ID = '893806110732.apps.googleusercontent.com';
window.plugin.sync.Authorizer.prototype.SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'];

window.plugin.sync.Authorizer.prototype.isAuthed = function() {
  return this.authorized;
}

window.plugin.sync.Authorizer.prototype.isAuthorizing = function() {
  return this.authorizing;
}
window.plugin.sync.Authorizer.prototype.addAuthCallback = function(callback) {
  if(typeof(this.authCallback) === 'function') this.authCallback = [this.authCallback];
  this.authCallback.push(callback);
}

window.plugin.sync.Authorizer.prototype.authComplete = function() {
  this.authorizing = false;
  if(this.authCallback) {
    if(typeof(this.authCallback) === 'function') this.authCallback();
    if(this.authCallback instanceof Array && this.authCallback.length > 0) {
      $.each(this.authCallback, function(ind, func) {
        func();
      });
    }
  }
}

window.plugin.sync.Authorizer.prototype.authorize = function(popup) {
  this.authorizing = true;
  this.authorized = false;
  var handleAuthResult, _this;
  _this = this;

  handleAuthResult = function(authResult) {
    if(authResult && !authResult.error) {
      _this.authorized = true;
      plugin.sync.logger.log('Authorized');
    } else {
      _this.authorized = false;
      var error = (authResult && authResult.error) ? authResult.error : 'not authorized';
      plugin.sync.logger.log('Authorization error: ' + error);
    }
    _this.authComplete();
  };

  gapi.auth.authorize({'client_id': this.CLIENT_ID, 'scope': this.SCOPES, 'immediate': !popup}
    , handleAuthResult);
}
//// end Authorizer




//// Logger
window.plugin.sync.Logger = function(options) {
  this.logLimit = options['logLimit'];
  this.logUpdateCallback = options['logUpdateCallback'];
  this.logs = [];
  this.log = this.log.bind(this);
  this.getLogs = this.getLogs.bind(this);
}

window.plugin.sync.Logger.prototype.log = function(message) {
  var log = {'time': new Date(), 'message': message};
  this.logs.unshift(log);
  if(this.logs.length > this.logLimit) {
    this.logs.pop();
  }
  if(this.logUpdateCallback) this.logUpdateCallback(this.getLogs());
}

window.plugin.sync.Logger.prototype.getLogs = function() {
  var allLogs = '';
  $.each(this.logs, function(ind,log) {
    allLogs += log.time.toLocaleTimeString() + ': ' + log.message + '<br />';
  });
  return allLogs;
}


//// end Logger




// http://stackoverflow.com/a/8809472/2322660
// http://stackoverflow.com/a/7221797/2322660
// With format fixing: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y in [8,9,a,b]
window.plugin.sync.generateUUID = function() {
  if(window.crypto && window.crypto.getRandomValues) {
    var buf = new Uint16Array(8);
    window.crypto.getRandomValues(buf);
    var S4 = function(num) {
      var ret = num.toString(16);
      return '000'.substring(0, 4-ret.length) + ret;
    };
    var yxxx = function(num) {
      return num&0x3fff|0x8000;
    }
    return (S4(buf[0])+S4(buf[1])+'-'+S4(buf[2])+'-4'+S4(buf[3]).substring(1)+'-'+S4(yxxx(buf[4]))+'-'+S4(buf[5])+S4(buf[6])+S4(buf[7]));
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

window.plugin.sync.updateLog = function(messages) {
  $('#sync-log').html(messages);
}

window.plugin.sync.toggleAuthButton = function() {
  var authed, authorizing;
  authed = plugin.sync.authorizer.isAuthed();
  authorizing = plugin.sync.authorizer.isAuthorizing();

  $('#sync-authButton').html(authed ? 'Authorized' : 'Authorize');

  $('#sync-authButton').attr('disabled', (authed || authorizing));
  $('#sync-authButton').toggleClass('sync-authButton-dimmed', authed || authorizing);
}

window.plugin.sync.toggleDialogLink = function() {
  var authed, anyFail;
  authed = plugin.sync.authorizer.isAuthed();
  anyFail = plugin.sync.registeredPluginsFields.anyFail;

  $('#sync-show-dialog').toggleClass('sync-show-dialog-error', !authed || anyFail);
}

window.plugin.sync.showDialog = function() {
  window.dialog({html: plugin.sync.dialogHTML, title: 'Sync', modal: true, id: 'sync-setting'});
  plugin.sync.toggleAuthButton();
  plugin.sync.toggleDialogLink();
  plugin.sync.updateLog(plugin.sync.logger.getLogs());
}

window.plugin.sync.setupDialog = function() {
  plugin.sync.dialogHTML = '<div id="sync-dialog">'
                         + '<button id="sync-authButton" class="sync-authButton-dimmed" '
                         + 'onclick="setTimeout(function(){window.plugin.sync.authorizer.authorize(true)}, 1)" '
                         + 'disabled="disabled">Authorize</button>'
                         + '<div id="sync-log"></div>'
                         + '</div>';
  $('#toolbox').append('<a id="sync-show-dialog" onclick="window.plugin.sync.showDialog();">Sync</a> ');
}

window.plugin.sync.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html(".sync-authButton-dimmed {\
            opacity: 0.5;\
          }\
          .sync-show-dialog-error {\
            color: #FF2222;\
          }\
          #sync-log {\
            height: 300px;\
            white-space: pre-wrap;\
            white-space: -moz-pre-wrap;\
            white-space: -o-pre-wrap;\
            word-wrap: break-word;\
            overflow-y: auto;\
          }")
  .appendTo("head");
}

var setup =  function() {
  window.plugin.sync.logger = new plugin.sync.Logger({'logLimit':10, 'logUpdateCallback': plugin.sync.updateLog});
  window.plugin.sync.loadUUID();
  window.plugin.sync.setupCSS();
  window.plugin.sync.setupDialog();

  window.plugin.sync.authorizer = new window.plugin.sync.Authorizer({
    'authCallback': [plugin.sync.toggleAuthButton, plugin.sync.toggleDialogLink]
  });
  window.plugin.sync.registeredPluginsFields = new window.plugin.sync.RegisteredPluginsFields({
    'authorizer': window.plugin.sync.authorizer
  });

  var GOOGLEAPI = 'https://apis.google.com/js/api.js';
  load(GOOGLEAPI).thenRun(function() {
    gapi.load('auth:client,drive-realtime,drive-share', window.plugin.sync.authorizer.authorize);
  });
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
