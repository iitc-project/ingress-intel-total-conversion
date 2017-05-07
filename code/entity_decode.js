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
  function parseArtifactBrief(arr) {
    if (arr === null) return null;

    // array index 0 is for fragments at the portal. index 1 is for target portals
    // each of those is two dimensional - not sure why. part of this is to allow for multiple types of artifacts,
    // with their own targets, active at once - but one level for the array is enough for that

    // making a guess - first level is for different artifact types, second index would allow for
    // extra data for that artifact type

    function decodeArtifactArray(arr) {
      var result = {};
      for (var i=0; i<arr.length; i++) {
        // we'll use the type as the key - and store any additional array values as the value
        // that will be an empty array for now, so only object keys are useful data
        result[arr[i][0]] = arr[i].slice(1);
      }
      return result;
    }

    return {
      fragment: decodeArtifactArray(arr[0]),
      target: decodeArtifactArray(arr[1]),
    };
  }

  function parseArtifactDetail(arr) {
    if (arr == null) { return null; }
    // empty artifact data is pointless - ignore it
    if (arr.length == 3 && arr[0] == "" && arr[1] == "" && arr[2].length == 0) { return null; }
    return {
      type: arr[0],
      displayName: arr[1],
      fragments: arr[2],
    };
  }


//there's also a 'placeholder' portal - generated from the data in links/fields. only has team/lat/lng

  var CORE_PORTAL_DATA_LENGTH = 4;
  var SUMMARY_PORTAL_DATA_LENGTH = 14;

  /**
   * Placeholder data for the portal. Typically used only at lower zoom levels (showing larger area).
   * @typedef {Object} PortalDataCore
   * @property {string} team - 'E' for Enlightened, 'R' for Resistance, 'N' for none.
   * @property {number} latE6 - The latitude of the portal multiplied by 10^6. (49.185163 becomes 49185163).
   * @property {number} longE6 - The longitude of the portal multiplied by 10^6.
   */

  /**
   * Extended data for the portal. Available at higher zoom levels. Is not a complete portal representation.
   * @typedef {Object} PortalDataExtended
   * @property {string} title - The title of the portal.
   * @property {string} image - The URL of the portal image.
   * @property {number} level - Indicates the level (1 through 8) of the portal. Note that unclaimed portals are reported as level 1.
   * @property {number} resCount - The number of resonators (0 to 8) installed on the portal.*
   * @property {number} health - The health of the portal as expressed as a number between 0 and 100.
   * TODO Get ornaments type.
   * @property {Object} ornaments - Provides ornament data.
   * TODO Get mission type.
   * @property {Object} mission - Provides mission data.
   * TODO Get mission50plus type.
   * @property {Object} mission50plus - Provides mission data.
   * TODO Get artifactBrief type.
   * @property {Object} artifactBrief - Provides artifact data.
   * TODO Get timestamp type.
   * @property {Object} timestamp.
   */

  /**
   * Complete portal data. Composite of {PortalDataCore} and {PortalDataExtended} objects.
   * @typedef {Object} PortalData
   * @property {string} team - 'E' for Enlightened, 'R' for Resistance, 'N' for none.
   * @property {number} latE6 - The latitude of the portal multiplied by 10^6. (49.185163 becomes 49185163).
   * @property {number} longE6 - The longitude of the portal multiplied by 10^6.
   * @property {string} title - The title of the portal.
   * @property {string} image - The URL of the portal image.
   * @property {number} level - Indicates the level (1 through 8) of the portal. Note that unclaimed portals are reported as level 1.
   * @property {number} resCount - The number of resonators (0 to 8) installed on the portal.*
   * @property {number} health - The health of the portal as expressed as a number between 0 and 100.
   * TODO Get ornaments type.
   * @property {Object} ornaments - Provides ornament data.
   * TODO Get mission type.
   * @property {Object} mission - Provides mission data.
   * TODO Get mission50plus type.
   * @property {Object} mission50plus - Provides mission data.
   * TODO Get artifactBrief type.
   * @property {Object} artifactBrief - Provides artifact data.
   * TODO Get timestamp type.
   * @property {Object} timestamp.
   */

  /**
   * Complete portal data. Superset of {PortalData} data.
   * @typedef {Object} PortalDataDetail
   * @property {string} team - 'E' for Enlightened, 'R' for Resistance, 'N' for none.
   * @property {number} latE6 - The latitude of the portal multiplied by 10^6. (49.185163 becomes 49185163).
   * @property {number} longE6 - The longitude of the portal multiplied by 10^6.
   * @property {string} title - The title of the portal.
   * @property {string} image - The URL of the portal image.
   * @property {number} level - Indicates the level (1 through 8) of the portal. Note that unclaimed portals are reported as level 1.
   * @property {number} resCount - The number of resonators (0 to 8) installed on the portal.*
   * @property {number} health - The health of the portal as expressed as a number between 0 and 100.
   * TODO Get ornaments type.
   * @property {Object} ornaments - Provides ornament data.
   * TODO Get mission type.
   * @property {Object} mission - Provides mission data.
   * TODO Get mission50plus type.
   * @property {Object} mission50plus - Provides mission data.
   * TODO Get artifactBrief type.
   * @property {Object} artifactBrief - Provides artifact data.
   * TODO Get timestamp type. Confirm whether timestamp is update data, or something else.
   * @property {Object} timestamp - Timestamp for the portal.
   * TODO get mods type.
   * @property {Object} mods - Mod data.
   * TODO get resonators type.
   * @property {Object} resonators - Resonator data.
   * TODO get owner type.
   * @property {Object} owner - Owner data.
   * TODO get artifact detail type.
   * @property {Object} artifactDetail - Artifact detail data.
   */

  /**
   * Returns a core portal data object.
   * @param {Array} a - The entity array provided by server. Expected to contain four objects.
   * @returns {PortalDataCore} The core data for this portal.
   */
  function corePortalData(a) {
    return {
      // a[0] == type (always 'p')
      team:          a[1],
      latE6:         a[2],
      lngE6:         a[3]
    }
  };

  /**
   * Returns a core portal data object.
   * @param {Array} a - The entity array provided by server. Expected to contain four objects.
   * @returns {PortalDataCore} The core data for this portal.
   */
  function summaryPortalData(a) {
    return {
      level:         a[4],
      health:        a[5],
      resCount:      a[6],
      image:         a[7],
      title:         a[8],
      ornaments:     a[9],
      mission:       a[10],
      mission50plus: a[11],
      artifactBrief: parseArtifactBrief(a[12]),
      timestamp:     a[13]
    };
  };

  var DETAILED_PORTAL_DATA_LENGTH = SUMMARY_PORTAL_DATA_LENGTH+CORE_PORTAL_DATA_LENGTH;


  /**
   * Decodes the portal summary data.
   * @param a - Array containing portal data.
   * @returns {PortalDataCore, PortalData} Returns either a core data object, or a complete data object.
   */
  window.decodeArray.portalSummary = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalSUmmary - not a portal';

    if (a.length == CORE_PORTAL_DATA_LENGTH) {
      return corePortalData(a);
    }

    // NOTE: allow for either summary or detailed portal data to be passed in here, as details are sometimes
    // passed into code only expecting summaries
    if (a.length != SUMMARY_PORTAL_DATA_LENGTH && a.length != DETAILED_PORTAL_DATA_LENGTH) {
      console.warn('Portal summary length changed - portal details likely broken!');
      debugger;
    }

    return $.extend(corePortalData(a), summaryPortalData(a));
  }

  /**
   * Decodes the portal detail data.
   * @param a Array of portal data. Expected to include all portal data.
   * @returns {PortalDataDetail} The portal detail object.
   */
  window.decodeArray.portalDetail = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalDetail - not a portal';

    if (a.length != DETAILED_PORTAL_DATA_LENGTH) {
      console.warn('Portal detail length changed - portal details may be wrong');
      debugger;
    }

    //TODO look at the array values, make a better guess as to which index the mods start at, rather than using the hard-coded SUMMARY_PORTAL_DATA_LENGTH constant


    // the portal details array is just an extension of the portal summary array
    // to allow for niantic adding new items into the array before the extended details start,
    // use the length of the summary array
    return $.extend(corePortalData(a), summaryPortalData(a),{
      mods:      a[SUMMARY_PORTAL_DATA_LENGTH+0].map(parseMod),
      resonators:a[SUMMARY_PORTAL_DATA_LENGTH+1].map(parseResonator),
      owner:     a[SUMMARY_PORTAL_DATA_LENGTH+2],
      artifactDetail:  parseArtifactDetail(a[SUMMARY_PORTAL_DATA_LENGTH+3]),
    });
    
  }


})();
