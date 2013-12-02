// REQUEST PARAMETER MUNGING /////////////////////////////////////////////

//TODO: the double inclusion is planned - but not yet in place

// WARNING: this code is included in IITC twice!
// once within the main body of IITC code, inside the wrapper function
// additionally, outside of the wrapper code - used to detect if the required munging code will work
// before IITC actually starts


// wrap in an anonymous function to limit scope
;(function(){

var requestParameterMunges = [
  // obsolete munge sets (they don't have some of the new parameters) deleted

  // set 10 - 2013-11-27
  {
    'dashboard.getArtifactInfo': 'artifacts',            // GET_ARTIFACT_INFO
    'dashboard.getGameScore': '4oid643d9zc168hs',        // GET_GAME_SCORE
    'dashboard.getPaginatedPlexts': 's1msyywq51ntudpe',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntities': '4467ff9bgxxe4csa',  // GET_THINNED_ENTITIES
    'dashboard.getPortalDetails': 'c00thnhf1yp3z6mn',    // GET_PORTAL_DETAILS
    'dashboard.redeemReward': '66l9ivg39ygfqqjm',        // REDEEM_REWARD
    'dashboard.sendInviteEmail': 'cgb7hi5hglv0xx8k',     // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'etn9xq7brd6947kq',           // SEND_PLEXT

    // common parameters
    method: 'yyngyttbmmbuvdpa',
    version: 'avz401t36lzrapis',
    version_parameter: 'c5d0a5d608f729a1232bebdc12fb86ba5fb6c43f',

    // GET_THINNED_ENTITIES
    quadKeys: '1mpmxz2yun22rwnn',

    // GET_PAGINATED_PLEXTS
    desiredNumItems: 'nzd23jqm9k1cnnij',
    minLatE6: '0dod6onpa1s4fezp',
    minLngE6: 'soass3t7mm7anneo',
    maxLatE6: 'cvarmr3o00ngylo1',
    maxLngE6: 'udzwnlx07hzd3bfo',
    minTimestampMs: '9iiiks138gkf8xho',
    maxTimestampMs: '94wm0u3sc3sgzq7x',
    chatTab: 'tqfj4a3okzn5v5o1',
    ascendingTimestampOrder: '5jv1m90sq35u6utq',

    // SEND_PLEXT
    message: '8exta9k7y8huhqmc',
    latE6: 'kqek161gza3kjcry',
    lngE6: '3dlxsqrjj2vcmhbc',
//  chatTab: 'efaznrayv5n3jxs0', //guessed parameter name - only seen munged

    // GET_PORTAL_DETAILS
    guid: 'seg6ohxgnqf9xu9w',

    // SEND_INVITE_EMAIL
    inviteeEmailAddress: '8exta9k7y8huhqmc',
  },

];



// in the recent stock site updates, their javascript code has been less obfuscated, but also the munge parameters
// change on every release. I can only assume it's now an integrated step in the build/release system, rather
// than continued efforts to block iitc. the lighter obfuscation on the code makes it easier to parse and find
// the munges in the code - so let's attempt that
function extractMungeFromStock() {
  try {
    var foundMunges = {};

    // these are easy - directly available in variables
    // NOTE: the .toString() is there so missing variables throw an exception, rather than storing 'undefined'
    foundMunges['dashboard.getArtifactInfo'] = nemesis.dashboard.requests.MethodName.GET_ARTIFACT_INFO.toString();
    foundMunges['dashboard.getGameScore'] = nemesis.dashboard.requests.MethodName.GET_GAME_SCORE.toString();
    foundMunges['dashboard.getPaginatedPlexts'] = nemesis.dashboard.requests.MethodName.GET_PAGINATED_PLEXTS.toString();
    foundMunges['dashboard.getThinnedEntities'] = nemesis.dashboard.requests.MethodName.GET_THINNED_ENTITIES.toString();
    foundMunges['dashboard.getPortalDetails'] = nemesis.dashboard.requests.MethodName.GET_PORTAL_DETAILS.toString();
    foundMunges['dashboard.redeemReward'] = nemesis.dashboard.requests.MethodName.REDEEM_REWARD.toString();
    foundMunges['dashboard.sendInviteEmail'] = nemesis.dashboard.requests.MethodName.SEND_INVITE_EMAIL.toString();
    foundMunges['dashboard.sendPlext'] = nemesis.dashboard.requests.MethodName.SEND_PLEXT.toString();

    // the rest are trickier - we need to parse the functions of the stock site. these break very often
    // on site updates

    // regular expression - to match either x.abcdef123456wxyz or x["123456abcdefwxyz"] format for property access
    var mungeRegExpProp = '(?:\\.([a-z][a-z0-9]{15})|\\["([0-9][a-z0-9]{15})"\\])';
    // and one to match members of object literal initialisation - {abcdef123456wxyz: or {"123456abcdefwxyz":
    var mungeRegExpLit = '(?:([a-z][a-z0-9]{15})|"([0-9][a-z0-9]{15})"):';

    // common parameters - method, version, version_parameter - currently found in the 
    // nemesis.dashboard.network.XhrController.prototype.doSendRequest_ function
    // look for something like
    //  var e = a.getData();
    //  e["3sld77nsm0tjmkvi"] = c;
    //  e.xz7q6r3aja5ttvoo = "b121024077de2a0dc6b34119e4440785c9ea5e64";
    var reg = new RegExp('getData\\(\\);.*\\n.*'+mungeRegExpProp+' =.*\n.*'+mungeRegExpProp+' *= *"([a-z0-9]{40})','m');
    var result = reg.exec(nemesis.dashboard.network.XhrController.prototype.doSendRequest_.toString());
    // there's two ways of matching the munge expression, so try both
    foundMunges.method = result[1] || result[2];
    foundMunges.version = result[3] || result[4];
    foundMunges.version_parameter = result[5];

    // GET_THINNED_ENTITIES parameters
    var reg = new RegExp('GET_THINNED_ENTITIES, [a-zA-Z]+ = {'+mungeRegExpLit);
    var result = reg.exec(nemesis.dashboard.network.DataFetcher.prototype.getGameEntities.toString());
    foundMunges.quadKeys = result[1] || result[2];

    // GET_PAGINATED_PLEXTS
    var reg = new RegExp('GET_PAGINATED_PLEXTS, [a-z] = [a-z] \\|\\| nemesis.dashboard.BoundsParams.getBoundsParamsForWorld\\(\\), [a-z] = [a-z] \\|\\| -1, [a-z] = [a-z] \\|\\| -1, [a-z] = {'+mungeRegExpLit+'[a-z], '+mungeRegExpLit+'Math.round\\([a-z].bounds.sw.lat\\(\\) \\* 1E6\\), '+mungeRegExpLit+'Math.round\\([a-z].bounds.sw.lng\\(\\) \\* 1E6\\), '+mungeRegExpLit+'Math.round\\([a-z].bounds.ne.lat\\(\\) \\* 1E6\\), '+mungeRegExpLit+'Math.round\\([a-z].bounds.ne.lng\\(\\) \\* 1E6\\), '+mungeRegExpLit+'[a-z], '+mungeRegExpLit+'[a-z]};\n *[a-z]'+mungeRegExpProp+' = [a-z];\n *[a-z] > -1 && \\([a-z]'+mungeRegExpProp+' = true\\);', 'm');
    var result = reg.exec(nemesis.dashboard.network.PlextStore.prototype.getPlexts.toString());

    foundMunges.desiredNumItems = result[1] || result[2];
    
    foundMunges.minLatE6 = result[3] || result[4];
    foundMunges.minLngE6 = result[5] || result[6];
    foundMunges.maxLatE6 = result[7] || result[8];
    foundMunges.maxLngE6 = result[9] || result[10];
    foundMunges.minTimestampMs = result[11] || result[12];
    foundMunges.maxTimestampMs = result[13] || result[14];
    foundMunges.chatTab = result[15] || result[16];  //guessed parameter name - only seen munged
    foundMunges.ascendingTimestampOrder = result[17] || result[18];

    // SEND_PLEXT
    var reg = new RegExp('SEND_PLEXT, {'+mungeRegExpLit+'[a-z], '+mungeRegExpLit+'[a-z], '+mungeRegExpLit+'[a-z], '+mungeRegExpLit+'[a-z]}');
    var result = reg.exec(nemesis.dashboard.network.PlextStore.prototype.sendPlext.toString());

    foundMunges.message = result[1] || result[2];
    foundMunges.latE6 = result[3] || result[4];
    foundMunges.lngE6 = result[5] || result[6];
    var chatTab = result[7] || result[8];
    if (chatTab != foundMunges.chatTab) throw 'Error: inconsistent munge parsing for chatTab';

    // GET_PORTAL_DETAILS
    var reg = new RegExp('GET_PORTAL_DETAILS, {'+mungeRegExpLit+'a}');
    var result = reg.exec(nemesis.dashboard.network.DataFetcher.prototype.getPortalDetails.toString());

    foundMunges.guid = result[1] || result[2];

    // SEND_INVITE_EMAIL
    var reg = new RegExp('SEND_INVITE_EMAIL, {'+mungeRegExpLit+'b}');
    foundMunges.inviteeEmailAddress = result[1] || result[2];

    return foundMunges;
  } catch(e) {
    console.warn('Failed to extract munges from the code: '+e);
  }
}


var activeMunge = null;


// attempt to guess the munge set in use, by looking through the functions of the stock intel page for one of the munged params
window.detectActiveMungeSet = function() {

  // first, try and parse the stock functions and extract the munges directly
  activeMunge = extractMungeFromStock();
  if (activeMunge) {
    console.log('IITC: Successfully extracted munges from stock javascript - excellent work!');
  } else {
    console.warn('IITC: failed to detect a munge set from the code - searching our list...');

    // try to find a matching munge set from the pre-defined ones. this code remains as in the case of
    // things breaking it can be quicker to update the table than to fix the regular expressions used
    // above

    try {
      for (var i in requestParameterMunges) {
        if (requestParameterMunges[i]['dashboard.getThinnedEntities'] == nemesis.dashboard.requests.MethodName.GET_THINNED_ENTITIES) {
          console.log('IITC: found a match with munge set index '+i);
          activeMunge = requestParameterMunges[i];
          break;
        }
      }
    } catch(e) {
      console.warn('IITC: failed to find matching munge set from supplied list');
    }
  }

  if (!activeMunge) {
    console.warn('IITC: Error!! failed to find a parameter munge set - neither extracting from stock, or searching through table. IITC CANNOT WORK');
    throw {error:'Failed to find a munge set'};
  }

}




window.mungeOneString = function(str) {
  if (!activeMunge) detectActiveMungeSet();

  return activeMunge[str];
}

// niantic now add some munging to the request parameters. so far, only two sets of this munging have been seen
window.requestDataMunge = function(data) {
  if (!activeMunge) detectActiveMungeSet();

  function munge(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
      // an array - munge each element of it
      var newobj = [];
      for (var i in obj) {
        newobj[i] = munge(obj[i]);
      }
      return newobj;
    } else if (typeof obj === 'object') {
      // an object: munge each property name, and pass the value through the munge process
      var newobj = Object();
      for (var p in obj) {
        var m = activeMunge[p];
        if (m === undefined) {
          console.error('Error: failed to find munge for object property '+p);
          newobj[p] = obj[p];
        } else {
          // rename the property
          newobj[m] = munge(obj[p]);
        }
      }
      return newobj;
    } else {
      // neither an array or an object - so must be a simple value. return it unmodified
      return obj;
    }
  };

  var newdata = munge(data);

  try {
    newdata = nemesis.dashboard.requests.normalizeParamCount(newdata);
  } catch(e) {
    if (!window._mungeHaveLoggedError) {
      console.warn('Failed to call the stock site normalizeParamCount() function: '+e);
      window._mungeHaveLoggedError = true;
    }
  }

  return newdata;
}


//anonymous function end
}());


