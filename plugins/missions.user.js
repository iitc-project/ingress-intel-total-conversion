// ==UserScript==
// @id             iitc-plugin-missions@jonatkins
// @name           IITC plugin: Missions
// @category       Info
// @version        0.0.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] View missions. Marking progress on waypoints/missions basis. Showing mission paths on the map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


var decodeWaypoint = function(data) {
	var result = {
		hidden: data[0],
		guid: data[1],
		title: data[2],
		typeNum: data[3],
		type: [null, "Portal", "Field Trip"][data[3]],
		objectiveNum: data[4],
		objective: [null, "Hack this Portal", "Capture or Upgrade Portal", "Create Link from Portal", "Create Field from Portal", "Install a Mod on this Portal", "Take a Photo", "View this Field Trip Waypoint", "Enter the Passphrase"][data[4]],
	};
	if (result.typeNum === 1) {
		result.portal = window.decodeArray.portalSummary(data[5]);
		// Portal waypoints have the same guid as the respective portal.
		result.portal.guid = result.guid;
	}
	return result;
};
var decodeMission = function(data) {
	return {
		guid: data[0],
		title: data[1],
		description: data[2],
		authorNickname: data[3],
		authorTeam: data[4],
		// Notice: this format is weird(100%: 1.000.000)
		ratingE6: data[5],
		medianCompletionTimeMs: data[6],
		numUniqueCompletedPlayers: data[7],
		typeNum: data[8],
		type: [null, "Sequential", "Non Sequential", "Hidden"][data[8]],
		waypoints: data[9].map(decodeWaypoint),
		image: data[10]
	};
};
var decodeMissionSummary = function(data) {
	return {
		guid: data[0],
		title: data[1],
		image: data[2],
		ratingE6: data[3],
		medianCompletionTimeMs: data[4]
	};
};
var timeToRemaining = function(t) {
	var data = parseInt(t / 86400) + 'd ' + (new Date(t % 86400 * 1000)).toUTCString().replace(/.*(\d{2}):(\d{2}):(\d{2}).*/, "$1h $2m $3s");
	data = data.replace('0d', '');
	data = data.replace('00h', '');
	data = data.replace('00m', '');
	return data.trim();
};
window.plugin.missions = {
	// 3 days.
	missionCacheTime: 3 * 24 * 3600 * 1E3,
	// 3 weeks.
	portalMissionsCacheTime: 21 * 24 * 3600 * 1E3,

	onPortalSelected: function(event) {
		/*if(event.selectedPortalGuid === event.unselectedPortalGuid) {
		    return;
		}*/
		if (window.selectedPortal === null) {
			return;
		}
		var portal = window.portals[window.selectedPortal];
		if (!portal || (!portal.options.data.mission && !portal.options.data.mission50plus)) {
			return;
		}
		// After select.
		setTimeout(function() {
			// #resodetails
			$('.linkdetails').append('<aside><a href="#" onclick="plugin.missions.openPortalMissions();" >Missions</a></aside>');
		}, 0);
	},

	openTopMissions: function(bounds) {
		bounds = bounds || window.map.getBounds();
		this.loadMissionsInBounds(bounds, this.showMissionListDialog.bind(this));
	},

	openPortalMissions: function() {
		var me = this,
			portal = window.portals[window.selectedPortal];
		if (!portal) {
			return;
		}
		this.loadPortalMissions(window.selectedPortal, function(missions) {
			if (!missions.length) {
				return;
			}

			if (missions.length === 1) {
				me.loadMission(missions[0].guid, me.showMissionDialog.bind(me));
			} else {
				me.showMissionListDialog(missions);
			}
		});
	},

	openMission: function(guid) {
		this.loadMission(guid, this.showMissionDialog.bind(this));
	},

	showMissionDialog: function(mission) {
		var me = this;
		var markers = this.highlightMissionPortals(mission);
		dialog({
			// id: 'mission-' + mission.guid,
			title: mission.title,
			height: 'auto',
			html: this.renderMission(mission),
			width: '450px',
			closeCallback: function() {
				me.unhighlightMissionPortals(markers);
			},
			collapseCallback: this.collapsFix,
			expandCallback: this.collapsFix
		});
	},

	showMissionListDialog: function(missions) {
		dialog({
			html: this.renderMissionList(missions),
			height: 'auto',
			width: '400px',
			collapseCallback: this.collapsFix,
			expandCallback: this.collapsFix
		});
	},

	collapsFix: function() {
		if (this && this.parentNode) {
			this.parentNode.style.height = 'auto';
		}
	},

	loadMissionsInBounds: function(bounds, callback, errorcallback) {
		var me = this;
		window.postAjax('getTopMissionsInBounds', {
			northE6: ((bounds.getNorth() * 1000000) | 0),
			southE6: ((bounds.getSouth() * 1000000) | 0),
			westE6: ((bounds.getWest() * 1000000) | 0),
			eastE6: ((bounds.getEast() * 1000000) | 0)
		}, function(data) {
			var missions = data.result.map(decodeMissionSummary);
			if (!missions) {
				if (errorcallback) {
					errorcallback('Invalid data');
				}
				return;
			}
			callback(missions);
		}, function(error) {
			console.log('Error loading missions in bounds', arguments);
			if (errorcallback) {
				errorcallback(error);
			}
		});
	},

	loadPortalMissions: function(guid, callback, errorcallback) {
		var me = this;
		// Mission summary rarely goes stale.
		if (me.cacheByPortalGuid[guid] && this.cacheByPortalGuid[guid].time > (Date.now() - this.portalMissionsCacheTime)) {
			callback(me.cacheByPortalGuid[guid].data);
			return;
		}
		window.postAjax('getTopMissionsForPortal', {
			guid: window.selectedPortal
		}, function(data) {
			var missions = data.result.map(decodeMissionSummary);
			if (!missions) {
				if (errorcallback) {
					errorcallback('Invalid data');
				}
				return;
			}

      window.runHooks('portalMissionsLoaded', { missions: missions, portalguid: guid });

			me.cacheByPortalGuid[guid] = {
				time: Date.now(),
				data: missions
			};
			me.saveData();
			callback(missions);
		}, function(error) {
			console.log('Error loading portal missions', arguments);
			if (errorcallback) {
				errorcallback(error);
			}
			// awww   
		});
	},
	loadMission: function(guid, callback, errorcallback) {
		var me = this;
		// TODO: we need to refresh data often enough, portal data can quickly go stale
		if (this.cacheByMissionGuid[guid] && this.cacheByMissionGuid[guid].time > (Date.now() - this.missionCacheTime)) {
			callback(this.getMissionCache(guid, true));
			return;
		}
		window.postAjax('getMissionDetails', {
			guid: guid
		}, function(data) {
			var mission = decodeMission(data.result);
			if (!mission) {
				if (errorcallback) {
					errorcallback('Invalid data');
				}
				return;
			}

      window.runHooks('missionLoaded', { mission: mission });

			me.cacheByMissionGuid[guid] = {
				time: Date.now(),
				data: mission
			};
			me.saveData();

			callback(mission);
		}, function() {
			console.log('Error loading mission data', guid, arguments);
			if (errorcallback) {
				errorcallback(error);
			}
			// awww
		});
	},

	renderMissionList: function(missions) {
		return missions.map(this.renderMissionSummary, this).join(' ');
	},

	renderMissionSummary: function(mission) {
		var cachedMission = this.getMissionCache(mission.guid);

		var html = '';
		var checked = this.settings.checkedMissions[mission.guid];

		html += '<div class="mc-' + mission.guid + '" style="' + (checked ? 'background-color: rgba(255, 187, 0, 0.3);' : '') + 'padding: 5px; border-bottom: black solid 1px;margin-bottom:  5px;height: 50px; ">';
		html += '<img style="width: 50px; float: left; margin-right: 20px" src="' + mission.image + '" >';
		html += '<div style="font-weight: bold;font-size: 1.3em;" ><a href="#" onclick="plugin.missions.openMission(\'' + mission.guid + '\')" >' + mission.title + '</a> </div>';
		if (cachedMission) {
			html += '<span class="' + (cachedMission.authorTeam === 'R' ? 'RESISTANCE' : 'ENLIGHTENED') + '">' + cachedMission.authorNickname + '</span>';
			html += '<br />';
		}
		html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle;" src="https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/time.png" />' +
			timeToRemaining((mission.medianCompletionTimeMs / 1000) | 0);
		html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle; margin-left: 5px;" src="https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/like.png" />' +
			(((mission.ratingE6 / 100) | 0) / 100) + '%';

		if (cachedMission) {
			html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle; margin-left: 5px;" src="https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/players.png" />' +
				cachedMission.numUniqueCompletedPlayers;
			html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle; margin-left: 5px;" src="https://commondatastorage.googleapis.com/ingress.com/img/map_icons/linkmodeicon.png" />' +
				cachedMission.waypoints.length;
		}
		html += '<br />';
		html += '</div>';
		return html;
	},

	renderMission: function(mission) {
		var me = this;
		var checked = this.settings.checkedMissions[mission.guid];
		//commondatastorage.googleapis.com/ingress.com/img/map_icons/linkmodeicon.png
		var html = '<div style="height: 110px;" >';
		html += '<a href="#" onclick="plugin.missions.toggleMission(\'' + mission.guid + '\')" >';
		html += '<span class="m-' + mission.guid + '" style="' + (checked ? '' : 'display: none;') + 'position: absolute; float: left; left: 12px; vertical-align: middle; padding-left: 10px; padding-top: 40px; font-size: 8em;opacity: 0.5;width: 90px; height: 60px;" >&#10003;</span>';
		html += '<img style="width: 100px;float: left; margin-right: 20px" src="' + mission.image + '" >';
		html += '</a>';
		html += '<div style="font-weight: bold;font-size: 1.3em;" >' + mission.title + '</div>';
		html += '<span class="' + (mission.authorTeam === 'R' ? 'RESISTANCE' : 'ENLIGHTENED') + '">' + mission.authorNickname + '</span>';
		html += '<br />';
		html += '<br />';
		html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle;" src="https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/time.png" />' +
			timeToRemaining((mission.medianCompletionTimeMs / 1000) | 0);
		html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle; margin-left: 5px;" src="https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/like.png" />' +
			(((mission.ratingE6 / 100) | 0) / 100) + '%';
		html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle; margin-left: 5px;" src="https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/players.png" />' +
			mission.numUniqueCompletedPlayers;
		html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle; margin-left: 5px;" src="https://commondatastorage.googleapis.com/ingress.com/img/map_icons/linkmodeicon.png" />' +
			mission.waypoints.length;
		html += '<br />';
		html += '<p>';
		html += mission.description;
		html += '</p>';
		html += '</div>';
		html += mission.waypoints.map(function(waypoint, index) {
			return me.renderMissionWaypoint(waypoint, index, mission);
		}).join(' ');
		return html;
	},

	renderMissionWaypoint: function(waypoint, index, mission) {
		var html = '';
		html += '<p>';
		html += '<div style="font-weight: bold;font-size: 1.3em;padding-left: 20px;" >';
		if (waypoint.portal) {
			var color = 'white';
			if (waypoint.portal.team === 'R') { // Yay
				color = '#00c2ff';
			} else if (waypoint.portal.team === 'E') { // Booo
				color = '#28f428';
			}
			var realHealth = (waypoint.portal.resCount / 8) * (waypoint.portal.health / 100);
			html += this.renderPortalCircle(color, waypoint.portal.level, realHealth);
			/*
			var radius = ((realHealth * 360) | 0);
			html += '<div style="display: inline-block; position:relative;margin: 1px; margin-right: 10px;margin-left: -4px;" >';
			html += '<div class="arc_start" style="position:absolute;top:0;left:0;width:15px;height: 15px;border-radius:100%;border: 3px solid;border-color:transparent '+color+' '+color+' '+color+';transform: rotate('+radius+'deg);"></div>';
			html += '<div class="arc_end" style="position:absolute;top:0;left:0;width:15px;height: 15px;border-radius:100%;border: 3px solid;border-color:'+color+' '+color+' '+color+' transparent;transform: rotate(405deg);"></div>'; // 360 + 45
			html += '<div style="font-size: 0.8em; font-weight: bold; padding-top: 3px; padding-left: 6.5px;color: '+color+';" > ' + waypoint.portal.level + ' </div>';
			html += '</div>';
			*/
		}
		if (waypoint.portal) {
			html += '<a href="#" onclick="renderPortalDetails(\'' + waypoint.portal.guid + '\')" >';
		}
		if (waypoint.title) {
			html += waypoint.title;
		} else {
			html += 'Unknown';
		}
		if (waypoint.portal) {
			html += '</a>';
		}
		html += '</div>';
		/*
		  checkbox_grey
		  checkbox_orange
		  checkbox_cyan
		*/
		var img = 'cyan';
		if (index === 0) {
			img = 'orange';
		} else if (!waypoint.objective) {
			img = 'grey';
		}
		// &#10003;
		var mwpid = mission.guid + '-' + waypoint.guid;
		var checked = this.settings.checkedWaypoints[mwpid];

		html += '<a href="#" onclick="plugin.missions.toggleWaypoint(\'' + mission.guid + '\',\'' + waypoint.guid + '\')" >';
		html += '<span class="wp-' + mwpid + '" style="' + (checked ? '' : 'display: none;') + 'position:absolute; float: left;margin-left: 4px">&#10003;</span>';

		html += '<img style="height: 14px; margin-right: 8px; vertical-align: middle;" src="https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/checkbox_' + img + '.png" />';
		html += '</a>';
		html += (waypoint.objective ? waypoint.objective : '?');
		html += '</p>';
		return html;
	},
	renderPortalCircle: function(portalColor, portalLevel, portalHealth) {
		var s = 20,
			bg = '#999',
			c = portalColor,
			i = 14,
			ic = '#555',
			s2 = ((s / 2) | 0),
			si = (((s - i) / 2) | 0),
			d = (portalHealth * 180) | 0,
			num = portalLevel;
		var html = '<div style="width: ' + s + 'px;height: ' + s + 'px;background-color:' + bg + ';border-radius: 50%;position: absolute;margin-top: -4px;margin-left: -23px;" >';
		html += '<div>';
		html += '<div style="width: ' + s + 'px;height: ' + s + 'px;position: absolute;border-radius: 50%;clip: rect(0px, ' + s + 'px, ' + s + 'px, ' + s2 + 'px);transform: rotate(' + d + 'deg);" >';
		html += '<div style="width: ' + s + 'px;height: ' + s + 'px;position: absolute;border-radius: 50%;background-color:' + c + ';clip: rect(0px, ' + s2 + 'px, ' + s + 'px, 0px);transform: rotate(' + d + 'deg);">';
		html += '</div>';
		html += '</div>';
		html += '<div style="width: ' + s + 'px;height: ' + s + 'px;position: absolute;border-radius: 50%;clip: rect(0px, ' + s + 'px, ' + s + 'px, ' + s2 + 'px);" >';
		html += '<div style="width: ' + s + 'px;height: ' + s + 'px;position: absolute;border-radius: 50%;background-color:' + c + ';clip: rect(0px, ' + s2 + 'px, ' + s + 'px, 0px);transform: rotate(' + d + 'deg);" >';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		html += '<div style="width: ' + i + 'px;height: ' + i + 'px;position: absolute;margin-left: ' + si + 'px;margin-top: ' + si + 'px;background-color:' + ic + ';border-radius: 50%;" >';
		html += '</div>';
		html += '<div style="position: absolute; font-size: 0.7em; font-weight: bold;padding-top: 4px; padding-left: 7px;">' + num;
		html += '</div>';
		html += '</div>';
		return html;
	},

	toggleWaypoint: function(mid, wpid, dontsave) {
		var mwpid = mid + '-' + wpid;
		var el = document.getElementsByClassName('wp-' + mwpid);
		if (!this.settings.checkedWaypoints[mwpid]) {
			this.settings.checkedWaypoints[mwpid] = true;
      window.runHooks('waypointFinished', { mission: this.getMissionCache(mid), waypointguid: wpid });
			$(el).show();
		} else {
			delete this.settings.checkedWaypoints[mwpid];
			$(el).hide();
		}
		if (!dontsave) {
			this.saveData();
		}
	},

	toggleMission: function(mid) {
		var mission = this.getMissionCache(mid);
		if (!mission) {
			return;
		}
		var el = document.getElementsByClassName('m-' + mid);
		var sumel = document.getElementsByClassName('mc-' + mid);
		if (!this.settings.checkedMissions[mid]) {
			this.settings.checkedMissions[mid] = true;
			mission.waypoints.forEach(function(waypoint) {
				if (!this.settings.checkedWaypoints[mid + '-' + waypoint.guid]) {
					this.toggleWaypoint(mid, waypoint.guid, true);
				}
			}, this);
			$(el).show();
			$(sumel).css('background-color', 'rgba(255, 187, 0, 0.3)');
      window.runHooks('missionFinished', { mission: mission });
		} else {
			delete this.settings.checkedMissions[mid];
			mission.waypoints.forEach(function(waypoint) {
				if (this.settings.checkedWaypoints[mid + '-' + waypoint.guid]) {
					this.toggleWaypoint(mid, waypoint.guid, true);
				}
			}, this);
			$(el).hide();
			$(sumel).css('background-color', '');
		}
		this.saveData();
	},

	getMissionCache: function(guid, updatePortals) {
		if (this.cacheByMissionGuid[guid]) {
			var cache = this.cacheByMissionGuid[guid];
			// Update portal data from map if older then 2 minutes.
			if (updatePortals && cache.time < (Date.now() - (2 * 60 * 1000))) {
				cache.data.waypoints.map(function(waypoint) {
					if (!waypoint.portal) {
						return;
					}
					var wp = window.portals[waypoint.portal.guid];
					if (!wp) {
						return;
					}
					$.extend(waypoint.portal, wp.options.data);
				});
			}
			return cache.data;
		}
		return null;
	},

	getPortalCache: function(guid) {
		if (this.cacheByPortalGuid[guid]) {
			return this.cacheByPortalGuid[guid].data;
		}
		return null;
	},

	saveData: function() {
		this.checkCacheSize();
		localStorage['plugins-missions-portalcache'] = JSON.stringify(this.cacheByPortalGuid);
		localStorage['plugins-missions-missioncache'] = JSON.stringify(this.cacheByMissionGuid);
		localStorage['plugins-missions-settings'] = JSON.stringify(this.settings);
	},

	loadData: function() {
		this.cacheByPortalGuid = JSON.parse(localStorage['plugins-missions-portalcache'] || '{}');
		this.cacheByMissionGuid = JSON.parse(localStorage['plugins-missions-missioncache'] || '{}');
		this.settings = JSON.parse(localStorage['plugins-missions-settings'] || '{}');
	},

	checkCacheSize: function() {
		if (JSON.stringify(this.cacheByPortalGuid).length > 1e6) { // 1 MB not MiB ;)
			this.cleanupPortalCache();
		}
		if (JSON.stringify(this.cacheByMissionGuid).length > 2e6) { // 2 MB not MiB ;)
			this.cleanupMissionCache();
		}
	},

	// Cleanup oldest half of the data.
	cleanupPortalCache: function() {
		var me = this;
		var cache = Object.keys(this.cacheByPortalGuid);
		cache.sort(function(a, b) {
			return me.cacheByPortalGuid[a].time - me.cacheByPortalGuid[b].time;
		});
		var toDelete = (cache.length / 2) | 0;
		cache.splice(0, toDelete + 1).forEach(function(el) {
			delete me.cacheByPortalGuid[el];
		});
	},

	// Cleanup oldest half of the data.
	cleanupMissionCache: function() {
		var me = this;
		var cache = Object.keys(this.cacheByMissionGuid);
		cache.sort(function(a, b) {
			return me.cacheByMissionGuid[a].time - me.cacheByMissionGuid[b].time;
		});
		var toDelete = (cache.length / 2) | 0;
		cache.splice(0, toDelete + 1).forEach(function(el) {
			delete me.cacheByMissionGuid[el];
		});
	},

	highlightMissionPortals: function(mission) {
		var markers = [];
		var prevPortal = null;
		mission.waypoints.forEach(function(waypoint) {
			if (!waypoint.portal) {
				return;
			}
			var portal = window.portals[waypoint.portal.guid];
			if (!portal) { // not in view?
				return;
			}
			var marker = L.circleMarker(
				L.latLng(portal.options.data.latE6 / 1E6, portal.options.data.lngE6 / 1E6), {
					radius: portal.options.radius + Math.ceil(portal.options.radius / 2),
					weight: 3,
					opacity: 1,
					color: '#222',
					fill: false,
					dashArray: null,
					clickable: false
				}
			);
			this.missionLayer.addLayer(marker);
			markers.push(marker);
			if (prevPortal) {
				var line = L.geodesicPolyline([
					L.latLng(prevPortal.options.data.latE6 / 1E6, prevPortal.options.data.lngE6 / 1E6),
					L.latLng(portal.options.data.latE6 / 1E6, portal.options.data.lngE6 / 1E6)
				], {
					color: '#222',

					opacity: 1,
					weight: 2,
					clickable: false
				});
				this.missionLayer.addLayer(line);
				markers.push(line);
			}
			prevPortal = portal;
		}, this);
		return markers;
	},

	unhighlightMissionPortals: function(markers) {
		markers.forEach(function(marker) {
			this.missionLayer.removeLayer(marker);
		}, this);
	},

	onPortalChanged: function(type, guid, oldval) {
		var portal;
		if (type === 'add' || type === 'update') {
			// Compatibility
			portal = window.portals[guid] || oldval;
			if (!portal.options.data.mission && !portal.options.data.mission50plus) {
				return;
			}
			if (this.markedStarterPortals[guid]) {
				return;
			}

			this.markedStarterPortals[guid] = L.circleMarker(
				L.latLng(portal.options.data.latE6 / 1E6, portal.options.data.lngE6 / 1E6), {
					radius: portal.options.radius + Math.ceil(portal.options.radius / 2),
					weight: 3,
					opacity: 1,
					color: '#555',
					fill: false,
					dashArray: null,
					clickable: false
				}
			);
			this.missionStartLayer.addLayer(this.markedStarterPortals[guid]);
		} else if (type === 'delete') {
			portal = oldval;
			if (!this.markedStarterPortals[guid]) {
				return;
			}

			this.missionStartLayer.removeLayer(this.markedStarterPortals[guid]);
			delete this.markedStarterPortals[guid];
		}
	},

	setup: function() {
		this.cacheByPortalGuid = {};
		this.cacheByMissionGuid = {};

		this.markedStarterPortals = {};
		this.markedMissionPortals = {};

		this.loadData();

		if (!this.settings.checkedWaypoints) {
			this.settings.checkedWaypoints = {};
		}
		if (!this.settings.checkedMissions) {
			this.settings.checkedMissions = {};
		}

		$('#toolbox').append('<a href="#" onclick="plugin.missions.openTopMissions();" >Missions in view</a>');

		// window.addPortalHighlighter('Mission start point', this.highlight.bind(this));
		window.addHook('portalSelected', this.onPortalSelected.bind(this));

		/*
		  I know iitc has portalAdded event but it is missing portalDeleted. So we have to resort to Object.observe
		*/
		var me = this;
		if (Object.observe) { // Chrome
			Object.observe(window.portals, function(changes) {
				changes.forEach(function(change) {
					me.onPortalChanged(change.type, change.name, change.oldValue);
				});
			});
		} else { // Firefox why no Object.observer ? :<
			window.addHook('portalAdded', function(data) {
				me.onPortalChanged('add', data.portal.options.guid, data.portal);
			});
			// TODO: bug iitc dev for portalRemoved event
			var oldDeletePortal = window.Render.prototype.deletePortalEntity;
			window.Render.prototype.deletePortalEntity = function(guid) {
				if (guid in window.portals) {
					me.onPortalChanged('delete', guid, window.portals[guid]);
				}
				oldDeletePortal.apply(this, arguments);
			};
		}

		this.missionStartLayer = new L.LayerGroup();
		this.missionLayer = new L.LayerGroup();

		window.addLayerGroup('Mission start portals', this.missionStartLayer, false);
		window.addLayerGroup('Mission portals', this.missionLayer, true);

    window.pluginCreateHook('missionLoaded');
    window.pluginCreateHook('portalMissionsLoaded');
    window.pluginCreateHook('missionFinished');
    window.pluginCreateHook('waypointFinished');
	}
};

var setup = window.plugin.missions.setup.bind(window.plugin.missions);

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
