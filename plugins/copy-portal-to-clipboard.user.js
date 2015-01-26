// ==UserScript==
// @id             iitc-plugin-copy-portal-to-clipboard@tapion
// @name           IITC plugin: Copy portal to clipboard
// @category       Tweaks
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Copy portal name and links in the clipboard and paste it in Hangout to your agents. When you press CTRL+C and a portal is selected, IITC will copy a usefull string in your clipboard: portal name, intel link, GMaps link. This is a very usefull feature for Intel OP who wants to send a portal direction to ground agents.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.copyPortalToClipboard = function() {};

window.plugin.copyPortalToClipboard.TrelloClipboard = function() {

  // CREDITS: https://gist.github.com/raincoat/6062760
  var me = this;

  var utils = {
    nodeName: function (node, name) {
      return (node.nodeName.toLowerCase() === name);
    }
  };
  var textareaId = 'simulate-trello-clipboard',
    containerId = textareaId + '-container',
    container, textarea;
  var createTextarea = function () {
    container = document.querySelector('#' + containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.setAttribute('style', [, 'position: fixed;', 'left: 0px;', 'top: 0px;', 'width: 0px;', 'height: 0px;', 'z-index: 100;', 'opacity: 0;'].join(''));
      document.body.appendChild(container);
    }
    container.style.display = 'block';
    textarea = document.createElement('textarea');
    textarea.setAttribute('style', [, 'width: 1px;', 'height: 1px;', 'padding: 0px;'].join(''));
    textarea.id = textareaId;
    container.innerHTML = '';
    container.appendChild(textarea);
    textarea.appendChild(document.createTextNode(me.value));
    textarea.focus();
    textarea.select();
  };

  var keyDonwMonitor = function (e) {
    var code = e.keyCode || e.which;
    if (!(e.ctrlKey || e.metaKey)) {
      return;
    }
    var target = e.target;
    if (utils.nodeName(target, 'textarea') || utils.nodeName(target, 'input')) {
      return;
    }
    if (window.getSelection && window.getSelection() && window.getSelection().toString()) {
      return;
    }
    if (document.selection && document.selection.createRange().text) {
      return;
    }
    setTimeout(createTextarea, 0);
  };

  var keyUpMonitor = function (e) {
    var code = e.keyCode || e.which;
    if (e.target.id !== textareaId) {
      return;
    }
    container.style.display = 'none';
  };

  document.addEventListener('keydown', keyDonwMonitor);
  document.addEventListener('keyup', keyUpMonitor);
};

window.plugin.copyPortalToClipboard.TrelloClipboard.prototype.setValue = function (value) {
  this.value = value;
};


window.plugin.copyPortalToClipboard.clipboard = function clipboard(guid) {
  var portal = window.portals[window.selectedPortal];
  if(portal) {
    var name = portal.options.data.title;
    var lat = portal.options.data.latE6/1E6;
    var lon = portal.options.data.lngE6/1E6;
    var intel_link = 'https://ingress.com/intel?ll='+lat+','+lon+'&z=17&pll='+lat+','+lon;
    var gmaps_link = 'https://maps.google.com/maps?ll='+lat+','+lon+'&q='+lat+','+lon+'%20('+encodeURIComponent(name)+')/';
    var clipboard = ''+name+"\n"+intel_link+"\n"+gmaps_link+'';
    window.plugin.copyPortalToClipboard.clip.setValue(clipboard);
  }
}

window.plugin.copyPortalToClipboard.setup  = function() {

  window.plugin.copyPortalToClipboard.clip = new window.plugin.copyPortalToClipboard.TrelloClipboard();
  window.addHook('portalSelected', window.plugin.copyPortalToClipboard.clipboard);

};

var setup =  window.plugin.copyPortalToClipboard.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
