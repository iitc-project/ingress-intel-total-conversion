// ==UserScript==
// @id             iitc-plugin-bookmarks@ZasoGD
// @name           IITC plugin: Bookmarks for maps and portals
// @category       Controls
// @version        0.2.12.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Save your favorite Maps and Portals and move the intel map with a click. Works with sync.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////
/***********************************************************************

  HOOKS:
  - pluginBkmrksEdit: fired when a bookmarks/folder is removed, added or sorted, also when a folder is opened/closed;
  - pluginBkmrksOpenOpt: fired when the "Bookmarks Options" panel is opened (you can add new options);
  - pluginBkmrksSyncEnd: fired when the sync is finished;

***********************************************************************/
////////////////////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.bookmarks = function() {};

  window.plugin.bookmarks.SYNC_DELAY = 5000;

  window.plugin.bookmarks.KEY_OTHER_BKMRK = 'idOthers';
  window.plugin.bookmarks.KEY_STORAGE = 'plugin-bookmarks';
  window.plugin.bookmarks.KEY_STATUS_BOX = 'plugin-bookmarks-box';

  window.plugin.bookmarks.KEY = {key: window.plugin.bookmarks.KEY_STORAGE, field: 'bkmrksObj'};
  window.plugin.bookmarks.UPDATE_QUEUE = {key: 'plugin-bookmarks-queue', field: 'updateQueue'};
  window.plugin.bookmarks.UPDATING_QUEUE = {key: 'plugin-bookmarks-updating-queue', field: 'updatingQueue'};

  window.plugin.bookmarks.bkmrksObj = {};
  window.plugin.bookmarks.statusBox = {};
  window.plugin.bookmarks.updateQueue = {};
  window.plugin.bookmarks.updatingQueue = {};

  window.plugin.bookmarks.enableSync = false;

  window.plugin.bookmarks.starLayers = {};
  window.plugin.bookmarks.starLayerGroup = null;

  window.plugin.bookmarks.isSmart = undefined;
  window.plugin.bookmarks.isAndroid = function() {
    if(typeof android !== 'undefined' && android) {
      return true;
    }
    return false;
  }

/*********************************************************************************************************************/

  // Generate an ID for the bookmark (date time + random number)
  window.plugin.bookmarks.generateID = function() {
    var d = new Date();
    var ID = d.getTime()+(Math.floor(Math.random()*99)+1);
    var ID = 'id'+ID.toString();
    return ID;
  }

  // Format the string
  window.plugin.bookmarks.escapeHtml = function(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\//g, '&#47;')
        .replace(/\\/g, '&#92;');
  }

  // Update the localStorage
  window.plugin.bookmarks.saveStorage = function() {
    localStorage[plugin.bookmarks.KEY_STORAGE] = JSON.stringify(window.plugin.bookmarks.bkmrksObj);
  }
  // Load the localStorage
  window.plugin.bookmarks.loadStorage = function() {
    window.plugin.bookmarks.bkmrksObj = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
  }

  window.plugin.bookmarks.saveStorageBox = function() {
    localStorage[plugin.bookmarks.KEY_STATUS_BOX] = JSON.stringify(window.plugin.bookmarks.statusBox);
  }
  window.plugin.bookmarks.loadStorageBox = function() {
    window.plugin.bookmarks.statusBox = JSON.parse(localStorage[plugin.bookmarks.KEY_STATUS_BOX]);
  }

  window.plugin.bookmarks.upgradeToNewStorage = function() {
    if(localStorage['plugin-bookmarks-portals-data'] && localStorage['plugin-bookmarks-maps-data']) {
      var oldStor_1 = JSON.parse(localStorage['plugin-bookmarks-maps-data']);
      var oldStor_2 = JSON.parse(localStorage['plugin-bookmarks-portals-data']);

      window.plugin.bookmarks.bkmrksObj.maps = oldStor_1.bkmrk_maps;
      window.plugin.bookmarks.bkmrksObj.portals = oldStor_2.bkmrk_portals;
      window.plugin.bookmarks.saveStorage();

      localStorage.removeItem('plugin-bookmarks-maps-data');
      localStorage.removeItem('plugin-bookmarks-portals-data');
      localStorage.removeItem('plugin-bookmarks-status-box');
    }
  }

  window.plugin.bookmarks.createStorage = function() {
    if(!localStorage[window.plugin.bookmarks.KEY_STORAGE]) {
      window.plugin.bookmarks.bkmrksObj.maps = {idOthers:{label:"Others",state:1,bkmrk:{}}};
      window.plugin.bookmarks.bkmrksObj.portals = {idOthers:{label:"Others",state:1,bkmrk:{}}};
      window.plugin.bookmarks.saveStorage();
    }
    if(!localStorage[window.plugin.bookmarks.KEY_STATUS_BOX]) {
      window.plugin.bookmarks.statusBox.show = 1;
      window.plugin.bookmarks.statusBox.page = 0;
      window.plugin.bookmarks.statusBox.pos = {x:100,y:100};
      window.plugin.bookmarks.saveStorageBox();
    }
  }

  window.plugin.bookmarks.refreshBkmrks = function() {
    $('#bkmrk_maps > ul, #bkmrk_portals > ul').remove();

    window.plugin.bookmarks.loadStorage();
    window.plugin.bookmarks.loadList('maps');
    window.plugin.bookmarks.loadList('portals');

    window.plugin.bookmarks.updateStarPortal();
    window.plugin.bookmarks.jquerySortableScript();
  }

