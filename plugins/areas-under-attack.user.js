// ==UserScript==
// @id             iitc-plugin-areas-under-attack@bryndavies
// @name           IITC plugin: highlight areas recently under attack
// @category       Tweaks
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Highlight areas under attack in last 15 mins by flashing portals, links and fields red. Uses chat data to determine attacked portals.
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
window.plugin.areasUnderAttack = function() {
};

window.plugin.areasUnderAttack.THRESHOLDMINS = 15;

window.plugin.areasUnderAttack.msgPortalList = {}; // list of attacked portals derived from chat messages
window.plugin.areasUnderAttack.portalList = {}; // list of attacked portals derived from message portals compared to current portal state
window.plugin.areasUnderAttack.linkList = {}; // list of links attached to attacked portals
window.plugin.areasUnderAttack.fieldList = {}; //list of fields attached to attacked portals
window.plugin.areasUnderAttack.removePortalList = {}; // list of attacked portals previously highlighted that need de-highlighting
window.plugin.areasUnderAttack.removeLinkList = {}; // list of links previously highlighted that need de-highlighting
window.plugin.areasUnderAttack.removeFieldList = {}; //list of fields previously highlighted that need de-highlighting
window.plugin.areasUnderAttack.portalsLoaded = false; // set to true once initial display of portals has finished
window.plugin.areasUnderAttack.style = 'css3';

window.plugin.areasUnderAttack.setupCSS = function() {
  $("<style>").prop("type", "text/css").html(''
    + '@-webkit-keyframes plugin-areas-under-attack-blink-green {'
    + '0% {stroke: #03DC03}'
    + '50% {stroke: #FF0000}'
    + '100% {stroke: #03DC03}'
    + '}'
    + '@-webkit-keyframes plugin-areas-under-attack-blink-blue {'
    + '0% {stroke: #0088FF}'
    + '50% {stroke: #FF0000}'
    + '100% {stroke: #0088FF}'
    + '}'
    + '@-moz-keyframes plugin-areas-under-attack-blink-green {'
    + '0% {stroke: #03DC03}'
    + '50% {stroke: #FF0000}'
    + '100% {stroke: #03DC03}'
    + '}'
    + '@-moz-keyframes plugin-areas-under-attack-blink-blue {'
    + '0% {stroke: #0088FF}'
    + '50% {stroke: #FF0000}'
    + '100% {stroke: #0088FF}'
    + '}'
    + '@keyframes plugin-areas-under-attack-blink-green {'
    + '0% {stroke: #03DC03}'
    + '50% {stroke: #FF0000}'
    + '100% {stroke: #03DC03}'
    + '}'
    + '@keyframes plugin-areas-under-attack-blink-blue {'
    + '0% {stroke: #0088FF}'
    + '50% {stroke: #FF0000}'
    + '100% {stroke: #0088FF}'
    + '}'
    + '@-webkit-keyframes plugin-areas-under-attack-blink-field-green {'
    + '0% {fill: #03DC03}'
    + '50% {fill: #FF0000}'
    + '100% {fill: #03DC03}'
    + '}'
    + '@-webkit-keyframes plugin-areas-under-attack-blink-field-blue {'
    + '0% {fill: #0088FF}'
    + '50% {fill: #FF0000}'
    + '100% {fill: #0088FF}'
    + '}'
    + '@-moz-keyframes plugin-areas-under-attack-blink-field-green {'
    + '0% {fill: #03DC03}'
    + '50% {fill: #FF0000}'
    + '100% {fill: #03DC03}'
    + '}'
    + '@-moz-keyframes plugin-areas-under-attack-blink-field-blue {'
    + '0% {fill: #0088FF}'
    + '50% {fill: #FF0000}'
    + '100% {fill: #0088FF}'
    + '}'
    + '@keyframes plugin-areas-under-attack-blink-field-green {'
    + '0% {fill: #03DC03}'
    + '50% {fill: #FF0000}'
    + '100% {fill: #03DC03}'
    + '}'
    + '@keyframes plugin-areas-under-attack-blink-field-blue {'
    + '0% {fill: #0088FF}'
    + '50% {fill: #FF0000}'
    + '100% {fill: #0088FF}'
    + '}'
    + '.plugin-areas-under-attack-green{'
    + '-webkit-animation-name: plugin-areas-under-attack-blink-green;'
    + '-webkit-animation-iteration-count: infinite;'
    + '-webkit-animation-timing-function: ease;'
    + '-webkit-animation-duration: 1s;'
    + '-moz-animation-name: plugin-areas-under-attack-blink-green;'
    + '-moz-animation-iteration-count: infinite;'
    + '-moz-animation-timing-function: ease;'
    + '-moz-animation-duration: 1s;'
    + 'animation-name: plugin-areas-under-attack-blink-green;'
    + 'animation-iteration-count: infinite;'
    + 'animation-timing-function: ease;'
    + 'animation-duration: 1s;'
    + '}'
    + '.plugin-areas-under-attack-blue{'
    + '-webkit-animation-name: plugin-areas-under-attack-blink-blue;'
    + '-webkit-animation-iteration-count: infinite;'
    + '-webkit-animation-timing-function: ease;'
    + '-webkit-animation-duration: 1s;'
    + '-moz-animation-name: plugin-areas-under-attack-blink-blue;'
    + '-moz-animation-iteration-count: infinite;'
    + '-moz-animation-timing-function: ease;'
    + '-moz-animation-duration: 1s;'
    + 'animation-name: plugin-areas-under-attack-blink-blue;'
    + 'animation-iteration-count: infinite;'
    + 'animation-timing-function: ease;'
    + 'animation-duration: 1s;'
    + '}'
    + '.plugin-areas-under-attack-field-green{'
    + '-webkit-animation-name: plugin-areas-under-attack-blink-field-green;'
    + '-webkit-animation-iteration-count: infinite;'
    + '-webkit-animation-timing-function: ease;'
    + '-webkit-animation-duration: 1s;'
    + '-moz-animation-name: plugin-areas-under-attack-blink-field-green;'
    + '-moz-animation-iteration-count: infinite;'
    + '-moz-animation-timing-function: ease;'
    + '-moz-animation-duration: 1s;'
    + 'animation-name: plugin-areas-under-attack-blink-field-green;'
    + 'animation-iteration-count: infinite;'
    + 'animation-timing-function: ease;'
    + 'animation-duration: 1s;'
    + '}'
    + '.plugin-areas-under-attack-field-blue{'
    + '-webkit-animation-name: plugin-areas-under-attack-blink-field-blue;'
    + '-webkit-animation-iteration-count: infinite;'
    + '-webkit-animation-timing-function: ease;'
    + '-webkit-animation-duration: 1s;'
    + '-moz-animation-name: plugin-areas-under-attack-blink-field-blue;'
    + '-moz-animation-iteration-count: infinite;'
    + '-moz-animation-timing-function: ease;'
    + '-moz-animation-duration: 1s;'
    + 'animation-name: plugin-areas-under-attack-blink-field-blue;'
    + 'animation-iteration-count: infinite;'
    + 'animation-timing-function: ease;'
    + 'animation-duration: 1s;'
    + '}'
    + '.plugin-areas-under-attack-field-light{'
    + 'fill: #FF0000;'
    + '}'
    + '.plugin-areas-under-attack-light{'
    + 'stroke: #FF0000;'
    + '}'
  ).appendTo("head");
};

