// as of 2014-08-14, Niantic have returned to minifying the javascript. This means we no longer get the nemesis object
// and it's various member objects, functions, etc.
// so we need to extract some essential parameters from the code for IITC to use


window.niantic_params = {}


window.extractFromStock = function() {

  //TODO: need to search through the stock intel minified functions/data structures for the required variables
  // just as a *very* quick fix, test the theory with hard-coded variable names


  // extract the former nemesis.dashboard.config.CURRENT_VERSION from the code
  var re = new RegExp('[a-z]=[a-z].getData\\(\\);[a-z].v="([a-f0-9]{40})";');
  var func = od.prototype.vg.toString();
  var match = re.exec(func);
  niantic_params.CURRENT_VERSION = match[1];


}
