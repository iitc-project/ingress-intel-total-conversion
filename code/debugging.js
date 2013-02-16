
// DEBUGGING TOOLS ///////////////////////////////////////////////////
// meant to be used from browser debugger tools and the like.

window.debug = function() {}

window.debug.renderDetails = function() {
  console.log('portals: ' + Object.keys(portals).length);
  console.log('links:   ' + Object.keys(links).length);
  console.log('fields:  ' + Object.keys(fields).length);
}

window.debug.printStackTrace = function() {
  var e = new Error('dummy');
  console.log(e.stack);
  return e.stack;
}

window.debug.clearPortals = function() {
  for(var i = 0; i < portalsLayers.length; i++)
    portalsLayers[i].clearLayers();
}

window.debug.clearLinks = function() {
  linksLayer.clearLayers();
}

window.debug.clearFields = function() {
  fieldsLayer.clearLayers();
}

window.debug.getFields = function() {
  return fields;
}

window.debug.forceSync = function() {
  localStorage.clear();
  window.playersToResolve = [];
  window.playersInResolving = [];
  debug.clearFields();
  debug.clearLinks();
  debug.clearPortals();
  updateGameScore();
  requestData();
}

window.debug.console = function() {
  $('#debugconsole').text();
}

window.debug.console.create = function() {
  if($('#debugconsole').length) return;
  $('#chatcontrols').append('<a>debug</a>');
  $('#chatcontrols a:last').click(function() {
    $('#chatinput mark').css('cssText', 'color: #bbb !important').text('debug:');
    $('#chat > div').hide();
    $('#debugconsole').show();
    $('#chatcontrols .active').removeClass('active');
    $(this).addClass('active');
  });
  $('#chat').append('<div id="debugconsole" style="display: none"></div>');
}

window.debug.console.renderLine = function(text, errorType) {
  debug.console.create();
  switch(errorType) {
    case 'error':   var color = '#FF424D'; break;
    case 'warning': var color = '#FFDE42'; break;
    case 'alert':   var color = '#42FF90'; break;
    default:        var color = '#eee';
  }
  if(typeof text !== 'string' && typeof text !== 'number') text = JSON.stringify(text);
  var d = new Date();
  var ta = d.toLocaleTimeString(); // print line instead maybe?
  var tb = d.toLocaleString();
  var t = '<time title="'+tb+'" data-timestamp="'+d.getTime()+'">'+ta+'</time>';
  var s = 'style="color:'+color+'"';
  var l = '<tr><td>'+t+'</td><td><mark '+s+'>'+errorType+'</mark></td><td>'+text+'</td></tr>';
  $('#debugconsole').prepend(l);
}

window.debug.console.log = function(text) {
  debug.console.renderLine(text, 'notice');
}

window.debug.console.warn = function(text) {
  debug.console.renderLine(text, 'warning');
}

window.debug.console.error = function(text) {
  debug.console.renderLine(text, 'error');
}

window.debug.console.alert = function(text) {
  debug.console.renderLine(text, 'alert');
}

window.debug.console.overwriteNative = function() {
  window.debug.console.create();
  window.console = function() {}
  window.console.log = window.debug.console.log;
  window.console.warn = window.debug.console.warn;
  window.console.error = window.debug.console.error;
  window.alert = window.debug.console.alert;
}

window.debug.console.overwriteNativeIfRequired = function() {
  if(!window.console || L.Browser.mobile)
    window.debug.console.overwriteNative();
}