window.plugin.areasUnderAttack.setupToolbox = function() {
  $('#toolbox').append(' <a onclick="window.plugin.areasUnderAttack.showConfigDialog()" title="Show areas under attack config options">Areas under attack</a>');
};

window.plugin.areasUnderAttack.showConfigDialog = function() {
  var html = '<div>';
  html += '<p>Select style of highlighting.</p>';
  html += '<input type="radio" name="plugin-areasunderattack-style" value="disabled" onclick="window.plugin.areasUnderAttack.setStyle(\'disabled\')" ';
  if(window.plugin.areasUnderAttack.style === 'disabled') {
    html += 'checked="checked" ';
  }
  html += '/><label>Disabled</label><br/>';
  html += '<input type="radio" name="plugin-areasunderattack-style" value="static" onclick="window.plugin.areasUnderAttack.setStyle(\'static\')" ';
  if(window.plugin.areasUnderAttack.style === 'static') {
    html += 'checked="checked" ';
  }
  html += '/><label>Static (Apply red colour but no pulse effect)</label><br/>'
  html += '<input type="radio" name="plugin-areasunderattack-style" value="css3" onclick="window.plugin.areasUnderAttack.setStyle(\'css3\')" ';
  if(window.plugin.areasUnderAttack.style === 'css3') {
    html += 'checked="checked" ';
  }
  html += '/><label>CSS3 (Pulse attacked areas red)</label><br/>';
  html += '</div>';
  dialog({
    html: html,
    id: 'plugin-areasUnderAttack-options',
    title: 'Areas Under Attack Options'
  });
};

