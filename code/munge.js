// REQUEST PARAMETER MUNGING /////////////////////////////////////////////

//TODO: the double inclusion is planned - but not yet in place

// WARNING: this code is included in IITC twice!
// once within the main body of IITC code, inside the wrapper function
// additionally, outside of the wrapper code - used to detect if the required munging code will work
// before IITC actually starts



window.requestParameterMunges = [
  // now obsolete (they don't have some of the new parameters) munge sets deleted

  // set 6 - 2013-10-29
  {
    'dashboard.getGameScore': 'vzjhib746rvkre04',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': 'gqa96zhqpddtfmkl',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': '18lmw7lytgxji0dk',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': 'emb5xrj8rav1i0be',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': '4xqof5pldqab63rb',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': 'yq5wxjlnud0tj6hu',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'e1ipqdxjlwd3l7zb',             // SEND_PLEXT

    // common parameters
    method: 'wg7gyxoanqc1si5r',
    version: 'adlo9o4kjvho5q94', //guessed parameter name - only seen munged
    version_parameter: '56036a6497ea344a9fffa38b171a77c092c1f220', // passed as the value to the above parameter

    // GET_THINNED_ENTITIES
    quadKeys: '6vcl0ivqz4aj5sfu', //guessed parameter name - only seen munged

    // GET_PAGINATED_PLEXTS
    desiredNumItems: '6jd5b49wn748diye',
    minLatE6: '891ebsryg45b8cxb',
    minLngE6: 'mvepdcx1k6noya15',
    maxLatE6: 's3rh3fhji5mcjlof',
    maxLngE6: 'yqdgfuukrxj8byzj',
    minTimestampMs: 'btf0kpztxrkt6sl6',
    maxTimestampMs: 'hg8vhtehxf53n5cu',
    chatTab: '6bk9rmebtk1ux6da', //guessed parameter name - only seen munged
    ascendingTimestampOrder: '4zw3v6xwp117r47w',

    // SEND_PLEXT
    message: '55vpsci0hji0ai5x',
    latE6: 'lyhrt4miuwc7w29d',
    lngE6: 'c1yl2qmzfu5j23ao',
//  chatTab: '6bk9rmebtk1ux6da', //guessed parameter name - only seen munged

    // LOOKUP_PLAYERS
    guids: 'k76phw8ey9z21z7c',

    // SEND_INVITE_EMAIL
    inviteeEmailAddress: 'x16pe9u4i8bidbi2',
  },

  // set 7 - 2013-11-06
  {
    'dashboard.getArtifactInfo': 'artifacts',               // GET_ARTIFACT_INFO: new (and not obfsucated?!)
    'dashboard.getGameScore': 'yol4dxx5ufqolhk2',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': '7b83j2z81rtk6101',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': '46su4lrisoq28gxh',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': 'wsc5puahrymtf1qh',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': 'oo0n7pw2m0xufpzx',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': 'bo1bp74rz8kbdjkb',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'q0f8o4v9t8pt91yv',             // SEND_PLEXT

    // common parameters
    method: 'imo60cdzkemxduub',
    version: '54lh4o0q7nz7dao9', //guessed parameter name - only seen munged
    version_parameter: '370c0b4e160ed26c8c4ce40f10f546545730e1ef', // passed as the value to the above parameter

    // GET_THINNED_ENTITIES
    quadKeys: 'iqy8e2d3zpne0cmh', //guessed parameter name - only seen munged

    // GET_PAGINATED_PLEXTS
    desiredNumItems: 'chwe3yko3xy0qlk3',
    minLatE6: 'f31z3x27ua8i05cf',
    minLngE6: 't0rmob7f42c0w04r',
    maxLatE6: 'ebwfvri5io9q0tvu',
    maxLngE6: 'lfqzvpj92dp8uxo6',
    minTimestampMs: '23a6djyyieeaeduu',
    maxTimestampMs: 'zhjtsm2gw7w3b7mx',
    chatTab: 'tak64gipm3hhqpnh', //guessed parameter name - only seen munged
    ascendingTimestampOrder: 'v5rzzxtg5rmry3dx',

    // SEND_PLEXT
    message: 'onptntn3szan21lj',
    latE6: '1jq9lgu3hjajrt7s',
    lngE6: 'plbubiopnavbxxh6',
//  chatTab: 'tak64gipm3hhqpnh', //guessed parameter name - only seen munged

    // LOOKUP_PLAYERS
    guids: '919p2cfpdo2wz03n',

    // SEND_INVITE_EMAIL
    inviteeEmailAddress: 'thpbnoyjx0antwm5',
  },

  // set 8 - 2013-11-07
  {
    'dashboard.getArtifactInfo': 'artifacts',               // GET_ARTIFACT_INFO: new (and not obfsucated?!)
    'dashboard.getGameScore': 'lls4clhel87apzpa',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': 'r6n2xgcd8wjsm4og',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': '1ybigzcf2sifu34b',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': 'uig0xeb6trclqd2l',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': '7dd7x64cc2lbutoq',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': 'd8p6dvwilsr460u3',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'repg2orpg7htkoto',             // SEND_PLEXT

    // common parameters
    method: '97aes4vnlvyhoxik',
    version: 'an8mglz21qabq3wq', //guessed parameter name - only seen munged
    version_parameter: 'b92c9d055fcdf715887b173c706e7a2c267e32c5', // passed as the value to the above parameter

    // GET_THINNED_ENTITIES
    quadKeys: 'mhjknavysslwfhk6', //guessed parameter name - only seen munged

    // GET_PAGINATED_PLEXTS
    desiredNumItems: 'l61g8u397alq3j1x',
    minLatE6: 'wwsvpboc5bxd1s9q',
    minLngE6: '48l4x7ngfsz47z3u',
    maxLatE6: 'p3m1qg81uqldizu6',
    maxLngE6: 'h4kv1eef878vfyk3',
    minTimestampMs: 'uj1vcy9ufws24v2c',
    maxTimestampMs: '8pt1x5nd9hk5vakv',
    chatTab: 'zy1yc1rfczashshu', //guessed parameter name - only seen munged
    ascendingTimestampOrder: 'duyuskmky68nl2ci',

    // SEND_PLEXT
    message: 'xktwjguq0nohzioa',
    latE6: 'm4crflfaibmg9mdf',
    lngE6: 'h6jfungrw5ii830r',
//  chatTab: 'zy1yc1rfczashshu', //guessed parameter name - only seen munged

    // LOOKUP_PLAYERS
    guids: '3u9h9cpfh2yiy4fk',

    // SEND_INVITE_EMAIL
    inviteeEmailAddress: 'jpg3y4ax7t0w356j',
  },

  // set 9 - 2013-11-1
  {
    'dashboard.getArtifactInfo': 'artifacts',               // GET_ARTIFACT_INFO: new (and not obfsucated?!)
    'dashboard.getGameScore': '9w8phj2dccvns3t9',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': '3b1nc3ub0sd1704x',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': '2xa55qj41qrhfhas',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': '734hxjh89d53clqq',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': 'k3hwg41wf112gjjh',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': 'uwizjeb18xmcesa0',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': '5au1m1hut1gyvnix',             // SEND_PLEXT

    // common parameters
    method: '3sld77nsm0tjmkvi',
    version: 'xz7q6r3aja5ttvoo', //guessed parameter name - only seen munged
    version_parameter: 'b121024077de2a0dc6b34119e4440785c9ea5e64', // passed as the value to the above parameter

    // GET_THINNED_ENTITIES
    quadKeys: '0o6bkrbwevwn6bg1', //guessed parameter name - only seen munged

    // GET_PAGINATED_PLEXTS
    desiredNumItems: '3fketl1tv01q7vxu',
    minLatE6: '5i6jhgbv3aq3c4qz',
    minLngE6: 'pe2io3r932qysg4u',
    maxLatE6: 'plzyuy89bnlb3pth',
    maxLngE6: 'q0qq1ooc7sxpynth',
    minTimestampMs: 'nc282s8hdklv21mw',
    maxTimestampMs: 'ezrljj0l71gpelpu',
    chatTab: 'efaznrayv5n3jxs0', //guessed parameter name - only seen munged
    ascendingTimestampOrder: 'fcmlcb8ya0oa1clk',

    // SEND_PLEXT
    message: 'jg4ms2i14rgzi02n',
    latE6: 'nkf3evzpkxkq8l2q',
    lngE6: '7xoz0xl8se4d1j53',
//  chatTab: 'efaznrayv5n3jxs0', //guessed parameter name - only seen munged

    // LOOKUP_PLAYERS
    guids: 'm4dcrdltldigfo94',

    // SEND_INVITE_EMAIL
    inviteeEmailAddress: 'rye9be4um2t1z5ts',
  },

];
window.activeRequestMungeSet = undefined;



