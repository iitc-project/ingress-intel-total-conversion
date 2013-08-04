// ==UserScript==
// @id             iitc-inventory-show@slt
// @name           IITC plugin: Show player inventory (a plugin for iitc-inventory-import)
// @category       Inventory
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Displays and stores users inventory, implemented as a plugin for inventory import. Based on iBlob by StarlightPL
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

/**
 * Inventory plugin for IITC
 * 
 */

function wrapper() {
	// ensure plugin framework is there, even if iitc is not yet loaded
	if(typeof window.plugin !== 'function') window.plugin = function() {};
	if(typeof window.plugin.inventory !== 'function') window.plugin.inventory = function() {};
	if(typeof window.plugin.inventory.import !== 'function') window.plugin.inventory.import = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

	// create namespace for plugin
	window.plugin.inventory.show = function() {
	};

	// empty inventory object
	window.plugin.inventory.show.inventoryObject = {};
	window.plugin.inventory.show.invObjEmpty = function() { 
	return {
		keys : {}, /* guid => { link, count, address, title, location, imgURL } */
		resonators : [0, 0, 0, 0, 0, 0, 0, 0],
		xmps : [0, 0, 0, 0, 0, 0, 0, 0],
		powercubes : [0, 0, 0, 0, 0, 0, 0, 0],
		media : [0, 0, 0, 0, 0, 0, 0, 0],
		shields : [ 0, 0, 0 ],
		turrets : [ 0, 0, 0 ],
		linkamps : [ 0, 0, 0 ],
		forceamps : [ 0, 0, 0 ],
		heatsinks : [ 0, 0, 0 ],
		multihacks : [ 0, 0, 0 ],
		flipcards : [ 0, 0 ],
		stats : {
			keys : 0,
			resonators : 0,
			xmps : 0,
			powercubes : 0,
			media : 0,
			shields : 0,
			turrets : 0,
			linkamps : 0,
			forceamps : 0,
			heatsinks : 0,
			multihacks : 0,
			flipcards : 0,
			all : {
				count : 0,
				percentage : 0,
			},
			lastSync: '',
		}
	};
};

	window.plugin.inventory.show.LOCAL_STORAGE_KEY = 'iB-inventory';

	window.plugin.inventory.show.OPSButton;

	window.plugin.inventory.show.loadInventory = function() {
		var invObjectJSON = localStorage[plugin.inventory.show.LOCAL_STORAGE_KEY];
		if (!invObjectJSON)
			return plugin.inventory.show.invObjEmpty();
		var invObject = JSON.parse(invObjectJSON);
		return invObject;
	};

	window.plugin.inventory.show.saveInventory = function(invObj) {
		var invObjectJSON = JSON.stringify(invObj);
		localStorage[plugin.inventory.show.LOCAL_STORAGE_KEY] = invObjectJSON;
	};
	
	window.plugin.inventory.show.prepareInventory = function(invObj) {

		// erase old one if exists
		if ($('#iB-inventory').length > 0) {
			$('#iB-inventory').remove();
		}

		plugin.inventory.show.inventory = '' + '<div id="iB-inventory">'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>Resonators ('
				+ invObj.stats.resonators
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.resonators)
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	</div>'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>XMPs ('
				+ invObj.stats.xmps
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.xmps)
				+ '	  		</ul>'
				+ '		</div>'
				+ '	</div>'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>Power Cubes ('
				+ invObj.stats.powercubes
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.powercubes)
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	</div>'
				+ '	<div id="iB-totals">'
				+ '		<h1 class="iB-invTitle">Inventory Stats</h1>'
				+ '	 	<div id="iB-totalBox">'
				+ '			<p class="iB-invInfo">Total items in inventory: ('
				+ invObj.stats.all.count
				+ '/2000)</p>'
				+ '			<div id="iB-capacityC">'
				+ invObj.stats.all.percentage
				+ '% full'
				+ '				<div id="iB-barC">'
				+ '					<div id="iB-bar" style="width: '
				+ invObj.stats.all.percentage
				+ '%"></div>'
				+ '				</div>'
				+ '			</div>'
				+ '			<p class="iB-invInfo">Total number of keys: '
				+ invObj.stats.keys
				+ '</p>'
				+ '			<p class="iB-invInfo">Last sync date: '
				+ invObj.stats.lastSync
				+ '</p>'
				+ '		</div>'
				+ '	</div>'
				+ '	<div class="iB-btnR" id="iB-close">X</div>'
				+ '	<br style="clear: both"/>'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>Shields ('
				+ invObj.stats.shields
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.shields, [ 'C', 'R', 'VR' ])
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	  	<br/>'
				+ '		<h1 class=iB-invTitle>Turrets ('
				+ invObj.stats.turrets
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.turrets, [ 'C', 'R', 'VR' ])
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	</div>'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>LinkAmps ('
				+ invObj.stats.linkamps
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.linkamps, [ 'C', 'R', 'VR' ])
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	  	<br/>'
				+ '		<h1 class=iB-invTitle>ForceAmps ('
				+ invObj.stats.forceamps
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.forceamps, [ 'C', 'R', 'VR' ])
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	</div>'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>HeatSinks ('
				+ invObj.stats.heatsinks
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.heatsinks, [ 'C', 'R', 'VR' ])
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	  	<br/>'
				+ '		<h1 class=iB-invTitle>MultiHacks ('
				+ invObj.stats.multihacks
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.multihacks, [ 'C', 'R', 'VR' ])
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	</div>'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>Media ('
				+ invObj.stats.media
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.media)
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	</div>'
				+ '	<div class="iB-invBox">'
				+ '		<h1 class=iB-invTitle>Flipcards ('
				+ invObj.stats.flipcards
				+ ')</h1>'
				+ '		<div class="iB-invList">'
				+ '	  		<ul class="iB-invItem">'
				+ plugin.inventory.show.prepareList(invObj.flipcards, [ 'JARVIS', 'ADA' ])
				+ '	  		</ul>'
				+ '	  	</div>'
				+ '	</div>'
				+ '</div>';

		$('body').append(plugin.inventory.show.inventory);
		$('#iB-close').click(function() {
			$('#iB-inventory').toggle();
		});
	};

	window.plugin.inventory.show.prepareList = function(itemList, names) {
		if (itemList === undefined)
			return "<li></l1>";

		var list = "";

		if (names === undefined) {
			names = [ 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8' ];
		}

		$.each(itemList, function(idx, cnt) {
			var name = "???";
			if ( idx < names.length )
				name = names[idx];
			list += "<li>" + name + " - " + cnt + "</l1>";
		});
		return list;
	};

	window.plugin.inventory.show.setupCSS = function() {
		$("<style>").prop("type", "text/css").html(
				""	 + "#iB-inventory {"
					 + ' font-family: "Coda";'
					 + " pointer-events: none;" 
					 + " display: none;"
					 + "	position: absolute;" 
					 + "	top: 100px;"
					 + "	right: 360px;"
					 // + " margin: 10px 10px;"
					 + "	border: 1px solid #00FFFF;"
					 + "	background: black; /* #0080f0; */ "
					 + "	opacity:0.9;" 
					 + "	filter:alpha(opacity=90);"
					 + "	overflow: auto;" 
					 + "	float: right;"
					 + " z-index: 1000" 
					 + "}\n" 
					 + ".iB-invBox {"
					 + "	border: 1px solid #00ffff;"
					 + "	background: #006d73;" 
					 + "	padding: 10px;"
					 + "	margin: 5px;" 
					 + "	float: left;" 
					 + "}\n"
					 + ".iB-invTitle {" 
					 + "	font-size:12px;"
					 + "	font-weight: normal;" 
					 + "	color: white;"
					 + "	margin: 0;" 
					 + "	padding: 0;"
					 + "	text-align: center;" 
					 + "}\n" 
					 + ".iB-invList {"
					 + "	width: 78px;" 
					 + "	border: 1px solid #EEEEEE;"
					 + "	background: #111111;" 
					 + "	padding: 10px;"
					 + "	margin: 5px;" 
					 + "}\n" 
					 + ".iB-invItem {"
					 + "	font-size: 12px;" 
					 + "	font-weight: normal;"
					 + "	color: #EEEEEE;" 
					 + "	list-style-type: none;"
					 + "	display: inline;" 
					 + "	margin: 0;" 
					 + "	padding: 0;"
					 + "}\n"
                     
					 + "#iB-totals {" 
					 + "	border: 1px solid #00ffff;"
					 + "	width: 252px;" 
					 + "	font-size: 14px;"
					 + "	font-weight: normal;" 
					 + "	background: #006d73;"
					 + "	padding: 6px 10px;" 
					 + "	margin: 5px;"
					 + "	float: left;" 
					 + "	color: white;" 
					 + "}\n"
					 + "#iB-totalBox {" 
					 + "	border: 1px solid #00ffff;"
					 + "	background: #006d73;" 
					 + "	padding: 10px;"
					 + "	margin: 5px;" 
					 + "	height: 144px;"
					 + "}\n" 
					 + ".iB-invInfo {"
					 + "	font-size: 12px;" 
					 + "	font-weight: normal;"
					 + "	color: #EEEEEE;" 
					 + "	margin: 0;" 
					 + "	padding: 0;"
					 + "}\n" 
					 + "#iB-capacityC {"
					 + "	display: block;"
					 + " font-size: 10px;"
					 + "	position: relative;" 
					 + "	top: 0;" 
					 + "	left: 0;"
					 + "	border: 1px solid #eeeeee;"
					 + "	background: #333333;" 
					 + "	margin: 2px 10px;"
					 + "	padding: 0;" 
					 + "	text-align: center;"
					 + "	overflow: hidden;" 
					 + "	z-index: 1;" 
					 + "}\n"
					 + "#iB-barC {" 
					 + "	display:block;"
					 + "	position: absolute;" 
					 + "	width: 100%;"
					 + "	height: 21px;" 
					 + "	top: 0px;" 
					 + "	left: 0px;"
					 + "	padding: 0;" 
					 + "	margin: 0;" 
					 + "	overflow: hidden;"
					 + "	z-index: -1;" 
					 + "}\n" 
					 + "#iB-bar {"
					 + "	background: #2db32d;" 
					 + "	height: 100%;" 
					 + "}\n"
                     
					 + "#iB-wrap {"
					 + "	overflow: auto;" 
					 + "	float: left;"
					 + "	margin: 0;" 
					 + "	padding: 0;" 
					 + "}\n" 
					 + ".iB-btnL {"
					 + " pointer-events: auto;" 
					 + "	cursor: pointer;"
					 + "	border: 1px solid #00ffff;" 
					 + "	font-size: 14px;"
					 + "	background: #006d73;" 
					 + "	padding: 5px 10px;"
					 + "	margin: 5px 3px;" 
					 + "	float: left;"
					 + "	color: white;" 
					 + "}\n" 
					 + ".iB-btnR {"
					 + " pointer-events: auto;" 
					 + "	cursor: pointer;"
					 + "	border: 1px solid #00ffff;" 
					 + "	font-size: 14px;"
					 + "	background: #006d73;" 
					 + "	padding: 5px 10px;"
					 + "	margin: 5px 3px;" 
					 + "	float: right;"
					 + "	color: white;" 
					 + "}\n" 
					 + "#iB-OPS {"
					 + " pointer-events: auto;"
					 + "	cursor: pointer !important;"
					 + ' font-family: "Coda";' 
					 + " font-size: 14px;"
					 + "	border: 1px solid #00ffff;" 
					 + "	font-size: 14px;"
					 + "	background: #006d73;" 
					 + "	padding: 5px 10px;"
					 + "	margin: 10px;" 
					 + "	float: right;"
					 + "	color: white;"
					 // + " z-index: 1;"
					 + "}\n" 
					 + "#iB-blob {" 
					 + " font-size: 10px;"
					 + " pointer-events: auto !important;"
					 + "	border: 1px solid #00ffff;"
					 + "	background: #006d73;" 
					 + "	color: #eeeeee;"
					 + "	padding: 5px 10px;" 
					 + "	margin: 5px 3px;"
					 + "	width: 108px;" 
					 + "	height: 156px;" 
					 + "	float: left;"
					 + "	overflow: hidden;" 
					 + "}\n").appendTo("head");
	};

	window.plugin.inventory.show.setupContent = function() {
		plugin.inventory.show.OPSButton = '<div id="iB-OPS" onclick="window.plugin.inventory.show.showOps()">OPS</div>';
		$("#map>.leaflet-control-container>.leaflet-top.leaflet-right").append(
				plugin.inventory.show.OPSButton);

		plugin.inventory.show.keyView = '<div class="iB-btnR">K: <span id="iB-keyCount">0</span></div>';
	};

	window.plugin.inventory.show.showOps = function() {
		$('#iB-inventory').toggle();
	};

	window.plugin.inventory.show.addToSidebar = function() {

		$("#portaldetails > .imgpreview").append(plugin.inventory.show.keyView);
		var guid = window.selectedPortal;
		var count = 0;
		var info = window.plugin.inventory.show.inventoryObject.keys[guid];
		if (info !== undefined) {
			count = info.count;
		};

		$('#iB-keyCount').html(count);
		if (count > 0) {
			$('#iB-keyCount').css({'color': 'yellow'});
		}
	};

	var setup = function() {
		window.plugin.inventory.show.setupCSS();
		var invObj = window.plugin.inventory.show.loadInventory();
		window.plugin.inventory.show.prepareInventory(invObj);
		window.plugin.inventory.show.setupContent();
		window.plugin.inventory.show.inventoryObject = invObj;
		window
				.addHook('portalDetailsUpdated',
						window.plugin.inventory.show.addToSidebar);
		window.plugin.inventory.import.addHandler(window.plugin.inventory.show.syncInventory);
	};

	window.plugin.inventory.show.syncInventory = function(inventory) {
		console.log('Syncing inventory');
		var invObj = window.plugin.inventory.show.invObjEmpty();
		var rawInv = inventory;
		var rarity = { 'COMMON': 0, 'RARE': 1, 'VERY_RARE': 2 };
		var flipcardtypes = { 'JARVIS': 0, 'ADA': 1 };
		$.each(rawInv, function(idx, item) {

			var obj = item[2];
			
			//keys
			if (obj.hasOwnProperty('resource') && obj.resource.resourceType === 'PORTAL_LINK_KEY') {
				var guid = obj.portalCoupler.portalGuid; 
				if (invObj.keys.hasOwnProperty(guid)) {
					invObj.keys[guid].count++;
				} else {
					invObj.keys[guid] = {};
					invObj.keys[guid].count = 1;
					invObj.keys[guid].portalTitle = obj.portalCoupler.portalTitle; 
				}
				invObj.stats.keys++;
				return true;
			}

			//flipcards
			if (obj.hasOwnProperty('resource') && obj.resource.resourceType === 'FLIP_CARD') {
				invObj.flipcards[flipcardtypes[obj.flipCard.flipCardType]]++;
				return true;
			}
			
			//resonators
			if (obj.hasOwnProperty('resourceWithLevels') && obj.resourceWithLevels.resourceType === 'EMITTER_A') {
				invObj.resonators[obj.resourceWithLevels.level-1]++;
				return true;
			}

			//XMPs
			if (obj.hasOwnProperty('resourceWithLevels') && obj.resourceWithLevels.resourceType === 'EMP_BURSTER') {
				invObj.xmps[obj.resourceWithLevels.level-1]++;
				return true;
			}
			
			//powercubes
			if (obj.hasOwnProperty('resourceWithLevels') && obj.resourceWithLevels.resourceType === 'POWER_CUBE') {
				invObj.powercubes[obj.resourceWithLevels.level-1]++;
				return true;
			}

			//media
			if (obj.hasOwnProperty('resourceWithLevels') && obj.resourceWithLevels.resourceType === 'MEDIA') {
				invObj.media[obj.resourceWithLevels.level-1]++;
				return true;
			};
			
			//portal mods
			if (obj.hasOwnProperty('modResource')) {
				switch (obj.modResource.resourceType) {
					case 'RES_SHIELD':
						invObj.shields[rarity[obj.modResource.rarity]]++;
						return true;
					case 'TURRET':
						invObj.turrets[rarity[obj.modResource.rarity]]++;
						return true;
					case 'LINK_AMPLIFIER':
						invObj.linkamps[rarity[obj.modResource.rarity]]++;
						return true;
					case 'FORCE_AMP':
						invObj.forceamps[rarity[obj.modResource.rarity]]++;
						return true;
					case 'HEATSINK':
						invObj.heatsinks[rarity[obj.modResource.rarity]]++;
						return true;
					case 'MULTIHACK':
						invObj.multihacks[rarity[obj.modResource.rarity]]++;
						return true;
				}
			};
		});

		$.each(invObj.resonators, function(idx, cnt) {invObj.stats.resonators += cnt;});
		$.each(invObj.xmps, function(idx, cnt) {invObj.stats.xmps += cnt;});
		$.each(invObj.powercubes, function(idx, cnt) {invObj.stats.powercubes += cnt;});
		$.each(invObj.media, function(idx, cnt) {invObj.stats.media += cnt;});
		$.each(invObj.shields, function(idx, cnt) {invObj.stats.shields += cnt;});
		$.each(invObj.turrets, function(idx, cnt) {invObj.stats.turrets += cnt;});
		$.each(invObj.linkamps, function(idx, cnt) {invObj.stats.linkamps += cnt;});
		$.each(invObj.forceamps, function(idx, cnt) {invObj.stats.forceamps += cnt;});
		$.each(invObj.heatsinks, function(idx, cnt) {invObj.stats.heatsinks += cnt;});
		$.each(invObj.multihacks, function(idx, cnt) {invObj.stats.multihacks += cnt;});
		$.each(invObj.flipcards, function(idx, cnt) {invObj.stats.flipcards += cnt;});
		
		invObj.stats.all.count = invObj.stats.resonators +
			+ invObj.stats.xmps
			+ invObj.stats.powercubes
			+ invObj.stats.media
			+ invObj.stats.shields
			+ invObj.stats.turrets
			+ invObj.stats.linkamps
			+ invObj.stats.forceamps
			+ invObj.stats.heatsinks
			+ invObj.stats.multihacks
			+ invObj.stats.flipcards
			+ invObj.stats.keys;
		invObj.stats.all.percentage = 100*invObj.stats.all.count / 2000;
		invObj.stats.lastSync = new Date().toString();
		
//		console.dir(invObj);
		
		window.plugin.inventory.show.inventoryObject = invObj;
		window.plugin.inventory.show.saveInventory(invObj);
		window.plugin.inventory.show.prepareInventory(invObj);
		
		window.plugin.inventory.import.message('Inventory list synchronized');
	};	
	
// PLUGIN END //////////////////////////////////////////////////////////

	if (window.iitcLoaded && typeof setup === 'function') {
		setup();
	} else {
		if (window.bootPlugins)
			window.bootPlugins.push(setup);
		else
			window.bootPlugins = [ setup ];
	}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + wrapper + ')();'));
(document.body || document.head || document.documentElement)
		.appendChild(script);