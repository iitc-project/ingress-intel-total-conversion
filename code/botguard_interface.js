// interface to the use of the google 'botguard' javascript added to the intel site


iitc_bg = Object();

iitc_bg.init = function() {
// stock site - 'ud.g()' constructor
//function ud() {
//  this.lb = {}; //a map, indexed by 'group-[ab]-actions', each entry containing an array of 'yd' objects (simple object, with 'gf' and 'cb' members). a queue of data to process?
//  this.ya = {}; //a map, indexed by 'group-[ab]-actions', each entry containing an object with an 'invoke' method
//  this.qc = {}; //a map, indexed by group, witn constructors for botguard
//  this.cb = ""; // the 'key' - B
//  this.gd = []; //the list of methods to protect
//}

  iitc_bg.data_queue = {};    //.lb - indexed by group
  iitc_bg.instance_queue = {}; //.ya - indexed by group
  iitc_bg.key = "";      //.cb
  iitc_bg.botguard = {}; //.qc - indexed by key


// stock site code
//ud.prototype.R = function(a, b, c) {
//// a==B, b==CS, c==window.niantic_params.botguard_protected_methods
//  this.gd = c;
//  vd(this, a);
//  for (var d in b) if ("group-b-actions" == d || "group-a-actions" == d) {
//    for (c = 0; c < b[d].length; ++c) xd(this, d, new yd(b[d][c], a));
//    zd(this, d);
//  }
//};
// and... a simple object that just holds onto it's parameters (the data - a - and the key - b)
//function yd(a, b) {
//  this.gf = a;
//  this.cb = b;
//}
    

  // to initialise, we need four things
  // B - a key(?). set in the main web page HTML, name isn't changed on site updates
  // CS - initialisation data for botguard - again in the main page, again name is constant
  // a list of method names to protect. varies on site updates (sometimes) - in window.niantic_params.botguard_protected_methods
  // a (smaller) list of methods for group a - in window.niantic_params.botguard_group_methods


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
//function xd(a, b, c) {
//// a==this, b=="group-[ab]-actions", c==a 'yd' object (c.gf == botguard data, c.cb == key)
//  var d = c.cb && a.qc[c.cb];
//  if ("dkxm" == c.gf || d) a.lb[b] || (a.lb[b] = []), a.lb[b].push(c);
//}

  var botguard_instance = iitc_bg.key && iitc_bg.botguard[iitc_bg.key];

  if (data == "dkxm" || botguard_instance) {
    // NOTE: we pre-create empty per-group arrays on init
    iitc_bg.data_queue[group].push( {data: data, key: key} );
  }
};


// called both on initialisation and on processing responses from the server
// 
iitc_bg.process_key = function(key,serverEval) {

// stock site code
//function vd(a, b, c) {
//// a == the ud.g() singleton
//// b == the 'b' response from the server, or on init, the key
//// c == the 'a' response from the server (code to eval), or not set on init
//  a.cb = b;
//  if (!a.qc[b]) {
//    var d = !1; //false
//    if (c) try {
//      eval(c);
//    } catch (e) {
//       d = !0; //true
//    }
//    d || (a.qc[b] = botguard.bg)
//  }
//}

  iitc_bg.key = key;

  if (!iitc_bg.botguard[key]) {
    var caught = false;
    if (serverEval) {
      // server wants us to eval some code! risky, and impossible to be certain we can do it safely
      // however... reports say that it only interacts with the botguard.bg code, so we might be fine just running it
      try {
        eval(serverEval);
      } catch(e) {
        caught = true;
      }
    }
    if (!caught) {
      iitc_bg.botguard[key] = botguard.bg;
    }
  }
};



iitc_bg.get_method_group = function(method) {
//stock site
//function wd(a) {
//  return -1 != Rf.indexOf(a) ? "group-a-actions" : "group-b-actions";
//}
//NOTE: stock site has separate test for 'is any group' - IITC combines it into this one function that returns
// undefined for no group

  if (window.niantic_params.botguard_protected_methods.indexOf(method) != -1) {
    if (window.niantic_params.botguard_group_methods.indexOf(method) != -1) {
      return "group-a-actions";
    } else {
      return "group-b-actions";
    }
  }
  // method is not of any group
  return undefined;
};


// stock site code - called to create the 'c' parameter for each request
//function Cd(a, b) {
//  if (-1 == a.gd.indexOf(b)) return "";
//  var c = "mxkd", d = wd(b);
//  a.ya[d] && 0 < a.ya[d].length && a.ya[d].shift().invoke(function(a) {
//    c = a;
//  });
//  zd(a, d);
//  return c;
//}
//... also
//function Sf() {}
//
//Sf.prototype.invoke = function(a) {
//  a("dkxm");
//};



// returns the extra parameters to add to any JSON request
iitc_bg.extra_request_params = function(method) {

  var extra = {};
  extra.b = iitc_bg.key;
  extra.c = iitc_bg.get_request_data(method);

  return extra;
};

iitc_bg.get_request_data = function(method) {
//function Cd(a, b) {
////a==this, b==method
//  if (-1 == a.gd.indexOf(b)) return "";
//  var c = "mxkd", d = wd(b); //d==group
//  a.ya[d] && 0 < a.ya[d].length && a.ya[d].shift().invoke(function(a) {
//    c = a;
//  });
//  zd(a, d);
//  return c;
//}


  var group = iitc_bg.get_method_group(method);
  if (!group) {
    return "";
  }

  // this seems to be some kind of 'flag' string - and is either "mkxd" or "dkxm". it can be returned from the
  // server, so we stick with the same string rather than something more sensibly named
  var data = "mkxd";

  if (iitc_bg.botguard[group] && iitc_bg.botguard[group].length > 0) {
    var instance = iitc_bg.botguard[group].shift();
    instance.invoke(function(a) { data=a; });
  };


};

// stock site - 'dummy' botguard object
//function Sf() {}
//Sf.prototype.invoke = function(a) {
//  a("dkxm");
//};
  
iitc_bg.dummy_botguard = function() {};
iitc_bg.dummy_botguard.prototype.invoke = function(callback) {
  callback("dkxm");
}


iitc_bg.process_queue = function(group) {
//stock site
//function zd(a, b) {
//// a==this, b==group
//  if (a.lb[b] && 0 < a.lb[b].length) {
//    var c = a.lb[b].shift(), d = c.gf, c = "dkxm" == d ? new Sf : new a.qc[c.cb](d);
//    a.ya[b] || (a.ya[b] = []);
//    a.ya[b].push(c);
//  }
//}

// processes an entry in the queue for the specified group

  if (iitc_bg.data_queue[group] && iitc_bg.data_queue[group].length > 0) {
    var item = iitc_bg.data_queue[group].shift();
    var obj = undefined;

    if (item.data == "dkxm") {
      obj = new iitc_bg.dummy_botguard;
    } else {

      obj = new iitc_bg.botguard[item.key](item.data);
    }

    // note: we pre-create empty per-group arrays on init
    iitc_bg.instance_queue[group].push(obj);
  }

};
