// decode the on-network array entity format into an object format closer to that used before
// makes much more sense as an object, means that existing code didn't need to change, and it's what the
// stock intel site does internally too (the array format is only on the network)


// anonymous wrapper function
(function(){
  window.decodeArray = function(){};


  function parseMod(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      name: arr[1],
      rarity: arr[2],
      stats: arr[3],
    };
  }
  function parseResonator(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      level: arr[1],
      energy: arr[2],
    };
  }
  function parseArtifact(arr) {
    if (arr == null) { return null; }
    // empty artifact data is pointless - ignore it
    if (arr.length == 3 && arr[0] == "" && arr[1] == "" && arr[2].length == 0) { return null; }
    return {
      type: arr[0],
      displayName: arr[1],
      fragments: arr[2],
    };
  }


  var summaryArrayLength = undefined;


  function basePortalData(a) {
    return {
      // a[0] == type (always 'p')
      team:          a[1],
      latE6:         a[2],
      lngE6:         a[3],
      level:         a[4],
      health:        a[5],
      resCount:      a[6],
      image:         a[7],
      title:         a[8],
      ornaments:     a[9],
      mission:       a[10],
      mission50plus: a[11]
    };
  };

  window.decodeArray.portalSummary = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalSUmmary - not a portal';

    if (summaryArrayLength===undefined) summaryArrayLength = a.length;
    if (summaryArrayLength!=a.length) console.warn('decodeArray.portalSUmmary: inconsistant map data portal array lengths');

    return basePortalData(a);
  }

  window.decodeArray.portalDetail = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalDetail - not a portal';

    if (summaryArrayLength===undefined) throw 'Error: decodeArray.portalDetail - not yet seen any portal summary data - cannot decode!';

    // the portal details array is just an extension of the portal summary array
    // to allow for niantic adding new items into the array before the extended details start,
    // use the length of the summary array
    return $.extend(basePortalData(a),{
      mods:      a[summaryArrayLength+0].map(parseMod),
      resonators:a[summaryArrayLength+1].map(parseResonator),
      owner:     a[summaryArrayLength+2],
      artifact:  parseArtifact(a[summaryArrayLength+3]),
    });
    
  }


})();