/***************************************************************************************************************************************************************/

  // Show/hide the bookmarks box
  window.plugin.bookmarks.switchStatusBkmrksBox = function(status) {
    var newStatus = status;

    if(newStatus === 'switch') {
      if(window.plugin.bookmarks.statusBox.show === 1) {
        newStatus = 0;
      } else {
        newStatus = 1;
      }
    }

    if(newStatus === 1) {
      $('#bookmarksBox').css('height', 'auto');
      $('#bkmrksTrigger').css('height', '0');
    } else {
      $('#bkmrksTrigger').css('height', '64px');
      $('#bookmarksBox').css('height', '0');
    }

    window.plugin.bookmarks.statusBox['show'] = newStatus;
    window.plugin.bookmarks.saveStorageBox();
  }

  window.plugin.bookmarks.onPaneChanged = function(pane) {
    if(pane == "plugin-bookmarks")
      $('#bookmarksBox').css("display", "");
    else
      $('#bookmarksBox').css("display", "none");
  }

  // Switch list (maps/portals)
  window.plugin.bookmarks.switchPageBkmrksBox = function(elem, page) {
    window.plugin.bookmarks.statusBox.page = page;
    window.plugin.bookmarks.saveStorageBox();

    $('h5').removeClass('current');
    $(elem).addClass('current');

    var sectList = '#'+$(elem).attr('class').replace(' current', '');
    $('#bookmarksBox .bookmarkList').removeClass('current');
    $(sectList).addClass('current');
  }

  // Switch the status folder to open/close (in the localStorage)
  window.plugin.bookmarks.openFolder = function(elem) {
    $(elem).parent().parent('li').toggleClass('open');

    var typeList = $(elem).parent().parent().parent().parent('div').attr('id').replace('bkmrk_', '');
    var ID = $(elem).parent().parent('li').attr('id');

    var newFlag;
    var flag = window.plugin.bookmarks.bkmrksObj[typeList][ID]['state'];
    if(flag) { newFlag = 0; }
    else if(!flag) { newFlag = 1; }

    window.plugin.bookmarks.bkmrksObj[typeList][ID]['state'] = newFlag;
    window.plugin.bookmarks.saveStorage();
    window.runHooks('pluginBkmrksEdit', {"target": "folder", "action": newFlag?"open":"close", "id": ID});
  }

  // Load the HTML bookmarks
  window.plugin.bookmarks.loadList = function(typeList) {
    var element = '';
    var elementTemp = '';
    var elementExc = '';
    var returnToMap = '';

    if(window.plugin.bookmarks.isSmart) {
      returnToMap = 'window.show(\'map\');';
    }

    // For each folder
    var list = window.plugin.bookmarks.bkmrksObj[typeList];

    for(var idFolders in list) {
      var folders = list[idFolders];
      var active = '';

      // Create a label and a anchor for the sortable
      var folderDelete = '<span class="folderLabel"><a class="bookmarksRemoveFrom" onclick="window.plugin.bookmarks.removeElement(this, \'folder\');return false;" title="Remove this folder">X</a>';
      var folderName = '<a class="bookmarksAnchor" onclick="window.plugin.bookmarks.openFolder(this);return false"><span></span>'+folders['label']+'</a></span>';//<span><span></span></span>';
      var folderLabel = folderDelete+folderName;

      if(folders['state']) { active = ' open'; }
      if(idFolders === window.plugin.bookmarks.KEY_OTHER_BKMRK) {
        folderLabel = '';
        active= ' othersBookmarks open';
      }
      // Create a folder
      elementTemp = '<li class="bookmarkFolder'+active+'" id="'+idFolders+'">'+folderLabel+'<ul>';

      // For each bookmark
      var fold = folders['bkmrk'];
      for(var idBkmrk in fold) {
        var btn_link;
        var btn_remove = '<a class="bookmarksRemoveFrom" onclick="window.plugin.bookmarks.removeElement(this, \''+typeList+'\');return false;" title="Remove from bookmarks">X</a>';

        var btn_move = '';
        if(window.plugin.bookmarks.isSmart) {
          btn_move = '<a class="bookmarksMoveIn" onclick="window.plugin.bookmarks.dialogMobileSort(\''+typeList+'\', this);return false;">=</a>';
        }

        var bkmrk = fold[idBkmrk];
        var label = bkmrk['label'];
        var latlng = bkmrk['latlng'];

        // If it's a map
        if(typeList === 'maps') {
          if(bkmrk['label']=='') { label = bkmrk['latlng']+' ['+bkmrk['z']+']'; }
          btn_link = '<a class="bookmarksLink" onclick="'+returnToMap+'window.map.setView(['+latlng+'], '+bkmrk['z']+');return false;">'+label+'</a>';
        }
        // If it's a portal
        else if(typeList === 'portals') {
          var guid = bkmrk['guid'];
          var btn_link = '<a class="bookmarksLink" onclick="$(\'a.bookmarksLink.selected\').removeClass(\'selected\');'+returnToMap+'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+label+'</a>';
        }
        // Create the bookmark
        elementTemp += '<li class="bkmrk" id="'+idBkmrk+'">'+btn_remove+btn_move+btn_link+'</li>';
      }
      elementTemp += '</li></ul>';

      // Add folder 'Others' in last position
      if(idFolders != window.plugin.bookmarks.KEY_OTHER_BKMRK) { element += elementTemp; }
      else{ elementExc = elementTemp; }
    }
    element += elementExc;
    element = '<ul>'+element+'</ul>';

    // Append all folders and bookmarks
    $('#bkmrk_'+typeList).append(element);
  }

