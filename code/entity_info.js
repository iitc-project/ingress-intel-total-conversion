

// ENTITY DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of an entity (i.e.
// portal, link, field) and they will return useful data.


// given the entity detail data, returns the team the entity belongs
// to. Uses TEAM_* enum values.
window.getTeam = function(details) {
  var team = TEAM_NONE;
  if(details.controllingTeam.team === 'ALIENS') team = TEAM_ENL;
  if(details.controllingTeam.team === 'RESISTANCE') team = TEAM_RES;
  return team;
}
