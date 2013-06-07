// ==UserScript==
// @id             iitc-plugin-bookmarks@zaso
// @name           IITC plugin: Bookmarks for maps and portals
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Save your favorite Maps and Portals.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.bookmarks = function() {};

window.plugin.bookmarks.KEY_OTHER_BKMRK = 'idOthers';
window.plugin.bookmarks.LOCAL_STORAGE_status_box = 'plugin-bookmarks-status-box';
window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals = 'plugin-bookmarks-portals-data';
window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_maps = 'plugin-bookmarks-maps-data';

window.plugin.bookmarks.bkmrk_portals = {};
window.plugin.bookmarks.bkmrk_maps = {};

window.plugin.bookmarks.disabledMessage;
window.plugin.bookmarks.contentStarHTML;
window.plugin.bookmarks.bkmrkBox;
window.plugin.bookmarks.bkmrkRibbon;
window.plugin.bookmarks.loadList;
window.plugin.bookmarks.setupJS;

/***************************************************************************************************************************************************************/

window.plugin.bookmarks.addStarToSidebar = function() {
  if(typeof(Storage) === "undefined") { $('#portaldetails > .imgpreview').after(plugin.bookmarks.disabledMessage); return; }
  var title = $('#portaldetails > h3').text();
  $('#portaldetails > h3').html(plugin.bookmarks.contentStarHTML+title);
  plugin.bookmarks.updateStarPortal();
}
window.plugin.bookmarks.updateStarPortal = function() {
  window.plugin.bookmarks.loadBookmarks('bkmrk_portals');
  var guid = window.selectedPortal;
  var list = plugin.bookmarks['bkmrk_portals'];
  $('#bookmarkStar').removeClass('favorite');
  $('.bkmrk a.bookmarksLink.selected').removeClass('selected');
  for(var idFolders in list) {
    for(var idBkmrk in list[idFolders]['bkmrk']) {
      var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
      if(guid == portalGuid) {
        $('#bookmarkStar').addClass('favorite');
        $('.bkmrk#'+idBkmrk+' a.bookmarksLink').addClass('selected');
      }
     }
  }
}
window.plugin.bookmarks.switchStarPortal = function() {
  var guid = window.selectedPortal;

  if($('#bookmarkStar').hasClass('favorite')) {
    var list = plugin.bookmarks['bkmrk_portals'];

    for(var idFolders in list) {
      for(var idBkmrk in list[idFolders]['bkmrk']) {
        var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
        if(guid == portalGuid) {
          delete list[idFolders]['bkmrk'][idBkmrk];
          $('.bkmrk#'+idBkmrk+'').remove();
        }
       }
    }
  }
  else {
    var linka = $('#portaldetails .linkdetails aside a:contains("Portal link")').attr('href');
    var namePortal = $('#portaldetails h3').text();

    var ID = window.plugin.bookmarks.generateID();

    var spac = linka.split('pll=');
    var latlng = spac[1] ;
    plugin.bookmarks['bkmrk_portals'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"guid":guid,"latlng":latlng,"label":namePortal};
    $('#bkmrk_portals li.othersBookmarks ul').append('<li class="bkmrk" id="'+ID+'"><a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a><a class="bookmarksLink" onclick="window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+namePortal+'</a></li>');
  }
  window.plugin.bookmarks.storeBookmarks('bkmrk_portals');
  window.plugin.bookmarks.updateStarPortal();
}
window.plugin.bookmarks.addBookmarkMap = function(elem) {
  var mapLink = $(elem).attr('href');
    var pars = new RegExp('[\\?&amp;]ll=([^&amp;#]*)[&amp;]z=([^&amp;#]*)').exec(mapLink);
    var res = pars[1].split(',');
    res[2] = pars[2];
    var latlng = res[0]+','+res[1];
    var zoom = res[2];

    var ID = window.plugin.bookmarks.generateID();

    var nameMap = $(elem).siblings('input').val();
    nameMap = nameMap.replace(/\//g, '&#47;').replace(/\\/g, '&#92;').replace(/"/g, '&#34;').replace(/"/g, '&#39;');

    if(nameMap == '') { nameMap = ''; }
    $(elem).siblings('input').val('');

  plugin.bookmarks['bkmrk_maps'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"label":nameMap,"latlng":latlng,"z":parseInt(zoom)};
  plugin.bookmarks.storeBookmarks('bkmrk_maps');

  if(nameMap=='') { nameMap = latlng+' ['+zoom+']'; }
  $('#bkmrk_maps li.othersBookmarks ul').append('<li class="bkmrk" id="'+ID+'"><a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a><a class="bookmarksLink" onclick="map.setView(['+latlng+'], '+zoom+');return false;">'+nameMap+'</a></li>');
}

/***************************************************************************************************************************************************************/

window.plugin.bookmarks.generateID = function() {
  var d = new Date();
  var ID = d.getTime()+(Math.floor(Math.random()*99)+1);
  var ID = 'id'+ID.toString();
  return ID;
}

window.plugin.bookmarks.openFolder = function(elem) {
  var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
  var ID = $(elem).parent().parent('li').attr('id');
  var newFlag;
  var flag = plugin.bookmarks[typeList][ID]['state'];
  if(flag) { newFlag = 0; }
  else if(!flag) { newFlag = 1; }
  window.plugin.bookmarks[typeList][ID]['state'] = newFlag;
  window.plugin.bookmarks.storeBookmarks(typeList);
}
window.plugin.bookmarks.addFolder = function(typeList) {
  var ID = window.plugin.bookmarks.generateID();
  var input = '#'+typeList+' .addForm input';
  var nameFolder = $(input).val();
  nameFolder = nameFolder.replace(/\//g, '&#47;').replace(/\\/g, '&#92;').replace(/"/g, '&#34;').replace(/"/g, '&#39;');
  if(nameFolder == '') { nameFolder = 'Folder'; }
  $(input).val('');

  plugin.bookmarks[typeList][ID] = {"label":nameFolder,"state":0,"bkmrk":{}};
  plugin.bookmarks.storeBookmarks(typeList);

  $('#'+typeList+' li.othersBookmarks').before('<li class="bookmarkFolder" id="'+ID+'"><span class="folderLabel"><a class="bookmarksRemoveFrom">X</a><a class="bookmarksAnchor"><span></span>'+nameFolder+'</a><span><span></span></span></span><ul></ul></li>');
}
window.plugin.bookmarks.deletBookmark = function(elem) {
  var typeList = $(elem).parent().parent().parent().parent().parent('div').attr('id');
  var ID = $(elem).parent('li').attr('id');
  var IDfold = $(elem).parent().parent().parent('li').attr('id');
  delete window.plugin.bookmarks[typeList][IDfold]['bkmrk'][ID];
  window.plugin.bookmarks.storeBookmarks(typeList);
  if(typeList == 'bkmrk_portals') { window.plugin.bookmarks.updateStarPortal(); }
}
window.plugin.bookmarks.deletFolder = function(elem) {
  var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
  var ID = $(elem).parent().parent('li').attr('id');
  delete plugin.bookmarks[typeList][ID];
  window.plugin.bookmarks.storeBookmarks(typeList);
  if(typeList == 'bkmrk_portals') { window.plugin.bookmarks.updateStarPortal(); }
}

window.plugin.bookmarks.sortBookmarksFolder = function(typeList) {
  window.plugin.bookmarks.loadBookmarks(typeList);
  var newArr = {};
  $('#'+typeList+' li.bookmarkFolder').each(function() {
      var idFold = $(this).attr('id');
    newArr[idFold] = window.plugin.bookmarks[typeList][idFold];
  });
  window.plugin.bookmarks[typeList] = newArr;
  window.plugin.bookmarks.storeBookmarks(typeList);
}
window.plugin.bookmarks.sortBookmarks = function(typeList) {
  window.plugin.bookmarks.loadBookmarks(typeList);
  var list = window.plugin.bookmarks[typeList];
  var newArr = {};

  $('#'+typeList+' li.bookmarkFolder').each(function() {
    var idFold = $(this).attr('id');
    newArr[idFold] = window.plugin.bookmarks[typeList][idFold];
    newArr[idFold].bkmrk = {};
  });

  $('#'+typeList+' li.bkmrk').each(function() {
    window.plugin.bookmarks.loadBookmarks(typeList);
    var idFold = $(this).parent().parent('li').attr('id');
      var id = $(this).attr('id');

    var list = window.plugin.bookmarks[typeList];
    for(var idFoldersOrigin in list) {
      for(var idBkmrk in list[idFoldersOrigin]['bkmrk']) {
        if(idBkmrk == id) {
          newArr[idFold].bkmrk[id] = window.plugin.bookmarks[typeList][idFoldersOrigin].bkmrk[id];
        }
      }
    }
  });
  window.plugin.bookmarks[typeList] = newArr;
  window.plugin.bookmarks.storeBookmarks(typeList);
}

window.plugin.bookmarks.storeBookmarks = function(typeList) {
  var bookmarksObject = {};
  bookmarksObject[typeList] = plugin.bookmarks[typeList];
  var bookmarksObjectJSON = JSON.stringify(bookmarksObject);
  localStorage[plugin.bookmarks['LOCAL_STORAGE_'+typeList]] = bookmarksObjectJSON;
}
window.plugin.bookmarks.loadBookmarks = function(typeList) {
  var bookmarksObjectJSON = localStorage[plugin.bookmarks['LOCAL_STORAGE_'+typeList]];
  if(!bookmarksObjectJSON) return;
  var bookmarksObject = JSON.parse(bookmarksObjectJSON);
  plugin.bookmarks[typeList] = bookmarksObject[typeList];
}
window.plugin.bookmarks.loadList = function(typeList) {
  window.plugin.bookmarks.loadBookmarks(typeList);
  var element = '';

  var list = window.plugin.bookmarks[typeList];
  for(var idFolders in list) {
    var folders = list[idFolders];
    var active = '';

    var folderLabel = '<span class="folderLabel"><a class="bookmarksRemoveFrom" title="Remove this folder">X</a>';
    folderLabel += '<a class="bookmarksAnchor"><span></span>'+folders['label']+'</a><span><span></span></span></span>';

    if(folders['state']) { active = ' active'; }
    if(idFolders == window.plugin.bookmarks.KEY_OTHER_BKMRK) { folderLabel = ''; active= ' othersBookmarks active' }
    element += '<li class="bookmarkFolder'+active+'" id="'+idFolders+'">'+folderLabel+'<ul>';

    var fold = folders['bkmrk'];
    for(var idBkmrk in fold) {
      var btn_link;
      var btn_remove = '<a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a>';
      var bkmrk = fold[idBkmrk];
      var label = bkmrk['label'];
      var latlng = bkmrk['latlng'];

      if(typeList == 'bkmrk_maps') {
        if(bkmrk['label']=='') { label = bkmrk['latlng']+' ['+bkmrk['z']+']'; }
        btn_link = '<a class="bookmarksLink" onclick="map.setView(['+latlng+'], '+bkmrk['z']+');return false;">'+label+'</a>';
      }
      else if(typeList == 'bkmrk_portals') {
        var guid = bkmrk['guid'];
        var btn_link = '<a class="bookmarksLink" onclick="window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+label+'</a>';
      }
      element += '<li class="bkmrk" id="'+idBkmrk+'">'+btn_remove+btn_link+'</li>';
    }
    element += '</li></ul>';
  }
  $('#'+typeList+' ul').html(element);
}

/***************************************************************************************************************************************************************/

window.plugin.bookmarks.setupJS = function() {
  $(document).ready(function() {
    //ENABLED THE DRAGGABLE PROPERTY OF THE BOX
    $('#bookmarksBox').draggable({ handle:'.handle', containment:'window' });
    $("#bookmarksBox #bookmarksMin , #bookmarksBox ul li, #bookmarksBox ul li a, #bookmarksBox h5, #bookmarksBox .addForm a").disableSelection();
  
    //SWICTH VISIBILITY OF THE BOX
    $('#bookmarksMin').click(function() { $('#bookmarksBox').animate({marginTop:'-100%'}, {duration:400, queue:false}); $('#bookmarksShow').animate({marginTop:-36}, {duration:400, queue:false}); localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']] = 0; });
    $('#bookmarksShow').click(function() { $('#bookmarksBox').animate({marginTop:0}, {duration:400, queue:false}); $('#bookmarksShow').animate({marginTop:-100}, {duration:400, queue:false}); localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']]= 1; });
    if(localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']] == 1) { $('#bookmarksShow').trigger('click'); }else { $('#bookmarksMin').trigger('click'); }
  
    //SWITCH LIST (MAPS/PORTALS)
    $('#bookmarksBox h5').click(function() {$('h5').removeClass('current');$(this).addClass('current');var sectList = '#'+$(this).attr('class').replace(' current', '');$('#bookmarksBox .bookmarkList').removeClass('current');$(sectList).addClass('current');});
  
    //ACTIVE VERTICAL SCROLL-BAR ON THE LONG LISTS
    $('.bookmarkList > ul').enscroll({ showOnHover: true, verticalTrackClass: 'trackScroll', verticalHandleClass: 'handleScroll', minScrollbarLength:28 });
  
    //ENABLED THE SORTABLE PROPERTY OF THE FOLDERS AND BOOKMARKS
    $(".bookmarkList > ul").sortable({items:"li.bookmarkFolder:not(.othersBookmarks)",handle:".bookmarksAnchor",placeholder:"sortable-placeholder",forcePlaceholderSize:true,
      update:function(event, ui) {
        var typeList = $('#'+ui.item.context.id).parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortBookmarksFolder(typeList);
      }
    });
    $(".bookmarkList ul li ul").sortable({items:"li.bkmrk",connectWith:".bookmarkList ul ul",handle:".bookmarksLink",placeholder:"sortable-placeholder",forcePlaceholderSize:true,
      update:function(event, ui) {
        var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortBookmarks(typeList);
      }
    });
  
    //REMOVE FOLDER
    $('.bookmarkList').on('click', '.folderLabel .bookmarksRemoveFrom', function(e) {
      window.plugin.bookmarks.deletFolder(this);
      $(this).parent().parent('li').remove();
      e.preventDefault();
    });
  
    //REMOVE BOOKMARK
    $('.bookmarkList').on('click', '.bkmrk .bookmarksRemoveFrom', function(e) {
      window.plugin.bookmarks.deletBookmark(this);
      $(this).parent('li').remove();
      e.preventDefault();
    });
  
    //OPEN/CLOSE FOLDER
    $('#bookmarksBox').on('click', '.bookmarksAnchor', function(e) {
      window.plugin.bookmarks.openFolder(this);
      $(this).parent().parent('li').toggleClass('active');
      e.preventDefault();
    });
  
    //ADD BOOKMARK/FOLDER
    $('#bookmarksBox .addForm a').click(function(e) {
      var typeList = $(this).parent().parent('div').attr('id');
      if($(this).hasClass('newMap')) { window.plugin.bookmarks.addBookmarkMap(this); }
      else { window.plugin.bookmarks.addFolder(typeList); }
  
      //REFRESS SORTABLE EVENT FOR BKMRK
      $(".bookmarkList ul li ul").sortable({items:"li.bkmrk",connectWith:".bookmarkList ul ul",handle:".bookmarksLink",placeholder:"sortable-placeholder",forcePlaceholderSize:true,
        update:function(event, ui) {
          var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
          window.plugin.bookmarks.sortBookmarks(typeList);
        }
      });
      e.preventDefault();
    });
  });
}

window.plugin.bookmarks.setupCSS = function() {
  $("<style>").prop("type", "text/css")
  .html("@@INCLUDESTRING:plugins/bookmarks-by-zaso.css@@").appendTo("head");
}

window.plugin.bookmarks.setupContent = function() {
  plugin.bookmarks.contentStarHTML = '<a id="bookmarkStar" onclick="window.plugin.bookmarks.switchStarPortal();return false;" title="Save this portal in your bookmarks"><span></span></a>';
  plugin.bookmarks.disabledMessage = '<div class="notStorageSupport" title="Your browser do not support localStorage">Plugin Bookmarks disabled</div>';
  plugin.bookmarks.bkmrkBox     = '<div id="bookmarksBox">'
                      +'<div id="topBar"><a id="bookmarksMin" class="btn" title="Minimize">-</a><div class="handle">...</div></div>'
                      +'<div id="bookmarksTypeBar"><h5 class="bkmrk_maps current">Maps</h5><h5 class="bkmrk_portals">Portals</h5></div>'
                      +'<div id="bkmrk_maps" class="bookmarkList current"><div class="addForm"><input placeholder="Insert label"><a class="newMap" onmouseover="setPermaLink(this);return false">+ Map</a><a class="newFolder">+ Folder</a></div><ul></ul></div>'
                      +'<div id="bkmrk_portals" class="bookmarkList"><div class="addForm"><input placeholder="Insert label"><a class="newFolder">+ Folder</a></div><ul></ul></div>'
                    +'</div>';
  plugin.bookmarks.bkmrkRibbon   = '<a id="bookmarksShow"></a>';
}

/***************************************************************************************************************************************************************/

var setup =  function() {
  if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_bkmrk_portals']]) {localStorage[plugin.bookmarks['LOCAL_STORAGE_bkmrk_portals']] = '{"bkmrk_portals":{"'+window.plugin.bookmarks.KEY_OTHER_BKMRK+'":{"label":"Others","state":1,"bkmrk":{}}}}'; }
  if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_bkmrk_maps']]) {localStorage[plugin.bookmarks['LOCAL_STORAGE_bkmrk_maps']] = '{"bkmrk_maps":{"'+window.plugin.bookmarks.KEY_OTHER_BKMRK+'":{"label":"Others","state":1,"bkmrk":{}}}}'; }
  if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']]) {localStorage[plugin.bookmarks['LOCAL_STORAGE_status_box']] = 0;}

  if($.inArray('pluginBookmarksUpdate', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBookmarksUpdate'); }
  window.plugin.bookmarks.setupCSS();
  window.plugin.bookmarks.setupJS();
  window.plugin.bookmarks.setupContent();
  window.plugin.bookmarks.loadBookmarks('bkmrk_portals');
  window.plugin.bookmarks.loadBookmarks('bkmrk_maps');
  window.addHook('portalDetailsUpdated', window.plugin.bookmarks.addStarToSidebar);

  //Add to DOM the element of the plugin and load data from localStorage
  $('body').append(plugin.bookmarks.bkmrkRibbon);
  $('body').append(plugin.bookmarks.bkmrkBox);
  window.plugin.bookmarks.loadList('bkmrk_maps');
  window.plugin.bookmarks.loadList('bkmrk_portals');

  //Load the js page for the scrollbar
  var script2 = document.createElement('script');
  script2.type = 'text/javascript';
  script2.src = 'http://enscrollplugin.com/releases/enscroll-0.4.0.min.js';
  script2.appendChild(document.createTextNode('('+ wrapper +')();'));
  (document.body || document.head || document.documentElement).appendChild(script2);
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
