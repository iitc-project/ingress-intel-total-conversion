// ==UserScript==
// @id       iitc-plugin-iOS-workaround@galfinite
// @name IITC Plugin: iOS Workaround
// @category       Misc
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Workarounds for iitc on iOS
// @version        0.2.1.@@DATETIMEVERSION@@
// @include        http://www.ingress.com/intel*
// @include        https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @grant         none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.iOSworkaround = function() {};

var iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);

window.plugin.iOSworkaround.openChatListDialog = function() {

	var title = 'Chat Options';

	var body = '<div id="ChatOptionsBox"><table id="ChatOptionsTable">'

	//table finish
	body += '</tr></table></div>';

	dialog({
		title: title,
		html: body,
		id: 'dialog-chatOptions',
		dialogClass: 'ui-dialog-chatOptions',
		buttons:{
			'Full': function(){window.show('full');},
			'Compact': function(){window.show('compact');},
			'Public': function(){window.show('public');},
			'Faction': function(){window.show('faction');},
			'Map': function(){window.show('map');}
		}
	});
}

window.plugin.iOSworkaround.addChatButton = function() {
	window.plugin.iOSworkaround.viewChatBtn = L.Control.extend({
		options:{
			position: 'topleft'
		},
		onAdd: function (map) {
			var container = L.DomUtil.create('div', 'leaflet-chat-selector');
			$(container).append('<div class="leaflet-bar"><a href="javascript: void(0);" class="chat-button"></a></div>');
			$(container).on('click', function() {
				window.plugin.iOSworkaround.openChatListDialog();
			})
			return container;
		}
	});
	map.addControl(new window.plugin.iOSworkaround.viewChatBtn);
}

window.plugin.iOSworkaround.setupCSS = function() {
	cssData = ".glympse-member { \
			background-repeat: no-repeat;\
			background-size: 32px 37px;\
			background-position: 50% 0;\
		}\
		.leaflet-chat-selector a.chat-button {\
			background-repeat: no-repeat;\
			background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4zjOaXUAAABBdJREFUOE+llLuP41QUxr3LaoWQVlBSUGxBsRUF/wLF7BZQUNAi0VPRM9UWiG61iBXMMrCMBDMM835mQpzHxHk5HidxHMd5OW9nksn7NckmH+cmQTACQcGRPl3f4+/7nRsrNvdvla/13qo0u0u14fTDcuf6o1Kr+yiWKd/ngFsLy38XgDsMctke8tXeyy5pcjWYotqfotQeT7PNUd9oDIW02fpAUZS7i9g/V7kxuF9qXZ/WeuNJdzTFYDxXn66ZeiTWrw8mKLTG0C+HvFZsP1jEb1bK7LyTqw9TV70xBScE+FNsz9S9nqszfIkWqdweQav0KqrReHeBmVeqXn89UemkKu1rNAcjtMncXYiF/xDrtwZjNPtj1GlwrTtCqTVEuNAsKJnKmwscx+nlxjOj1gM9NzJdk5nA/RFaC7Frpnp/fu+KPFXyMr/ZGkCvdCCmq5sbGxuvcFqx+iCUrfdzV12UGn0y9GfmantAcCY2hNYOrbM+gQjCfMyfp1y21kUgVe0JidzbnGxUPg1la0iaTRjVNgozcBcmU5MG/FWNHsokdr9Q7yJXayNdaUEvN3FhVGFXcp9xbq3wTM6YUPM16KU6jEoT2csmYkYRGbM+C+k5E3renAPKNaiZ4syXNhvQildQcpeQUiYscmqH48PpPZ9eoEYJSraCeKGGUCILQVYhqkmohgm3FIUnpEHLV6kfgzesIUpQjbwRowIpWYI3XsCxqAe4k0Bs3R5Ow60aEPU8QukSgnEDMkGj6QIU2su6gUgqDy1HYS2DUDKPSLo49yYKEGJZMMaOW3FyBx718ZFPhVWKwxlOwh8zICUITKGoUYaSIVE4RtdROi0boNDpQtQT4zmcK2nYZB0n/hg27NJT7sgfef9XhzQ58ERwJsbgIqiPoKKewwWB5WRhplCyiHCKQLRe0D5I971qBvYZTMWW82L6k9X/iBPF4ms/n/mSWw4JB0IY1qCK83CCzGkECBzUspDoJEwXbAhJop6PYMxnFdVZbs3iTaycn9+b/bE3Lb6ltVNhsmUP4lAI4TcyOeU4BCUJbzRF4TT8BBDZAJKf9kIkCbsUw7E3jHWrD9/tOz6ewVjRF+b2i0PX6dqJG1v2AEFlWP0KBVS4ZA3usE4AOjUbQDAPraxv9UeYf7q6z3+1vLx8e4Gb17pF2Hi+Z8eLQyc2bX7suSSceBg4ApsYhYNO4ySIwOAkOz2aXUdg9OOR8ym9cjc/Y3wm8+oWH9C+2bbiyfpx7dttq7Z27Jpu2rzYcwZx5JZg8YZmcJ7gtoCCfWcguH4mPPzbyahuueXoJ9/v23Jf/rD3+RcrO/fYS76ybXnv+Y7tyequzbV25JTpF8i/nHnOt23er3f54EOe5+8s8jdLUXB33yEurW7zbyxa/6M47ncFomjVVv+zkgAAAABJRU5ErkJggg==);\
		}\
		.leaflet-retina .leaflet-chat-selector a.chat-button {\
			background-size: 20px 20px;\
			background-repeat: no-repeat;\
			background-image: url(data:image/png;base64,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);\
		}\
		#glympseMemberListDialog.mobile .closeGlympseMembersBtn { margin-top: 20px; }";
	
	$('<style>') .prop('type', 'text/css') .html(cssData).appendTo('head');
}

