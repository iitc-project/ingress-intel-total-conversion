
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
        html:  acquired.count + '@' + acquired.name.short + prefix + level + suffix,
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
        html:  acquired.count + '@' + prefix + abbreviation + suffix,
        plain: acquired.count + '@' + abbreviation
      };
    }
  },
  'default' : {
    decode: function(type, resource) {return 'UNKNOWN';},
    format: function(acquired, group) {
      return {
        table: '<td>+</td><td>' + acquired.name.long + ' [' + acquired.count + ']</td>',
        html:  acquired.count + '@' + acquired.name.short,
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
  var passcode = this.passcode, to_alert, to_log;

  if(data.error) {
    to_alert = '<strong>' + data.error + '</strong><br />' + (window.REDEEM_ERRORS[data.error] || 'There was a problem redeeming the passcode. Try again?');
    to_log   = '[ERROR] ' + data.error;
  } else if(data.result) {
    var payload = {};
    var encouragement = window.REDEEM_ENCOURAGEMENT[Math.floor(Math.random() * window.REDEEM_ENCOURAGEMENT.length)];
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
              return true;
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
          name = window.REDEEM_RESOURCES[type] || {long: type + '*', short: type[0] + '*'};

          // Decide if we inferred this resource
          if(!(type in window.REDEEM_RESOURCES) || handler.taxonomy !== handler.processed_as) {
            inferred.push({type: type, key: key, handler: handler});
          }
          return false;
        }
        return true;
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

    // Get AP, XM, and other static quantities
    $.each([{label: 'AP', award: parseInt(data.result.apAward)}, {label: 'XM', award: parseInt(data.result.xmAward)}], function(idx, val) {
      if(val.award > 0) {
        var formatted = val.award + ' ' + val.label;
        results.table.push('<td>+</td><td>' + formatted + '</td>');
        results.html.push(formatted);
        results.plain.push(formatted);
      }
      return true;
    });

    // Build the formatted results alphabetically
    $.each(Object.keys(payload).sort(), function(type_idx, type) {
      $.each(Object.keys(payload[type]).sort(), function(key_idx, key) {
        var acquired = payload[type][key];
        $.each(acquired.handler.functions.format(acquired, key), function(format, string) {
          results[format].push(string);
          return true;
        });
        return true;
      });
      return true;
    });

    if (inferred.length > 0) {
      results.table.push('<td style="font-family: monospace;">**<td style="font-family: monospace;"><strong>IITC had to guess!</strong></td>');
      results.table.push('<td style="font-family: monospace;">**<td style="font-family: monospace;"><strong>Submit a log including:</strong></td>');
      $.each(inferred, function (idx, val) {
        var type = val.type + ':' + val.key, taxonomy = val.handler.taxonomy + ' =~ ' + val.handler.processed_as;
        results.table.push('<td style="font-family: monospace;">!</td><td style="font-family: monospace;"><em>' + type + '</em></td>');
        results.table.push('<td style="font-family: monospace;">!</td><td style="font-family: monospace;">' + taxonomy + '</td>');
        console.log(passcode + ' => [INFERRED] ' + type + ' :: ' + taxonomy);
      });
    }

    // Add table footers
    results.table.push('<td style="font-family: monospace;">&gt;&gt;</td><td><a href="javascript:alert(\'' +
                       escape('<span style="font-family: monospace;"><strong>' + encouragement + '</strong><br />' + results.html.join('/') + '</span>') +
                       '\', true);" style="font-family: monospace;">[plaintext]</a>');

    // Display formatted versions in a table, plaintext, and the console log
    to_alert = '<table class="redeem-result">' + results.table.map(function(a) {return '<tr>' + a + '</tr>';}).join("\n") + '</table>';
    to_log = results.plain.join('/');
  }

  alert(to_alert, true);
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
        alert('<strong>The HTTP request failed.</strong> ' + extra);
      });
  });
}
