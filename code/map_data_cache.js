// MAP DATA CACHE ///////////////////////////////////
// cache for map data tiles. 

window.DataCache = function() {
  this.REQUEST_CACHE_FRESH_AGE = 90;  // if younger than this, use data in the cache rather than fetching from the server
  this.REQUEST_CACHE_MAX_AGE = 60*60;  // maximum cache age. entries are deleted from the cache after this time
  this.REQUEST_CACHE_MIN_SIZE = 200;  // if fewer than this many entries, don't expire any
  this.REQUEST_CACHE_MAX_SIZE = 2000;  // if more than this many entries, expire early

  this._cache = {};

}

window.DataCache.prototype.store = function(qk,data,date) {
  // fixme? common behaviour for objects is that properties are kept in the order they're added
  // this is handy, as it allows easy retrieval of the oldest entries for expiring
  // however, this is not guaranteed by the standards, but all our supported browsers work this way

  delete this._cache[qk];

  if (date === undefined) date = new Date();
  this._cache[qk] = { time: date.getTime(), data: data };
}

window.DataCache.prototype.get = function(qk) {
  if (qk in this._cache) return this._cache[qk].data;
  else return undefined;
}

window.DataCache.prototype.getTime = function(qk) {
  if (qk in this._cache) return this._cache[qk].time;
  else return 0;
}

window.DataCache.prototype.isFresh = function(qk) {
  if (qk in this._cache) {
    var d = new Date();
    var t = d.getTime() - this.REQUEST_CACHE_FRESH_AGE*1000;
    if (this._cache[qk].time >= t) return true;
    else return false;
  }

  return undefined;
}


window.DataCache.prototype.expire = function() {
  var d = new Date();
  var t = d.getTime()-this.REQUEST_CACHE_MAX_AGE*1000;

  var cacheSize = Object.keys(this._cache).length;

  for(var qk in this._cache) {
    // stop processing once we hit the minimum size
    if (cacheSize < this.REQUEST_CACHE_MIN_SIZE) break;

    // fixme? our MAX_SIZE test here assumes we're processing the oldest first. this relies
    // on looping over object properties in the order they were added. this is true in most browsers,
    // but is not a requirement of the standards
    if (cacheSize > this.REQUEST_CACHE_MAX_SIZE || this._cache[qk].time < t) {
      delete this._cache[qk];
      cacheSize--;
    }
  }
}
