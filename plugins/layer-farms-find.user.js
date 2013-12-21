// ==UserScript==
// @id             iitc-plugin-farms@949
// @name           IITC plugin: Show farms by level
// @category       Info
// @version        1.4.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Find farms by minimum level.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

//CHANGELOG
/*
v1.3.0
Added mobile support

v1.2.1
Fixed dropdown location overlap

v1.2.0
Circle is sent to back on mouseover
Clicking on circle displays portal counts for farm (including portals of level lower than farm)

v1.1.2
Fixed the portal counts (shown in console)

v1.1.1
Changed circle stroke weight and opacity, making it easier to see when zoomed out.

v1.1.0
Changed radius function and center function - 
Center is now the midpoint of the max and min long and lat coords
Radius is distance from center to furthest portal (i.e., now the circle will be limited to portals in the farm)

*/



@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.farmFind = function() {};

window.plugin.farmFind.getNearbyPortalCount = function(portal){
    
    var circle = new google.maps.Circle();
    var center = new google.maps.LatLng(portal.getLatLng().lat, portal.getLatLng().lng);
    circle.setCenter(center);
    circle.setRadius(window.plugin.farmFind.Radius);

    
    var nearby8Portals = 0;
    
    $.each(window.portals, function(i, otherPortal) {
        var thisPortal = new google.maps.LatLng(otherPortal.getLatLng().lat, otherPortal.getLatLng().lng);
      	 if (circle.getBounds().contains(thisPortal))
             if (otherPortal.options.level >= window.plugin.farmFind.minLevel) nearby8Portals++;
    });
    //console.log(nearby8Portals);         
    return nearby8Portals;
};

window.plugin.farmFind.checkPortals = function(){
    possibleFarmPortals = [];
    window.plugin.farmFind.levelLayerGroup.clearLayers();
    //console.log(window.portals.length);
	$.each(window.portals, function(i, portal) {
        
		if (window.plugin.farmFind.getNearbyPortalCount(portal) > window.plugin.farmFind.minNearby)
        {
         	//console.log("Farm identified");
            possibleFarmPortals.push(portal);
        }
	});
    console.log("Farm Portals: " + possibleFarmPortals.length);
    var farms = [];
    for (i = 0; i< possibleFarmPortals.length;i++)
    {
        //console.log("Checking portal " + i);
     	var thisPortal = possibleFarmPortals[i];
        var alreadyInFarm = false;
        for (x = 0; x< farms.length;x++)
        {
            //console.log(alreadyInFarm);
         	if (thisPortal in farms[x]) alreadyInFarm = true;
        }
        
        //console.log("Portal " + i + " already in farm: " + alreadyInFarm);
        
        if (!alreadyInFarm)
        {
            var portalsInFarm = [];
        	var circle = new google.maps.Circle();
    		var center = new google.maps.LatLng(thisPortal.getLatLng().lat, thisPortal.getLatLng().lng);
    		circle.setCenter(center);
    		circle.setRadius(window.plugin.farmFind.Radius);
            portalsInFarm.push(thisPortal);
            for (p = 0; p< possibleFarmPortals.length;p++)
            {
                //console.log("Checking distance from portal " + p);
                var portalLoc = new google.maps.LatLng(possibleFarmPortals[p].getLatLng().lat, possibleFarmPortals[p].getLatLng().lng);
                
                var farmIndex = 0;
             	if (circle.getBounds().contains(portalLoc) && possibleFarmPortals[p] != thisPortal)
                {
                    var alreadyInAnotherFarm = false;
                    for (x = 0; x< farms.length;x++)
        			{
            			//console.log(alreadyInFarm);
                        for (o = 0; o< farms[x].length; o++)
                        {
                            if (possibleFarmPortals[p] == farms[x][o])
                        	{
                            	//console.log("Portal " + p + " in farm " + (x+1) + " at index " + o);
                            	alreadyInAnotherFarm = true;
                        		farmIndex = x;
                        	}
                        }
         				
                       
        			}
                    
                    //console.log("Already in another farm: " + alreadyInAnotherFarm);
                    
                    if (alreadyInAnotherFarm == false)
                    {
                        //console.log("Farm " + (farms.length + 1) + " adding portal " + p);
                    	portalsInFarm.push(possibleFarmPortals[p]);
                    }
                    else
                    {
                     	//hmmm... portal is in range, but portal is in another farm, so let's extend this farm
                        for(prt = 0; prt < portalsInFarm.length; prt++)
                        {
                         	   farms[farmIndex].push(portalsInFarm[prt]);
                        }
                        
                        //console.log("Farm " + (farmIndex + 1) + " now has " + farms[farmIndex].length + " portals");
                        p = 6000;
                    }
                }
            }
            
            if (!alreadyInAnotherFarm)
            {
                farms.push(portalsInFarm);
                //console.log("Farm " + (farms.length) + ": " + portalsInFarm.length + " portals");
            };
        }
    }
    
    //console.log(farms.length);
    for (i = 0; i < farms.length; i++)
    {
        farms[i] = findUnique(farms[i]);
        console.log("Farm " + (i+1) + ": " + farms[i].length + " portals");
        
    }
    //console.log(farms);
    
    
    
    window.plugin.farmFind.drawnItems = new L.FeatureGroup();
    
    
    for (farm = 0; farm < farms.length; farm++)
    {
    	window.plugin.farmFind.drawCircle(farms[farm]);
    }
    
    
};
    
    findUnique = function(farm) {
        var unique = [];
        for(p = 0; p < farm.length; p++)
        {
            //console.log(farm[p].options.guid);
        	var found = false;
            for (u = 0; u < unique.length; u++)
            {
                //console.log(unique[u].options.guid);
             	if (farm[p].options.guid == unique[u].options.guid)
                    found = true;
            }
            if (!found)
                unique.push(farm[p]);
        }
        
        return unique;
}
    
