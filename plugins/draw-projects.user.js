// ==UserScript==
// @id             iitc-plugin-draw-projects@zaso
// @name           IITC plugin: Draw Projects
// @category       Layer
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Create separated projects for your drawn elements.
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
window.plugin.drawProjects = function() {};

window.plugin.drawProjects.PREKEY = 'plugin-draw-tools-layer';
window.plugin.drawProjects.projects = [];

window.plugin.drawProjects.scanStorage = function() {
  for(field in window.localStorage) {
    if(field.includes(window.plugin.drawProjects.PREKEY)) {
      window.plugin.drawProjects.projects.push(field);
    }
  }
}

// Format the string
window.plugin.drawProjects.fieldToName = function(field) {
  var name = field;
  name = name.replace(window.plugin.drawProjects.PREKEY, '');
  name = name.replace(/___/g, ' ');
  return name;
}
window.plugin.drawProjects.nameToField = function(name) {
  var field = name;
  field = field.replace(/ /g, '___');
  field = window.plugin.drawProjects.PREKEY+field;
  return field;
}
window.plugin.drawProjects.escapeHtml = function(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, '&#47;')
    .replace(/\\/g, '&#92;');
}

//---------------------------------------------------------------------------------------

window.plugin.drawProjects.clearAndDraw = function() {
  window.plugin.drawTools.drawnItems.clearLayers();
  window.plugin.drawTools.load();
  console.log('DRAWTOOLS: reset all drawn items');
  runHooks('pluginDrawTools', {event: 'clear'});
}

window.plugin.drawProjects.createNewProject = function() {
  var rawName = $('#drawProjectsManager input').val();
  if(rawName != '') {
    rawName = window.plugin.drawProjects.escapeHtml(rawName);

    var field = window.plugin.drawProjects.nameToField(rawName);;
    var name = window.plugin.drawProjects.fieldToName(field);;

    window.plugin.drawProjects.projects.push(field);
    localStorage[field] = '';
    $('#drawProjects select').append('<option value="'+field+'">'+name+'</option>');
    $('#drawProjectsManager input').val('');
  }
}

window.plugin.drawProjects.switchProject = function() {
  var namePrj = $('#drawProjects select').val();
  window.plugin.drawTools.storageKEY = namePrj;
  window.plugin.drawProjects.clearAndDraw();
}

window.plugin.drawProjects.deleteProject = function() {
  var id = $('#drawProjects select').val();
  if(id != window.plugin.drawProjects.PREKEY) {
    var index = window.plugin.drawProjects.projects.indexOf(id);

    $('#drawProjects select option[value = "'+id+'"]').remove();
    delete localStorage[id];
    if(index >= 0) { window.plugin.drawProjects.projects.splice(index, 1); }

    window.plugin.drawTools.storageKEY = window.plugin.drawProjects.PREKEY;
    window.plugin.drawProjects.clearAndDraw();
  }
}

//---------------------------------------------------------------------------------------

window.plugin.drawProjects.openDrawOptBox = function(data) {
  if(data.event == 'openOpt') {
    console.log(data);

    $('#dialog-plugin-drawtools-options').append('<div id="drawProjectsManager"></div>');
    $('#drawProjectsManager')
        .append('<h4>Draw Projects</h4>')
        .append('<div id="expProjAdd"><input placeholder="Insert new draw project name" /><a onclick="window.plugin.drawProjects.createNewProject();return false">Add</a></div>')
        .append('<a id="expProjDel" onclick="window.plugin.drawProjects.deleteProject();return false;">Delet current projects</a>');
  }
}

window.plugin.drawProjects.appendBox = function() {
  $('#sidebar').append('<div id="drawProjects"></div>');
  $('#drawProjects').append('<select title="Draw Projects List. Opt in \'DrawTools Opt\'" onchange="window.plugin.drawProjects.switchProject();return false;"></select>')
  window.plugin.drawProjects.appendProjects();
}

window.plugin.drawProjects.appendProjects = function() {
  $('#drawProjects select option').remove();
  var projects = window.plugin.drawProjects.projects;

  projects.forEach(function(prj) {
    var name = prj.replace(window.plugin.drawProjects.PREKEY, '');
    if(name == '') { name = 'Stock Draw Project';}
    $('#drawProjects select').append('<option value="'+prj+'">'+window.plugin.drawProjects.fieldToName(name)+'</option>');
  });
}

window.plugin.drawProjects.setupCSS = function() {
  $("<style>").prop("type", "text/css").html(''
    +'#drawProjects{border:2px solid #20A8B1;border-width:2px 0;}'
    +'#drawProjects select{border-right:1px solid #20A8B1;height:33px;color:#ffce00;border:none;width:100%;background:rgba(0,0,0,.3);}'
    +'#drawProjects select option{background:#0E3C46;}'

    +'#drawProjectsManager *{color:#ffce00;text-align:center;box-sizing:border-box;box-sizing:border-box;height:23px;}'
    +'#drawProjectsManager h4{margin:15px 0 6px;}'
    +'#drawProjectsManager div#expProjAdd a,#drawProjectsManager a#expProjDel{display:block;border:1px solid #ffce00;padding:3px 0;margin:10px auto;width:80%;background:rgba(8,48,78,.9);}'
    +'#drawProjectsManager div#expProjAdd *{float:left;}'
    +'#drawProjectsManager div#expProjAdd{width:80%;margin:0 10%;}'
    +'#drawProjectsManager div#expProjAdd input{border:1px solid #ffce00;padding:3px 0;width:80%;background:rgba(8,48,78,.9);text-align:left;text-indent:7px;}'
    +'#drawProjectsManager div#expProjAdd a{width:20%;margin:0;border-left:none;}'
    +'#drawProjectsManager a#expProjDel{clear: both;}'
  ).appendTo("head");
}

var setup = function() {
  if($.inArray('pluginDrawTools', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginDrawTools'); }
  window.addHook('pluginDrawTools', window.plugin.drawProjects.openDrawOptBox);

  window.plugin.drawProjects.setupCSS();
  window.plugin.drawProjects.scanStorage();
  window.plugin.drawProjects.appendBox();
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
