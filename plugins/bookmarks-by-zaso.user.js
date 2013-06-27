// ==UserScript==
// @id             iitc-plugin-bookmarks@ZasoGD
// @name           IITC plugin: Bookmarks for maps and portals
// @category       Controls
// @version        0.1.75.@@DATETIMEVERSION@@
// @namespace      @@UPDATEURL@@
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Save your favorite Maps and Portals and move the intelmap view in a second. The ingress world just a click.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.bookmarks = function() {};
  window.plugin.bookmarks.bkmrk_portals = {};
  window.plugin.bookmarks.bkmrk_maps = {};
  window.plugin.bookmarks.status_box = {};

  window.plugin.bookmarks.KEY_OTHER_BKMRK = 'idOthers';
  window.plugin.bookmarks.LOCAL_STORAGE_status_box = 'plugin-bookmarks-status-box';
  window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals = 'plugin-bookmarks-portals-data';
  window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_maps = 'plugin-bookmarks-maps-data';

/*********************************************************************************************************************/

  //---------------------------------------------------------------------------------------
  // Append a 'star' flag in sidebar.
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.addToSidebar = function(){
    if(typeof(Storage) === "undefined"){ $('#portaldetails > .imgpreview').after(plugin.bookmarks.disabledMessage); return; }
    $('.bookmarkStar').remove();
    $('#portaldetails > h3.title').before(plugin.bookmarks.contentStarHTML);

    //Prepend a star to mobile status-bar
    if(window.isSmartphone()){
      $('#updatestatus').prepend(plugin.bookmarks.contentStarHTML);
      $('#updatestatus .bookmarkStar').attr('title', '');
    }
    plugin.bookmarks.updateStarPortal();
  }

  //---------------------------------------------------------------------------------------
  // Update the status of the star (when a portal is selected from the map/bookmarks-list)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.updateStarPortal = function(){
    window.plugin.bookmarks.loadBookmarks('bkmrk_portals');
    var guid = window.selectedPortal;

    $('.bookmarkStar').removeClass('favorite');
    $('.bkmrk a.bookmarksLink.selected').removeClass('selected');

    //If current portal is into bookmarks: select bookmark portal from portals list and select the star
    if(localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals].search(guid) != -1){
      $('.bookmarkStar').addClass('favorite');
      var list = plugin.bookmarks['bkmrk_portals'];
      for(var idFolders in list){
        for(var idBkmrk in list[idFolders]['bkmrk']){
          var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
          if(guid == portalGuid){
            $('.bkmrk#'+idBkmrk+' a.bookmarksLink').addClass('selected');
          }
         }
      }
    }
  }

  //---------------------------------------------------------------------------------------
  // Switch the status of the star
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.switchStarPortal = function(){
    var guid = window.selectedPortal;

    //If portal is saved in bookmarks: Remove this bookmark
    if($('.bookmarkStar').hasClass('favorite')){
      var list = plugin.bookmarks['bkmrk_portals'];

      for(var idFolders in list){
        for(var idBkmrk in list[idFolders]['bkmrk']){
          var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
          if(guid == portalGuid){
            delete list[idFolders]['bkmrk'][idBkmrk];
            $('.bkmrk#'+idBkmrk+'').remove();
          }
         }
      }
    }
    //If portal isn't saved in bookmarks: Add this bookmark
    else{
      // Get portanl name and coorditanes
      var d = window.portals[window.selectedPortal].options.details;
      var namePortal = d.portalV2.descriptiveText.TITLE;
      var lat = (d.locationE6.latE6)/1E6;
      var lng = (d.locationE6.lngE6)/1E6;
      var latlng = lat+','+lng;

      var ID = window.plugin.bookmarks.generateID();

      // Add bookmark in the localStorage
      plugin.bookmarks['bkmrk_portals'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"guid":guid,"latlng":latlng,"label":namePortal};
      //Append the new bookmark to the map list
      $('#bkmrk_portals li.othersBookmarks ul').append('<li class="bkmrk" id="'+ID+'"><a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a><a class="bookmarksLink selected" onclick="window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+namePortal+'</a></li>');
    }
    window.plugin.bookmarks.storeBookmarks('bkmrk_portals');
    window.plugin.bookmarks.updateStarPortal();
  }

  //---------------------------------------------------------------------------------------
  // Save a bookmark map
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.addBookmarkMap = function(elem){
    // Get the coordinates and zoom
    var c = map.getCenter();
    var lat = Math.round(c.lat*1E6)/1E6;
    var lng = Math.round(c.lng*1E6)/1E6;
    var latlng = lat+','+lng;
    var zoom = map.getZoom();

    var ID = window.plugin.bookmarks.generateID();

    //Get the label | Convert some characters | Set the input (empty)
    var nameMap = $(elem).siblings('input').val();
    nameMap = nameMap.replace(/\//g, '&#47;').replace(/\\/g, '&#92;').replace(/"/g, '&#34;').replace(/"/g, '&#39;');
    $(elem).siblings('input').val('');

    // Add bookmark in the localStorage
    plugin.bookmarks['bkmrk_maps'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"label":nameMap,"latlng":latlng,"z":parseInt(zoom)};
    plugin.bookmarks.storeBookmarks('bkmrk_maps');

    //Append the new bookmark to the map list
    if(nameMap == ''){ nameMap = latlng+' ['+zoom+']'; }
    $('#bkmrk_maps li.othersBookmarks ul').append('<li class="bkmrk" id="'+ID+'"><a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a><a class="bookmarksLink" onclick="map.setView(['+latlng+'], '+zoom+');return false;">'+nameMap+'</a></li>');
  }

/*********************************************************************************************************************/

  //---------------------------------------------------------------------------------------
  // Generate an ID for the bookmark (date time + random number)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.generateID = function(){
    var d = new Date();
    var ID = d.getTime()+(Math.floor(Math.random()*99)+1);
    var ID = 'id'+ID.toString();
    return ID;
  }

  //---------------------------------------------------------------------------------------
  // Format the string 
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.escapeHtml = function(text){
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  }

  //---------------------------------------------------------------------------------------
  // Switch the status folder to open/close (in the localStorage)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.openFolder = function(elem){
    var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
    var ID = $(elem).parent().parent('li').attr('id');
    var newFlag;
    var flag = plugin.bookmarks[typeList][ID]['state'];
    if(flag){ newFlag = 0; }
    else if(!flag){ newFlag = 1; }
    window.plugin.bookmarks[typeList][ID]['state'] = newFlag;
    window.plugin.bookmarks.storeBookmarks(typeList);
  }

  //---------------------------------------------------------------------------------------
  // Switch the status folder to open/close (in the localStorage)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.addFolder = function(typeList){
    var ID = window.plugin.bookmarks.generateID();
    var input = '#'+typeList+' .addForm input';
    //Get the label | Convert some characters | Set the input (empty)
    var nameFolder = $(input).val();
    nameFolder = window.plugin.bookmarks.escapeHtml(nameFolder);
    if(nameFolder == ''){ nameFolder = 'Folder'; }
    $(input).val('');

    // Add new folder in the localStorage
    plugin.bookmarks[typeList][ID] = {"label":nameFolder,"state":1,"bkmrk":{}};
    plugin.bookmarks.storeBookmarks(typeList);
    //Append the new folder to the list
    $('#'+typeList+' li.othersBookmarks').before('<li class="bookmarkFolder active" id="'+ID+'"><span class="folderLabel"><a class="bookmarksRemoveFrom">X</a><a class="bookmarksAnchor"><span></span>'+nameFolder+'</a><span><span></span></span></span><ul></ul></li>');
  }

  //---------------------------------------------------------------------------------------
  // Remove the bookmark (from the localStorage)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.deletBookmark = function(elem){
    var typeList = $(elem).parent().parent().parent().parent().parent('div').attr('id');
    var ID = $(elem).parent('li').attr('id');
    var IDfold = $(elem).parent().parent().parent('li').attr('id');
    delete window.plugin.bookmarks[typeList][IDfold]['bkmrk'][ID];
    window.plugin.bookmarks.storeBookmarks(typeList);
    if(typeList == 'bkmrk_portals'){ window.plugin.bookmarks.updateStarPortal(); }
  }

  //---------------------------------------------------------------------------------------
  // Remove the folder (from the localStorage)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.deletFolder = function(elem){
    var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
    var ID = $(elem).parent().parent('li').attr('id');
    delete plugin.bookmarks[typeList][ID];
    window.plugin.bookmarks.storeBookmarks(typeList);
    if(typeList == 'bkmrk_portals'){ window.plugin.bookmarks.updateStarPortal(); }
  }

  //---------------------------------------------------------------------------------------
  // Saved the new sort of the folders (in the localStorage)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.sortBookmarksFolder = function(typeList){
    window.plugin.bookmarks.loadBookmarks(typeList);
    var newArr = {};
    $('#'+typeList+' li.bookmarkFolder').each(function(){
        var idFold = $(this).attr('id');
      newArr[idFold] = window.plugin.bookmarks[typeList][idFold];
    });
    window.plugin.bookmarks[typeList] = newArr;
    window.plugin.bookmarks.storeBookmarks(typeList);
  }

  //---------------------------------------------------------------------------------------
  // Saved the new sort of the bookmarks (in the localStorage)
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.sortBookmarks = function(typeList){
    window.plugin.bookmarks.loadBookmarks(typeList);
    var list = window.plugin.bookmarks[typeList];
    var newArr = {};

    $('#'+typeList+' li.bookmarkFolder').each(function(){
      var idFold = $(this).attr('id');
      newArr[idFold] = window.plugin.bookmarks[typeList][idFold];
      newArr[idFold].bkmrk = {};
    });

    $('#'+typeList+' li.bkmrk').each(function(){
      window.plugin.bookmarks.loadBookmarks(typeList);
      var idFold = $(this).parent().parent('li').attr('id');
        var id = $(this).attr('id');

      var list = window.plugin.bookmarks[typeList];
      for(var idFoldersOrigin in list){
        for(var idBkmrk in list[idFoldersOrigin]['bkmrk']){
          if(idBkmrk == id){
            newArr[idFold].bkmrk[id] = window.plugin.bookmarks[typeList][idFoldersOrigin].bkmrk[id];
          }
        }
      }
    });
    window.plugin.bookmarks[typeList] = newArr;
    window.plugin.bookmarks.storeBookmarks(typeList);
  }

  //---------------------------------------------------------------------------------------
  // Update the localStorage
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.storeBookmarks = function(typeList){
    var bookmarksObject = {};
    bookmarksObject[typeList] = plugin.bookmarks[typeList];
    var bookmarksObjectJSON = JSON.stringify(bookmarksObject);
    localStorage[plugin.bookmarks['LOCAL_STORAGE_'+typeList]] = bookmarksObjectJSON;
  }

  //---------------------------------------------------------------------------------------
  // Load the localStorage
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.loadBookmarks = function(typeList){
    var bookmarksObjectJSON = localStorage[plugin.bookmarks['LOCAL_STORAGE_'+typeList]];
    if(!bookmarksObjectJSON) return;
    var bookmarksObject = JSON.parse(bookmarksObjectJSON);
    window.plugin.bookmarks[typeList] = bookmarksObject[typeList];
  }

  //---------------------------------------------------------------------------------------
  // Load the bookmarks
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.loadList = function(typeList){
    window.plugin.bookmarks.loadBookmarks(typeList);
    var element = '';
    var elementTemp = '';
    var elementExc = '';

    // For each folder
    var list = window.plugin.bookmarks[typeList];
    for(var idFolders in list){
      var folders = list[idFolders];
      var active = '';

      // Create a label and a anchor for the sortable
      var folderLabel = '<span class="folderLabel"><a class="bookmarksRemoveFrom" title="Remove this folder">X</a>';
      folderLabel += '<a class="bookmarksAnchor"><span></span>'+folders['label']+'</a><span><span></span></span></span>';

      if(folders['state']){ active = ' active'; }
      if(idFolders == window.plugin.bookmarks.KEY_OTHER_BKMRK){
        folderLabel = ''; active= ' othersBookmarks active';
      }
      // Create a folder
      elementTemp = '<li class="bookmarkFolder'+active+'" id="'+idFolders+'">'+folderLabel+'<ul>';

      // For each bookmark
      var fold = folders['bkmrk'];
      for(var idBkmrk in fold){
        var btn_link;
        var btn_remove = '<a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a>';
        var bkmrk = fold[idBkmrk];
        var label = bkmrk['label'];
        var latlng = bkmrk['latlng'];

        // If it's a map
        if(typeList == 'bkmrk_maps'){
          if(bkmrk['label'] == ''){ label = bkmrk['latlng']+' ['+bkmrk['z']+']'; }
          btn_link = '<a class="bookmarksLink" onclick="map.setView(['+latlng+'], '+bkmrk['z']+');return false;">'+label+'</a>';
        }
        // If it's a portal
        else if(typeList == 'bkmrk_portals'){
          var guid = bkmrk['guid'];
          var btn_link = '<a class="bookmarksLink" onclick="window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+label+'</a>';
        }
        // Create the bookmark
        elementTemp += '<li class="bkmrk" id="'+idBkmrk+'">'+btn_remove+btn_link+'</li>';
      }
      elementTemp += '</li></ul>';

      //Add folder 'Others' in last position
      if(idFolders != window.plugin.bookmarks.KEY_OTHER_BKMRK){ element += elementTemp; }
      else{ elementExc = elementTemp; }
    }
    element += elementExc;

    // Append all folders and bookmarks
    $('#'+typeList+' ul').html(element);
  }

