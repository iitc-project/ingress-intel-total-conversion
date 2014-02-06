// ==UserScript==
// @id             iitc-plugin-draw-range
// @name           IITC plugin: Draw Range
// @category       Layer
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      drawRange
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Draw the range circles for modified portal levels!
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.drawRange = function() {};

window.plugin.drawRange.setupCallback = function() {
    addHook('portalDetailsUpdated', window.plugin.drawRange.addLink);
}

window.plugin.drawRange.addLink = function(d) {
  $('.linkdetails').append('<aside><a onclick="window.plugin.drawRange.rangeOpt(\''+window.selectedPortal+'\')" title="Draw Range Circle">Draw Range Circle</a></aside>');
}

var resoLevels = new Array()
var linkAmps = new Array()
var FinalRange = 0;

window.plugin.drawRange.rangeOpt = function(guid) {
  if (!window.portals[guid]) {
    console.warn ('Error: failed to find portal details for guid '+guid);
    return;
  }

  var data = window.portals[guid].options.data;
 
  var title = 'Draw Range Options';
  
  var details = portalDetail.get(guid);

  for (var i = 0; i < 8; i++){
	resoLevels[i] = (details.resonatorArray.resonators[i] ? details.resonatorArray.resonators[i].level : 0)
  }
  
  var LA = getPortalModsByType(details, 'LINK_AMPLIFIER');
  for (var i = 0; i < 4; i++){
	linkAmps[i] = (LA[i] ? LA[i].rarity : "None");
  }
  
  var body = '<div id="DrawRangeOptionsBox"><table id="DrawRangeOptionsTable"><tr><th colspan="3">'
  body += (data.title || '<no title>');
  body += '</th></tr><tr>';
  
  //Resonator drop downs, defaulted to current values
  body += '<td><table id="DrawRangeResoTable">'
  for (var i = 0; i < resoLevels.length; i++){
	body += window.plugin.drawRange.genResoTableRow(i,resoLevels[i]);
  }
  body += '</table></td>'
  
  //Link Amps
  body += '<td><table id="DrawRangeLinkAmpTable">'
  for (var i = 0; i < linkAmps.length; i++){
	body += window.plugin.drawRange.genLinkAmpTableRow(i,linkAmps[i]);
  }
  body += '</table></td>'
  
  //Summary of current options
  body += '<td><div id="DrawRangeCurrentValues">';
  body += window.plugin.drawRange.getCurrentValues();  
  body += '</div></td>';
  
  //table finish
  body += '</tr></table></div>';

  dialog({
    title: title,
    html: body,
    id: 'dialog-drawRange',
    dialogClass: 'ui-dialog-drawRange',
	buttons:{
		'DRAW': function(){
			window.plugin.drawRange.draw(guid);
		}
	}
  });
}

window.plugin.drawRange.getLABoost = function(){
	var scale = [1.0, 0.25, 0.125, 0.125];
	var boost = 0.0;
	var count = 0;
	
	$.each(linkAmps, function(ind, type){
		var thisBoost = window.plugin.drawRange.getLARange(type);
		boost += thisBoost*scale[count];
		if(thisBoost > 0){
			count++;
		}
	});
	
	return (count > 0) ? boost : 1.0;
}

window.plugin.drawRange.getLARange = function(LA){
	var Ranges = {
		None : 0,
		RARE : 2,
		VERY_RARE : 7
		//TODO - confirm very rare
		}
	
	var multiplier = 0;
	$.each(Ranges, function(type, range){
		if (LA == type){
			multiplier = range;
			return false;
		}
	});
	return multiplier;	
}

window.plugin.drawRange.getCurrentValues = function(){
	var valueTable = '<table><tr><th colspan="2">Current values:</th><tr>'
	
	var CurrentLevel = window.plugin.drawRange.getCurrentLevel();
	var BaseRange = 160*Math.pow(CurrentLevel,4);
	var LABoost = window.plugin.drawRange.getLABoost();
	FinalRange = BaseRange*LABoost;
	
	valueTable += '<tr><td>Portal Level:</td><td>'+CurrentLevel+'</td></tr>';
	valueTable += '<tr><td>Base Range:</td><td>'+window.plugin.drawRange.numberWithCommas(Math.floor(BaseRange))+'m</td></tr>';
	valueTable += '<tr><td>Boost Multiplier:</td><td>'+LABoost+'</td></tr>';
	valueTable += '<tr><td>Final Range:</td><td>'+window.plugin.drawRange.numberWithCommas(Math.floor(FinalRange))+'m</td><tr>';
	valueTable += '</table>';
	return valueTable;
}

window.plugin.drawRange.getCurrentLevel = function(){
	var lvl = 0;
	$.each(resoLevels, function(ind,value){
		lvl += parseInt(value);
	});
	return lvl/8;
}

window.plugin.drawRange.genResoTableRow = function(resoNum, resoLevel){
	var row = '<tr><td><select id="Reso'+resoNum+'" onchange="window.plugin.drawRange.resoChange('+resoNum+',this)">';
	for (var i=0; i <= 8; i++){
		row += '<option value="'+i+'"'+(resoLevel == i ? ' selected' : '')+'>'+i+'</option>'
	}
	row += '</select></td></tr>'
	return row;
}

window.plugin.drawRange.genLinkAmpTableRow = function(LANum, LAtype){
	var possibleLATypes = ["None","RARE","VERY_RARE"];
	
	var row = '<tr><td><select id="LA'+LANum+'" onchange="window.plugin.drawRange.LAChange('+LANum+',this)">';
	for (var i=0; i < possibleLATypes.length; i++){
		row += '<option value="'+possibleLATypes[i]+'"'+(LAtype == possibleLATypes[i] ? ' selected' : '')+'>'+possibleLATypes[i]+'</option>';
	}
	row += '</select></td></tr>';
	return row;
}

window.plugin.drawRange.numberWithCommas = function(n){
	//thanks to http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
	return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

window.plugin.drawRange.LAChange = function(LANum, sel){
	linkAmps[LANum] = sel.options[sel.selectedIndex].value;
	$('#DrawRangeCurrentValues').html(window.plugin.drawRange.getCurrentValues());
}

window.plugin.drawRange.resoChange = function(resoNum,sel){
	resoLevels[resoNum] = parseInt(sel.options[sel.selectedIndex].value);
	$('#DrawRangeCurrentValues').html(window.plugin.drawRange.getCurrentValues());
}

window.plugin.drawRange.draw = function(guid){
	//TODO implement check to see if draw tools are installed
	var latlng = window.portals[guid].getLatLng();
	var newitem;
	newitem = L.geodesicCircle(latlng, FinalRange, {
		fill: false,
		color: 'brown',
		weight: 3
		});

	newitem.addTo(window.plugin.drawTools.drawnItems);
	window.plugin.drawTools.save();

	if(!map.hasLayer(window.plugin.drawTools.drawnItems)) {
	map.addLayer(window.plugin.drawTools.drawnItems);
	//TODO circles have a file when IITC is reloaded...
	}

}

 window.plugin.drawRange.setupCSS = function() {
    $('<style>').prop('type', 'text/css').html('<style>' +
      '.ui-dialog-drawRange {' +
        'width: auto !important;' +
        'min-width: 400px !important;' +
    '}' +
      '#dialog-drawRange {' +
        'overflow-x: auto;' +
        'overflow-y: auto;' +
    '}' +
    '</style>').appendTo('head');
  }
 

var setup = function () {
  window.plugin.drawRange.setupCallback();
  window.plugin.drawRange.setupCSS();
}


// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@