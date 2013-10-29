// MAP DATA CACHE ///////////////////////////////////
// cache for map data tiles. 

window.DataCache = function() {
  // stock site nemesis.dashboard.DataManager.CACHE_EXPIRY_MS_ = 18E4 - so should be 2 mins cache time
  this.REQUEST_CACHE_FRESH_AGE = 120;  // if younger than this, use data in the cache rather than fetching from the server

  // stale cache entries can be updated (that's what the optional 'timestampMs' field in getThinnedEntnties is
  // for, retrieving deltas) so use a long max age to take advantage of this
  // however, ther must be an overall limit on the maximum age of data from the servers, otherwise the deletedEntity
  // entries would grow indefinitely. an hour seems reasonable from experience with the data, so 55 mins max cache time
//  this.REQUEST_CACHE_MAX_AGE = 55*60;  // maximum cache age. entries are deleted from the cache after this time
//UPDATE: this timestampMs parameter doesn't work, so reduced max age to limit RAM usage
  this.REQUEST_CACHE_MAX_AGE = 15*60;  // maximum cache age. entries are deleted from the cache after this time

  if (L.Browser.mobile) {
    // on mobile devices, smaller cache size
    this.REQUEST_CACHE_MAX_SIZE = 300;  // if more than this many entries, expire early
  } else {
    // but on desktop, allow more
    this.REQUEST_CACHE_MAX_SIZE = 1000;  // if more than this many entries, expire early
  }

  this._cache = {};
  this._interval = undefined;

}

window.DataCache.prototype.store = function(qk,data,freshTime) {
  // fixme? common behaviour for objects is that properties are kept in the order they're added
  // this is handy, as it allows easy retrieval of the oldest entries for expiring
  // however, this is not guaranteed by the standards, but all our supported browsers work this way

  delete this._cache[qk];

  var time = new Date().getTime();

  if (freshTime===undefined) freshTime = this.REQUEST_CACHE_FRESH_AGE*1000;
  var expire = time + freshTime;

  this._cache[qk] = { time: time, expire: expire, data: data };
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
    var t = d.getTime();
    if (this._cache[qk].expire >= t) return true;
    else return false;
  }

  return undefined;
}

window.DataCache.prototype.startExpireInterval = function(period) {
  if (this._interval === undefined) {
    var savedContext = this;
    this._interval = setInterval (function() { savedContext.runExpire(); }, period*1000);
  }
}

window.DataCache.prototype.stopExpireInterval = function() {
  if (this._interval !== undefined) {
    stopInterval (this._interval);
    this._interval = undefined;
  }
}



window.DataCache.prototype.runExpire = function() {
  var d = new Date();
  var t = d.getTime()-this.REQUEST_CACHE_MAX_AGE*1000;

  var cacheSize = Object.keys(this._cache).length;

  for(var qk in this._cache) {

    // fixme? our MAX_SIZE test here assumes we're processing the oldest first. this relies
    // on looping over object properties in the order they were added. this is true in most browsers,
    // but is not a requirement of the standards
    if (cacheSize > this.REQUEST_CACHE_MAX_SIZE || this._cache[qk].time < t) {
      delete this._cache[qk];
      cacheSize--;
    }
  }
}