/***************************************************************************************************************************************************************/

  window.plugin.bookmarks.findByGuid = function(guid) {
    var list = window.plugin.bookmarks.bkmrksObj['portals'];

    for(var idFolders in list) {
      for(var idBkmrk in list[idFolders]['bkmrk']) {
        var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
        if(guid === portalGuid) {
          return {"id_folder":idFolders,"id_bookmark":idBkmrk};
        }
       }
    }
    return;
  }

  // Append a 'star' flag in sidebar.
  window.plugin.bookmarks.onPortalSelectedPending = false;
  window.plugin.bookmarks.onPortalSelected = function() {
    $('.bkmrksStar').remove();

    if(window.selectedPortal == null) return;

    if (!window.plugin.bookmarks.onPortalSelectedPending) {
      window.plugin.bookmarks.onPortalSelectedPending = true;

      setTimeout(function() { // the sidebar is constructed after firing the hook
        window.plugin.bookmarks.onPortalSelectedPending = false;

        $('.bkmrksStar').remove();

        if(typeof(Storage) === "undefined") {
          $('#portaldetails > .imgpreview').after(plugin.bookmarks.htmlDisabledMessage);
          return;
        }

        // Prepend a star to mobile status-bar
        if(window.plugin.bookmarks.isSmart) {
          $('#updatestatus').prepend(plugin.bookmarks.htmlStar);
          $('#updatestatus .bkmrksStar').attr('title', '');
        }

        $('#portaldetails > h3.title').before(plugin.bookmarks.htmlStar);
        window.plugin.bookmarks.updateStarPortal();
      }, 0);
    }

  }

  // Update the status of the star (when a portal is selected from the map/bookmarks-list)
  window.plugin.bookmarks.updateStarPortal = function() {
    var guid = window.selectedPortal;
    $('.bkmrksStar').removeClass('favorite');
    $('.bkmrk a.bookmarksLink.selected').removeClass('selected');

    // If current portal is into bookmarks: select bookmark portal from portals list and select the star
    if(localStorage[window.plugin.bookmarks.KEY_STORAGE].search(guid) != -1) {
      var bkmrkData = window.plugin.bookmarks.findByGuid(guid);
      if(bkmrkData) {
        $('.bkmrk#'+bkmrkData['id_bookmark']+' a.bookmarksLink').addClass('selected');
        $('.bkmrksStar').addClass('favorite');
      }
    }
  }

  // Switch the status of the star
  window.plugin.bookmarks.switchStarPortal = function(guid) {
    if(guid == undefined) guid = window.selectedPortal;

    // If portal is saved in bookmarks: Remove this bookmark
    var bkmrkData = window.plugin.bookmarks.findByGuid(guid);
    if(bkmrkData) {
      var list = window.plugin.bookmarks.bkmrksObj['portals'];
      delete list[bkmrkData['id_folder']]['bkmrk'][bkmrkData['id_bookmark']];
      $('.bkmrk#'+bkmrkData['id_bookmark']+'').remove();

      window.plugin.bookmarks.saveStorage();
      window.plugin.bookmarks.updateStarPortal();

      window.runHooks('pluginBkmrksEdit', {"target": "portal", "action": "remove", "folder": bkmrkData['id_folder'], "id": bkmrkData['id_bookmark'], "guid":guid});
      console.log('BOOKMARKS: removed portal ('+bkmrkData['id_bookmark']+' situated in '+bkmrkData['id_folder']+' folder)');
    }
    // If portal isn't saved in bookmarks: Add this bookmark
    else{
      // Get portal name and coordinates
      var p = window.portals[guid];
      var ll = p.getLatLng();
      plugin.bookmarks.addPortalBookmark(guid, ll.lat+','+ll.lng, p.options.data.title);
    }
  }

  plugin.bookmarks.addPortalBookmark = function(guid, latlng, label) {
    var ID = window.plugin.bookmarks.generateID();

    // Add bookmark in the localStorage
    window.plugin.bookmarks.bkmrksObj['portals'][window.plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"guid":guid,"latlng":latlng,"label":label};

    window.plugin.bookmarks.saveStorage();
    window.plugin.bookmarks.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', {"target": "portal", "action": "add", "id": ID, "guid": guid});
    console.log('BOOKMARKS: added portal '+ID);
  }

  // Add BOOKMARK/FOLDER
  window.plugin.bookmarks.addElement = function(elem, type) {
    var ID = window.plugin.bookmarks.generateID();
    var typeList = $(elem).parent().parent('div').attr('id');

    // Get the label | Convert some characters | Set the input (empty)
    var input = '#'+typeList+' .addForm input';
    var label = $(input).val();
    label = window.plugin.bookmarks.escapeHtml(label);
    $(input).val('');

    // Add a map
    if(type === 'map') {
      // Get the coordinates and zoom
      var c = map.getCenter();
      var lat = Math.round(c.lat*1E6)/1E6;
      var lng = Math.round(c.lng*1E6)/1E6;
      var latlng = lat+','+lng;
      var zoom = parseInt(map.getZoom());
      // Add bookmark in the localStorage
      window.plugin.bookmarks.bkmrksObj['maps'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"label":label,"latlng":latlng,"z":zoom};
    }
    else{
      if(label === '') { label = 'Folder'; }
      var short_type = typeList.replace('bkmrk_', '');
      // Add new folder in the localStorage
      window.plugin.bookmarks.bkmrksObj[short_type][ID] = {"label":label,"state":1,"bkmrk":{}};
    }
    window.plugin.bookmarks.saveStorage();
    window.plugin.bookmarks.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', {"target": type, "action": "add", "id": ID});
    console.log('BOOKMARKS: added '+type+' '+ID);
  }

  // Remove BOOKMARK/FOLDER
  window.plugin.bookmarks.removeElement = function(elem, type) {
    if(type === 'maps' || type === 'portals') {
      var typeList = $(elem).parent().parent().parent().parent().parent('div').attr('id');
      var ID = $(elem).parent('li').attr('id');
      var IDfold = $(elem).parent().parent().parent('li').attr('id');
      var guid = window.plugin.bookmarks.bkmrksObj[typeList.replace('bkmrk_', '')][IDfold]['bkmrk'][ID].guid;

      delete window.plugin.bookmarks.bkmrksObj[typeList.replace('bkmrk_', '')][IDfold]['bkmrk'][ID];
      $(elem).parent('li').remove();

      if(type === 'portals') {
        var list = window.plugin.bookmarks.bkmrksObj['portals'];

        window.plugin.bookmarks.updateStarPortal();
        window.plugin.bookmarks.saveStorage();

        window.runHooks('pluginBkmrksEdit', {"target": "portal", "action": "remove", "folder": IDfold, "id": ID, "guid": guid});
        console.log('BOOKMARKS: removed portal ('+ID+' situated in '+IDfold+' folder)');
      } else {
        window.plugin.bookmarks.saveStorage();
        window.runHooks('pluginBkmrksEdit', {"target": "map", "action": "remove", "id": ID});
        console.log('BOOKMARKS: removed map '+ID);
      }
    }
    else if(type === 'folder') {
      var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
      var ID = $(elem).parent().parent('li').attr('id');

      delete plugin.bookmarks.bkmrksObj[typeList.replace('bkmrk_', '')][ID];
      $(elem).parent().parent('li').remove();
      window.plugin.bookmarks.saveStorage();
      window.plugin.bookmarks.updateStarPortal();
      window.runHooks('pluginBkmrksEdit', {"target": "folder", "action": "remove", "id": ID});
      console.log('BOOKMARKS: removed folder '+ID);
    }
  }

  window.plugin.bookmarks.deleteMode = function() {
    $('#bookmarksBox').removeClass('moveMode').toggleClass('deleteMode');
  }

  window.plugin.bookmarks.moveMode = function() {
    $('#bookmarksBox').removeClass('deleteMode').toggleClass('moveMode');
  }

  window.plugin.bookmarks.mobileSortIDb = '';
  window.plugin.bookmarks.mobileSortIDf = '';
  window.plugin.bookmarks.dialogMobileSort = function(type, elem){
    window.plugin.bookmarks.mobileSortIDb = $(elem).parent('li.bkmrk').attr('id');
    window.plugin.bookmarks.mobileSortIDf = $(elem).parent('li.bkmrk').parent('ul').parent('li.bookmarkFolder').attr('id');

    if(type === 'maps'){ type = 1; }
    else if(type === 'portals'){ type = 2; }

    dialog({
      html: window.plugin.bookmarks.dialogLoadListFolders('bookmarksDialogMobileSort', 'window.plugin.bookmarks.mobileSort', true, type),
      dialogClass: 'ui-dialog-bkmrksSet-copy',
      title: 'Bookmarks - Move Bookmark'
    });
  }

  window.plugin.bookmarks.mobileSort = function(elem){
    var type = $(elem).data('type');
    var idBkmrk = window.plugin.bookmarks.mobileSortIDb;
    var newFold = $(elem).data('id');
    var oldFold = window.plugin.bookmarks.mobileSortIDf;

    var Bkmrk = window.plugin.bookmarks.bkmrksObj[type][oldFold].bkmrk[idBkmrk];

    delete window.plugin.bookmarks.bkmrksObj[type][oldFold].bkmrk[idBkmrk];

    window.plugin.bookmarks.bkmrksObj[type][newFold].bkmrk[idBkmrk] = Bkmrk;

    window.plugin.bookmarks.saveStorage();
    window.plugin.bookmarks.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', {"target": "bookmarks", "action": "sort"});
    window.plugin.bookmarks.mobileSortIDf = newFold;
    console.log('Move Bookmarks '+type+' ID:'+idBkmrk+' from folder ID:'+oldFold+' to folder ID:'+newFold);
  }

  window.plugin.bookmarks.onSearch = function(query) {
    var term = query.term.toLowerCase();

    $.each(plugin.bookmarks.bkmrksObj.maps, function(id, folder) {
      $.each(folder.bkmrk, function(id, bookmark) {
        if(bookmark.label.toLowerCase().indexOf(term) === -1) return;

        query.addResult({
          title: escapeHtmlSpecialChars(bookmark.label),
          description: 'Map in folder "' + escapeHtmlSpecialChars(folder.label) + '"',
          icon: '@@INCLUDEIMAGE:images/icon-bookmark-map.png@@',
          position: L.latLng(bookmark.latlng.split(",")),
          zoom: bookmark.z,
          onSelected: window.plugin.bookmarks.onSearchResultSelected,
        });
      });
    });

    $.each(plugin.bookmarks.bkmrksObj.portals, function(id, folder) {
      $.each(folder.bkmrk, function(id, bookmark) {
        if(bookmark.label.toLowerCase().indexOf(term) === -1) return;

        query.addResult({
          title: escapeHtmlSpecialChars(bookmark.label),
          description: 'Bookmark in folder "' + escapeHtmlSpecialChars(folder.label) + '"',
          icon: '@@INCLUDEIMAGE:images/icon-bookmark.png@@',
          position: L.latLng(bookmark.latlng.split(",")),
          guid: bookmark.guid,
          onSelected: window.plugin.bookmarks.onSearchResultSelected,
        });
      });
    });
  };

  window.plugin.bookmarks.onSearchResultSelected = function(result, event) {
    if(result.guid) { // portal
      var guid = result.guid;
      if(event.type == 'dblclick')
        zoomToAndShowPortal(guid, result.position);
      else if(window.portals[guid])
        renderPortalDetails(guid);
      else
        window.selectPortalByLatLng(result.position);
    } else if(result.zoom) { // map
      map.setView(result.position, result.zoom);
    }
    return true; // prevent default behavior
  };