window.plugin.areasUnderAttack.setStyle = function(style) {
  window.plugin.areasUnderAttack.style = style;
  localStorage["plugin-areasUnderAttack-style"] = style;
};

/**
 * Remove all msgPortals that are older than the threshold time
 * @param thresholdTime
 */
window.plugin.areasUnderAttack.removeOldMsgPortals = function(thresholdTime) {
  var portalList = window.plugin.areasUnderAttack.msgPortalList;
  for(guid in portalList) if(portalList.hasOwnProperty(guid)) {
    var portal = portalList[guid];
    if(portal.attackTime < thresholdTime) {
      delete portalList[guid];
    }
  }
};

/**
 * Add msgPortals to the list for all new messages that signify an attack
 * @param messages
 * @param thresholdTime
 */
window.plugin.areasUnderAttack.addAttackedMsgPortals = function(messages, thresholdTime) {
  $.each(messages, function(i, message) {
    if(message[1] > thresholdTime) {
      var attackTime = message[1];
      var plext = message[2].plext;
      var msgPortal = null;
      if(plext.text.indexOf("is under attack") > -1) {
        msgPortal = plext.markup[1][1];
      } else if(plext.text.indexOf("destroyed a") > -1) {
        msgPortal = plext.markup[2][1];
      }
      if(msgPortal !== null && msgPortal !== undefined && attackTime >= thresholdTime) {
        var key = msgPortal.latE6 + "/" + msgPortal.lngE6;
        var existingMsgPortal = window.plugin.areasUnderAttack.msgPortalList[key];
        if(existingMsgPortal == undefined || existingMsgPortal.attackTime < attackTime) {
          window.plugin.areasUnderAttack.msgPortalList[key] = {
            portal: msgPortal,
            team: msgPortal.team,
            attackTime: attackTime
          };
        }
      }
    }
  });
  if(window.plugin.areasUnderAttack.portalsLoaded === true) {
    window.plugin.areasUnderAttack.mapDataRefreshed();
  }
};

/**
 * Iterate over msgPortal list, finding the guids for the corresponding portals in the messages. Determine whether they
 * are still under attack. If so, add the portal details to the main portal list for highlighting. Otherwise, remove the
 * msgPortal from its list and add the portal to a 'remove highlighting' list.
 */
window.plugin.areasUnderAttack.updateAttackedPortals = function() {
  var thresholdMillis = new Date().valueOf() - (window.plugin.areasUnderAttack.THRESHOLDMINS * 60000);
  window.plugin.areasUnderAttack.removeOldMsgPortals(thresholdMillis);
  window.plugin.areasUnderAttack.removePortalList = window.plugin.areasUnderAttack.portalList;
  window.plugin.areasUnderAttack.portalList = {};
  var msgPortalList = window.plugin.areasUnderAttack.msgPortalList;
  var removeList = [];
  for(latlng in msgPortalList) if(msgPortalList.hasOwnProperty(latlng)) {
    var msgPortalObj = msgPortalList[latlng];
    var attackTime = msgPortalObj.attackTime;
    var msgPortal = msgPortalObj.portal;
    // only add to main list if portal still under attack. If team has changed then skip.
    var guid = window.findPortalGuidByPositionE6(msgPortal.latE6, msgPortal.lngE6);
    var attackedPortal = window.plugin.areasUnderAttack.portalList[guid];
    var currentPortal = window.portals[guid];
    var attackedPortalTeam = msgPortal.team.substring(0, 1);
    if(currentPortal !== undefined) {
      var currentPortalTeam = currentPortal.options.data.team;
      if(currentPortalTeam !== 'N' && currentPortalTeam === attackedPortalTeam) {
        if(attackedPortal === undefined || attackedPortal.attackTime < attackTime) {
          window.plugin.areasUnderAttack.portalList[guid] = {
            guid: guid,
            attackTime: attackTime,
            team: msgPortal.team
          };
          if(window.plugin.areasUnderAttack.removePortalList.hasOwnProperty(guid)) {
            // portal still under attack, so dont remove highlight
            delete window.plugin.areasUnderAttack.removePortalList[guid];
          }
        }
      } else {
        removeList.push(latlng);
      }
    } else {
      removeList.push(latlng);
    }
  }
  $.each(removeList, function(i, latlng) {
    delete window.plugin.areasUnderAttack.msgPortalList[latlng];
  });
};

/**
 * (re)build list of links attached to portals that are under attack and list of links that were previously under
 * attack that need highlighting to be removed
 */
