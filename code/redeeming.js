// REDEEMING ///////////////////////////////////////////////////////
// Heuristic passcode redemption that tries to guess unknown items /
////////////////////////////////////////////////////////////////////

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
  "Make the " + {'RESISTANCE' : 'Resistance', 'ALIENS' : 'Enlightened'}[PLAYER.team] + " proud!"
];

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  var passcode = this.passcode, to_dialog, to_log, dialog_title, dialog_buttons;

  if(data.error) {
    // What to display
    to_dialog = '<strong>' + data.error + '</strong><br />' + (window.REDEEM_ERRORS[data.error] || 'There was a problem redeeming the passcode. Try again?');
    to_log    = '[ERROR] ' + data.error;

    // Dialog options
    dialog_title   = 'Error: ' + passcode;
    dialog_buttons = {};
  } else if(data.result) {
    var encouragement = window.REDEEM_ENCOURAGEMENT[Math.floor(Math.random() * window.REDEEM_ENCOURAGEMENT.length)];
    var payload = {};
    var inferred = [];
    var results = {
      'table' : ['<th colspan="2" style="text-align: left;"><strong>' + encouragement + '</strong></th>'],
      'html'  : [],
      'plain' : []
    };

    // Track frequencies and levels of items
    $.each(data.result.inventoryAward, function (award_idx, award) {
      var acquired = award[2], handler, type, resource, key, str;

      // The "what the heck is this item" heuristic
      $.each(acquired, function (taxonomy, attribute) {
        if('resourceType' in attribute) {
          if(taxonomy in window.REDEEM_HANDLERS) {
            // Cool. We know how to directly handle this item.
            handler = {
              functions: window.REDEEM_HANDLERS[taxonomy],
              taxonomy: taxonomy,
              processed_as: taxonomy
            };
          } else {
            // Let's see if we can get a hint for how we should handle this.
            $.each(attribute, function (attribute_key, attribute_value) {
              if(attribute_key in window.REDEEM_HINTS) {
                // We're not sure what this item is, but we can process it like another item
                handler = {
                  functions: (window.REDEEM_HANDLERS[window.REDEEM_HINTS[attribute_key]] || window.REDEEM_HANDLERS.resource),
                  taxonomy: taxonomy,
                  processed_as: window.REDEEM_HINTS[attribute_key]
                };
                return false;
              }
            });

            // Fall back to the default handler if necessary
            handler = handler || {
              functions: window.REDEEM_HANDLERS.resource,
              taxonomy: taxonomy,
              processed_as: 'resource'
            };
          }

          // Grab the type
          type = attribute.resourceType;

          // Prefer the resource's native format, falling back to a generic version that applies to an entire taxonomy
          resource = $.extend({format: function(acquired) {return {long: type, short: type[0]};}}, window.REDEEM_RESOURCES[type] || {});

          // Get strings pertaining to this item, using server overrides for the item name if possible
          str = $.extend(resource.format(acquired),
                         acquired.displayName && acquired.displayName.displayName ? {
                           long: attribute.displayName || acquired.displayName.displayName
                         } : {});

          // Get the primary key. Once again, prefer the resource's native format, but use the generic version if we don't have one.
          key  = (resource.decode || handler.functions.decode)(type, acquired, handler.taxonomy);

          // Decide if we inferred this resource
          if(!(type in window.REDEEM_RESOURCES) || handler.taxonomy !== handler.processed_as) {
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
      payload[type][key].count = payload[type][key].count || 0;
      payload[type][key].count += 1;
    });

    // Get AP and XM.
    $.each([{label: 'AP', award: parseInt(data.result.apAward)}, {label: 'XM', award: parseInt(data.result.xmAward)}], function(idx, val) {
      if(val.award > 0) {
        results.table.push('<td>+</td><td>' + digits(val.award) + ' ' + val.label + '</td>');
        results.html.push(val.award + ' ' + val.label);
        results.plain.push(val.award + ' ' + val.label);
      }
    });

    // Build the formatted results alphabetically
    $.each(Object.keys(payload).sort(), function(type_idx, type) {
      $.each(Object.keys(payload[type]).sort(), function(key_idx, key) {
        var acquired = payload[type][key];
        $.each(acquired.handler.functions.format(acquired, key), function(format, string) {
          results[format].push(string);
        });
      });
    });

    // Let the user know if we had to guess
    if(inferred.length > 0) {
      results.table.push('<td>*</td><td>Guessed (check console)</td>');
      $.each(inferred, function (idx, val) {
        console.log(passcode +
                    ' => [INFERRED] ' + val.type + ':' + val.key + ' :: ' +
                    val.handler.taxonomy + ' =~ ' + val.handler.processed_as);
      });
      console.log(passcode + ' => [RESPONSE] ' + JSON.stringify(data));
    }

    // Display formatted versions in a table, plaintext, and the console log
    to_dialog = '<table class="redeem-result-table">' +
                results.table.map(function(a) {return '<tr>' + a + '</tr>';}).join("\n") +
                '</table>';
    to_log    = '[SUCCESS] ' + results.plain.join('/');

    dialog_title   = 'Passcode: ' + passcode;
    dialog_buttons = {
      'PLAINTEXT' : function() {
        dialog({
          title: 'Rewards: ' + passcode,
          html: '<span class="redeem-result-html">' + results.html.join('/') + '</span>'
        });
      }
    }
  }

  // Display it
  dialog({
    title: dialog_title,
    buttons: dialog_buttons,
    html: to_dialog
  });
  console.log(passcode + ' => ' + to_log);
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
