// ==UserScript==
// @id             iitc-plugin-show-portals-i-own@lliu
// @name           IITC plugin: Show My Own Portals
// @category       Info
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Find my own portals and highlight them on the map
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

// use own namespace for plugin
window.plugin.showPortalsIOwn = function() {};

window.plugin.showPortalsIOwn.nick = window.PLAYER.nickname;
window.plugin.showPortalsIOwn.hiliteList = [];
window.plugin.showPortalsIOwn.myPortals = [];
window.plugin.showPortalsIOwn.showmeHook = false;
    
window.plugin.showPortalsIOwn.setupCallback = function() {
  //$('#toolbox').append(' <a onclick="window.plugin.showPortalsIOwn.showme()" title="Highlight my own portals">Show My Portals</a>');
  //addHook('iitcLoaded', window.plugin.showPortalsIOwn.showme);
  //addHook('mapDataRefreshEnd', window.plugin.showPortalsIOwn.showme);
  addHook('requestFinished', window.plugin.showPortalsIOwn.showme);
    

  window.plugin.showPortalsIOwn.layer = L.layerGroup([]);

  window.map.on('layeradd', function(e) {
    if (e.layer === window.plugin.showPortalsIOwn.layer) {
        window.plugin.showPortalsIOwn.showmeHook = true;
        window.plugin.showPortalsIOwn.showme();
    }
  });
  window.map.on('layerremove', function(e) {
    if (e.layer === window.plugin.showPortalsIOwn.layer) {
      // clearout data and remove drawings, remove hooks
      window.plugin.showPortalsIOwn.clearShowme();
      window.plugin.showPortalsIOwn.showmeHook = false;
    }
  });

  window.addLayerGroup('My Own Portals', window.plugin.showPortalsIOwn.layer, false);
};

window.plugin.showPortalsIOwn.clearShowme = function() {
  //clear the hilite
  for (var i = 0; i<window.plugin.showPortalsIOwn.hiliteList.length; i++) {
    map.removeLayer(window.plugin.showPortalsIOwn.hiliteList[i]);
  }
  //window.plugin.showPortalsIOwn.myPortals = [];
  if(jQuery('#dialog-show-portals-i-own').dialog('isOpen')
      && !jQuery(e.target).is('.ui-dialog, a')
      && !jQuery(e.target).closest('.ui-dialog').length
  ) {
    jQuery('#dialog-show-portals-i-own').dialog('close');
  }
  if(jQuery('#dialog-enter-nickname').dialog('isOpen')
      && !jQuery(e.target).is('.ui-dialog, a')
      && !jQuery(e.target).closest('.ui-dialog').length
  ) {
    jQuery('#dialog-enter-nickname').dialog('close');
  }
}

window.plugin.showPortalsIOwn.zaptome = function(id) {
  selectPortal(window.portals[id] ? id : null);        
};