// attempt to guess the munge set in use, by looking therough the functions of the stock intel page for one of the munged params
window.detectActiveMungeSet = function() {

  // try and find the stock page functions
  // FIXME? revert to searching through all the code? is that practical?
  var stockFunc;
  try {
    stockFunc = nemesis.dashboard.network.XhrController.prototype.doSendRequest_.toString();
  } catch(e) {
    try {
      stockFunc = nemesis.dashboard.network.XhrController.prototype.sendRequest.toString();
    } catch(e) {
      try {
        stockFunc = nemesis.dashboard.network.DataFetcher.prototype.sendRequest_.toString();
      } catch(e) {
        console.warn('Failed to find a relevant function in the stock site');
      }
    }
  }

  if(stockFunc) {
    for (var i in window.requestParameterMunges) {
      if (stockFunc.indexOf (window.requestParameterMunges[i]['method']) >= 0) {
        console.log('IITC: found request munge set index '+i+' in stock intel site');
        window.activeRequestMungeSet = i;
      }
    }
  } else {
    console.error('IITC: failed to find the stock site function for detecting munge set');
  }

  if (window.activeRequestMungeSet===undefined) {
    console.error('IITC: failed to find request munge set - IITC will likely fail');
    window.activeRequestMungeSet = 0;
  }
}



// niantic now add some munging to the request parameters. so far, only two sets of this munging have been seen
window.requestDataMunge = function(data) {
  var activeMunge = window.requestParameterMunges[window.activeRequestMungeSet];

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
  return newdata;
}
