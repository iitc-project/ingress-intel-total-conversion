//******************************
//******************************
//******** INSTRUCTIONS ********
//******************************
//******************************

// 1. Go to the www.cloudmade.com website and register an account
// 2. Get an API Key
// 3. Edit the code below, replace YOUR_API_KEY with the API key from CloudMade.com
// 4. Reload the page
// optional: browse their map styles, add/modify any you like to the cmStyles list

// You take your own responsibility for any API key you register and use. Please read
// any relevant terms and conditions. At the time of writing, Cloudmade offers a reasonable
// number of free requests, which should be more than enough for personal use. You could
// probably share a key with a group of people without issues, but it is your responsibility
// to remain within any terms and usage limits.

//******************************
//******************************
//******************************


// ==UserScript==
// @id             iitc-plugin-cloudmade-maps
// @name           IITC plugin: CloudMade.com maps
// @category       Map Tiles
// @version        0.0.2
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    TEMPLATE PLUGIN - add back the CloudMade.com map layers. YOU WILL NEED TO EDIT THIS PLUGIN BEFORE IT WILL RUN
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.mapTileCloudMade = function() {};

window.plugin.mapTileCloudMade.setup = function() {
  //**********************************
  //**********************************
  //**** CloudMade settings start ****
  //**********************************
  //**********************************

  //set this to your API key - get an API key by registering at www.cloudmade.com
  //e.g. var cmApiKey = '8ee2a50541944fb9bcedded5165f09d9';
  var cmApiKey = 'YOUR_API_KEY';

  //the list of styles you'd like to see
  var cmStyles = {
    '998': "Pale Dawn",
    '999': "Midnight",
    '22677': "Minimal",
    '27169': "Amused",
    '78603': "Armageddon",
  };

  //**********************************
  //**********************************
  //****  CloudMade settings end  ****
  //**********************************
  //**********************************


  if(cmApiKey=='YOUR_API_KEY') {
    dialog({title: 'CloudMade.com map plugin', text: 'The CloudMade.com plugin needs manual configuration. Edit the plugin code to do this.'});
    return;
  }

  var osmAttribution = 'Map data © OpenStreetMap contributors';
  var cmOpt = {attribution: osmAttribution+', Imagery © CloudMade', maxZoom: 18, apikey: cmApiKey};

  $.each(cmStyles, function(key,value) {
    cmOpt['style'] = key;
    var cmMap = new L.TileLayer('http://{s}.tile.cloudmade.com/{apikey}/{style}/256/{z}/{x}/{y}.png', cmOpt);
    layerChooser.addBaseLayer(cmMap, 'CloudMade '+value);
  });

};

var setup = window.plugin.mapTileCloudMade.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