window.plugin.showPortalsIOwn.showme = function() {
  if (!window.plugin.showPortalsIOwn.showmeHook) return;

  //console.log('!!!showPortalsIOwn.showme() called!!!');
  // do I know my own nick name?
  //console.log('my nickname is '+window.PLAYER.nickname);

  // where do I get all the portal info?
  var s = '';
  var count = 0;
  var myowncount = 0;
  var totalCount = 0;
  var ptest = [];

  //clear the hilite
  for (var i = 0; i<window.plugin.showPortalsIOwn.hiliteList.length; i++) {
    map.removeLayer(window.plugin.showPortalsIOwn.hiliteList[i]);
  }

  $.each(window.portals, function(id, p) {
    //console.log(id);
    selectPortal(window.portals[id] ? id : null);

    if (id && !portalDetail.isFresh(id)) {
      portalDetail.request(id);
    }
    
    var portal = window.portals[id];
    var data = portal.options.data;
    var details = portalDetail.get(id);

    count++;
    //console.log(p);
    //console.log(details);
    if (details) {
      //console.log(details.owner);
      if (details.owner.toLowerCase()==window.plugin.showPortalsIOwn.nick.toLowerCase()) {
        // fixed nickname case here
        window.plugin.showPortalsIOwn.nick = details.owner;
        myowncount++;
        //console.log(p);
        ptest.push(p);
      }
    }
  });

  // merge to the found list to the storage
  //$.merge(window.plugin.showPortalsIOwn.myPortals, ptest);
  //window.plugin.showPortalsIOwn.myPortals = $.unique(window.plugin.showPortalsIOwn.myPortals);
  for (var i = 0;i<ptest.length;i++) {
    var exists = false;
    for (var j = 0; j<window.plugin.showPortalsIOwn.myPortals.length;j++) {
      if (ptest[i].options.guid == window.plugin.showPortalsIOwn.myPortals[j].options.guid) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      window.plugin.showPortalsIOwn.myPortals.push(ptest[i]);
    }
  }
    
  // sort by lvl first then title
  var ptestSorted = window.plugin.showPortalsIOwn.myPortals.sort(function(a, b) {
    var order = b.options.level - a.options.level;
    if (order == 0) {// if level is the same, sort by title
      return a.options.data.title.localeCompare(b.options.data.title);            
    } else return order;
  });

  var s1='';
  // TODO: make lvl a filter for display???
  // list level color legend
  var s2='<table><tr><td>Level Color</td><td align="center" bgcolor="'+window.COLORS_LVL[1]+'">1</td>'+
  '<td align="center" bgcolor="'+window.COLORS_LVL[2]+'">2</td>'+
  '<td align="center" bgcolor="'+window.COLORS_LVL[3]+'">3</td>'+
  '<td align="center" bgcolor="'+window.COLORS_LVL[4]+'">4</td>'+
  '<td align="center" bgcolor="'+window.COLORS_LVL[5]+'">5</td>'+
  '<td align="center" bgcolor="'+window.COLORS_LVL[6]+'">6</td>'+
  '<td align="center" bgcolor="'+window.COLORS_LVL[7]+'">7</td>'+
  '<td align="center" bgcolor="'+window.COLORS_LVL[8]+'">8</td></table>\n'

  var len = ptestSorted.length;
  selectPortal(null);
  for (var i=0; i < len; i++) {
    var pt = ptestSorted[i];

    var coord = pt.getLatLng();
    var lvl = pt.options.level;
        
    var onclick = 'zoomToAndShowPortal(\''+pt.options.guid+'\',['+pt.options.ent[2][2]/1E6+','+pt.options.ent[2][3]/1E6+'])';
    s1+='<a onclick="'+onclick+'" title="Zap to portal"><font color=\"'+window.COLORS_LVL[lvl]+'\">'+pt.options.data.title+'</font></a>\n';
    totalCount++;
        
    // try to catch the drawing of out-of-bound, ignore it now
    try {
      window.plugin.showPortalsIOwn.hiliteList.push(
        L.circle(coord,lvl==1?2*8:lvl*8,
        { fill: true, color: 'red', opacity: 0.5, fillOpacity: 0.5, weight: 2, clickable: false }
        ).addTo(map)
      );
      pt.bringToFront();
    } catch (err) {
      console.log('catch error while drawing: '+err.message);
    }
  }

  if (totalCount > 0) 
  s1 = s2+s1;
  s+='Current portals processed: '+count + ' found: '+myowncount+'.\nCumulative count: '+totalCount+'\n\n'+s1;

  var userDisplayed = window.plugin.showPortalsIOwn.nick;
  var userGrammar = 's';
  if (window.plugin.showPortalsIOwn.nick == window.PLAYER.nickname) {
    userDisplayed = 'You';
    userGrammar = '';
  }

  dialog({
    text: s,
    title: 'Show Portals '+userDisplayed+' Own'+userGrammar,
    id: 'show-portals-i-own',
    width: 380,
    position: { my: "left bottom", at: "left top", of: "#chatcontrols" },
    buttons: {
      '>>>>>': function() {
        window.plugin.showPortalsIOwn.changeNick();
      },
    }
  });
      
  // focus on the input if it's open
  if(jQuery('#dialog-enter-nickname').dialog('isOpen')
      && !jQuery(e.target).is('.ui-dialog, a')
      && !jQuery(e.target).closest('.ui-dialog').length
  ) {
    jQuery('#nickfield').focus();
  }
};

window.plugin.showPortalsIOwn.changeNick = function() {
  //var newNick = null; //prompt('Enter a player nickname:', window.plugin.showPortalsIOwn.nick);
  var s = '<div id="dialog-form-change-nick"><form id="nickinput"><label for="name">Nickname </label>'+
  '<input type="search" name="name" id="nickfield" value=\''+ 
  window.plugin.showPortalsIOwn.nick+'\' autofocus onfocus="this.value = this.value;"/></form></div>';
  //TODO: make prompt in IITC style.
  var dinput = dialog({
    text: s,
    title: 'Change Nickname',
    id: 'enter-nickname',
    width: 270,
    position: { my: "left bottom", at: "right bottom", of: "#dialog-show-portals-i-own" },
    buttons: {
      "OK": {
        text: "OK",
        click: function() {
          //Do your code here
          var newNick = $("#nickfield").val();
          //console.log('changeNick called: '+newNick);
          if (newNick !== null && newNick != '') {
            // only need to refresh if new nick is entered
            if (newNick != window.plugin.showPortalsIOwn.nick) {
              // clear the cumulative list storage
              window.plugin.showPortalsIOwn.myPortals = [];
              window.plugin.showPortalsIOwn.nick=newNick;
              window.plugin.showPortalsIOwn.showme();
            }
          }
          $(this).dialog("close");
        }
      },
      "Cancel": function() {
        $(this).dialog("close");
      }
    }
  });
  
  // prevent enter of the input form reload the page
  $('#nickinput').submit(function() {
    return false;
  });
  // associate "Enter" key to OK of the nick input form.
  $('#nickfield').keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
    if (e.keyCode == $.ui.keyCode.ENTER) {
      var buttons = dinput.dialog('option','buttons');
      buttons['OK'].click.apply(dinput);
    }
    return false;
  });
}

var setup =  function() {
  window.plugin.showPortalsIOwn.setupCallback();
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
