// REDEEMING ///////////////////////////////////////////////////////
// Heuristic passcode redemption that tries to guess unknown items /
////////////////////////////////////////////////////////////////////

// TODO remove lots of unused code from the old redeeming method

/* Abbreviates redemption items.
 * Example: VERY_RARE => VR
 */
window.REDEEM_ABBREVIATE = function(tag) {return tag.split('_').map(function (i) {return i[0];}).join('');};

/* Resource type names mapped to actual names and abbreviations.
 * Add more here if necessary.
 * Sometimes, items will have more information than just a level. Allow for specialization.
 */
window.REDEEM_RESOURCES = {
  RES_SHIELD: {
    /* modResource */
    format: function(acquired) {
      return {long: 'Portal Shield', short: 'S'};
    }
  },
  FORCE_AMP: {
    format: function(acquired) {
      return {long: 'Force Amp', short: 'FA'};
    }
  },
  LINK_AMP: {
    format: function(acquired) {
      return {long: 'Link Amp', short: 'LA'};
    }
  },
  HEATSINK: {
    format: function(acquired) {
      return {long: 'Heatsink', short: 'H'};
    }
  },
  MULTIHACK: {
    format: function(acquired) {
      return {long: 'Multihack', short: 'M'};
    }
  },
  TURRET: {
    format: function(acquired) {
      return {long: 'Turret', short: 'T'};
    }
  },
  UNUSUAL: {
    format: function(acquired) {
      return {long: 'Unusual Object', short: 'U'};
    }
  },
  EMITTER_A: {
    /* resourceWithLevels */
    format: function(acquired) {
      return {long: 'Resonator', short: 'R'};
    }
  },
  EMP_BURSTER: {
    /* resourceWithLevels */
    format: function(acquired) {
      return {long: 'XMP Burster', short: 'X'};
    }
  },
  POWER_CUBE: {
    /* resourceWithLevels */
    format: function(acquired) {
      return {long: 'Power Cube', short: 'C'};
    }
  },
  MEDIA: {
    /* resourceWithLevels */
    format: function(acquired) {
      return {
        long: 'Media: <a href="' + (acquired.storyItem.primaryUrl || '#') + '" target="_blank">' + (acquired.storyItem.shortDescription || 'UNKNOWN') + '</a>',
        short: 'M'
      };
    }
  },
  FLIP_CARD: {
    decode: function(type, acquired, key) {
      /* ADA or JARVIS */
      return acquired.flipCard.flipCardType;
    },
    format: function(acquired) {
      var type = acquired.flipCard.flipCardType;
      return {
        long: type,
        short: ({ADA: 'AR', JARVIS: 'JV'}[type] || 'FC'),
        prefix: '<span title="' + (acquired.displayName ? (acquired.displayName.displayDescription || '') : '') + '" class="' + ({ADA: 'res', JARVIS: 'enl'}[type] || '') + '">',
        suffix: '</span>'
      };
    }
  },
  PORTAL_LINK_KEY: {
    decode: function(type, acquired, key) {
      /* A unique identifier for this portal. */
      return acquired.portalCoupler.portalGuid;
    },
    format: function(acquired) {
      return {
        long: 'Portal Key: ' + acquired.portalCoupler.portalTitle || 'Unknown Portal',
        short: 'K'
      };
    }
  }
};

/* Redemption "handlers" handle decoding and formatting for rewards.
 *
 * Redemption "decoders" are used for returning the primary attribute (key) from
 * different types of items. Pretty self-explanatory.
 *
 * Redemption "formatters" are used for formatting specific types of password rewards.
 * Right now, Ingress has resourceWithLevels (leveled resources) and modResource (mods).
 * Resources with levels have levels, and mods have rarity. Format them appropriately.
 */