/***************************************************************************************************************************************************************/

  // Saved the new sort of the folders (in the localStorage)
  window.plugin.bookmarks.sortFolder = function(typeList) {
    var keyType = typeList.replace('bkmrk_', '');

    var newArr = {};
    $('#'+typeList+' li.bookmarkFolder').each(function() {
        var idFold = $(this).attr('id');
      newArr[idFold] = window.plugin.bookmarks.bkmrksObj[keyType][idFold];
    });
    window.plugin.bookmarks.bkmrksObj[keyType] = newArr;
    window.plugin.bookmarks.saveStorage();

    window.runHooks('pluginBkmrksEdit', {"target": "folder", "action": "sort"});
    console.log('BOOKMARKS: sorted folder');
  }

  // Saved the new sort of the bookmarks (in the localStorage)
  window.plugin.bookmarks.sortBookmark = function(typeList) {
    var keyType = typeList.replace('bkmrk_', '');
    var list = window.plugin.bookmarks.bkmrksObj[keyType];
    var newArr = {};

    $('#'+typeList+' li.bookmarkFolder').each(function() {
      var idFold = $(this).attr('id');
      newArr[idFold] = window.plugin.bookmarks.bkmrksObj[keyType][idFold];
      newArr[idFold].bkmrk = {};
    });

    $('#'+typeList+' li.bkmrk').each(function() {
      window.plugin.bookmarks.loadStorage();

      var idFold = $(this).parent().parent('li').attr('id');
      var id = $(this).attr('id');

      var list = window.plugin.bookmarks.bkmrksObj[keyType];
      for(var idFoldersOrigin in list) {
        for(var idBkmrk in list[idFoldersOrigin]['bkmrk']) {
          if(idBkmrk == id) {
            newArr[idFold].bkmrk[id] = window.plugin.bookmarks.bkmrksObj[keyType][idFoldersOrigin].bkmrk[id];
          }
        }
      }
    });
    window.plugin.bookmarks.bkmrksObj[keyType] = newArr;
    window.plugin.bookmarks.saveStorage();
    window.runHooks('pluginBkmrksEdit', {"target": "bookmarks", "action": "sort"});
    console.log('BOOKMARKS: sorted bookmark (portal/map)');
  }

  window.plugin.bookmarks.jquerySortableScript = function() {
    $(".bookmarkList > ul").sortable({
      items:"li.bookmarkFolder:not(.othersBookmarks)",
      handle:".bookmarksAnchor",
      placeholder:"sortable-placeholder",
      helper:'clone', // fix accidental click in firefox
      forcePlaceholderSize:true,
      update:function(event, ui) {
        var typeList = $('#'+ui.item.context.id).parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortFolder(typeList);
      }
    });

    $(".bookmarkList ul li ul").sortable({
      items:"li.bkmrk",
      connectWith:".bookmarkList ul ul",
      handle:".bookmarksLink",
      placeholder:"sortable-placeholder",
      helper:'clone', // fix accidental click in firefox
      forcePlaceholderSize:true,
      update:function(event, ui) {
        var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortBookmark(typeList);
      }
    });
  }