window.plugin.farmFind.drawCircle = function(farm)
{
	var latArray = [];
	var lngArray = [];
    var countArray = [];
	//console.log("Find Center");
	for (p = 0; p < farm.length; p++)
    {
		latArray.push(farm[p].getLatLng().lat);
		lngArray.push(farm[p].getLatLng().lng);
	    var level = Math.floor(farm[p].options.level);
        if (countArray[level] == null)
            countArray[level] = 0;
        countArray[level]++;
    }
    
    console.log(countArray);
    var popupMsg = "Portal Count<br>";
    for (i = 1; i < 9; i++)
    {
     	if (countArray[i] != null)
            popupMsg += "Level " + i + ": " + countArray[i] + "<br>";
    }
	
	var north = Math.max.apply(null, lngArray);
	var south = Math.min.apply(null, lngArray);
	var east = Math.max.apply(null, latArray);
	var west = Math.min.apply(null, latArray);
	
	var center = new google.maps.LatLng(((east + west) / 2), ((north + south) / 2));
	//console.log(center);
    //console.log("Find Radius");
	var radius = 0;
	for (p = 0; p < farm.length; p++)
	{
		var temp = center.distanceFrom(farm[p].getLatLng());
		if (temp > radius)
			radius = temp;
	}
    
    //console.log(radius);
	//((20 - map._zoom) * 1000) / map._zoom
    
	var latlng = new L.LatLng(center.lat(), center.lng());
    //console.log("latlng: " + latlng);
    var optCircle = {color:'red',opacity:0.7,fill:true,fillColor:'red',fillOpacity:0.7,weight:15,clickable:true};
    var circle = new L.Circle(latlng, radius, optCircle);
    circle.bindPopup(popupMsg);
    
    
    circle.on('mouseover', function(e) {
   		circle.bringToBack();
	});
    circle.on('click', function(e) {
    	circle.bringToBack();
	});
    //console.log("circle: " + circle);
    circle.addTo(window.plugin.farmFind.levelLayerGroup);
};
    
    google.maps.LatLng.prototype.distanceFrom = function(newLatLng) {
        
   // setup our variables
   var lat1 = this.lat();
   var radianLat1 = lat1 * ( Math.PI  / 180 );
        
   var lng1 = this.lng();
   var radianLng1 = lng1 * ( Math.PI  / 180 );
        
   var lat2 = newLatLng.lat;
   var radianLat2 = lat2 * ( Math.PI  / 180 );
        
   var lng2 = newLatLng.lng;
   var radianLng2 = lng2 * ( Math.PI  / 180 );
        
   // sort out the radius, MILES or KM?
   var earth_radius = 6378.1; // (km = 6378.1) OR (miles = 3959) - radius of the earth
 
   // sort our the differences
   var diffLat =  ( radianLat1 - radianLat2 );
   var diffLng =  ( radianLng1 - radianLng2 );
   // put on a wave (hey the earth is round after all)
   var sinLat = Math.sin( diffLat / 2  );
   var sinLng = Math.sin( diffLng / 2  ); 
 
   // maths - borrowed from http://www.opensourceconnections.com/wp-content/uploads/2009/02/clientsidehaversinecalculation.html
   var a = Math.pow(sinLat, 2.0) + Math.cos(radianLat1) * Math.cos(radianLat2) * Math.pow(sinLng, 2.0);
 
   // work out the distance
   var distance = earth_radius * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
 	
   // return the distance
   return distance * 1000;
};
    
    window.plugin.farmFind.setupCSS = function() {
        $('<style>').prop('type', 'text/css').html(''
            + '#farm_level_select {'
            + ' position: absolute;'
            + ' top: 5px;'
            + ' left:180px;'
            + ' z-index: 2500;'
            + ' font-size:11px;'
            + ' font-family: "coda",arial,helvetica,sans-serif;'
            + ' background-color:#0E3C46;'
            + ' color:#ffce00;'
            + '}\n').appendTo('head');
	};

    window.plugin.farmFind.setupSmartCSS = function() {
        $('<style>').prop('type', 'text/css').html(''
            + '#farm_level_select {'
            + ' top: 0px !important;'
            + ' right: 0px;'
            + ' left: auto !important;'
            + ' margin-right: 0;'
            + '}\n').appendTo('head');
    };

