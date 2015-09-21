
var RegionScoreboard = (function () {
  
  var mainDialog;
  var regionScore;
  
  function RegionScore(serverResult) {
      this.ori_data = serverResult;
      this.topAgents = serverResult.topAgents;
      this.regionName = serverResult.regionName;
      this.gameScore = serverResult.gameScore;
      
      this.checkpoints = []
      for (var i=0; i<serverResult.scoreHistory.length; i++) {
          var h = serverResult.scoreHistory[i]
          this.checkpoints[h[0]] = [h[1],h[2]];
      }

      this.hasNoTopAgents = function () {
        return this.topAgents.length==0;
      }
      
      this.getAvgScore = function(faction) {
          return this.gameScore[ faction===TEAM_ENL? 0:1 ];
      }
      this.getAvgScoreMax = function() {
          return Math.max(this.getAvgScore(TEAM_ENL), this.getAvgScore(TEAM_RES), 1);
      }
      
      this.getScoreMax = function(min_value) {
          var max = min_value || 0;
          for (var i=1; i<this.checkpoints.length; i++) {
              var cp = this.checkpoints[i];
              max = Math.max(max,cp[0],cp[1]);
          }
          return max;
      }
   }
  
  function showScoreboard() {
    // TODO: rather than just load the region scores for the center of the map, display a list of regions in the current view
    // and let the user select one (with automatic selection when just one region, and limited to close enough zooms so list size is reasonable)
    var latLng = map.getCenter();

    var latE6 = Math.round(latLng.lat*1E6);
    var lngE6 = Math.round(latLng.lng*1E6);

    mainDialog = dialog({title:'Region scores',html:'Loading regional scores...',width:450,minHeight:320});

    window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, 
        onRequestSuccess, 
        onRequestFailure);
  };

  // TODO: DEPRECATED replace with "window.RegionScoreboard.showScoreboard();"
  window.regionScoreboard = showScoreboard;
  
  function onRequestFailure() {
    mainDialog.html('Failed to load region scores - try again');
   }

  function onRequestSuccess(data) {
      if (data.result === undefined) {
        return onRequestFailure();
      }
      
      regionScore = new RegionScore(data.result);
      updateDialog();
   }

  function updateDialog(logscale) {

    // we need some divs to make the accordion work properly
    mainDialog.html('<div class="cellscore">'
           +'<b>Region scores for '+regionScore.regionName+'</b>'
           +'<div><table>'+createResults()+'</table>'
           +RegionScoreboard.HistoryChart.create(regionScore, logscale)+'</div>'
           +'<b>Checkpoint overview</b>'
           +'<div>'+createHistoryTable()+'</div>'
           +'<b>Top agents</b>'
           +'<div>'+createAgentTable()+'</div>'
           +'</div>');

    $('g.checkpoint', mainDialog).each(function(i, elem) {
      elem = $(elem);

      var tooltip = 'CP:\t'+elem.attr('data-cp')
        + '\nEnl:\t' + digits(elem.attr('data-enl'))
        + '\nRes:\t' + digits(elem.attr('data-res'));
      elem.tooltip({
        content: convertTextToTableMagic(tooltip),
        position: {my: "center bottom", at: "center top-10"}
      });
    });

    $('.cellscore', mainDialog).accordion({
      header: 'b',
      heightStyle: "fill"
    });

    $('input.logscale', mainDialog).change(function(){
      var input = $(this);
      updateDialog(input.prop('checked'));
    });
  }
   
  function createHistoryTable() {
    var history = regionScore.checkpoints;
    var table = '<table class="checkpoint_table"><thead><tr><th>Checkpoint</th><th>Enlightened</th><th>Resistance</th></tr></thead>';

    for(var i=history.length-1; i>0; i--) {
      table += '<tr><td>' + i + '</td><td>' + digits(history[i][0]) + '</td><td>' + digits(history[i][1]) + '</td></tr>';
    }

    table += '</table>';
    return table;
   }

  function createAgentTable() {
      var agentTable = '<table><tr><th>#</th><th>Agent</th></tr>';
      
      for (var i=0; i<regionScore.topAgents.length; i++) {
          var agent = regionScore.topAgents[i];
          agentTable += '<tr><td>'+(i+1)+'</td><td class="nickname '+(agent.team=='RESISTANCE'?'res':'enl')+'">'+agent.nick+'</td></tr>';
      };
      
      if (regionScore.hasNoTopAgents()) {
        agentTable += '<tr><td colspan="2"><i>no top agents</i></td></tr>';
      }
      agentTable += '</table>';
      
      return agentTable;
   }
   
  function createResults() {
      
      var maxAverage = regionScore.getAvgScoreMax();
      var order = (PLAYER.team == 'RESISTANCE' ? [TEAM_RES,TEAM_ENL]:[TEAM_ENL,TEAM_RES])
      
      var result = '';
      for (var t=0; t<2; t++) {
          var faction = order[t];
          var team = window.TEAM_NAMES[faction];
          var teamClass = window.TEAM_TO_CSS[faction]
          var teamCol = COLORS[faction];
          var barSize = Math.round(regionScore.getAvgScore(faction)/maxAverage*200);
          result += '<tr><th class="'+teamClass+'">'+team+'</th>'
                  + '<td class="'+teamClass+'">'+digits(regionScore.getAvgScore(faction))+'</td>'
                  + '<td><div style="background:'+teamCol+'; width: '+barSize+'px; height: 1.3ex; border: 2px outset '+teamCol+'; margin-top: 2px"> </td></tr>';
      }

      return result;
  }
   

  return {
    showScoreboard
  };
  
}());


