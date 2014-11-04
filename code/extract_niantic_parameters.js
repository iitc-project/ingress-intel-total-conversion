// as of 2014-08-14, Niantic have returned to minifying the javascript. This means we no longer get the nemesis object
// and it's various member objects, functions, etc.
// so we need to extract some essential parameters from the code for IITC to use

window.extractFromStock = function() {
  window.niantic_params = {}


  // extract the former nemesis.dashboard.config.CURRENT_VERSION from the code
  var reVersion = new RegExp('[a-z]=[a-z].getData\\(\\);[a-z].v="([a-f0-9]{40})";');

  // we also extract all top-level arrays of strings, for botguard
  var arrays = [];

  var minified = new RegExp('^[a-zA-Z][a-zA-Z0-9]$');

  for (var topLevel in window) {
    if (minified.test(topLevel)) {
      // a minified object - check for minified prototype entries

      if (window[topLevel] && window[topLevel].prototype) {

        // the object has a prototype - iterate through the properties of that
        for (var secLevel in window[topLevel].prototype) {
          if (minified.test(secLevel)) {

            // looks like we've found an object of the format "XX.prototype.YY"...

            var item = window[topLevel].prototype[secLevel];

            if (item && typeof(item) == "function") {
              // a function - test it against the relevant regular expressions
              var funcStr = item.toString();

              var match = reVersion.exec(funcStr);
              if (match) {
                console.log('Found former CURRENT_VERSION in '+topLevel+'.prototype.'+secLevel);
                niantic_params.CURRENT_VERSION = match[1];
              }

            }

          }
        }

      } //end 'if .prototype'


      // finding the required method names for the botguard interface code
      if (window[topLevel] && Object.prototype.toString.call(window[topLevel]) == "[object Array]") {
        // look for all arrays in the top-level namespace

        var arr = window[topLevel];
        var onlyStrings = true;
        if (arr.length > 0) {
          for (var i in arr) {
            if (Object.prototype.toString.call(arr[i]) != "[object String]") {
              onlyStrings = false;
              break;
            }
          }
          if (onlyStrings) {
            arrays.push(arr);
          }
        }

      }

    }
  }

  // we extracted a list of string arrays. now, we need to find which ones we want to use
  // there are two. both contain a list of method names - one is the list of methods protected by either
  // botguard group-a or group-b, while the others is just a list of those in one group

  window.niantic_params.botguard_protected_methods = [];
  window.niantic_params.botguard_group_a_methods = [];

  var countMethods = function(arr) {
    var methods = ['artifacts', 'getGameScore', 'getPlexts', 'getPortalDetails', 'redeemReward', 'sendInviteEmail', 'sendPlext'];
    var count = 0;
    for (var j in arr) {
      if (methods.indexOf(arr[j]) != -1) {
        count++;
      }
    }
    return count;
  }

  var protectedMethodsCount = 0;
  var groupMethodsCount = 0;

  for (var i in arrays) {
    var arr = arrays[i];
    var arrCount = countMethods(arr);

    // now store the longest in niantic_params.botguard_protected_methods, and 2nd longest in .niantic_params.botguard_group_a_methods

    if (arrCount > protectedMethodsCount) {
      // longest found - copy any existing longest to the 2nd longest

      window.niantic_params.botguard_group_a_methods = window.niantic_params.botguard_protected_methods;
      groupMethodsCount = protectedMethodsCount;

      //... and set the longest
      window.niantic_params.botguard_protected_methods = arr;
      protectedMethodsCount = arrCount;

    } else if (arrCount > groupMethodsCount) {
      // 2nd longest - store
      window.niantic_params.botguard_group_a_methods = arr;
      groupMethodsCount = arrCount;
    }

  }


  if (niantic_params.CURRENT_VERSION === undefined || window.niantic_params.botguard_protected_methods.length == 0 || window.niantic_params.botguard_group_a_methods == 0) {
    dialog({
      title: 'IITC Broken',
      html: '<p>IITC failed to extract the required parameters from the intel site</p>'
           +'<p>This can happen after Niantic update the standard intel site. A fix will be needed from the IITC developers.</p>',
    });

    console.log('Discovered parameters');
    console.log(JSON.stringify(window.niantic_params,null,2));

    throw('Error: IITC failed to extract CURRENT_VERSION string - cannot continue');
  }

}

