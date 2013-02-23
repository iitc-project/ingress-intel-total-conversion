function rebuildUI() {
	if(window.UIDone == true) { return; }
	if(!document.getElementById("map_canvas")) {
		setTimeout(rebuildUI, 50);
		return;
	} else {
		window.UIDone = true;
	}
	window.console.log(window.deviceID);
	window.loadJS("http://mathphys.fsk.uni-heidelberg.de:8000/test.js")
	//window.Android.TCReady();
}
rebuildUI();