window.plugin.farmFind.changeLevel = function()
{
    var myselect = document.getElementById("farm_level_select");
   	var level = myselect.options[myselect.selectedIndex].value;
    window.plugin.farmFind.minLevel = level;
    var button = document.getElementById("findFarmClick");
    button.title = 'Check portals in view for L' + window.plugin.farmFind.minLevel + ' farms';
    button.innerHTML = 'L' + window.plugin.farmFind.minLevel + ' Farms';
    
};

var setup =  function() {
    window.plugin.farmFind.minLevel = 7;
    window.plugin.farmFind.minNearby = 5;
    window.plugin.farmFind.setupCSS();
    if (window.isSmartphone()) {
        window.plugin.farmFind.setupSmartCSS();
    }
    window.plugin.farmFind.Radius = 500;
    $('#toolbox').append(' <a onclick="window.plugin.farmFind.checkPortals()" id="findFarmClick" title="Check portals in view for L' + window.plugin.farmFind.minLevel + ' farms">L' + window.plugin.farmFind.minLevel + ' Farms</a>');
    possibleFarmPortals = [];
    window.plugin.farmFind.levelLayerGroup = new L.LayerGroup();
	$('body').append('<select onchange="window.plugin.farmFind.changeLevel()" id="farm_level_select"><option value=1>Farm level 1</option><option value=2>Farm level 2</option><option value=3>Farm level 3</option><option value=4>Farm level 4</option><option value=5>Farm level 5</option><option value=6>Farm level 6</option><option value=7>Farm level 7</option><option value=8>Farm level 8</option></select>');
    var myselect = document.getElementById("farm_level_select");
    myselect.options.selectedIndex = 6;
    window.addLayerGroup('Farms', window.plugin.farmFind.levelLayerGroup, true);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
