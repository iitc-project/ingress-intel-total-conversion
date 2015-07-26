function Android() {
    this.showZoom = showZoom;
    function showZoom() {
        window.webkit.messageHandlers.ios.postMessage({functionName: "showZoom", args: ""});
    };

    this.copy = copy;
    function copy(text) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "copy", args: text});
    };

    this.reloadIITC = reloadIITC;
    function reloadIITC() {
        window.webkit.messageHandlers.ios.postMessage({functionName: "reloadIITC", args: ""});
    };

    this.getFileRequestUrlPrefix = getFileRequestUrlPrefix;
    function getFileRequestUrlPrefix() {
        window.webkit.messageHandlers.ios.postMessage({functionName: "getFileRequestUrlPrefix", args: ""});
    };

    this.setActiveHighlighter = setActiveHighlighter;
    function setActiveHighlighter(name) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "setActiveHighlighter", args: name});
    };

    this.setPermalink = setPermalink;
    function setPermalink(href) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "setPermalink", args: href});
    };

    this.getVersionName = getVersionName;
    function getVersionName() {
        window.webkit.messageHandlers.ios.postMessage({functionName: "getVersionName", args: ""});
    };

    this.dialogOpened = dialogOpened;
    function dialogOpened(id, boolValue) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "dialogOpened", args: [id, boolValue]});
    };

    this.switchToPane = switchToPane;
    function switchToPane(id) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "switchToPane", args: id});
    };

    this.setLayers = setLayers;
    function setLayers(baseLayersJSON, overlayLayersJSON) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "setLayers", args: [baseLayersJSON, overlayLayersJSON]});
    };

    this.dialogOpened = dialogOpened;
    function dialogOpened(id, boolValue) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "dialogOpened", args: [id, boolValue]});
    };

    this.addPortalHighlighter = addPortalHighlighter;
    function addPortalHighlighter(name) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "addPortalHighlighter", args: name});
    };

    this.spinnerEnabled = spinnerEnabled;
    function spinnerEnabled(boolValue) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "spinnerEnabled", args: boolValue});
    };

    this.setProgress = setProgress;
    function setProgress(progress) {
        window.webkit.messageHandlers.ios.postMessage({functionName: "setProgress", args: progress});
    };

    this.bootFinished = bootFinished;
    function bootFinished() {
        window.webkit.messageHandlers.ios.postMessage({functionName: "bootFinished", args: ""});
    };

    this.intentPosLink=intentPosLink;
    function intentPosLink(lat, lng, zoom, title, boolValue ){
        window.webkit.messageHandlers.ios.postMessage({functionName: "intentPosLink", args:[lat,lng,zoom,title,boolValue]});
    };
}
var android=new Android();