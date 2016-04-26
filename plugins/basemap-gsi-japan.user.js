// ==UserScript==
// @id             iitc-plugin-basemap-gsi-japan
// @name           IITC plugin: GSI map tiles (Japan Only)
// @category       Map Tiles
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the Geospatial Information Authority of Japan map tiles as an optional layer. Available only in Japan.
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


/*
Map data © 国土地理院 (The Geospatial Information Authority of Japan)

The bathymetric contours are derived from those contained within the GEBCO 
Digital Atlas, published by the BODC on behalf of IOC and IHO (2003) 
(http://www.gebco.net)

海上保安庁許可第２２２５１０号（水路業務法第２５条に基づく類似刊行物）

GSI's terms of use: http://www.gsi.go.jp/ENGLISH/page_e30286.html

> The Terms of Use are compatible with the Creative Commons Attribution 
> License 4.0 (hereinafter referred to as the CC License). This means that 
> Content based on the Terms of Use may be used under the CC License in 
> lieu of the Terms of Use.
*/

// use own namespace for plugin
    
window.plugin.mapTileGsiJapan = {
  addLayer: function() {

    // Register the GSI map tiles as a layer.

    var gsiLayer = new L.TileLayer(
      'http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', 
      {
        attribution:   'Map data © <a href="http://www.gsi.go.jp/ENGLISH/index.html">国土地理院</a>',
        minZoom:       5,
        maxZoom:       21,
        maxNativeZoom: 18,
        detectRetina:  true,
      });
    layerChooser.addBaseLayer(gsiLayer, 'GSI of Japan');
  },
};

var setup = window.plugin.mapTileGsiJapan.addLayer;


// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