RegionScoreboard.HistoryChart = (function () {
  var regionScore;
  var scaleFct;
  var logscale;
  var svgObjects;
  
  function create(_regionScore,logscale) {
    regionScore = _regionScore;

    var max = regionScore.getScoreMax(10); //NOTE: ensure a min of 10 for the graph
    max *= 1.09;      // scale up maximum a little, so graph isn't squashed right against upper edge
    setScaleType(max,logscale)
      
    svgObjects = [];

    // svg area 400x130. graph area 350x100, offset to 40,10
    var svg= '<div><svg width="400" height="130">'
           + svgBackground()
           + svgAxis(max)
           + svgAveragePath()
           + svgFactionPath()
           + svgObjects.join('')
           + '<foreignObject height="18" width="45" y="111" x="0" class="node"><label title="Logarithmic scale">'
           +  '<input type="checkbox" class="logscale" style="height:auto;padding:0;vertical-align:middle"'+(logscale?' checked':'')+'/>'
           +  'log</label></foreignObject>'
           + '</svg></div>';

    return svg;
   }
  
  function svgFactionPath() {
    var teamPaths = [[],[]];

    for (var i=0; i<regionScore.checkpoints.length; i++) {
      var x=i*10+40;
        
      if (regionScore.checkpoints[i] !== undefined) {
          
        // paths
        if (i>0 && regionScore.checkpoints[i-1] !== undefined) {
          for (var t=0; t<2; t++) {
            teamPaths[t].push('M'+(x-10)+','+scaleFct(regionScore.checkpoints[i-1][t])+' L'+x+','+scaleFct(regionScore.checkpoints[i][t]));
          }
        }
        // markers
        svgObjects.push('<g title="test" class="checkpoint" data-cp="'+i+'" data-enl="'+regionScore.checkpoints[i][0]+'" data-res="'+regionScore.checkpoints[i][1]+'">');
        svgObjects.push('<rect x="'+(i*10+35)+'" y="10" width="10" height="100" fill="black" fill-opacity="0" />');
        for (var t=0; t<2; t++) {
          var col = getFactionColor(t);
          svgObjects.push('<circle cx="'+x+'" cy="'+scaleFct(regionScore.checkpoints[i][t])+'" r="3" stroke-width="1" stroke="'+col+'" fill="'+col+'" fill-opacity="0.5" />');
        }
        svgObjects.push('</g>');
      }
    }
    
    var svgPath='';
    for (var t=0; t<2; t++) {
        var col = getFactionColor(t);
        if (teamPaths[t].length > 0) {
            svgPath += '<path d="'+teamPaths[t].join(' ')+'" stroke="'+col+'" />';
        }
    }
    
    return svgPath;
  }
  
   
  function svgBackground() {
    return '<rect x="0" y="0" width="400" height="130" stroke="#FFCE00" fill="#08304E" />';
  }

  function svgAxis(max) {
    return '<path d="M40,110 L40,10 M40,110 L390,110" stroke="#fff" />'
           + createTicks(max);
  }

  function createTicks(max) {
      var ticks = createTicksHorz();

      function addVTick(i) {
          var y = scaleFct(i);

          ticks.push('M40,'+y+' L390,'+y);
        
          svgObjects.push('<text x="35" y="'+y+'" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="end" fill="#fff">'+formatNumber(i)+'</text>');
      }
    
      // vertical
      // first we calculate the power of 10 that is smaller than the max limit
      var vtickStep = Math.pow(10,Math.floor(Math.log10(max)));
      if(logscale) {
          for(var i=0;i<4;i++) {
            
            addVTick(vtickStep);
            vtickStep /= 10;
          }
      } else {
          // this could be between 1 and 10 grid lines - so we adjust to give nicer spacings
          if (vtickStep < (max/5)) {
              vtickStep *= 2;
          } else if (vtickStep > (max/2)) {
              vtickStep /= 2;
          }
          
          for (var i=vtickStep; i<=max; i+=vtickStep) {
            addVTick(i);
          }
      }
      

      return ('<path d="'+ticks.join(' ')+'" stroke="#fff" opacity="0.3" />');
  }   

  function createTicksHorz() {
    var ticks = [];
    for (var i=5; i<=35; i+=5) {
      var x=i*10+40;
      ticks.push('M'+x+',10 L'+x+',110');
      svgObjects.push('<text x="'+x+'" y="125" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="middle" fill="#fff">'+i+'</text>');
    }
    
    return ticks;
  }
   
  function svgAveragePath() {
    var path='';
    for (var t=0; t<2; t++) {
      var col = getFactionColor(t);
      var y = scaleFct(regionScore.gameScore[t]);
      path += '<path d="M40,'+y+' L390,'+y+'" stroke="'+col+'" stroke-dasharray="3,2" opacity="0.8" />';
    }
    
    return path;
  }
  
  function setScaleType(max,useLogScale) {
    
    logscale = useLogScale;
    if (useLogScale) {
      if(!Math.log10)
        Math.log10 = function(x) { return Math.log(x) / Math.LN10; };
        
      // 0 cannot be displayed on a log scale, so we set the minimum to 0.001 and divide by lg(0.001)=-3
      scaleFct = function(y) { return  10 - Math.log10(Math.max(0.001,y/max)) / 3 * 100; }
    } else {
      scaleFct = function(y) { return 110-y/max*100; };
    }
  }

  function getFactionColor(t) {
    return t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];;
  }

  function formatNumber(num) {
    return i>=1000000000 ? i/1000000000+'B' : i>=1000000 ? i/1000000+'M' : i>=1000 ? i/1000+'k' : i;
  }
  
  return {
    create
  };

}());