window.plugin.areasUnderAttack.refreshLinks = function() {
  window.plugin.areasUnderAttack.removeLinkList = window.plugin.areasUnderAttack.linkList;
  window.plugin.areasUnderAttack.linkList = {};
  var portalList = window.plugin.areasUnderAttack.portalList;
  for(guid in portalList) if(portalList.hasOwnProperty(guid)) {
    var portalLinks = window.getPortalLinks(guid);
    $.each(portalLinks.in, function(index, lguid) {
      window.plugin.areasUnderAttack.linkList[lguid] = window.links[lguid];
      if(window.plugin.areasUnderAttack.removeLinkList.hasOwnProperty(lguid)) {
        // link still under attack, so dont remove highlight
        delete window.plugin.areasUnderAttack.removeLinkList[lguid];
      }
    });
    $.each(portalLinks.out, function(index, lguid) {
      window.plugin.areasUnderAttack.linkList[lguid] = window.links[lguid];
      if(window.plugin.areasUnderAttack.removeLinkList.hasOwnProperty(lguid)) {
        // link still under attack, so dont remove highlight
        delete window.plugin.areasUnderAttack.removeLinkList[lguid];
      }
    });
  }
};

/**
 * (re)build list of fields attached to portals that are under attack and list of fields that were previously under
 * attack that need highlighting to be removed
 */
window.plugin.areasUnderAttack.refreshFields = function() {
  window.plugin.areasUnderAttack.removeFieldList = window.plugin.areasUnderAttack.fieldList;
  window.plugin.areasUnderAttack.fieldList = {};
  var portalList = window.plugin.areasUnderAttack.portalList;
  for(guid in portalList) if(portalList.hasOwnProperty(guid)) {
    var portalFields = window.getPortalFields(guid);
    $.each(portalFields, function(index, fguid) {
      window.plugin.areasUnderAttack.fieldList[fguid] = window.fields[fguid];
      if(window.plugin.areasUnderAttack.removeFieldList.hasOwnProperty(fguid)) {
        // field still under attack, so dont remove highlight
        delete window.plugin.areasUnderAttack.removeFieldList[fguid];
      }
    });
  }
};

/**
 * Go through attacked portal list, link list and field list, identifying the corresponding _path object and add appropriate
 * highlighting css class
 * Go through removed lists removing all highlighting classes from their _path objects
 */
