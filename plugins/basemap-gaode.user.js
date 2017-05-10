// ==UserScript==
// @id             iitc-plugin-gaode-maps
// @name           IITC plugin: Gaode maps
// @category       Map Tiles
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://mutong.moe/basemap-gaode.user.js
// @downloadURL    https://mutong.moe/basemap-gaode.user.js
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add various map layers Gaode Maps.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.mapGaode = function() {};

/////////// begin Gaode transformer /////////
var GaodeTransformer = window.plugin.mapGaode.GaodeTransformer = function() {};

GaodeTransformer.prototype.a = 6378245.0;
GaodeTransformer.prototype.ee = 0.00669342162296594323;

GaodeTransformer.prototype.transformToGcj = function(wgLat, wgLng) {

    if (this.isOutOfChina(wgLat, wgLng) || this.isInsideTaiwan(wgLat, wgLng)) {
        return {lat: wgLat, lng: wgLng};
    }

    dLat = this.transformLat(wgLng - 105.0, wgLat - 35.0);
    dLng = this.transformLng(wgLng - 105.0, wgLat - 35.0);
    radLat = wgLat / 180.0 * Math.PI;
    magic = Math.sin(radLat);
    magic = 1 - this.ee * magic * magic;
    sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * Math.PI);
    mgLat = wgLat + dLat;
    mgLng = wgLng + dLng;

    return {lat: mgLat, lng: mgLng};

};

GaodeTransformer.prototype.transformToWgs = function(gcjLat, gcjLng) {

    if (this.isOutOfChina(gcjLat, gcjLng) || this.isInsideTaiwan(gcjLat, gcjLng)) {
        return {lat: gcjLat, lng: gcjLng};
    }

    wgsLat = gcjLat;
    wgsLng = gcjLng;
    do {
        gcjL = this.transformToGcj(wgsLat, wgsLng);
        dLat = gcjL.lat - gcjLat;
        dLng = gcjL.lng - gcjLng;
        wgsLat -= dLat;
        wgsLng -= dLng;
    } while (Math.abs(dLat) > 1e-10 || Math.abs(dLng) > 1e-10);

    return {lat: wgsLat, lng: wgsLng};

};

GaodeTransformer.prototype.transformLat = function(x, y) {
    var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
};

GaodeTransformer.prototype.transformLng = function(x, y) {
    var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
};

GaodeTransformer.prototype.isOutOfChina = function(lat, lng) {
    if (lng < 72.004 || lng > 137.8347) return true;
    if (lat < 0.8293 || lat > 55.8271) return true;
    return false;
};

GaodeTransformer.prototype.isInsideTaiwan = function(lat, lng) {
    return (21.8056 < lat && lat < 25.3637 && 119.9914 < lng && lng < 122.1849);
};

/////////// end Gaode transformer /////////

var gaodeTransformer = new GaodeTransformer();

window.plugin.mapGaode.setupGaodeLayer = function() {

    L.GaodeLayer = L.TileLayer.extend({

        options: {
            subdomains: ['1', '2', '3', '4'],
            maxZoom: 19,
            detectRetina: true,
            attribution: '© <a href="https://gaode.com">高德地图</a>'
        },

        _getTilePos: function (tilePoint) {

            var origin = this._map.getPixelOrigin(),
                tileSize = this._getTileSize();

            ori = this._map._getCenterLayerPoint();
            latLng = this._map.layerPointToLatLng(ori);
            latLng = gaodeTransformer.transformToWgs(latLng.lat, latLng.lng);
            dst = this._map.latLngToLayerPoint(new L.LatLng(latLng.lat, latLng.lng));

            tilePos = tilePoint.multiplyBy(tileSize).subtract(origin).subtract(ori.subtract(dst));

            return tilePos;

        },

        _update: function() {

            if (!this._map) { return; }

            var map = this._map,
                bounds = map.getPixelBounds(),
                zoom = map.getZoom(),
                tileSize = this._getTileSize();

            if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
                return;
            }

            ori = this._map._getCenterLayerPoint();
            latLng = this._map.layerPointToLatLng(ori);
            latLng = gaodeTransformer.transformToWgs(latLng.lat, latLng.lng);
            dst = this._map.latLngToLayerPoint(new L.LatLng(latLng.lat, latLng.lng));
            bounds = L.bounds(
                bounds.min.subtract(dst.subtract(ori)),
                bounds.max.subtract(dst.subtract(ori))
            );

            var tileBounds = L.bounds(
                    bounds.min.divideBy(tileSize)._floor(),
                    bounds.max.divideBy(tileSize)._floor());

            this._addTilesFromCenterOut(tileBounds);

            if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
                this._removeOtherTiles(tileBounds);
            }

        }

    });

    L.gaodeLayer = function(url, options) {
        return new L.GaodeLayer(url, options);
    };

};

window.plugin.mapGaode.setup = function() {

    window.plugin.mapGaode.setupGaodeLayer();

    var gaodeSat = L.gaodeLayer('http://wprd0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {type: 'SATELLITE'});
    layerChooser.addBaseLayer(gaodeSat, 'Gaode Satellite');

    var gaodeRoad = L.gaodeLayer('http://wprd0{s}.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}', {type: 'ROADS'});
    layerChooser.addBaseLayer(gaodeRoad, 'Gaode Roads');

    var gaodeHybrid = L.layerGroup([
        L.gaodeLayer('http://wprd0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {type: 'SATELLITE'}),
        L.gaodeLayer('http://wprd0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {type: 'TRANSPARENT', opacity: 0.75})
    ]);
    layerChooser.addBaseLayer(gaodeHybrid, 'Gaode Hybrid');

};

var setup = window.plugin.mapGaode.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
