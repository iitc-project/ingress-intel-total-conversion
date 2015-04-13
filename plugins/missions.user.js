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
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
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
		type: [null, 'Portal', 'Field Trip'][data[3]],
		objectiveNum: data[4],
		objective: [null, 'Hack this Portal', 'Capture or Upgrade Portal', 'Create Link from Portal', 'Create Field from Portal', 'Install a Mod on this Portal', 'Take a Photo', 'View this Field Trip Waypoint', 'Enter the Passphrase'][data[4]],
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
		type: [null, 'Sequential', 'Non Sequential', 'Hidden'][data[8]],
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
	var data = parseInt(t / 86400) + 'd ' + (new Date(t % 86400 * 1000)).toUTCString().replace(/.*(\d{2}):(\d{2}):(\d{2}).*/, '$1h $2m $3s');
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

	missionTypeImages: [
		'@@INCLUDEIMAGE:images/mission-type-unknown.png@@',
		'@@INCLUDEIMAGE:images/mission-type-sequential.png@@',
		'@@INCLUDEIMAGE:images/mission-type-random.png@@',
		'@@INCLUDEIMAGE:images/mission-type-hidden.png@@',
	],

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
			$('.linkdetails').append('<aside><a tabindex="0" onclick="plugin.missions.openPortalMissions();" >Missions</a></aside>');
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
			collapseCallback: this.collapseFix,
			expandCallback: this.collapseFix
		});
	},

	showMissionListDialog: function(missions) {
		dialog({
			html: this.renderMissionList(missions),
			height: 'auto',
			width: '400px',
			collapseCallback: this.collapseFix,
			expandCallback: this.collapseFix
		});
	},

	collapseFix: function() {
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
			console.error('Error loading mission data: ' + guid + ", " + Array.prototype.slice.call(arguments));
			
			if (errorcallback) {
				errorcallback(error);
			}
			// awww
		});
	},

	renderMissionList: function(missions) {
		var container = document.createElement('div');
		missions.forEach(function(mission) {
			container.appendChild(this.renderMissionSummary(mission));
		}, this);
		return container;
	},

	renderMissionSummary: function(mission) {
		var cachedMission = this.getMissionCache(mission.guid);

		var checked = this.settings.checkedMissions[mission.guid];

		var container = document.createElement('div');
		container.className = 'plugin-mission-summary mc-' + mission.guid;
		if(checked)
			container.classList.add('checked');
		
		var img = container.appendChild(document.createElement('img'));
		img.src = mission.image;
		img.addEventListener('click', function(ev) {
			plugin.missions.toggleMission(mission.guid);
		}, false);
		
		var title = container.appendChild(document.createElement('a'));
		title.textContent = mission.title;
		title.href = '/mission/' + mission.guid; // TODO make IITC load on mission permalinks as well
		title.addEventListener('click', function(ev) {
			plugin.missions.openMission(mission.guid);
			// prevent browser from following link
			ev.preventDefault();
			return false;
		}, false);
		
		if(cachedMission) {
			var span = container.appendChild(document.createElement('span'));
			span.className = 'nickname ' + (cachedMission.authorTeam === 'R' ? 'res' : 'enl')
			span.textContent = cachedMission.authorNickname;
			
			if(window.plugin.distanceToPortal && window.plugin.distanceToPortal.currentLoc) {
				var infoDistance = container.appendChild(document.createElement('span'));
				infoDistance.className = 'plugin-mission-info distance help';
				infoDistance.title = 'Distance to this mission. Click to update.';
				infoDistance.addEventListener('click', function() {
					plugin.missions.renderMissionDistance(cachedMission, infoDistance);
				}, false);
				this.renderMissionDistance(cachedMission, infoDistance);
			}
		}
		
		container.appendChild(document.createElement('br'));
		
		var infoTime = container.appendChild(document.createElement('span'));
		infoTime.className = 'plugin-mission-info time';
		infoTime.textContent = timeToRemaining((mission.medianCompletionTimeMs / 1000) | 0) + ' ';
		img = infoTime.insertBefore(document.createElement('img'), infoTime.firstChild);
		img.src = 'https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/time.png';
		
		var infoRating = container.appendChild(document.createElement('span'));
		infoRating.className = 'plugin-mission-info rating';
		infoRating.textContent = (((mission.ratingE6 / 100) | 0) / 100) + '%' + ' ';
		img = infoRating.insertBefore(document.createElement('img'), infoRating.firstChild);
		img.src = 'https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/like.png';
		
		if (cachedMission) {
			var infoPlayers = container.appendChild(document.createElement('span'));
			infoPlayers.className = 'plugin-mission-info players';
			infoPlayers.textContent = cachedMission.numUniqueCompletedPlayers + ' ';
			img = infoPlayers.insertBefore(document.createElement('img'), infoPlayers.firstChild);
			img.src = 'https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/players.png';
			
			var infoWaypoints = container.appendChild(document.createElement('span'));
			infoWaypoints.className = 'plugin-mission-info waypoints';
			infoWaypoints.textContent = cachedMission.waypoints.length + ' ';
			img = infoWaypoints.insertBefore(document.createElement('img'), infoWaypoints.firstChild);
			img.src = this.missionTypeImages[cachedMission.typeNum] || this.missionTypeImages[0];
			img.title = cachedMission.type || 'Unknown mission type';
			img.className = 'help';
		}
		
		return container;
	},

	renderMissionDistance: function(mission /* cached mission, full details*/, container) {
		if(!(plugin.distanceToPortal && plugin.distanceToPortal.currentLoc)) return;
		
		var distances = mission.waypoints
			.filter(function(waypoint) {
				return !!waypoint.portal;
			})
			.map(function(waypoint) {
				var position = L.latLng(waypoint.portal.latE6/1E6, waypoint.portal.lngE6/1E6);
				var distance = position.distanceTo(plugin.distanceToPortal.currentLoc);
				return {
					waypoint: waypoint,
					distance: distance,
					position: position,
				};
			});
		
		if(!distances.length) return;
		
		if(mission.typeNum == 2) { // non-sequential
			distances.sort(function(a, b) { return a.distance - b.distance; });
		}
		
		var position = distances[0].position;
		var distance = distances[0].distance;
		
		var bearing = window.plugin.distanceToPortal.currentLoc.bearingTo(position);
		
		$(container)
			.text(window.plugin.distanceToPortal.formatDistance(distance))
			.prepend($('<span>')
				.addClass('portal-distance-bearing')
				.css({
					'transform': 'rotate('+bearing+'deg)',
					'-moz-transform': 'rotate('+bearing+'deg)',
					'-webkit-transform': 'rotate('+bearing+'deg)',
				}));
	},

	renderMission: function(mission) {
		var container = document.createElement('div');
		container.className = 'plugin-mission-details';
		
		var summary = container.appendChild(this.renderMissionSummary(mission));
		
		// replace link with heading
		var title = summary.getElementsByTagName('a')[0];
		var newtitle = document.createElement('h4');
		newtitle.textContent = mission.title;
		title.parentNode.replaceChild(newtitle, title);
		
		var desc = summary.appendChild(document.createElement('p'));
		desc.className = 'description';
		desc.textContent = mission.description;
		
		
		var list = container.appendChild(document.createElement('ol'))
		mission.waypoints.forEach(function(waypoint, index) {
			list.appendChild(this.renderMissionWaypoint(waypoint, index, mission));
		}, this);
		
		return container;
	},

	renderMissionWaypoint: function(waypoint, index, mission) {
		var container = document.createElement('li');
		container.className = 'plugin-mission-waypoint';
		
		if (waypoint.portal) {
			container.appendChild(this.renderPortalCircle(waypoint.portal));
			
			var title = container.appendChild(document.createElement('a'));
			
			var lat = waypoint.portal.latE6/1E6;
			var lng = waypoint.portal.lngE6/1E6;
			var perma = '/intel?ll='+lat+','+lng+'&z=17&pll='+lat+','+lng;
			
			title.href = perma;
			title.addEventListener('click', function(ev) {
				selectPortalByLatLng(lat, lng);
				ev.preventDefault();
				return false;
			}, false);
			title.addEventListener('dblclick', function(ev) {
				zoomToAndShowPortal(waypoint.portal.guid, [lat, lng]);
				ev.preventDefault();
				return false;
			}, false);
		} else {
			var title = container.appendChild(document.createElement('span'));
		}
		
		title.className = 'title';
		if(waypoint.title)
			title.textContent = waypoint.title;
		else if(waypoint.portal && waypoint.portal.title)
			title.textContent = waypoint.portal.title;
		else
			title.textContent = 'Unknown';
		
		var mwpid = mission.guid + '-' + waypoint.guid;
		var checked = this.settings.checkedWaypoints[mwpid];
		
		var label = container.appendChild(document.createElement('label'));
		
		var checkbox = label.appendChild(document.createElement('input'));
		checkbox.type = 'checkbox';
		checkbox.addEventListener('change', function() {
			plugin.missions.toggleWaypoint(mission.guid, waypoint.guid);
		}, false);
		checkbox.className = 'wp-' + mwpid;
		
		var objective = label.appendChild(document.createElement('span'));
		objective.textContent = waypoint.objective ? waypoint.objective : '?';
		
		return container;
	},
	
	renderPortalCircle: function(portal) {
		var team = TEAM_TO_CSS[getTeam(portal)];
		var resCount = portal.resCount;
		var level = resCount == 0 ? 0 : portal.level; // we want neutral portals to be level 0
		
		var container = document.createElement('div');
		container.className = 'plugin-mission-portal-indicator help ' + team;
		container.textContent = level;
		container.title = 'Level:\t'+level+'\nResonators:\t'+resCount+'\nHealth:\t'+portal.health+'%';
		
		for(var i = 0; i< resCount; i++) {
			var resonator = container.appendChild(document.createElement('div'));
			/* Firefox supports transform* without vendor prefix, but Android does not yet */
			resonator.style.transform = 'rotate(' + i*45 + 'deg)';
			resonator.style.webkitTransform = 'rotate(' + i*45 + 'deg)';
		}
		return container;
	},

	toggleWaypoint: function(mid, wpid, dontsave) {
		var mwpid = mid + '-' + wpid;
		var el = document.getElementsByClassName('wp-' + mwpid);
		if(!this.settings.checkedWaypoints[mwpid]) {
			this.settings.checkedWaypoints[mwpid] = true;
			window.runHooks('waypointFinished', { mission: this.getMissionCache(mid), waypointguid: wpid });
		} else {
			delete this.settings.checkedWaypoints[mwpid];
		}
		$(el).prop('checked', !!this.settings.checkedWaypoints[mwpid]);
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
			$(sumel).addClass('checked');
			window.runHooks('missionFinished', { mission: mission });
		} else {
			delete this.settings.checkedMissions[mid];
			mission.waypoints.forEach(function(waypoint) {
				if (this.settings.checkedWaypoints[mid + '-' + waypoint.guid]) {
					this.toggleWaypoint(mid, waypoint.guid, true);
				}
			}, this);
			$(el).hide();
			$(sumel).removeClass('checked');
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
		var latlngs = [];
		
		mission.waypoints.forEach(function(waypoint) {
			if (!waypoint.portal) {
				return;
			}
			
			var radius = window.portals[waypoint.portal.guid] ? window.portals[waypoint.portal.guid].options.radius * 1.5 : 5;
			var ll = [waypoint.portal.latE6 / 1E6, waypoint.portal.lngE6 / 1E6];
			latlngs.push(ll);
			
			var marker = L.circleMarker(ll, {
					radius: radius,
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
		}, this);
		
		var line = L.geodesicPolyline(latlngs, {
			color: '#222',
			opacity: 1,
			weight: 2,
			clickable: false
		});
		this.missionLayer.addLayer(line);
		markers.push(line);
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

		$('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/missions.css@@').appendTo('head');
		$('#toolbox').append('<a tabindex="0" onclick="plugin.missions.openTopMissions();">Missions in view</a>');

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

		var match = location.pathname.match(/\/mission\/([0-9a-z.]+)/);
		if(match && match[1]) {
			var mid = match[1];
			this.openMission(mid);
		}
	}
};

var setup = window.plugin.missions.setup.bind(window.plugin.missions);

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