/***************************************************************************************************************************************************************/
/** OPTIONS ****************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  // Manual import, export and reset data
  window.plugin.bookmarks.manualOpt = function() {
    dialog({
      html: plugin.bookmarks.htmlSetbox,
      dialogClass: 'ui-dialog-bkmrksSet',
      title: 'Bookmarks Options'
    });

    window.runHooks('pluginBkmrksOpenOpt');
  }

  window.plugin.bookmarks.optAlert = function(message) {
      $('.ui-dialog-bkmrksSet .ui-dialog-buttonset').prepend('<p class="bkrmks-alert" style="float:left;margin-top:4px;">'+message+'</p>');
      $('.bkrmks-alert').delay(2500).fadeOut();
  }

  window.plugin.bookmarks.optCopy = function() {
    if(typeof android !== 'undefined' && android && android.shareString) {
      return android.shareString(localStorage[window.plugin.bookmarks.KEY_STORAGE]);
    } else {
      dialog({
        html: '<p><a onclick="$(\'.ui-dialog-bkmrksSet-copy textarea\').select();">Select all</a> and press CTRL+C to copy it.</p><textarea readonly>'+localStorage[window.plugin.bookmarks.KEY_STORAGE]+'</textarea>',
        dialogClass: 'ui-dialog-bkmrksSet-copy',
        title: 'Bookmarks Export'
      });
    }
  }

  window.plugin.bookmarks.optExport = function() {
    if(typeof android !== 'undefined' && android && android.saveFile) {
      android.saveFile("IITC-bookmarks.json", "application/json", localStorage[window.plugin.bookmarks.KEY_STORAGE]);
    }
  }

  window.plugin.bookmarks.optPaste = function() {
    var promptAction = prompt('Press CTRL+V to paste it.', '');
    if(promptAction !== null && promptAction !== '') {
      try {
        JSON.parse(promptAction); // try to parse JSON first
        localStorage[window.plugin.bookmarks.KEY_STORAGE] = promptAction;
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "import"});
        console.log('BOOKMARKS: reset and imported bookmarks');
        window.plugin.bookmarks.optAlert('Successful. ');
      } catch(e) {
        console.warn('BOOKMARKS: failed to import data: '+e);
        window.plugin.bookmarks.optAlert('<span style="color: #f88">Import failed </span>');
      }
    }
  }

  window.plugin.bookmarks.optImport = function() {
    if (window.requestFile === undefined) return;
    window.requestFile(function(filename, content) {
      try {
        JSON.parse(content); // try to parse JSON first
        localStorage[window.plugin.bookmarks.KEY_STORAGE] = content;
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "import"});
        console.log('BOOKMARKS: reset and imported bookmarks');
        window.plugin.bookmarks.optAlert('Successful. ');
      } catch(e) {
        console.warn('BOOKMARKS: failed to import data: '+e);
        window.plugin.bookmarks.optAlert('<span style="color: #f88">Import failed </span>');
      }
    });
  }

  window.plugin.bookmarks.optReset = function() {
    var promptAction = confirm('All bookmarks will be deleted. Are you sure?', '');
    if(promptAction) {
      delete localStorage[window.plugin.bookmarks.KEY_STORAGE];
      window.plugin.bookmarks.createStorage();
      window.plugin.bookmarks.loadStorage();
      window.plugin.bookmarks.refreshBkmrks();
      window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "reset"});
      console.log('BOOKMARKS: reset all bookmarks');
      window.plugin.bookmarks.optAlert('Successful. ');
    }
  }

  window.plugin.bookmarks.optBox = function(command) {
    if(!window.plugin.bookmarks.isAndroid()) {
      switch(command) {
        case 'save':
          var boxX = parseInt($('#bookmarksBox').css('top'));
          var boxY = parseInt($('#bookmarksBox').css('left'));
          window.plugin.bookmarks.statusBox.pos = {x:boxX, y:boxY};
          window.plugin.bookmarks.saveStorageBox();
          window.plugin.bookmarks.optAlert('Position acquired. ');
          break;
        case 'reset':
          $('#bookmarksBox').css({'top':100, 'left':100});
          window.plugin.bookmarks.optBox('save');
          break;
      }
    } else {
      window.plugin.bookmarks.optAlert('Only IITC desktop. ');
    }
  }

  window.plugin.bookmarks.dialogLoadListFolders = function(idBox, clickAction, showOthersF, scanType/*0 = maps&portals; 1 = maps; 2 = portals*/) {
    var list = JSON.parse(localStorage['plugin-bookmarks']);
    var listHTML = '';
    var foldHTML = '';
    var elemGenericFolder = '';

    // For each type and folder
    for(var type in list){
      if(scanType === 0 || (scanType === 1 && type === 'maps') || (scanType === 2 && type === 'portals')){
        listHTML += '<h3>'+type+':</h3>';

        for(var idFolders in list[type]) {
          var label = list[type][idFolders]['label'];

          // Create a folder
          foldHTML = '<div class="bookmarkFolder" id="'+idFolders+'" data-type="'+type+'" data-id="'+idFolders+'" onclick="'+clickAction+'(this)";return false;">'+label+'</div>';

          if(idFolders !== window.plugin.bookmarks.KEY_OTHER_BKMRK) {
            listHTML += foldHTML;
          } else {
            if(showOthersF === true){
              elemGenericFolder = foldHTML;
            }
          }
        }
      }
      listHTML += elemGenericFolder;
      elemGenericFolder = '';
    }

    // Append all folders
    var r = '<div class="bookmarksDialog" id="'+idBox+'">'
      + listHTML
      + '</div>';

    return r;
  }

  window.plugin.bookmarks.renameFolder = function(elem){
    var type = $(elem).data('type');
    var idFold = $(elem).data('id');

    var promptAction = prompt('Insert a new name.', '');
    if(promptAction !== null && promptAction !== '') {
      try {
        var newName = window.plugin.bookmarks.escapeHtml(promptAction);

        window.plugin.bookmarks.bkmrksObj[type][idFold].label = newName;
        $('#bookmarksDialogRenameF #'+idFold).text(newName);
        window.plugin.bookmarks.saveStorage();
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "import"});

        console.log('BOOKMARKS: renamed bookmarks folder');
        window.plugin.bookmarks.optAlert('Successful. ');
      } catch(e) {
        console.warn('BOOKMARKS: failed to rename folder: '+e);
        window.plugin.bookmarks.optAlert('<span style="color: #f88">Rename failed </span>');
        return;
      }
    }
  }

  window.plugin.bookmarks.optRenameF = function() {
    dialog({
      html: window.plugin.bookmarks.dialogLoadListFolders('bookmarksDialogRenameF', 'window.plugin.bookmarks.renameFolder', false, 0),
      dialogClass: 'ui-dialog-bkmrksSet-copy',
      title: 'Bookmarks Rename Folder'
    });
  }

