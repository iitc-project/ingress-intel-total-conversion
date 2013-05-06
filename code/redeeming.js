// REDEEMING /////////////////////////////////////////////////////////

/* Resource type names mapped to actual names and abbreviations.
 * Add more here if necessary.
 */
window.REDEEM_RESOURCES = {
  RES_SHIELD:  {long: 'Portal Shield', short: 'SH'},
  EMITTER_A:   {long: 'Resonator', short: 'R'},
  EMP_BURSTER: {long: 'XMP Burster', short: 'X'},
  POWER_CUBE:  {long: 'Power Cube', short: 'C'}
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
  "Asset transfer in progress.",
  "Well done, Agent.",
  "Make the " + {'RESISTANCE' : 'Resistance', 'ALIENS' : 'Enlightened'}[PLAYER.team] + " proud!"
];

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
  'resourceWithLevels' : {
    decode: function(type, resource) {return resource.level;},
    format: function(acquired, level) {
      var prefix = '<span style="color: ' + (window.COLORS_LVL[level] || 'white') + ';">';
      var suffix = '</span>';
      return {
        table: '<td>' + prefix + 'L' + level + suffix + '</td><td>' + acquired.name.long + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '&#215;' + acquired.name.short + prefix + level + suffix,
        plain: acquired.count + '@' + acquired.name.short + level
      };
    }
  },
  'modResource' : {
    decode: function(type, resource) {return resource.rarity;},
    format: function(acquired, rarity) {
      var prefix = '<span style="color: ' + (window.COLORS_MOD[rarity] || 'white') + ';">';
      var suffix = '</span>';
      var abbreviation = rarity.split('_').map(function (i) {return i[0];}).join('');
      return {
        table: '<td>' + prefix + abbreviation + suffix + '</td><td>' + acquired.name.long + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '&#215;' + prefix + abbreviation + suffix,
        plain: acquired.count + '@' + abbreviation
      };
    }
  },
  'default' : {
    decode: function(type, resource) {return 'UNKNOWN';},
    format: function(acquired, group) {
      return {
        table: '<td>+</td><td>' + acquired.name.long + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '&#215;' + acquired.name.short,
        plain: acquired.count + '@' + acquired.name.short
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

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  var passcode = this.passcode, to_dialog, to_log, buttons;

  if(data.error) {
    to_dialog = '<strong>' + data.error + '</strong><br />' + (window.REDEEM_ERRORS[data.error] || 'There was a problem redeeming the passcode. Try again?');
    to_log    = '[ERROR] ' + data.error;
    buttons   = {};
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
      var acquired = award[2], handler, type, key, name;

      // The "what the heck is this item" heuristic
      $.each(acquired, function (taxonomy, resource) {
        if('resourceType' in resource) {
          if(taxonomy in window.REDEEM_HANDLERS) {
            // Cool. We know how to directly handle this item.
            handler = {
              functions: window.REDEEM_HANDLERS[taxonomy],
              taxonomy: taxonomy,
              processed_as: taxonomy
            };
          } else {
            // Let's see if we can get a hint for how we should handle this.
            $.each(resource, function (resource_key, resource_value) {
              if(resource_key in window.REDEEM_HINTS) {
                // We're not sure what this item is, but we can process it like another item
                handler = {
                  functions: (window.REDEEM_HANDLERS[window.REDEEM_HINTS[resource_key]] || window.REDEEM_HANDLERS['default']),
                  taxonomy: taxonomy,
                  processed_as: window.REDEEM_HINTS[resource_key]
                };
                return false;
              }
            });

            // Fall back to the default handler if necessary
            handler = handler || {
              functions: window.REDEEM_HANDLERS['default'],
              taxonomy: taxonomy,
              processed_as: 'default'
            };
          }

          // Collect the data that we know
          type = resource.resourceType;
          key  = handler.functions.decode(type, resource);
          name = window.REDEEM_RESOURCES[type] || {long: type, short: type[0]};

          // Decide if we inferred this resource
          if(!(type in window.REDEEM_RESOURCES) || handler.taxonomy !== handler.processed_as) {
            name.long  += '*';
            name.short += '*';
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
      payload[type][key].name = payload[type][key].name || name;
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
    if (inferred.length > 0) {
      results.table.push('<td>*</td><td>Guessed (check console)</td>');
      $.each(inferred, function (idx, val) {
        console.log(passcode +
                    ' => [INFERRED] ' + val.type + ':' + val.key + ' :: ' +
                    val.handler.taxonomy + ' =~ ' + val.handler.processed_as);
      });
    }

    // Display formatted versions in a table, plaintext, and the console log
    to_dialog = '<table class="redeem-result">' +
                results.table.map(function(a) {return '<tr>' + a + '</tr>';}).join("\n") +
                '</table>';
    to_log    = '[SUCCESS] ' + results.plain.join('/');
    buttons   = {
      'PLAINTEXT' : function() {
        dialog({
          title: 'Passcode: ' + passcode,
          html: '<span style="font-family: monospace;"><strong>' + encouragement + '</strong>' +
                '<br />' + results.html.join('/') + '</span>'
        });
      }
    }
  }

  dialog({
    title: 'Passcode: ' + passcode,
    html: to_dialog,
    buttons: buttons
  });
  console.log(passcode + ' => ' + to_log);
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
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
          html: '<strong>The HTTP request failed.</strong> ' + extra
        });
      });
  });
}
