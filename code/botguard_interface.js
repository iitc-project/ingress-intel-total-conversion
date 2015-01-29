// interface to the use of the google 'botguard' javascript added to the intel site


iitc_bg = Object();

iitc_bg.init = function() {
// stock site - 'ad.e()' constructor
//function Ad() {
//  this.Eb = {}; // a map, indexed by 'group-[ab]-actions', each entry containing an array of 'yd' objects (simple object, with 'gf' and 'cb' members). a queue of data to process?
//  this.Oa = {}; // a map, indexed by 'group-[ab]-actions', each entry containing an object with an 'invoke' method
//  this.Zc = {}; // a map, indexed by group, witn constructors for botguard
//  this.eb = ""; // the 'key' - B
//  this.Kh = e;  // e is defined in the main web page as "var e = function(w) {eval(w);};"
//}

  var botguard_eval = e;

  iitc_bg.data_queue = {};    //.lb - indexed by group
  iitc_bg.instance_queue = {}; //.ya - indexed by group
  iitc_bg.key = "";      //.cb
  iitc_bg.botguard = {}; //.qc - indexed by key
  iitc_bg.evalFunc = botguard_eval;

// stock site code
//Ad.prototype.U = function(a, b) {
//  Bd(this, a);
//  for (var c in b) if ("group-b-actions" == c || "group-a-actions" == c) {
//    for (var d = 0; d < b[c].length; ++d) Dd(this, c, new Ed(b[c][d], a));
//    Fd(this, c);
//  }
//};
// and.. Ed - a simple object that holds it's parameters and the timestamp it was created
//function Ed(a, b) {
//  var c = w();
//  this.mg = a;
//  this.eb = b;
//  this.Ki = c;
//}


  // to initialise, we need four things
  // B - a key(?). set in the main web page HTML, name isn't changed on site updates
  // CS - initialisation data for botguard - again in the main page, again name is constant
  // a list of method names to protect. varies on site updates (sometimes) - in window.niantic_params.botguard_protected_methods
  // a (smaller) list of methods for group a - in window.niantic_params.botguard_group_a_methods


  var botguard_key = B;
  var botguard_data = CS;

  iitc_bg.process_key(botguard_key);

  for (var group in botguard_data) {
    // TODO? filter this loop by group-[ab]-actions only? the stock site does, but this seems unnecessary

    // the stock site has code to create the emtpy arrays with the group index as and when needed
    // however, it makes more sense to do it here just once, rather than testing every time
    iitc_bg.data_queue[group] = [];
    iitc_bg.instance_queue[group] = [];

    for (var i=0; i < botguard_data[group].length; i++) {
      iitc_bg.push_queue(group, botguard_data[group][i], botguard_key);
    }

    iitc_bg.process_queue(group);
  }
};

//TODO: better name - will do for now...
iitc_bg.push_queue = function(group, data, key) {
//stock site code
//a=='this', b==group-[ab]-actions, c==object with .mg==data, .eb==key, .Ki==current timestamp
//function Dd(a, b, c) {
//  var d = c.eb && a.Zc[c.eb];
//  if ("dkxm" == c.mg || d) a.Eb[b] || (a.Eb[b] = []), a.Eb[b].push(c);
//}

  // Niantic have changed how the server returns data items to the client a few times, which cause
  // bad non-string items to come into here. this breaks things badly
  if (typeof data !== "string") throw "Error: iitc_bg.process_queue got dodgy data - expected a string";

  var botguard_instance = iitc_bg.key && iitc_bg.botguard[iitc_bg.key];

  if (data == "dkxm" || botguard_instance) {
    // NOTE: we pre-create empty per-group arrays on init
    iitc_bg.data_queue[group].push( {data: data, key: key, time: Date.now()} );
  }
};


// called both on initialisation and on processing responses from the server
// 
iitc_bg.process_key = function(key,serverEval) {

// stock site code
//function Bd(a, b, c) {
//  if (a.Zc[b]) a.eb = b; else {
//    var d = !0;
//    if (c) try {
//      a.Kh(c);
//    } catch (f) {
//      d = !1;
//    }
//    d && (a.Zc[b] = botguard.bg, a.eb = b);
//  }
//}

  if (iitc_bg.botguard[key]) {
    iitc_bg.key = key;
  } else {
    var noCatch = true;

    if (serverEval) {
      // server wants us to eval some code! risky, and impossible to be certain we can do it safely
      // however... reports say that it only interacts with the botguard.bg code, so we might be fine just running it
      // (but this is only when we don't send the correct params to the server? no reports of this code triggering yet...)
      try {
        console.warn('Server-generated javascript eval requested:\n'+serverExec);
debugger;
if (!confirm('The server asked IITC to run (eval) some javascript. This may or may not be safe. Run and continue?\n\nScript:\n'+serverEval)) { console.error('server javascript eval cancelled') } else
        iitc_bg.evalFunc(serverEval);
console.log('Server-generated javascript ran OK');
      } catch(e) {
console.warn('Server-generated javascript - threw an exception');
console.warn(e);
        noCatch = false;
      }
    }
    if (noCatch) {
      iitc_bg.botguard[key] = botguard.bg;
      iitc_bg.key = key;
    }
  }
};


//convert a method name to the group-[ab]-actions value, or return 'undefined' for no group
//NOTE: the stock code separates the 'in any group' and 'which group' test, but it's cleaner to combine them
//UPDATE: the 'not in any group' case was removed from the stock site logic
iitc_bg.get_method_group = function(method) {
//stock site
//function Cd(a) {
//  return -1 != ig.indexOf(a) ? "group-a-actions" : "group-b-actions";
//}

  if (window.niantic_params.botguard_group_a_methods.indexOf(method) != -1) {
    return "group-a-actions";
  } else {
    return "group-b-actions";
  }
};