/***************************************************************************************************************************************************************/
/** AUTO DRAW **************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  window.plugin.bookmarks.dialogDrawer = function() {
    dialog({
      html:window.plugin.bookmarks.dialogLoadList,
      dialogClass:'ui-dialog-autodrawer',
      title:'Bookmarks - Auto Draw',
      buttons:{
        'DRAW': function() {
          window.plugin.bookmarks.draw(0);
        },
        'DRAW&VIEW': function() {
          window.plugin.bookmarks.draw(1);
        }
      }
    });
    window.plugin.bookmarks.autoDrawOnSelect();
  }

  window.plugin.bookmarks.draw = function(view) {
    var latlngs = [];
    var uuu = $('#bkmrksAutoDrawer a.bkmrk.selected').each(function(i) {
      var tt = $(this).data('latlng');
      latlngs[i] = tt;
    });

    if(latlngs.length >= 2 && latlngs.length <= 3) {
      // TODO: add an API to draw-tools rather than assuming things about its internals

      var layer, layerType;
      if(latlngs.length == 2) {
        layer = L.geodesicPolyline(latlngs, window.plugin.drawTools.lineOptions);
        layerType = 'polyline';
      } else {
        layer = L.geodesicPolygon(latlngs, window.plugin.drawTools.polygonOptions);
        layerType = 'polygon';
      }

      map.fire('draw:created', {
        layer: layer,
        layerType: layerType
      });

      if($('#bkmrkClearSelection').prop('checked'))
        $('#bkmrksAutoDrawer a.bkmrk.selected').removeClass('selected');

      if(window.plugin.bookmarks.isSmart) {
        window.show('map');
      }

      // Shown the layer if it is hidden
      if(!map.hasLayer(window.plugin.drawTools.drawnItems)) {
        map.addLayer(window.plugin.drawTools.drawnItems);
      }

      if(view) {
        map.fitBounds(layer.getBounds());
      }
    }
  }

  window.plugin.bookmarks.autoDrawOnSelect = function() {
    var latlngs = [];
    var uuu = $('#bkmrksAutoDrawer a.bkmrk.selected').each(function(i) {
      var tt = $(this).data('latlng');
      latlngs[i] = tt;
    });

    var text = "You must select 2 or 3 portals!";
    var color = "red";

    function formatDistance(distance) {
      var text = digits(distance > 10000 ? (distance/1000).toFixed(2) + "km" : (Math.round(distance) + "m"));
      return distance >= 200000
        ? '<em title="Long distance link" class="help longdistance">'+text+'</em>'
        : text;
    }

    if(latlngs.length == 2) {
      var distance = L.latLng(latlngs[0]).distanceTo(latlngs[1]);
      text = 'Distance between portals: ' + formatDistance(distance);
      color = "";
    } else if(latlngs.length == 3) {
      var longdistance = false;
      var distances = latlngs.map(function(ll1, i, latlngs) {
        var ll2 = latlngs[(i+1)%3];
        return formatDistance(L.latLng(ll1).distanceTo(ll2));
      });
      text = 'Distances: ' + distances.join(", ");
      color = "";
    }

    $('#bkmrksAutoDrawer p')
      .html(text)
      .css("color", color);
  }

  window.plugin.bookmarks.dialogLoadList = function() {
    var r = 'The "<a href="http://iitc.jonatkins.com/?page=desktop#plugin-draw-tools" target="_BLANK"><strong>Draw Tools</strong></a>" plugin is required.</span>';

    if(!window.plugin.bookmarks || !window.plugin.drawTools) {
      $('.ui-dialog-autodrawer .ui-dialog-buttonset .ui-button:not(:first)').hide();
    }
    else{
      var portalsList = JSON.parse(localStorage['plugin-bookmarks']);
      var element = '';
      var elementTemp = '';
      var elemGenericFolder = '';

      // For each folder
      var list = portalsList.portals;
      for(var idFolders in list) {
        var folders = list[idFolders];

        // Create a label and a anchor for the sortable
        var folderLabel = '<a class="folderLabel" onclick="$(this).siblings(\'div\').toggle();return false;">'+folders['label']+'</a>';

        // Create a folder
        elementTemp = '<div class="bookmarkFolder" id="'+idFolders+'">'+folderLabel+'<div>';

        // For each bookmark
        var fold = folders['bkmrk'];
        for(var idBkmrk in fold) {
          var bkmrk = fold[idBkmrk];
          var label = bkmrk['label'];
          var latlng = bkmrk['latlng'];

          // Create the bookmark
          elementTemp += '<a class="bkmrk" id="'+idBkmrk+'" onclick="$(this).toggleClass(\'selected\');return false" data-latlng="['+latlng+']">'+label+'</a>';
        }
        elementTemp += '</div></div>';

        if(idFolders !== window.plugin.bookmarks.KEY_OTHER_BKMRK) {
          element += elementTemp;
        } else {
          elemGenericFolder += elementTemp;
        }
      }
      element += elemGenericFolder;

      // Append all folders and bookmarks
      r = '<div id="bkmrksAutoDrawer">'
        + '<label style="margin-bottom: 9px; display: block;">'
        + '<input style="vertical-align: middle;" type="checkbox" id="bkmrkClearSelection" checked>'
        + ' Clear selection after drawing</label>'
        + '<p style="margin-bottom:9px;color:red">You must select 2 or 3 portals!</p>'
        + '<div onclick="window.plugin.bookmarks.autoDrawOnSelect();return false;">'
        + element
        + '</div>'
        + '</div>';
    }
    return r;
  }

/***************************************************************************************************************************************************************/
/** SYNC *******************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  // Delay the syncing to group a few updates in a single request
  window.plugin.bookmarks.delaySync = function() {
    if(!window.plugin.bookmarks.enableSync) return;
    clearTimeout(plugin.bookmarks.delaySync.timer);
    window.plugin.bookmarks.delaySync.timer = setTimeout(function() {
        window.plugin.bookmarks.delaySync.timer = null;
        window.plugin.bookmarks.syncNow();
      }, window.plugin.bookmarks.SYNC_DELAY);
  }

  // Store the updateQueue in updatingQueue and upload
  window.plugin.bookmarks.syncNow = function() {
    if(!window.plugin.bookmarks.enableSync) return;
    $.extend(window.plugin.bookmarks.updatingQueue, window.plugin.bookmarks.updateQueue);
    window.plugin.bookmarks.updateQueue = {};
    window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATING_QUEUE);
    window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATE_QUEUE);

    window.plugin.sync.updateMap('bookmarks', window.plugin.bookmarks.KEY.field, Object.keys(window.plugin.bookmarks.updatingQueue));
  }

  // Call after IITC and all plugin loaded
  window.plugin.bookmarks.registerFieldForSyncing = function() {
    if(!window.plugin.sync) return;
    window.plugin.sync.registerMapForSync('bookmarks', window.plugin.bookmarks.KEY.field, window.plugin.bookmarks.syncCallback, window.plugin.bookmarks.syncInitialed);
  }

  // Call after local or remote change uploaded
  window.plugin.bookmarks.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
    if(fieldName === window.plugin.bookmarks.KEY.field) {
      window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.KEY);
      // All data is replaced if other client update the data during this client offline,
      if(fullUpdated) {
        window.plugin.bookmarks.refreshBkmrks();
        return;
      }

      if(!e) return;
      if(e.isLocal) {
        // Update pushed successfully, remove it from updatingQueue
        delete window.plugin.bookmarks.updatingQueue[e.property];
      } else {
        // Remote update
        delete window.plugin.bookmarks.updateQueue[e.property];
        window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATE_QUEUE);
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksSyncEnd', {"target": "all", "action": "sync"});
        console.log('BOOKMARKS: synchronized all');
      }
    }
  }

  // syncing of the field is initialed, upload all queued update
  window.plugin.bookmarks.syncInitialed = function(pluginName, fieldName) {
    if(fieldName === window.plugin.bookmarks.KEY.field) {
      window.plugin.bookmarks.enableSync = true;
      if(Object.keys(window.plugin.bookmarks.updateQueue).length > 0) {
        window.plugin.bookmarks.delaySync();
      }
    }
  }

  window.plugin.bookmarks.storeLocal = function(mapping) {
    if(typeof(window.plugin.bookmarks[mapping.field]) !== 'undefined' && window.plugin.bookmarks[mapping.field] !== null) {
      localStorage[mapping.key] = JSON.stringify(window.plugin.bookmarks[mapping.field]);
    } else {
      localStorage.removeItem(mapping.key);
    }
  }

  window.plugin.bookmarks.loadLocal = function(mapping) {
    var objectJSON = localStorage[mapping.key];
    if(!objectJSON) return;
    window.plugin.bookmarks[mapping.field] = mapping.convertFunc
                            ? mapping.convertFunc(JSON.parse(objectJSON))
                            : JSON.parse(objectJSON);
  }

  window.plugin.bookmarks.syncBkmrks = function() {
    window.plugin.bookmarks.loadLocal(window.plugin.bookmarks.KEY);

    window.plugin.bookmarks.updateQueue = window.plugin.bookmarks.bkmrksObj;
    window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATE_QUEUE);

    window.plugin.bookmarks.delaySync();
  }

/***************************************************************************************************************************************************************/
/** HIGHLIGHTER ************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  window.plugin.bookmarks.highlight = function(data) {
    var guid = data.portal.options.ent[0];
    if(window.plugin.bookmarks.findByGuid(guid)) {
      data.portal.setStyle({fillColor:'red'});
    }
  }

  window.plugin.bookmarks.highlightRefresh = function(data) {
    if(_current_highlighter === 'Bookmarked Portals') {
      if(data.action === 'sync' || data.target === 'portal' || (data.target === 'folder' && data.action === 'remove') || (data.target === 'all' && data.action === 'import') || (data.target === 'all' && data.action === 'reset')) {
        window.resetHighlightedPortals();
      }
    }
  }

/***************************************************************************************************************************************************************/
/** BOOKMARKED PORTALS LAYER ***********************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  window.plugin.bookmarks.addAllStars = function() {
    var list = window.plugin.bookmarks.bkmrksObj.portals;

    for(var idFolders in list) {
      for(var idBkmrks in list[idFolders]['bkmrk']) {
        var latlng = list[idFolders]['bkmrk'][idBkmrks].latlng.split(",");
        var guid = list[idFolders]['bkmrk'][idBkmrks].guid;
        var lbl = list[idFolders]['bkmrk'][idBkmrks].label;
        window.plugin.bookmarks.addStar(guid, latlng, lbl);
      }
    }
  }

  window.plugin.bookmarks.resetAllStars = function() {
    for(guid in window.plugin.bookmarks.starLayers) {
      var starInLayer = window.plugin.bookmarks.starLayers[guid];
      window.plugin.bookmarks.starLayerGroup.removeLayer(starInLayer);
      delete window.plugin.bookmarks.starLayers[guid];
    }
    window.plugin.bookmarks.addAllStars();
  }

  window.plugin.bookmarks.addStar = function(guid, latlng, lbl) {
    var star = L.marker(latlng, {
      title: lbl,
      icon: L.icon({
        iconUrl: '@@INCLUDEIMAGE:images/marker-star.png@@',
        iconAnchor: [15,40],
        iconSize: [30,40]
      })
    });
    window.registerMarkerForOMS(star);
    star.on('spiderfiedclick', function() { renderPortalDetails(guid); });

    window.plugin.bookmarks.starLayers[guid] = star;
    star.addTo(window.plugin.bookmarks.starLayerGroup);
  }

  window.plugin.bookmarks.editStar = function(data) {
    if(data.target === 'portal') {
      if(data.action === 'add') {
        var guid = data.guid;
        var latlng = window.portals[guid].getLatLng();
        var lbl = window.portals[guid].options.data.title;
        var starInLayer = window.plugin.bookmarks.starLayers[data.guid];
        window.plugin.bookmarks.addStar(guid, latlng, lbl);
      }
      else if(data.action === 'remove') {
        var starInLayer = window.plugin.bookmarks.starLayers[data.guid];
        window.plugin.bookmarks.starLayerGroup.removeLayer(starInLayer);
        delete window.plugin.bookmarks.starLayers[data.guid];
      }
    }
    else if((data.target === 'all' && (data.action === 'import' || data.action === 'reset')) || (data.target === 'folder' && data.action === 'remove')) {
      window.plugin.bookmarks.resetAllStars();
    }
  }

/***************************************************************************************************************************************************************/

  window.plugin.bookmarks.setupCSS = function() {
    $('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/bookmarks-by-zaso.css@@').appendTo('head');
  }

  window.plugin.bookmarks.setupPortalsList = function() {
    function onBookmarkChanged(data) {
      console.log(data, data.target, data.guid);

      if(data.target == "portal" && data.guid) {
        if(plugin.bookmarks.findByGuid(data.guid))
          $('[data-list-bookmark="'+data.guid+'"]').addClass("favorite");
        else
          $('[data-list-bookmark="'+data.guid+'"]').removeClass("favorite");
      } else {
        $('[data-list-bookmark]').each(function(i, element) {
          var guid = element.getAttribute("data-list-bookmark");
          if(plugin.bookmarks.findByGuid(guid))
            $(element).addClass("favorite");
          else
            $(element).removeClass("favorite");
        });
      }
    }

    window.addHook('pluginBkmrksEdit', onBookmarkChanged);
    window.addHook('pluginBkmrksSyncEnd', onBookmarkChanged);

    window.plugin.portalslist.fields.unshift({ // insert at first column
      title: "",
      value: function(portal) { return portal.options.guid; }, // we store the guid, but implement a custom comparator so the list does sort properly without closing and reopening the dialog
      sort: function(guidA, guidB) {
        var infoA = plugin.bookmarks.findByGuid(guidA);
        var infoB = plugin.bookmarks.findByGuid(guidB);
        if(infoA && !infoB) return 1;
        if(infoB && !infoA) return -1;
        return 0;
      },
      format: function(cell, portal, guid) {
        $(cell)
          .addClass("portal-list-bookmark")
          .attr("data-list-bookmark", guid);

        // for some reason, jQuery removes event listeners when the list is sorted. Therefore we use DOM's addEventListener
        $('<span>').appendTo(cell)[0].addEventListener("click", function() {
          if(window.plugin.bookmarks.findByGuid(guid)) {
            window.plugin.bookmarks.switchStarPortal(guid);
          } else {
            var ll = portal.getLatLng();
            plugin.bookmarks.addPortalBookmark(guid, ll.lat+','+ll.lng, portal.options.data.title);
          }
        }, false);

        if(plugin.bookmarks.findByGuid(guid))
          cell.className += " favorite";
      },
    });
  }

  window.plugin.bookmarks.setupContent = function() {
    plugin.bookmarks.htmlBoxTrigger = '<a id="bkmrksTrigger" class="open" onclick="window.plugin.bookmarks.switchStatusBkmrksBox(\'switch\');return false;" accesskey="v" title="[v]">[-] Bookmarks</a>';
    plugin.bookmarks.htmlBkmrksBox = '<div id="bookmarksBox">'
                          +'<div id="topBar">'
                            +'<a id="bookmarksMin" class="btn" onclick="window.plugin.bookmarks.switchStatusBkmrksBox(0);return false;" title="Minimize">-</a>'
                            +'<div class="handle">...</div>'
                            +'<a id="bookmarksDel" class="btn" onclick="window.plugin.bookmarks.deleteMode();return false;" title="Show/Hide \'X\' button">Show/Hide "X" button</a>'
                          +'</div>'
                          +'<div id="bookmarksTypeBar">'
                            +'<h5 class="bkmrk_maps current" onclick="window.plugin.bookmarks.switchPageBkmrksBox(this, 0);return false">Maps</h5>'
                            +'<h5 class="bkmrk_portals" onclick="window.plugin.bookmarks.switchPageBkmrksBox(this, 1);return false">Portals</h5>'
                            +'<div style="clear:both !important;"></div>'
                          +'</div>'
                          +'<div id="bkmrk_maps" class="bookmarkList current">'
                            +'<div class="addForm">'
                              +'<input placeholder="Insert label" />'
                              +'<a class="newMap" onclick="window.plugin.bookmarks.addElement(this, \'map\');return false;">+ Map</a>'
                              +'<a class="newFolder" onclick="window.plugin.bookmarks.addElement(this, \'folder\');return false;">+ Folder</a>'
                            +'</div>'
                          +'</div>'
                          +'<div id="bkmrk_portals" class="bookmarkList">'
                            +'<div class="addForm">'
                              +'<input placeholder="Insert label" />'
                              +'<a class="newFolder" onclick="window.plugin.bookmarks.addElement(this, \'folder\');return false;">+ Folder</a>'
                            +'</div>'
                          +'</div>'
                          +'<div style="border-bottom-width:1px;"></div>'
                        +'</div>';

    plugin.bookmarks.htmlDisabledMessage = '<div title="Your browser do not support localStorage">Plugin Bookmarks disabled*.</div>';
    plugin.bookmarks.htmlStar = '<a class="bkmrksStar" accesskey="b" onclick="window.plugin.bookmarks.switchStarPortal();return false;" title="Save this portal in your bookmarks [b]"><span></span></a>';
    plugin.bookmarks.htmlCalldrawBox = '<a onclick="window.plugin.bookmarks.dialogDrawer();return false;" accesskey="q" title="Draw lines/triangles between bookmarked portals [q]">Auto draw</a>';
    plugin.bookmarks.htmlCallSetBox = '<a onclick="window.plugin.bookmarks.manualOpt();return false;">Bookmarks Opt</a>';
    plugin.bookmarks.htmlMoveBtn = '<a id="bookmarksMove" class="btn" onclick="window.plugin.bookmarks.moveMode();return false;">Show/Hide "Move" button</a>'

    var actions = '';
    actions += '<a onclick="window.plugin.bookmarks.optReset();return false;">Reset bookmarks</a>';
    actions += '<a onclick="window.plugin.bookmarks.optCopy();return false;">Copy bookmarks</a>';
    actions += '<a onclick="window.plugin.bookmarks.optPaste();return false;">Paste bookmarks</a>';

    if(plugin.bookmarks.isAndroid()) {
      actions += '<a onclick="window.plugin.bookmarks.optImport();return false;">Import bookmarks</a>';
      actions += '<a onclick="window.plugin.bookmarks.optExport();return false;">Export bookmarks</a>';
    }
    actions += '<a onclick="window.plugin.bookmarks.optRenameF();return false;">Rename Folder</a>'
    if(!plugin.bookmarks.isAndroid()) {
      actions += '<a onclick="window.plugin.bookmarks.optBox(\'save\');return false;">Save box position</a>';
      actions += '<a onclick="window.plugin.bookmarks.optBox(\'reset\');return false;">Reset box position</a>';
    }
    plugin.bookmarks.htmlSetbox = '<div id="bkmrksSetbox">' + actions + '</div>';
  }

