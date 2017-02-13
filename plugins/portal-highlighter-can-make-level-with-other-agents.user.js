// ==UserScript==
// @id             iitc-plugin-highlight-portals-upgrade-with-other-agents@nickspoon
// @name           IITC plugin: highlight portals you can upgrade to a specific level, alone or together with other agents
// @category       Highlighter
// @version        0.3.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to highlight portals which can be upgraded to a specific level, by you or you and others.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.portalHighligherPortalsCanMakeLevelWithAgents = function() {};

window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.agentList = [];

window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.loadAgents = function() {
  var all_agents = [];

  // Find all cached player names and add them to the local array
  $.each(Object.keys(sessionStorage), function(ind,key) {
    if(!key.match(/[^0-9a-f\.]/g) && !isSystemPlayer(key)) {
      var agent = { name: sessionStorage[key], guid: key, level: 8 };
      all_agents.push(agent);
    }
  });
  // Find any guessed levels and update the players in the local array
  $.each(Object.keys(localStorage), function(ind,key) {
    if(key.slice(0, 6) === 'level-')
      for(var i = 0, agent; agent = all_agents[i]; i++)
        if(agent.guid === key.substr(6)) {
          agent.level = parseInt(localStorage[key]);
          break;
        }
  });
  
  return all_agents;
}
  