/*********************************************************************************************************************/

  //---------------------------------------------------------------------------------------
  // Append the stylesheet
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.setupCSS = function(){
    $('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/bookmarks-by-zaso-css-desktop.css@@').appendTo('head');
  }

  //---------------------------------------------------------------------------------------
  // Append the stylesheet for mobile app
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.setupCSS_mobile = function(){
    $("<style>").prop("type", "text/css").html('@@INCLUDESTRING:plugins/bookmarks-by-zaso-css-mobile.css@@').appendTo("head");
  }

  //---------------------------------------------------------------------------------------
  // Append the js script
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.setupJS = function(){$(document).ready(function(){
    //ENABLED THE DRAGGABLE PROPERTY OF THE BOX
    $('#bookmarksBox').draggable({ handle:'.handle', containment:'window' });
    $("#bookmarksBox #bookmarksMin , #bookmarksBox ul li, #bookmarksBox ul li a, #bookmarksBox h5, #bookmarksBox .addForm a").disableSelection();

    //SWICTH VISIBILITY PROPERTY OF THE BOX
    $('#bookmarksMin').click(function(){
      $('#bookmarksBox').animate({marginTop:'-200%'}, {duration:600, queue:false});
      $('#bookmarksShow').animate({marginTop:-36}, {duration:400, queue:false});

      var uuu = JSON.parse(localStorage['plugin-bookmarks-status-box']);
      uuu['visibility'] = 0;
      localStorage['plugin-bookmarks-status-box'] = JSON.stringify(uuu);
    });
    $('#bookmarksShow').click(function(){
      $('#bookmarksBox').animate({marginTop:0}, {duration:600, queue:false});
      $('#bookmarksShow').animate({marginTop:-100}, {duration:400, queue:false});

      var uuu = JSON.parse(localStorage['plugin-bookmarks-status-box']);
      uuu['visibility'] = 1;
      localStorage['plugin-bookmarks-status-box'] = JSON.stringify(uuu);
    });
    //SWITCH LIST (MAPS/PORTALS)
    $('#bookmarksBox h5').click(function(){
      $('h5').removeClass('current');
      $(this).addClass('current');
      var sectList = '#'+$(this).attr('class').replace(' current', '');
      $('#bookmarksBox .bookmarkList').removeClass('current');
      $(sectList).addClass('current');

      var uuu = JSON.parse(localStorage['plugin-bookmarks-status-box']);
      if($(this).hasClass('bkmrk_portals')){ uuu['page'] = 1; }
      else{ uuu['page'] = 0; } 
      localStorage['plugin-bookmarks-status-box'] = JSON.stringify(uuu);
    });

    var qqq = JSON.parse(localStorage['plugin-bookmarks-status-box']);
    if(qqq['visibility'] == 1){$('#bookmarksShow').trigger('click'); }
    if(qqq['page'] == 1){ $('#bookmarksBox h5.bkmrk_portals').trigger('click'); }

    //ENABLED THE SORTABLE PROPERTY OF THE FOLDERS AND BOOKMARKS
    $(".bookmarkList > ul").sortable({
      items:"li.bookmarkFolder:not(.othersBookmarks)",
      handle:".bookmarksAnchor",
      placeholder:"sortable-placeholder",
      forcePlaceholderSize:true,
      helper:'clone',
      distance:5,
      update:function(event, ui){
        var typeList = $('#'+ui.item.context.id).parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortBookmarksFolder(typeList);
      }
    });
    $(".bookmarkList ul li ul").sortable({
      items:"li.bkmrk",
      connectWith:".bookmarkList ul ul",
      handle:".bookmarksLink",
      placeholder:"sortable-placeholder",
      forcePlaceholderSize:true,
      helper:'clone',
      distance:5,
      update:function(event, ui){
        var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortBookmarks(typeList);
      }
    });

    //ADD BOOKMARK/FOLDER
    $('#bookmarksBox .addForm a').click(function(e){
      var typeList = $(this).parent().parent('div').attr('id');
      if($(this).hasClass('newMap')){ window.plugin.bookmarks.addBookmarkMap(this); }
      else{ window.plugin.bookmarks.addFolder(typeList); }

      //REFRESS SORTABLE EVENT FOR BKMRK
      $(".bookmarkList ul li ul").sortable({
        items:"li.bkmrk",
        connectWith:".bookmarkList ul ul",
        handle:".bookmarksLink",
        placeholder:"sortable-placeholder",
        forcePlaceholderSize:true,
        helper:'clone',
        distance:5,
        update:function(event, ui){
          var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
          window.plugin.bookmarks.sortBookmarks(typeList);
        }
      });
      if(window.isSmartphone()){
        // The clone not working in mobile mode (to be corrected)---------------
        $(".bookmarkList ul li ul").sortable("option", "helper", "original");
      };
      e.preventDefault();
    });

    //REMOVE FOLDER
    $('.bookmarkList').on('click', '.folderLabel .bookmarksRemoveFrom', function(e){
      window.plugin.bookmarks.deletFolder(this);
      $(this).parent().parent('li').remove();
      e.preventDefault();
    });

    //REMOVE BOOKMARK
    $('.bookmarkList').on('click', '.bkmrk .bookmarksRemoveFrom', function(e){
      window.plugin.bookmarks.deletBookmark(this);
      $(this).parent('li').remove();
      e.preventDefault();
    });

    if(typeof android !== 'undefined' && android){
      //FOR MOBILE
      // The clone not working in mobile mode (to be corrected)---------------
      $(".bookmarkList > ul").sortable("option", "helper", "original");
      $(".bookmarkList ul li ul").sortable("option", "helper", "original");
    }else{
      //DESTOP: active vertical scroll-bar on the long lists
      $('.bookmarkList > ul').enscroll({verticalTrackClass:'trackScroll', verticalHandleClass:'handleScroll', minScrollbarLength:28 });
    }

    if(window.isSmartphone()){
      //Show/Hide the box
      $('#bookmarksBox').hide();
      $('#bookmarksShowMobile').click(function(){
      $(this).toggleClass('open');
        $('#bookmarksBox').toggle();
        if($(this).hasClass('open')){ $(this).text('[-] Bookmarks'); }
        else{ $(this).text('[+] Bookmarks'); }
      });
      //Return to map when a bookmark is clicked
      $('.bookmarkList').on('click', '.bkmrk .bookmarksLink', function(){
        window.show("map");
      });
    }
    else{
      //OPEN/CLOSE FOLDER (to be corrected in mobile mode)---------------
      $('#bookmarksBox').on('click', '.bookmarksAnchor', function(e){
        window.plugin.bookmarks.openFolder(this);
        $(this).parent().parent('li').toggleClass('active');
        e.preventDefault();
      });
    }

    //BOOKMARKS OPTIONS
    $('#bkmrkOpt').on('click', function(e){
      dialog({ html: plugin.bookmarks.bkmrkOptbox, dialogClass: 'ui-dialog-bkmrkOpt', title: 'Bookmarks Options' });
      $('#bkmrkOptbox').tabs();
      $('#bkmrkO input').val(localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_maps]+'///'+localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals]).select();

      function refreshIntel(action){
        $('.ui-dialog-bkmrkOpt .ui-dialog-buttonset button').trigger('click');
        $('#bookmarksBox, .bookmarkStar, #bookmarksShow').remove();
        dialog({ html: 'Refresh the page.', title:'Successful' });
      }

      $('#bkmrkOptbox li a:contains("Export"), #bkmrkOptbox #bkmrkO button').on('click', function(e){
        $('#bkmrkO input').val(localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_maps]+'///'+localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals]).select();
      })
      $('#bkmrkOptbox #bkmrkI button').on('click', function(e){
        if($('#bkmrkI input').val() != ''){
          var imp = $('#bkmrkI input').val();
          imp = imp.split('///');
          localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_maps] = imp[0];
          localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals] = imp[1];
          refreshIntel();
        }
      })
      $('#bkmrkOptbox #bkmrkR button').on('click', function(e){
        delete localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals];
        delete localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_maps];
        refreshIntel();
      })
      e.preventDefault();
    });
  });}

  //---------------------------------------------------------------------------------------
  // HTML element
  //---------------------------------------------------------------------------------------
  window.plugin.bookmarks.setupContent = function(){
    plugin.bookmarks.contentStarHTML    = '<a class="bookmarkStar" onclick="window.plugin.bookmarks.switchStarPortal();return false;" title="Save this portal in your bookmarks"><span></span></a>';
    plugin.bookmarks.disabledMessage    = '<div title="Your browser do not support localStorage">Plugin Bookmarks disabled</div>';
    plugin.bookmarks.bkmrkRibbon        = '<a id="bookmarksShow"></a>';
    plugin.bookmarks.bkmrkBox           = '<div id="bookmarksBox">'
                                            +'<div id="topBar"><a id="bookmarksMin" class="btn" title="Minimize">-</a><div class="handle">...</div></div>'
                                            +'<div id="bookmarksTypeBar"><h5 class="bkmrk_maps current">Maps</h5><h5 class="bkmrk_portals">Portals</h5><div style="clear:both !important;"></div></div>'
                                            +'<div id="bkmrk_maps" class="bookmarkList current"><div class="addForm"><input placeholder="Insert label"><a class="newMap">+ Map</a><a class="newFolder">+ Folder</a></div><ul></ul></div>'
                                            +'<div id="bkmrk_portals" class="bookmarkList"><div class="addForm"><input placeholder="Insert label"><a class="newFolder">+ Folder</a></div><ul></ul></div>'
                                          +'</div>';
    plugin.bookmarks.bkmrkTriggerMobile = '<a id="bookmarksShowMobile">[+] Bookmarks</a>';
    plugin.bookmarks.bkmrkOpt           = '<a id="bkmrkOpt" title="Import/export bookmarks">Bookmarks Opt</a>';
    plugin.bookmarks.bkmrkOptbox        = '<div id="bkmrkOptbox">'
                                            +'<ul class="menu">'
                                              +'<li><a href="#bkmrkO">Export</a></li>'
                                              +'<li><a href="#bkmrkI">Import</a></li>'
                                              +'<li><a href="#bkmrkR">Reset</a></li>'
                                            +'</ul>'
                                            +'<div style="clear:both;"></div>'
                                            +'<div id="bkmrkO"><p>Copy the string (CTRL+C) and paste it in a file.</p><input type="text" disabled /><button>Reload</button></div>'
                                            +'<div id="bkmrkI"><input type="text" placeholder="Paste here the string" /><button>Import</button></div>'
                                            +'<div id="bkmrkR">All bookmarks will be deleted. Are you sure? <button>I\'m sure</button></div>'
                                          +'</div>'
  }

