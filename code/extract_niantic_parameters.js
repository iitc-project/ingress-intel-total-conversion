// as of 2014-08-14, Niantic have returned to minifying the javascript. This means we no longer get the nemesis object
// and it's various member objects, functions, etc.
// so we need to extract some essential parameters from the code for IITC to use

window.extractFromStock = function() {
  window.niantic_params = {}

  window.niantic_params.botguard_method_group_flag = {};

  // extract the former nemesis.dashboard.config.CURRENT_VERSION from the code
  var reVersion = new RegExp('[a-z]=[a-z].getData\\(\\);[a-z].v="([a-f0-9]{40})";');

  // we also extract all top-level arrays of strings, for botguard
  var arrays = [];

  var minified = new RegExp('^[a-zA-Z$][a-zA-Z$0-9]$');

  // required for botguard
  var requestPrototype = (function() {
    for(var topLevel in window) {
      if(!window[topLevel]) continue;
      // need an example for a request object
      for(var property in window[topLevel]) {
        if(window[topLevel][property] == "getRegionScoreDetails") {
          return Object.getPrototypeOf(window[topLevel]);
        }
      }
    }
  })();

  for (var topLevel in window) {
    if (minified.test(topLevel)) {
      // a minified object - check for minified prototype entries

      var topObject = window[topLevel];
      if (topObject && topObject.prototype) {

        // the object has a prototype - iterate through the properties of that
        for (var secLevel in topObject.prototype) {
          if (minified.test(secLevel)) {
            // looks like we've found an object of the format "XX.prototype.YY"...
            var item = topObject.prototype[secLevel];

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
      if(topObject && typeof topObject == "object" && Object.getPrototypeOf(topObject) == requestPrototype) {
        var methodKey = Object
          .keys(topObject)
          .filter(function(key) { return typeof key == "string"; })[0];

        for(var secLevel in topObject) {
          if(typeof topObject[secLevel] == "boolean") {
            window.niantic_params.botguard_method_group_flag[topObject[methodKey]] = topObject[secLevel];
          }
        }
      }


    }
  }


  if (niantic_params.CURRENT_VERSION === undefined || Object.keys(window.niantic_params.botguard_method_group_flag).length == 0) {
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

