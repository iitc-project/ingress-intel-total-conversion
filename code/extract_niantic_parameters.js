// as of 2014-08-14, Niantic have returned to minifying the javascript. This means we no longer get the nemesis object
// and it's various member objects, functions, etc.
// so we need to extract some essential parameters from the code for IITC to use

window.extractFromStock = function() {
  window.niantic_params = {}

  //TODO: need to search through the stock intel minified functions/data structures for the required variables
  // just as a *very* quick fix, test the theory with hard-coded variable names


  // extract the former nemesis.dashboard.config.CURRENT_VERSION from the code
  var reVersion = new RegExp('[a-z]=[a-z].getData\\(\\);[a-z].v="([a-f0-9]{40})";');


  var minified = new RegExp('^[a-zA-Z][a-zA-Z0-9]$');

  for (var topLevel in window) {
    if (minified.test(topLevel)) {
      // a minified object - check for minified prototype entries

      // the object has a prototype - iterate through the properties of that
      if (window[topLevel] && window[topLevel].prototype) {
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

      }
    }
  }


  if (niantic_params.CURRENT_VERSION === undefined) {
    dialog({
      title: 'IITC Broken',
      html: '<p>IITC failed to extract the required varsion parameter from the intel site</p>'
           +'<p>This can happen after Niantic update the standard intel site. A fix will be needed from the IITC developers.</p>',
    });

    throw('Error: IITC failed to extract CURRENT_VERSION string - cannot continue');
  }

}