/***************************************************************************************************************************************************************/

  var setup =  function(){
    //Set the localStorage (if not exist)
    if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_bkmrk_portals']]){localStorage[plugin.bookmarks['LOCAL_STORAGE_bkmrk_portals']] = '{"bkmrk_portals":{"'+window.plugin.bookmarks.KEY_OTHER_BKMRK+'":{"label":"Others","state":1,"bkmrk":{}}}}'; }
    if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_bkmrk_maps']]){localStorage[plugin.bookmarks['LOCAL_STORAGE_bkmrk_maps']] = '{"bkmrk_maps":{"'+window.plugin.bookmarks.KEY_OTHER_BKMRK+'":{"label":"Others","state":1,"bkmrk":{}}}}'; }

    if(localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']] == 1 || localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']] == 0){
      localStorage[plugin.bookmarks['LOCAL_STORAGE_status_box']] = '{"visibility":1,"page":0}';
    }
    if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']]){localStorage[plugin.bookmarks['LOCAL_STORAGE_status_box']] = '{"visibility":1,"page":0}';}

    //Load data from localStorage
    window.plugin.bookmarks.loadBookmarks('bkmrk_portals');
    window.plugin.bookmarks.loadBookmarks('bkmrk_maps');

    if(typeof android !== 'undefined' && android){
      //FOR MOBILE: load the script for the touch events
      var script2 = document.createElement('script');
      script2.type = 'text/javascript';
      script2.src = 'https://raw.github.com/furf/jquery-ui-touch-punch/master/jquery.ui.touch-punch.min.js';
      script2.appendChild(document.createTextNode('('+ wrapper +')();'));
      (document.body || document.head || document.documentElement).appendChild(script2);
    }
    else{
      //FOR DESKTOP: load the script to active the vertical scrollbar (in the bookmarks box)
      var script3 = document.createElement('script');
      script3.type = 'text/javascript';
      script3.src = 'http://enscrollplugin.com/releases/enscroll-0.4.0.min.js';
      script3.appendChild(document.createTextNode('('+ wrapper +')();'));
      (document.body || document.head || document.documentElement).appendChild(script3);
    }

    window.plugin.bookmarks.setupCSS();
    if(typeof android !== 'undefined' && android){
      window.plugin.bookmarks.setupCSS_mobile();
    }
    window.plugin.bookmarks.setupContent();

    //Append the bookmarks box
    if(window.isSmartphone()){
      $('#portaldetails').before(plugin.bookmarks.bkmrkTriggerMobile+plugin.bookmarks.bkmrkBox);
    }else{
      $('body').append(plugin.bookmarks.bkmrkRibbon+plugin.bookmarks.bkmrkBox);
    }
    $('#toolbox').append(plugin.bookmarks.bkmrkOpt);

    //Load bookmarks and folders in the box
    window.plugin.bookmarks.loadList('bkmrk_maps');
    window.plugin.bookmarks.loadList('bkmrk_portals');

    window.plugin.bookmarks.setupJS();
    window.addHook('portalDetailsUpdated', window.plugin.bookmarks.addToSidebar);
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@