// returns the extra parameters to add to any JSON request
iitc_bg.extra_request_params = function(method) {

  var extra = {};
  extra.b = iitc_bg.key;
  extra.c = iitc_bg.get_request_data(method);

  return extra;
};

iitc_bg.get_request_data = function(method) {
//function Id(a, b) {
//  var c = "mxkd", d = Cd(b);
//  a.Oa[d] && 0 < a.Oa[d].length && a.Oa[d].shift().invoke(function(a) {
//    c = a;
//  });
//  Fd(a, d);
//  return c;
//}


  var group = iitc_bg.get_method_group(method);
  if (!group) {
    return "";
  }

  // this seems to be some kind of 'flag' string - and is either "mxkd" or "dkxm". it can be returned from the
  // server, so we stick with the same string rather than something more sensibly named
  var data = "mxkd";

  if (iitc_bg.instance_queue[group] && iitc_bg.instance_queue[group].length > 0) {
    var instance = iitc_bg.instance_queue[group].shift();
    instance.invoke(function(a) { data=a; });
  };

  iitc_bg.process_queue(group);

  if (data.indexOf('undefined is not a function') != -1) {
    // there's been cases of something going iffy in the botguard code, or IITC's interface to it. in this case,
    // instead of the correct encoded string, the data contains an error message along the lines of
    // "E:undefined is not a function:TypeError: undefined is not a function"[...]
    // in this case, better to just stop with some kind of error than send the string to the server
    debugger;
    throw ('Error: iitc_bg.get_request_data got bad data - cannot safely continue');
  }

  return data;
};

// stock site - 'dummy' botguard object
//function Sf() {}
//Sf.prototype.invoke = function(a) {
//  a("dkxm");
//};
  
iitc_bg.dummy_botguard = function() {};
iitc_bg.dummy_botguard.prototype.invoke = function(callback) {
  callback("dkxm");
};


iitc_bg.process_queue = function(group) {
//stock site
//function Fd(a, b) {
//  if (a.Eb[b]) for (; 0 < a.Eb[b].length; ) {
//    var c = a.Eb[b].shift(), d = c.mg, f = c.Ki + 717e4, g;
//    "dkxm" == d ? g = new jg : w() < f && (g = new a.Zc[c.eb](d));
//    if (g) {
//      c = a;
//      d = b;
//      c.Oa[d] || (c.Oa[d] = []);
//      c.Oa[d].push(g);
//      break;
//    }
//  }
//}

// processes an entry in the queue for the specified group

  while (iitc_bg.data_queue[group] && iitc_bg.data_queue[group].length > 0) {
    var item = iitc_bg.data_queue[group].shift();
    var obj = undefined;

    if (item.data == "dkxm") {
      obj = new iitc_bg.dummy_botguard;
    } else if (Date.now() < item.time + 7170000) {
      obj = new iitc_bg.botguard[item.key](item.data);
    }

    // note: we pre-create empty per-group arrays on init
    if (obj) {
      iitc_bg.instance_queue[group].push(obj);
      break;
    }
  }

};


iitc_bg.process_response_params = function(method,data) {
// stock site: response processing
//yd.prototype.vi = function(a, b) {
//  var c = b.target;
//  if (cd(c)) {
//    this.Ib.reset();
//    var d = a.hg, f = JSON.parse(ed(c));
//    if (f.c && 0 < f.c.length) {
//      var g = Ad.e(), h = a.getMethodName(), l = f.a, m = f.b, r = f.c[0];
//      m && l && Bd(g, m, l);
//      h = Cd(h);
//      if (r && m && 0 < r.length) for (l = 0; l < r.length; ++l) Dd(g, h, new Ed(r[l], m));
//      g.Oa[h] && 0 != g.Oa[h].length || Fd(g, h);
//    }
//    "error" in f && "out of date" == f.error ? (d = rd.e(), Gd(!1), d.ie = !0, Hd("Please refresh for the latest version.")) : "error" in f && "RETRY" == f.error ? (this.Da.ja(1, a), td(this.Ib)) : n.setTimeout(pa(d, f), 0);
//  } else this.Ib.Ec = !0, d = a.cg, ha(d) && (f = {
//    error: dd(c) || "unknown",
//    respStatus: c.getStatus()
//  }, n.setTimeout(pa(d, f), 0));
//  d = this.Te;
//  d.Aa.remove(c) && d.zc(c);
//};


  if (data.c && data.c.length > 0) {

    if (data.b && data.a) {
      // in this case, we *EVAL* the 'data.a' string from the server!
      // however, it's not a case that's been ever triggered in normal use, as far as I know
      iitc_bg.process_key(data.b, data.a);
    }

    var group = iitc_bg.get_method_group(method);

//NOTE: I missed a change here a while ago. originally data.c was a single-level array of items to push on the queue,
//but now it's a two-dimensional array, and it's only index zero that's used!
    var data_items = data.c[0];

    if (data_items && data.b && data_items.length > 0) {
      for (var i=0; i<data_items.length; i++) {
        iitc_bg.push_queue(group, data_items[i], data.b);
      }
    }

    if (iitc_bg.instance_queue[group] && iitc_bg.instance_queue[group].length == 0) {
      iitc_bg.process_queue(group);
    }

  }

  // finally, the rest of IITC won't expect these strange a/b/c params in the response data
  // (e.g. it's pointless to keep in the cache, etc), so clear them
  delete data.a;
  delete data.b;
  delete data.c;
};