window.plugin.areasUnderAttack.runHighlighters = function() {
  var portalList = window.plugin.areasUnderAttack.portalList;
  var linkList = window.plugin.areasUnderAttack.linkList;
  var fieldList = window.plugin.areasUnderAttack.fieldList;
  var removePortalList = window.plugin.areasUnderAttack.removePortalList;
  var removeLinkList = window.plugin.areasUnderAttack.removeLinkList;
  var removeFieldList = window.plugin.areasUnderAttack.removeFieldList;
  // dehighlight portals that are no longer under attack
  for(var rpguid in removePortalList) if(removePortalList.hasOwnProperty(rpguid)) {
    var rportal = window.portals[rpguid];
    if(rportal) {
      rportal._path.classList.remove("plugin-areas-under-attack-blue");
      rportal._path.classList.remove("plugin-areas-under-attack-green");
      rportal._path.classList.remove("plugin-areas-under-attack-light");
    }
  }
  // highlight attacked portals
  for(var pguid in portalList) if(portalList.hasOwnProperty(pguid)) {
    var portal = window.portals[pguid];
    if(portal) {
      if(window.plugin.areasUnderAttack.style === 'css3') {
        portal._path.classList.remove("plugin-areas-under-attack-light");
        if(portal.options.data.team === 'R') {
          portal._path.classList.add("plugin-areas-under-attack-blue");
        } else {
          portal._path.classList.add("plugin-areas-under-attack-green");
        }
      } else if(window.plugin.areasUnderAttack.style === 'static') {
        portal._path.classList.remove("plugin-areas-under-attack-blue");
        portal._path.classList.remove("plugin-areas-under-attack-green");
        portal._path.classList.add("plugin-areas-under-attack-light");
      } else {
        portal._path.classList.remove("plugin-areas-under-attack-light");
        portal._path.classList.remove("plugin-areas-under-attack-blue");
        portal._path.classList.remove("plugin-areas-under-attack-green");
      }
    }
  }
  // dehighlight links no longer under attack
  for(rlguid in removeLinkList) if(removeLinkList.hasOwnProperty(rlguid)) {
    var rlink = removeLinkList[rlguid];
    if(rlink) {
      rlink._path.classList.remove("plugin-areas-under-attack-blue");
      rlink._path.classList.remove("plugin-areas-under-attack-green");
      rlink._path.classList.remove("plugin-areas-under-attack-light");
    }
  }
  // highlight attacked links
  for(lguid in linkList) if(linkList.hasOwnProperty(lguid)) {
    var link = linkList[lguid];
    if(link) {
      if(window.plugin.areasUnderAttack.style === 'css3') {
        link._path.classList.remove("plugin-areas-under-attack-light");
        if(link.options.data.team === 'R') {
          link._path.classList.add("plugin-areas-under-attack-blue");
        } else {
          link._path.classList.add("plugin-areas-under-attack-green");
        }
      } else if(window.plugin.areasUnderAttack.style === 'static') {
        link._path.classList.add("plugin-areas-under-attack-light");
        link._path.classList.remove("plugin-areas-under-attack-blue");
        link._path.classList.remove("plugin-areas-under-attack-green");
      } else {
        link._path.classList.remove("plugin-areas-under-attack-light");
        link._path.classList.remove("plugin-areas-under-attack-blue");
        link._path.classList.remove("plugin-areas-under-attack-green");
      }
    }
  }
  // dehighlight fields no longer under attack
  for(rfguid in removeFieldList) if(removeFieldList.hasOwnProperty(rfguid)) {
    var rfield = removeFieldList[rfguid];
    if(rfield) {
      rfield._path.classList.remove("plugin-areas-under-attack-field-blue");
      rfield._path.classList.remove("plugin-areas-under-attack-field-green");
      rfield._path.classList.remove("plugin-areas-under-attack-field-light");
    }
  }
  // highlight attacked fields
  for(fguid in fieldList) if(fieldList.hasOwnProperty(fguid)) {
    var field = fieldList[fguid];
    if(field) {
      if(window.plugin.areasUnderAttack.style === 'css3') {
        field._path.classList.remove("plugin-areas-under-attack-field-light");
        if(field.options.data.team === 'R') {
          field._path.classList.add("plugin-areas-under-attack-field-blue");
        } else {
          field._path.classList.add("plugin-areas-under-attack-field-green");
        }
      } else if(window.plugin.areasUnderAttack.style === 'css3') {
        field._path.classList.add("plugin-areas-under-attack-field-light");
        field._path.classList.remove("plugin-areas-under-attack-field-blue");
        field._path.classList.remove("plugin-areas-under-attack-field-green");
      } else {
        field._path.classList.remove("plugin-areas-under-attack-field-light");
        field._path.classList.remove("plugin-areas-under-attack-field-blue");
        field._path.classList.remove("plugin-areas-under-attack-field-green");
      }
    }
  }
};

window.plugin.areasUnderAttack.chatDataLoaded = function(data) {
  //console.log("AUA: chat data refreshed, refreshing message portals")
  // get earliest time for attacks that we want to highlight
  var thresholdTime = new Date().valueOf() - (window.plugin.areasUnderAttack.THRESHOLDMINS * 60000);

  // remove portals from existing message portal list if attacked before threshold time or if portal no longer same colour as when attacked
  window.plugin.areasUnderAttack.removeOldMsgPortals(thresholdTime);

  // update message portal list from new message data
  window.plugin.areasUnderAttack.addAttackedMsgPortals(data.result, thresholdTime);
};

window.plugin.areasUnderAttack.mapDataRefreshed = function() {
  //console.log("AUA: map data refreshed, refreshing attacked portals")
  window.plugin.areasUnderAttack.portalsLoaded = true;
  window.plugin.areasUnderAttack.updateAttackedPortals();

  // refresh link list from portal list
  window.plugin.areasUnderAttack.refreshLinks();

  // refresh field list from portal list
  window.plugin.areasUnderAttack.refreshFields();

  // activate highlighters
  window.plugin.areasUnderAttack.runHighlighters();
};

var setup = function() {
  try {
    var style = localStorage["plugin-areasUnderAttack-style"];
    if(style !== undefined && style !== null) {
      window.plugin.areasUnderAttack.style = style;

    }
  } catch(e) {
    console.warn(e);
    window.plugin.areasUnderAttack.style = 'css3';
  }
  window.plugin.areasUnderAttack.setupCSS();
  window.plugin.areasUnderAttack.setupToolbox();
  window.addHook('publicChatDataAvailable', window.plugin.areasUnderAttack.chatDataLoaded);
  window.addHook('mapDataRefreshEnd', window.plugin.areasUnderAttack.mapDataRefreshed);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