/***************************************************************************************************************************************************************/

  var setup = function() {
    window.plugin.bookmarks.isSmart = window.isSmartphone();

    // Fired when a bookmarks/folder is removed, added or sorted, also when a folder is opened/closed.
    if($.inArray('pluginBkmrksEdit', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBkmrksEdit'); }
    // Fired when the "Bookmarks Options" panel is opened (you can add new options);
    if($.inArray('pluginBkmrksOpenOpt', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBkmrksOpenOpt'); }
    // Fired when the sync is finished;
    if($.inArray('pluginBkmrksSyncEnd', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBkmrksSyncEnd'); }

    // If the storage not exists or is a old version
    window.plugin.bookmarks.createStorage();
    window.plugin.bookmarks.upgradeToNewStorage();

    // Load data from localStorage
    window.plugin.bookmarks.loadStorage();
    window.plugin.bookmarks.loadStorageBox();
    window.plugin.bookmarks.setupContent();
    window.plugin.bookmarks.setupCSS();

    if(!window.plugin.bookmarks.isSmart) {
      $('body').append(window.plugin.bookmarks.htmlBoxTrigger + window.plugin.bookmarks.htmlBkmrksBox);
      $('#bookmarksBox').draggable({ handle:'.handle', containment:'window' });
      $("#bookmarksBox #bookmarksMin , #bookmarksBox ul li, #bookmarksBox ul li a, #bookmarksBox ul li a span, #bookmarksBox h5, #bookmarksBox .addForm a").disableSelection();
      $('#bookmarksBox').css({'top':window.plugin.bookmarks.statusBox.pos.x, 'left':window.plugin.bookmarks.statusBox.pos.y});
    }else{
      $('body').append(window.plugin.bookmarks.htmlBkmrksBox);
      $('#bookmarksBox').css("display", "none").addClass("mobile");

      if(window.useAndroidPanes())
        android.addPane("plugin-bookmarks", "Bookmarks", "ic_action_star");
      window.addHook('paneChanged', window.plugin.bookmarks.onPaneChanged);
    }
    $('#toolbox').append(window.plugin.bookmarks.htmlCallSetBox+window.plugin.bookmarks.htmlCalldrawBox);

    if(window.plugin.bookmarks.isSmart) {
//      $('#bookmarksBox.mobile #topBar').prepend(window.plugin.bookmarks.htmlCallSetBox+window.plugin.bookmarks.htmlCalldrawBox); // wonk in progress
      $('#bookmarksBox.mobile #topBar').append(plugin.bookmarks.htmlMoveBtn);
    }

    window.plugin.bookmarks.loadList('maps');
    window.plugin.bookmarks.loadList('portals');
    window.plugin.bookmarks.jquerySortableScript();

    if(window.plugin.bookmarks.statusBox['show'] === 0) { window.plugin.bookmarks.switchStatusBkmrksBox(0); }
    if(window.plugin.bookmarks.statusBox['page'] === 1) { $('#bookmarksBox h5.bkmrk_portals').trigger('click'); }

    window.addHook('portalSelected', window.plugin.bookmarks.onPortalSelected);
    window.addHook('search', window.plugin.bookmarks.onSearch);

    // Sync
    window.addHook('pluginBkmrksEdit', window.plugin.bookmarks.syncBkmrks);
    window.addHook('iitcLoaded', window.plugin.bookmarks.registerFieldForSyncing);

    // Highlighter - bookmarked portals
    window.addHook('pluginBkmrksEdit', window.plugin.bookmarks.highlightRefresh);
    window.addHook('pluginBkmrksSyncEnd', window.plugin.bookmarks.highlightRefresh);
    window.addPortalHighlighter('Bookmarked Portals', window.plugin.bookmarks.highlight);

    // Layer - Bookmarked portals
    window.plugin.bookmarks.starLayerGroup = new L.LayerGroup();
    window.addLayerGroup('Bookmarked Portals', window.plugin.bookmarks.starLayerGroup, false);
    window.plugin.bookmarks.addAllStars();
    window.addHook('pluginBkmrksEdit', window.plugin.bookmarks.editStar);
    window.addHook('pluginBkmrksSyncEnd', window.plugin.bookmarks.resetAllStars);

    if(window.plugin.portalslist) {
      window.plugin.bookmarks.setupPortalsList();
    } else {
      setTimeout(function() {
        if(window.plugin.portalslist)
          window.plugin.bookmarks.setupPortalsList();
      }, 500);
    }
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
