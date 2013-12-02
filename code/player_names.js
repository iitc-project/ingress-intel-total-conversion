// PLAYER NAMES //////////////////////////////////////////////////////



// test to see if a specific player GUID is a special system account (e.g. __JARVIS__, __ADA__) that shouldn't
// be listed as a player
window.isSystemPlayer = function(name) {

  switch (name) {
    case '__ADA__':
    case '__JARVIS__':
      return true;

    default:
      return false;
  }

}
