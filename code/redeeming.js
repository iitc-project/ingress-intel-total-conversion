// REDEEMING ///////////////////////////////////////////////////////
// Heuristic passcode redemption that tries to guess unknown items /
//////////////////////////////////////////////////////// [NUMINIT] /

/* This component's namespace.
 */
window.redeem = function(passcode, options) {
  return window.redeem.redeemCode(passcode, options);
};

/* Abbreviates redemption items.
 * Example: VERY_RARE => VR
 */
window.redeem.REDEEM_ABBREVIATE = function(tag) {return tag.split('_').map(function (i) {return i[0];}).join('');};

/* Resource type names mapped to actual names and abbreviations.
 * Add more here if necessary.
 * Sometimes, items will have more information than just a level. Allow for specialization.
 */
window.redeem.REDEEM_RESOURCES = {
  RES_SHIELD: {
    /* modResource */
    format: function() {
      return {long: 'Portal Shield', short: 'SH'};
    }
  },
  FORCE_AMP: {
    /* modResource */
    format: function() {
      return {long: 'Force Amp', short: 'FA'};
    }
  },
  LINK_AMPLIFIER: {
    /* modResource */
    format: function() {
      return {long: 'Link Amp', short: 'LA'};
    }
  },
  HEATSINK: {
    /* modResource */
    format: function() {
      return {long: 'Heatsink', short: 'HS'};
    }
  },
  MULTIHACK: {
    /* modResource */
    format: function() {
      return {long: 'Multihack', short: 'MH'};
    }
  },
  TURRET: {
    /* modResource */
    format: function() {
      return {long: 'Turret', short: 'TU'};
    }
  },
  EMITTER_A: {
    /* resourceWithLevels */
    format: function() {
      return {long: 'Resonator', short: 'R'};
    }
  },
  EMP_BURSTER: {
    /* resourceWithLevels */
    format: function() {
      return {long: 'XMP Burster', short: 'X'};
    }
  },
  ULTRA_STRIKE: {
    /* resourceWithLevels */
    format: function() {
      return {long: 'Ultra Strike', short: 'U'};
    }
  },
  POWER_CUBE: {
    /* resourceWithLevels */
    format: function() {
      return {long: 'Power Cube', short: 'C'};
    }
  },
  MEDIA: {
    /* resourceWithLevels */
    decode: function(type, acquired, key) {
      return acquired.storyItem.shortDescription;
    },

    /* resourceWithLevels with custom URL */
    format: function(acquired) {
      var level = parseInt(acquired.resourceWithLevels.level);
      return {
        long: 'Media: <a href="' + (acquired.storyItem.primaryUrl || '#') + '" target="_blank">' + (acquired.storyItem.shortDescription || 'UNKNOWN') + '</a>',
        short: 'M',
        primary: '<span style="color: ' + (window.COLORS_LVL[level] || 'white') + ';">L' + level + '</span>'
      };
    }
  },
  FLIP_CARD: {
    decode: function(type, acquired, key) {
      /* ADA or JARVIS */
      return acquired.flipCard.flipCardType;
    },

    /* resource */
    format: function(acquired) {
      var type = acquired.flipCard.flipCardType;
      return {
        long: type,
        short: ({ADA: 'AR', JARVIS: 'JV'}[type] || 'FC'),
        prefix: '<span class="' + ({ADA: 'res', JARVIS: 'enl'}[type] || '') + '">',
        suffix: '</span>'
      };
    }
  },
  PORTAL_LINK_KEY: {
    decode: function(type, acquired, key) {
      /* A unique identifier for this portal. */
      return acquired.portalCoupler.portalGuid;
    },

    /* resource */
    format: function(acquired) {
      var location = acquired.portalCoupler.portalLocation.split(',').map(function(a){a = parseInt(a, 16); return ((a & 0x80000000) != 0 ? -((a ^ 0xffffffff) + 1) : a) / 1e6;});
      return {
        long: 'Key: ' + acquired.portalCoupler.portalTitle || 'Unknown Portal',
        short: 'K',
        prefix: '<a onclick="zoomToAndShowPortal(\'' + acquired.portalCoupler.portalGuid + '\', [' + location.join(', ') + '])">',
        suffix: '</a>'
      };
    }
  },
  UNUSUAL: {
    /* resource */
    format: function(acquired) {
      return {long: 'Unusual Object', short: '?'};
    }
  },
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
window.redeem.REDEEM_HANDLERS = {
  resource: {
    decode: function(type, acquired, key) {return 'RESOURCE';},
    format: function(acquired, group) {
      var prefix = acquired.str.prefix || '';
      var suffix = acquired.str.suffix || '';
      return {
        table: '<td>+</td><td title="' + acquired.desc + '">' + prefix + acquired.str.long + suffix + ' [' + acquired.count + ']</td>',
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
        table: '<td>' + prefix + 'L' + (acquired.str.primary || level) + suffix + '</td><td title="' + acquired.desc + '">' + acquired.str.long + ' [' + acquired.count + ']</td>',
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
      var abbreviation = window.redeem.REDEEM_ABBREVIATE(rarity);
      return {
        table: '<td>' + prefix + abbreviation + suffix + '</td><td title="' + acquired.desc + '">' + acquired.str.long + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '&#215;' + acquired.str.short + ':' + prefix + abbreviation + suffix,
        plain: acquired.count + '@' + acquired.str.short + ':' + abbreviation
      };
    }
  }
};

/* Redemption "hints" hint at what an unknown resource might be from its object properties.
 */
window.redeem.REDEEM_HINTS = {
  level: 'resourceWithLevels',
  rarity: 'modResource'
};

/* Redemption errors. Very self-explanatory.
 */
window.redeem.REDEEM_ERRORS = {
  ALREADY_REDEEMED: 'The passcode has already been redeemed.',
  ALREADY_REDEEMED_BY_PLAYER : 'You have already redeemed this passcode.',
  INVALID_PASSCODE: 'This passcode is invalid.',
  INVENTORY_FULL: 'Your inventory is full.'
};

/* These are HTTP status codes returned by the redemption API.
 * TODO: Move to another file? Use more generally across IITC?
 */
window.redeem.REDEEM_STATUSES = {
  429: 'You have been rate-limited by the server. Wait a bit and try again.',
  500: 'Internal server error'
};

/* Encouragement for people who got it in.
 * Just for fun.
 */
window.redeem.REDEEM_ENCOURAGEMENT = [
  "Passcode accepted!",
  "Access granted.",
  "Resources acquired.",
  "Power up!",
  "Asset transfer in progress.",
  "Well done, Agent.",
  "Make the " + {'RESISTANCE' : 'Resistance', 'ENLIGHTENED' : 'Enlightened'}[PLAYER.team] + " proud!"
];

/*
 * Turns an item list into an object of frequencies.
 */
window.redeem.getFrequencies = function(inventory) {
  // Items we have and items we had to infer
  var payload = {}, inferred = [];

  // Track frequencies and levels of items
  $.each(inventory, function(award_idx, award) {
    var acquired = award[2], handler, type, resource, key, str, desc;

    // The "what the heck is this item" heuristic
    $.each(acquired, function(taxonomy, attribute) {
      if ('resourceType' in attribute) {
        if (taxonomy in window.redeem.REDEEM_HANDLERS) {
          // Cool. We know how to directly handle this item.
          handler = {
            functions: window.redeem.REDEEM_HANDLERS[taxonomy],
            taxonomy: taxonomy,
            processed_as: taxonomy
          };
        } else {
          // Let's see if we can get a hint for how we should handle this.
          $.each(attribute, function(attribute_key, attribute_value) {
            if (attribute_key in window.redeem.REDEEM_HINTS) {
              // We're not sure what this item is, but we can process it like another item
              handler = {
                functions: (window.redeem.REDEEM_HANDLERS[window.redeem.REDEEM_HINTS[attribute_key]] || window.redeem.REDEEM_HANDLERS.resource),
                taxonomy: taxonomy,
                processed_as: window.redeem.REDEEM_HINTS[attribute_key]
              };
              return false;
            }
          });

          // Fall back to the default handler if necessary
          handler = handler || {
            functions: window.redeem.REDEEM_HANDLERS.resource,
            taxonomy: taxonomy,
            processed_as: 'resource'
          };
        }

        // Grab the type
        type = attribute.resourceType;

        // Prefer the resource's native format, falling back to a generic version that applies to an entire taxonomy
        resource = $.extend({format: function(acquired) {return {long: type, short: type[0]};}}, window.redeem.REDEEM_RESOURCES[type] || {});

        // Get strings pertaining to this item, using server overrides for the item name if possible
        str = $.extend(resource.format(acquired), acquired.displayName && acquired.displayName.displayName ? {long: attribute.displayName || acquired.displayName.displayName} : {});

        // Get the description
        desc = (acquired.displayName && acquired.displayName.displayDescription ? acquired.displayName.displayDescription : '');

        // Get the primary key. Once again, prefer the resource's native format, but use the generic version if we don't have one.
        key  = (resource.decode || handler.functions.decode)(type, acquired, handler.taxonomy);

        // Decide if we inferred this resource
        if (!(type in window.redeem.REDEEM_RESOURCES) || handler.taxonomy !== handler.processed_as) {
          str.long  += '*';
          str.short += '*';
          inferred.push({type: type, key: key, handler: handler});
        }
        return false;
      }
    });

    // Update frequencies
    payload[type] = payload[type] || {};
    payload[type][key] = payload[type][key] || {};
    payload[type][key].handler = payload[type][key].handler || handler;
    payload[type][key].type = payload[type][key].type || type;
    payload[type][key].str = payload[type][key].str || str;
    payload[type][key].desc = payload[type][key].desc || desc;
    payload[type][key].count = payload[type][key].count || 0;
    payload[type][key].count += 1;
  });

  // Done
  return {payload: payload, inferred: inferred};
};

/*
 * Formats the given AP, XM, payload, and inferred types into a table, plain HTML, and plaintext.
 * Optionally, `types' and `whitelist' arguments can be given. If `whitelist' is true, the array or
 * object `types' will act as a whitelist. Otherwise, it will act as a blacklist.
 * Whitelisted types will be formatted exclusively; blacklisted types won't be formatted.
 */
window.redeem.format = function(ap, xm, payload, inferred, types, whitelist) {
  var results = {
    table: [],
    html:  [],
    plain: []
  };

  // Decide if we want to whitelist or blacklist anything
  var list = null;
  whitelist = (whitelist === false ? whitelist : true);
  if ($.isArray(types)) {
    list = {};
    $.each(types, function(idx, val) {
      list[val] = true;
    });
  } else if ($.isPlainObject(types)) {
    list = ignore;
  }

  // Get AP and XM.
  $.each([{label: 'AP', award: parseInt(ap)}, {label: 'XM', award: parseInt(xm)}], function(idx, val) {
    if(val.award > 0) {
      results.table.push('<td>+</td><td>' + digits(val.award) + ' ' + val.label + '</td>');
      results.html.push(val.award + ' ' + val.label);
      results.plain.push(val.award + ' ' + val.label);
    }
  });

  // Build the formatted results alphabetically, ignoring types depending on the whitelist argument
  $.each(Object.keys(payload).sort(), function(type_idx, type) {
    if (list !== null) {
      var included = type in list;
      if ((whitelist === true && !included) || (whitelist === false && included)) {
        return true;
      }
    }

    // Build it
    $.each(Object.keys(payload[type]).sort(), function(key_idx, key) {
      var acquired = payload[type][key];
      $.each(acquired.handler.functions.format(acquired, key), function(format, string) {
        results[format].push(string);
      });
    });
  });

  // Let the user know if we had to guess, regardless of whitelist.
  if (inferred.length > 0) {
    results.table.push('<td>*</td><td>Guessed (check console)</td>');
    $.each(inferred, function (idx, val) {
      console.log('redeem.success: ' + passcode + ' => [INFERRED] ' + val.type + ':' + val.key + ' :: ' + val.handler.taxonomy + ' =~ ' + val.handler.processed_as);
    });
    console.log('redeem.success: ' + passcode + ' => [RESPONSE] ' + JSON.stringify(data));
  }

  return results;
};

/*
 * Renders the given results into flat strings.
 * Takes an object of results and an object of classes, and returns a new object
 * with keys taken from `results' and values as corresponding flat strings.
 */
window.redeem.render = function(results, classes) {
  classes = classes || {};
  classes = $.extend({table: 'redeem-result-table', html: 'redeem-result-html'}, classes);

  // Display formatted versions in a table, plaintext, and the console log
  return {
    table: '<table class="' + classes.table + '">' + results.table.map(function(a) {return '<tr>' + a + '</tr>';}).join("\n") + '</table>',
    html:  '<span class="' + classes.html + '">' + results.html.join('/<wbr />') + '</span>',
    plain: '[SUCCESS] ' + results.plain.join('/')
  };
};

/*
 * Called on sucessfully redeeming a passcode.
 */
window.redeem.success = function(data, textStatus, jqXHR) {
  var passcode = this.passcode, to_dialog, to_log, dialog_title, dialog_buttons;

  if(data.error) {
    // What to display
    to_dialog = '<strong>' + data.error + '</strong><br />' + (window.redeem.REDEEM_ERRORS[data.error] || 'There was a problem redeeming the passcode. Try again?');
    to_log    = '[ERROR] ' + data.error;

    // Dialog options
    dialog_title   = 'Error: ' + passcode;
    dialog_buttons = {};
  } else if($.isPlainObject(data.result) && $.isArray(data.result.inventoryAward)) {
    var encouragement = window.redeem.REDEEM_ENCOURAGEMENT[Math.floor(Math.random() * window.redeem.REDEEM_ENCOURAGEMENT.length)];

    // Turn the item list into frequencies
    var frequencies   = window.redeem.getFrequencies(data.result.inventoryAward);

    // Format each item frequency group
    var results       = window.redeem.format(data.result.apAward || 0, data.result.xmAward || 0, frequencies.payload, frequencies.inferred)
    results.table.unshift('<th colspan="2" style="text-align: left;"><strong>' + encouragement + '</strong></th>');

    // Convert to flat strings
    var rendered      = window.redeem.render(results);

    // What to display
    to_dialog      = rendered.table;
    to_log         = rendered.text;

    // Dialog options
    dialog_title   = 'Passcode: ' + passcode;
    dialog_buttons = {
      'PLAINTEXT' : function() {
        dialog({
          title: 'Rewards: ' + passcode,
          html:  rendered.html
        });
      }
    }
  }

  // Display it (finally)
  dialog({
    title: dialog_title,
    html:  to_dialog,
    buttons: dialog_buttons
  });
  console.log('redeem.success: ' + passcode + ' => ' + to_log);
};

window.redeem.redeemCode = function(passcode, options) {
  options = $.extend(options || {}, {success: window.redeem.success});
  window.postAjax('redeemReward', {passcode: passcode}, options.success, options.failure);
};

window.redeem.setup = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13 || !$(this).val()) return;
    var passcode = $(this).val();
    window.redeem.redeemCode(passcode, {
      success: window.redeem.success,
      failure: function(response) {
        var extra = '';
        if(response.status) {
          extra = (window.redeem.REDEEM_STATUSES[response.status] || 'The server indicated an error.') + ' (HTTP ' + response.status + ')';
        } else {
          extra = 'No status code was returned.';
        }
        dialog({
          title: 'Request failed: ' + passcode,
          html: '<strong>The HTTP request failed.</strong> ' + extra
        });
      }
    });
  });
};
