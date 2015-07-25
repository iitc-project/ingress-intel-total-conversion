// as of 2014-08-14, Niantic have returned to minifying the javascript. This means we no longer get the nemesis object
// and it's various member objects, functions, etc.
// so we need to extract some essential parameters from the code for IITC to use

window.extractFromStock = function() {
  window.niantic_params = {}

  // extract the former nemesis.dashboard.config.CURRENT_VERSION from the code
  var reVersion = new RegExp('[a-z]=[a-z].getData\\(\\);[a-z].v="([a-f0-9]{40})";');

  var minified = new RegExp('^[a-zA-Z$][a-zA-Z$0-9]$');

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

      if (topObject && Array.isArray && Array.isArray(topObject)) {
        // find all non-zero length arrays containing just numbers
        if (topObject.length>0) {
          var justInts = true;
          for (var i=0; i<topObject.length; i++) {
            if (typeof(topObject[i]) !== 'number' || topObject[i] != parseInt(topObject[i])) {
              justInts = false;
              break;
            }
          }
          if (justInts) {

            // current lengths are: 17: ZOOM_TO_LEVEL, 14: TILES_PER_EDGE
            // however, slightly longer or shorter are a possibility in the future

            if (topObject.length >= 12 && topObject.length <= 18) {
              // a reasonable array length for tile parameters
              // need to find two types:
              // a. portal level limits. decreasing numbers, starting at 8
              // b. tiles per edge. increasing numbers. current max is 36000, 9000 was the previous value - 18000 is a likely possibility too

              if (topObject[0] == 8) {
                // check for tile levels
                var decreasing = true;
                for (var i=1; i<topObject.length; i++) {
                  if (topObject[i-1] < topObject[i]) {
                    decreasing = false;
                    break;
                  }
                }
                if (decreasing) {
                  console.log ('int array '+topLevel+' looks like ZOOM_TO_LEVEL: '+JSON.stringify(topObject));
                  window.niantic_params.ZOOM_TO_LEVEL = topObject;
                }
              } // end if (topObject[0] == 8)

              // 2015-06-25 - changed to top value of 64000, then to 32000 - allow for them to restore it just in case
              if (topObject[topObject.length-1] >= 9000 && topObject[topObject.length-1] <= 64000) {
                var increasing = true;
                for (var i=1; i<topObject.length; i++) {
                  if (topObject[i-1] > topObject[i]) {
                    increasing = false;
                    break;
                  }
                }
                if (increasing) {
                  console.log ('int array '+topLevel+' looks like TILES_PER_EDGE: '+JSON.stringify(topObject));
                  window.niantic_params.TILES_PER_EDGE = topObject;
                }

              } //end if (topObject[topObject.length-1] == 9000) {

            }
          }
        }
      }


    }
  }


  if (niantic_params.CURRENT_VERSION === undefined) {
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