window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.highlight = function(data,highlight_level) {
  var d = data.portal.options.details;
  var current_level = Math.floor(getPortalLevel(d));
  var potential_level = Math.floor(window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.potentialPortalLevel(d));
  var opacity = .7;
  if( potential_level > current_level && potential_level === highlight_level)
    data.portal.setStyle({fillColor: 'red', fillOpacity: opacity});
  else
    data.portal.setStyle({color: COLORS[getTeam(data.portal.options.details)], fillOpacity: 0.5});
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

// replaces the main IITC window.potentialPortalLevel function
window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.potentialPortalLevel = function(d) {
  var current_level = getPortalLevel(d);
  var potential_level = current_level;

  if(PLAYER.team === d.controllingTeam.team) {
    var resonators_on_portal = d.resonatorArray.resonators;
    var resonator_levels = new Array();
    var group = window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.agentList;
    // Figure out how many of each of these resonators can be placed by each member of the group
    group_resonators = [0,0,0,0,0,0,0,0,0];
    $.each(group, function(ind, agent) {
      for(var i=1;i<=MAX_PORTAL_LEVEL; i++) {
        group_resonators[i] += i > agent.level ? 0 : MAX_RESO_PER_PLAYER[i];
      }
    });
    $.each(resonators_on_portal, function(rind, reso) {
      $.each(group, function(ind, agent) {
        if(reso !== null && reso.ownerGuid === agent.guid) {
          group_resonators[reso.level]--;
        }
      });
      resonator_levels.push(reso === null ? 0 : reso.level);  
    });

    resonator_levels.sort(function(a, b) {
      return(a - b);
    });

    // Max out portal
    var install_index = 0;
    for(var i=MAX_PORTAL_LEVEL;i>=1; i--) {
      for(var install = group_resonators[i]; install>0; install--) {
        if(resonator_levels[install_index] < i) {
          resonator_levels[install_index] = i;
          install_index++;
        }
      }
    }
    potential_level = resonator_levels.reduce(function(a, b) {return a + b;}) / 8;
  }
  return(potential_level);
}

//determines the level of poral a user can make all on their own
window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.playerCanSoloLevel = function(lvl) {
  var renators_total = 0;
  var renators_placed = 0;
  var resonator_level = PLAYER.level
  while(renators_placed < 8) {
    for(var i = 0; i<MAX_RESO_PER_PLAYER[resonator_level]; i++) {
      if(renators_placed < 8) {
        renators_total += resonator_level;
        renators_placed++;
      }
    }
    resonator_level--;
  }
  return(Math.floor(renators_total/8));
}
window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.getHighlighter = function(lvl) {
  return(function(data){ 
    window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.highlight(data,lvl);
  });  
}

window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.display = function() {
  var agent_list = window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.agentList;
  
  var all_agents = window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.loadAgents();

  var buildAgentObject = function(agent) {
    return $('<tr>')
      .append($('<td style="white-space: nowrap;" class="agentName">' + agent.name + '</td>'))
      .append($('<td style="position: relative;">')
        .append($('<a class="agentLevel">' + agent.level + '</a>')
           .click(function() {
             $(this).parent()
               .append($('<select style="position: absolute; top: 0; left: 0;">')
                 .append([8,7,6,5,4,3,2,1].map(function(el){
                   return $('<option>').text(el).attr('value', el);
                 }))
                 .change(function() {
                   var level = parseInt($(this).find('option:selected').text());
                   $(this).parent().find('a').text(level);

                   // Update agents array
                   var agentName = $(this).parent().parent().find('.agentName').text();
                   for(var i = 0, agent; agent = agent_list[i]; i++)
                     if(agent.name === agentName)
                       agent.level = level;

                   $(this).remove();

                   // Refresh highlighted portals
                   $('#portal_highlight_select').change();
                 })
                 .blur(function() {
                   $(this).remove();
                 }));
             $(this).parent().find('select').focus().val(agent.level);
           })))
      .append($('<td>')
        .append($('<a>X</a>')
           .click(function() {
             // Remove from agents array
             var agentName = $(this).parent().parent().find('.agentName').text();
             var index = -1;
             $.each(agent_list, function(i, value) {
               if(value.name == agentName)
                 index = i;
             });
             if(index != -1)
               agent_list.splice(index, 1);

             $(this).parent().parent().remove();

             // Refresh highlighted portals
             $('#portal_highlight_select').change();
           })));
  }

  var addAgentByName = function(name) {
    for(var i = 0, agent; agent = all_agents[i]; i++)
      if(agent.name === name) {
        addAgent(agent);
        break;
      }
  }
  var addAgent = function(agent) {
    var add = true;
    
    if(agent_list.length >= 8) {
      window.dialog({html: 'You\'ve got enough people!', title: 'Too many!'});
      add = false;
    }
    for(var i = 0, a; a = agent_list[i]; i++)
      if(agent === a)
        // Do not add a player that is already listed
        add = false;
    if(add) {
      agent_list.push(agent);
      $('#agent-list').append(buildAgentObject(agent));
      $('#portal_highlight_select').change();
    }
    $('#agent_autocomplete').remove();
    $('#agent-add-name').val('');
  }

  var popup =
    $('<div id="agent-list-dialog">').append(
      $('<div class="header">Enter an agent name:</div>')).append(
      $('<div class="agent-add" style="position: relative;">').append(
        $('<input type="text" id="agent-add-name">'))).append(
      $('<div class="agent-list-container">').append(
        $('<table id="agent-list">')));
  
  if (window.isSmartphone()) {
    // Make the "Search" link change colour, then fade back to the standard yellow.
    var search_feedback = function(success) {
      popup.find('#agent-add-search')
        .css({color: success ? 'green' : 'red'})
        .animate({ color: '#FFCE00' }, 1000);
    }

    var agent_search = function(agentName) {
      $('#agent_autocomplete').remove();
      var val = agentName.replace(/\s/g, '').toLowerCase(),
          len = val.length;
      if(len === 0)
        search_feedback(false);
      else {
        var found_exact = null;
        var found_agents = all_agents.filter(function(agent) {
          if(agent.name.slice(0, len).toLowerCase() === val) {
            if (agent.name.toLowerCase() === val)
              found_exact = agent;
            return true;
          }
          return false;
        });
        search_feedback(found_agents.length > 0);
        if (found_exact)
          addAgent(found_exact);
        else if (found_agents.length === 1)
          addAgent(found_agents[0]);
        else if (found_agents.length > 0) {
          // Limit to 10 agents
          found_agents = found_agents.slice(0, 10);
          $('body').append(
            $('<div id="agent_autocomplete" class="ui-dialog">')
              .css({
                left: $('#agent-add-name').offset().left,
                top: $('#agent-add-name').offset().top + 25,
                minHeight: 100
              })
              .append(
                $('<ul>').append(
                  found_agents.map(function(agent) {
                    return $('<li>')
                      .append($('<a>').text(agent.name))
                      .click(function() {
                        addAgentByName($(this).text());
                      });
                  }))));
        }
      }
    };
    
    popup.find('#agent-add-name')
      .keydown(function(event) {
        if((event.keyCode ? event.keyCode : event.which) === 13) { // enter
          event.preventDefault();
          agent_search($(this).val());
        }
      })
      .after(
        $('<a id="agent-add-search">Search</a>').click(function() {
          agent_search($('#agent-add-name').val());
        }));
  }
  else {
    popup.find('#agent-add-name')
      .keyup(function(event) {
        var key = event.keyCode ? event.keyCode : event.which;
        if([9,13,16,17,18,19,20,27,32,33,34,35,36,37,38,39,40].indexOf(key) > -1)
          return;
        var val = $(this).val().replace(/\s/g, '').toLowerCase(),
            len = val.length;
        $('#agent_autocomplete').remove();
        if(len !== 0) {
          $('body').append(
            $('<div id="agent_autocomplete" class="ui-dialog">')
              .css({
                left: $(this).offset().left,
                top: $(this).offset().top + 25
              })
              .append(
                $('<ul>').append(
                  // Find agents whose names begin with the entered characters
                  all_agents.filter(function(agent) {
                    return agent.name.slice(0, len).toLowerCase() === val;
                  })
                  // Limit to 10 agents
                  .slice(0, 10)
                  // Add them to the list
                  .map(function(agent) {
                    return $('<li>')
                      .append($('<a>').text(agent.name))
                      .click(function() {
                        addAgentByName($(this).text());
                      });
                  }))));
          $('#agent_autocomplete ul').children().first().attr('class', 'selected');
        }
      })
      .focus(function(event) {
        $(this).keyup();
      })
      .blur(function(event) {
        // Delay so click actions can be captured, for example clicking an autocompleted agent name
        window.setTimeout('$("#agent_autocomplete").remove();', 500);
      })
      .keydown(function(event) {
        var key = event.keyCode ? event.keyCode : event.which;
        var selected = $('#agent_autocomplete li.selected');
        if(key === 13) { // enter
          event.preventDefault();
          if($(this).val() === '')
            window.dialog({html: 'Give us a name', title: 'Nameless'});
          else if(!selected) {
            // No-one is selected. Autocomplete may not be working - try the name as it is.
            var agentName = $(this).val().replace(/\s/g, '');
            var agentGuid = window.playerNameToGuid(agentName);
            if (agentGuid === null)
              window.dialog({html: 'Can\'t find that player sorry - try zooming out', title: 'Not found'});
            else {
              var agent = { name: agentName, guid: agentGuid, level: 8 };
              agent_list.push(agent);
              $('#agent-list').append(buildAgentObject(agent));
              $(this).val('');
              // Refresh highlighted portals
              $('#portal_highlight_select').change();
            }
          } else
            addAgentByName(selected.find('a').text());
        } else if(key === 40) { // down arrow
          event.preventDefault();
          if(selected.next().length > 0) {
            selected.removeAttr('class');
            selected.next().attr('class', 'selected');
          }
        } else if(key === 38) { // up arrow
          event.preventDefault();
          if (selected.prev().length > 0) {
            selected.removeAttr('class');
            selected.prev().attr('class', 'selected');
          }
        }
      });
  }

  $.each(agent_list, function(i, agent) {
    popup.find('#agent-list').append(buildAgentObject(agent));
  });

  window.dialog({html: popup, title: 'With agents...', id: 'agent_list_selector', closeCallback: function() { $('#agent_autocomplete').remove(); }});
}


var setup =  function() {
  // This is the maximum level of a portal a user can be the "last peice of"
  // yes, even a level 1 can be the difference in bumping a portal up to level 7
  var max_can_complete = 7;
  if(PLAYER.level === 8) {
    max_can_complete = 8;
  }

  window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.agentList.push(
    { name: PLAYER.nickname, guid: PLAYER.guid, level: PLAYER.level });

  // The rational behind the "minimum" level below is that showing a level 7 player, for example, all the portals they can make
  // a level 5 would be silly, as they can make ANY portal a level 5.
  for(var ptl_lvl = window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.playerCanSoloLevel()+1; ptl_lvl<=max_can_complete; ptl_lvl++) {
    window.addPortalHighlighter('Can Make Level ' + ptl_lvl + ' With Agents', window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.getHighlighter(ptl_lvl));
  }

  $('#toolbox')
    .append($('<a id="link_with_agents">With agents...</a>')
      .click(window.plugin.portalHighligherPortalsCanMakeLevelWithAgents.display));
  if(!window.isSmartphone())
    $('#link_with_agents')
      .attr('title', 'Select agents you are with, to find upgradeable portals');
  $('<style>')
    .prop('type', 'text/css')
    .html('\
#agent-list {\
  padding: 5px;\
}\
#agent-list li {\
  line-height: 1.8;\
}\
#agent_autocomplete {\
  width: 200px;\
  z-index: 10010;\
}\
#agent_autocomplete ul {\
  list-style-type: none;\
  margin: 2px 0;\
  padding: 0 2px;\
  overflow: hidden;\
}\
#agent_autocomplete ul li {\
  padding: 1px 3px;\
}\
#agent_autocomplete ul li a {\
  text-decoration: none;\
}\
#agent_autocomplete ul li:hover {\
  background-color: rgba(8, 60, 78, 0.9);\
}\
#agent_autocomplete ul li:hover a {\
  text-decoration: underline;\
}\
#agent_autocomplete ul li.selected {\
  border: 1px solid #FFCE00;\
  padding: 0 2px;\
}')
    .appendTo('head');
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