window.plugin.iOSworkaround.addMapButton = function(){
	$('#chatinput tr:first').append('<td width=20><a onclick="window.show(\'map\')"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwABEI8AARCPAbZ2bGgAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAHPSURBVDhPnZO9S8NQFMXbQQQHRRCdBMGio2C1Tu7S+g+IILi5Fbo4CAoOdRN0EBRcOgsOTg5OIq22TT+o4FoRnERLKVQX/d32xry0ibQeONy8e849SV5eAvl8fh5Wcrlck5oKhUKDAR/gWcPzSv2A29p2Q8O+DSZUcqFUKo2jfZpeZpdUdoDQ7DCdqOSCZVkLpk+96yo7oJnqMG6o5EI4HB7A+2T7uH7LZDITKjuQPcOQkCeTMOoDmFHZBZ5yBU8Wz2E2m53V9t+QML9Q+ucERnTZO+xQnmKRgCRsgd4zZURt/UHDzL21+Qj7D2VInswrUJhUW+9gSOAVJsypTXxb8AaewjFtdwNR4BUmfGc/d+G+2Wd9rePdwOD7ygweU6PUu47+l467EYlEhhEvMb2YA8rfj8K53DQ1Zm5bAfwFQ8VicYrLoBxYxDTiqgxC89hU4HJrqI0g7R1Yon/B7KQc1his0ZQ7WNS0319QKBTmZFCX3sBQlTCbrPdU8gSeK3gmvnK5PKptB4h1O0yI8UilLrBnIfSG4b2nHWyrCpoHhqEhr6VSF9Djttem7r0LQYyyj3E4rT1PEBA1w/DX5IOq/C/IzeWN6tQqjGlfEQj8AIv0YyDkEVbVAAAAAElFTkSuQmCC"></a></td>');
}

window.plugin.iOSworkaround.setup  = function() {
	if(iOS){ 
		$('#toolbox').append(' <a onclick="window.show(\'map\')">Close Pane</a>');
		// Close button is present (an x in top right corner) when the portal details are loaded. However, the info pane can be opened without portal details
		
		window.plugin.iOSworkaround.addChatButton();
		window.plugin.iOSworkaround.setupCSS();
		window.plugin.iOSworkaround.addMapButton();
	}
};

var setup =  window.plugin.iOSworkaround.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@