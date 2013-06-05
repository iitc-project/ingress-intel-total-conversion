// ==UserScript==
// @id         apgain@languantan
// @name       Total AP Gain
// @namespace  https://raw.github.com/languantan/apgain/master/AP_breakdown.user.js
// @version    0.2.3
// @description    Calculate AP gain for a single player
// @updateURL      https://raw.github.com/languantan/apgain/master/AP_breakdown.user.js
// @downloadURL    https://raw.github.com/languantan/apgain/master/AP_breakdown.user.js
// @include        http://www.ingress.com/intel*
// @include        https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @copyright  2013, languan aka tentwosix
// ==/UserScript==

function apGain() {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') 
        window.plugin = function() {};
    
    // PLUGIN START ////////////////////////////////////////////////////////
    
    // use own namespace for plugin
    window.plugin.apgain = function() {};
    
    window.plugin.apgain.display = function(playername){
        
        
        var total = 0;
        var resos_destroyed = 0;
        var links_destroyed = 0;
        var fields_destroyed = 0;
        var resos_deployed = 0;
        var captured = 0;
        var completed = 0;
        var links = 0;
        var fields = 0;
        var playerColor = "null";
        var guid = playerNameToGuid(playername);
        
        $.each(chat._public.data, 
               function(num, hello)
               { 
                   if(hello[3] == guid) //checks agent's guid against guid of Actions data
                   {
                       var line = hello[2]; 
                       if(playerColor=="null"){ //find agent's color from color attribute
                           var pos = line.indexOf("color:")+6;
                           var end = line.indexOf("\"",pos);
                           playerColor = line.substring(pos,end);
                           console.log(playerColor);
                           }
                       if(line.indexOf("destroyed an")!= -1) { total+=DESTROY_RESONATOR; resos_destroyed++; return;}
                       if(line.indexOf("destroyed the")!= -1) { total+=DESTROY_LINK; links_destroyed++; return;}
                       if(line.indexOf("destroyed a Control Field")!= -1) { total+=DESTROY_FIELD; fields_destroyed++; return;}
                       if(line.indexOf("deployed an")!= -1) { total+=DEPLOY_RESONATOR; resos_deployed++; return;}
                       if(line.indexOf("captured")!= -1) { total+=CAPTURE_PORTAL; captured++;completed++; return;}
                       if(line.indexOf("linked")!= -1) { total+=313; links++; return;}
                       if(line.indexOf("created a")!= -1) { total+=1250; fields++; return;}
                   }
               });
        
        var tblResult = $('<table style="margin-left:auto;margin-right:auto;width:500px;" />');
        tblResult.append($('<tr style="font-size:20px;color:#20A8B1"><th colspan="3"><h1 style="text-align:center;color:' + playerColor + '">' + playername + '</h1></th></tr>'));
        tblResult.append($('<tr style="text-align:center;font-weight:bold;color:#FFCE00;"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px">Action</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px"># of Actions</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px">AP Gained</td></tr>'));
        tblResult.append($('<tr style="text-align:center;color: ' +COLORS[2]+ ';"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px"><b>Destruction AP</b></td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px"></td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px"></td></tr>'));
        tblResult.append($('<tr style="text-align:center;color:#FFCE00"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px">Destroy a Resonator</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px">' + resos_destroyed + '</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px">' + resos_destroyed*DESTROY_RESONATOR + '</td></tr>'));
        tblResult.append($('<tr style="text-align:center;color:#FFCE00"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px">Destroy a Link</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px">' + links_destroyed + '</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px">' + links_destroyed*DESTROY_LINK + '</td></tr>'));	
        tblResult.append($('<tr style="text-align:center;color:#FFCE00"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px">Destroy a Control Field</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px">' + fields_destroyed + '</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px">' + fields_destroyed*DESTROY_FIELD + '</td></tr>'));
        
        tblResult.append($('<tr style="text-align:center;color: ' +COLORS[1]+ ';"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px"><b>Creation AP</b></td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px"></td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px"></td></tr>'));
        tblResult.append($('<tr style="text-align:center;color:#FFCE00;"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px">Deploy a Resonator</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px">' + resos_deployed + '</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px">' + resos_deployed*DEPLOY_RESONATOR + '</td></tr>'));
        tblResult.append($('<tr style="text-align:center;color:#FFCE00;"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px">Captured a Portal</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px">' + captured + '</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px">' + captured*500 + '</td></tr>'));
        tblResult.append($('<tr style="text-align:center;color:#FFCE00;"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 0px">Created a Link</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 1px 1px">' + links + '</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 1px 1px">' + links*313 + '</td></tr>'));
        tblResult.append($('<tr style="text-align:center;color:#FFCE00;"><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 0px 0px">Created a Control Field</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 1px 0px 1px">' + fields + '</td><td style="border-color:#FFCE00;border-style:solid;border-width:0px 0px 0px 1px">' + fields*1250 + '</td></tr>'));
        
        tblResult.append($('<tr style="font-size:20px; color:#20A8B1;"><th colspan="3">Total: ' + total + '</th></tr>'));
        //$(".ui-dialog-apgain").css({'position':'absolute','top':'100px','left':'400px','min-width':'600px'});
        //$('#dialog').css({'min-width':'550px'});
        
        dialog({
            title: 'Total AP Gained',
            dialogClass: 'ui-dialog-apgain',
            html: tblResult,
        });
        
        
        
    }
    
    var setup =  function() {
        $('head').append('<style> .ui-dialog-apgain {max-width: 800px !important; width: auto !important;}</style>');
        $('#sidebar').append('<input id="showAP" placeholder="agent\'s codename" type="text"/>');
        $('#showAP').keydown(function(event) {
            try {
                var kc = (event.keyCode ? event.keyCode : event.which);
                if(kc === 13) { // enter
                    event.preventDefault();
                    window.plugin.apgain.display($(this).val());
                    $(this).val('');
                } else if (kc === 9) { // tab: for autocomplete, uses IITC autocomplete function
                    event.preventDefault();
                    var el = $('#chatinput input');
                    el.val($(this).val());
                    window.chat.handleTabCompletion();
                    if (el.val().startsWith("@")){
                        var codename = el.val().substring(1).trim();
                        $(this).val(codename);
                    }
                    el.val('');
                }
            } catch(error) {
                console.log(error);
                debug.printStackTrace();
            }
            
        });
    }
    
    // PLUGIN END //////////////////////////////////////////////////////////
    if(window.iitcLoaded && typeof setup === 'function') {
        setup();
    } else {
        if(window.bootPlugins)
            window.bootPlugins.push(setup);
        else
            window.bootPlugins = [setup];
    }
    
} // wrapper end

// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ apGain +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