window.REDEEM_HANDLERS = {
  resource: {
    decode: function(type, acquired, key) {return 'RESOURCE';},
    format: function(acquired, group) {
      var prefix = acquired.str.prefix || '';
      var suffix = acquired.str.suffix || '';
      return {
        table: '<td>+</td><td>' + prefix + acquired.str.long + suffix + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '&#215;' + prefix + acquired.str.short + suffix,
        plain: acquired.count + '@' + acquired.str.short
      };
    }
  },

  // A leveled resource, such as XMPs, resonators, or power cubes.
  resourceWithLevels: {
    decode: function(type, acquired, key) {return acquired[key].level;},
    format: function(acquired, level) {
      var prefix = '<span style="color: ' + (window.COLORS_LVL[level] || 'white') + ';">';
      var suffix = '</span>';
      return {
        table: '<td>' + prefix + 'L' + level + suffix + '</td><td>' + acquired.str.long + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '&#215;' + acquired.str.short + prefix + level + suffix,
        plain: acquired.count + '@' + acquired.str.short + level
      };
    }
  },

  // A mod, such as portal shields or link amplifiers.
  modResource: {
    decode: function(type, acquired, key) {return acquired[key].rarity;},
    format: function(acquired, rarity) {
      var prefix = '<span style="color: ' + (window.COLORS_MOD[rarity] || 'white') + ';">';
      var suffix = '</span>';
      var abbreviation = window.REDEEM_ABBREVIATE(rarity);
      return {
        table: '<td>' + prefix + abbreviation + suffix + '</td><td>' + acquired.str.long + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '&#215;' + acquired.str.short + ':' + prefix + abbreviation + suffix,
        plain: acquired.count + '@' + acquired.str.short + ':' + abbreviation
      };
    }
  }
};

/* Redemption "hints" hint at what an unknown resource might be from its object properties.
 */
window.REDEEM_HINTS = {
  level: 'resourceWithLevels',
  rarity: 'modResource'
};

/* Redemption errors. Very self-explanatory.
 */
window.REDEEM_ERRORS = {
  ALREADY_REDEEMED: 'The passcode has already been redeemed.',
  ALREADY_REDEEMED_BY_PLAYER : 'You have already redeemed this passcode.',
  INVALID_PASSCODE: 'This passcode is invalid.'
};

/* These are HTTP status codes returned by the redemption API.
 * TODO: Move to another file? Use more generally across IITC?
 */
window.REDEEM_STATUSES = {
  429: 'You have been rate-limited by the server. Wait a bit and try again.',
  500: 'Internal server error'
};

/* Encouragement for people who got it in.
 * Just for fun.
 */
window.REDEEM_ENCOURAGEMENT = [
  "Passcode accepted!",
  "Access granted.",
  "Resources acquired.",
  "Power up!",
  "Asset transfer in progress.",
  "Well done, Agent.",
  "Make the " + {'RESISTANCE' : 'Resistance', 'ENLIGHTENED' : 'Enlightened'}[PLAYER.team] + " proud!"
];

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  var passcode = this.passcode, to_dialog, dialog_title;

  if(data.error) {
    dialog({
      title: 'Error: ' + passcode,
      html: '<strong>' + data.error + '</strong>'
    });
    return;
  }

  var encouragement = window.REDEEM_ENCOURAGEMENT[Math.floor(Math.random() * window.REDEEM_ENCOURAGEMENT.length)];

  var html = '<p><strong>' + encouragement + '</strong></p><ul class="redeemReward">';

  if(0 < data.xm)
    html += '<li>' + window.escapeHtmlSpecialChars(data.xm) + ' XM</li>';
  if(0 < data.ap)
    html += '<li>' + window.escapeHtmlSpecialChars(data.ap) + ' AP</li>';

  if(data.other) {
    data.other.forEach(function(item) {
      html += '<li>' + window.escapeHtmlSpecialChars(item) + '</li>';
    });
  }

  if(data.inventory) {
    data.inventory.forEach(function(type) {
      type.awards.forEach(function(item) {
        html += '<li>' + item.count + ' ';
        
        var l = item.level;
        if(0 < l) {
          l = parseInt(l);
          html += '<span class="itemlevel" style="background:' + COLORS_LVL[l] + '">L' + l + '</span> ';
        }

        html += window.escapeHtmlSpecialChars(type.name) + '</li>';
      });
    });
  }

  html += '</ul>';

  // Display it
  dialog({
    title: 'Passcode: ' + passcode,
    html: html
  });
};

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13 || !$(this).val()) return;
    var data = {passcode: $(this).val()};

    window.postAjax('redeemReward', data, window.handleRedeemResponse,
      function(response) {
        var extra = '';
        if(response.status) {
          extra = (window.REDEEM_STATUSES[response.status] || 'The server indicated an error.') + ' (HTTP ' + response.status + ')';
        } else {
          extra = 'No status code was returned.';
        }
        dialog({
          title: 'Request failed: ' + data.passcode,
          html: '<strong>The HTTP request failed.</strong> ' + extra
        });
      });
  });
};
