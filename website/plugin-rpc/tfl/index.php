<?php

include "phpcoord/phpcoord-2.3.php";

$cachedir = "/dev/shm";

header("Content-Type: text/plain");

function load_csv_callback($filename,$callback) {
  $f = fopen($filename,"rt");

  // the files start with a UTF-8 "byte order mark" - skip it
  fread($f, 3);

  $data = Array();
  $header = NULL;

  while (($row = fgetcsv($f,1000,",", '"', '\\')) !== FALSE) {
    // the file ends with a DOS-style EOF marker (Ctrl-Z)

    if ($row[0] == "\x1A")
      break;

    if (!$header) {
      $header = $row;
    } else {
      $row = array_combine($header, $row);

      $result = call_user_func($callback, $row);
    }
  }

}


function format_stop($row) {

  $easting = (int)$row['Location_Easting'];
  $northing = (int)$row['Location_Northing'];

  $os = new OSRef($easting, $northing);
  $latlng = $os->toLatLng();
  $latlng->OSGB36ToWGS84();

  $stop = Array (
    'bus_stop_code' => $row['Bus_Stop_Code'],
    'stop_name' => ucwords(strtolower($row['Stop_Name'])),
    'location_os' => Array('easting'=>$easting,'northing'=>$northing),
    'location' => Array('lat' => $latlng->lat, 'lng' => $latlng->lng),
    'heading' => (int)$row['Heading'],
    'virtual_bus_stop' => (int)$row['Virtual_Bus_Stop']
  );

  return $stop;
}


class Routes {
  var $routes = Array();

  function add_route($row) {
    $rt = $row['Route'];
    $run = (int)$row['Run'];

    if (!isset($this->routes[$rt])) {
      $this->routes[$rt] = Array();
    }

    if (!isset($run,$this->routes[$rt][$run])) {
      $this->routes[$rt][$run] = Array ( 'start' => format_stop($row) );
    }
  }

}


class Stops {
  var $route;
  var $run;
  var $stops = Array();

  function route_run($route,$run) {
    $this->route = $route;
    $this->run = $run;
  }

  function add_stop($row) {
    if ($row['Route'] == $this->route && $row['Run'] == $this->run) {
      $stop = format_stop($row);

      array_push($this->stops, $stop);
    }
  }

};


function cache_file_ok($cachefile,$datafile) {
  if ( file_exists($cachefile) ) {
    $cachetime = filemtime($cachefile);

    // the file is downloaded with 'wget' - this preserves server timestamps, so 'wrong' from a cache point of view
    $datatime = max (filemtime($datafile), filectime($datafile));

    if ($cachetime > $datatime) {
      return TRUE;
    }
  }
  return FALSE;
}

$result = NULL;

switch ($_REQUEST['method']) {

  case 'bus-routes':
    $cachefile = "$cachedir/iitc-rpc-bus-routes.json";

    if ( cache_file_ok($cachefile,"bus-sequences.csv") ) {
      $result = file_get_contents($cachefile);
    } else {
      $routes = new Routes();

      load_csv_callback("bus-sequences.csv", Array($routes,'add_route'));

      $result = json_encode(Array('bus-routes'=>$routes->routes));

      $tmpfile = tempnam($cachedir,"iitc-rpc");
      file_put_contents($tmpfile,$result) && rename($tmpfile, $cachefile);
    }
    break;

  case 'bus-stops':
    $route = $_REQUEST['route'];
    $run = (int)$_REQUEST['run'];

    $cachefile = "$cachedir/iitc-rpc-bus-stops-$route-$run.json";

    if ( cache_file_ok($cachefile,"bus-sequences.csv") ) {
      $result = file_get_contents($cachefile);
    } else {

      $stops = new Stops();
      $stops->route_run($route, $run);

      load_csv_callback("bus-sequences.csv", Array($stops,'add_stop'));

      $result = json_encode(Array('route' => $route, 'run' => $run, 'stops' => $stops->stops));

      $tmpfile = tempnam($cachedir,"iitc-rpc");
      file_put_contents($tmpfile,$result) && rename($tmpfile, $cachefile);
    }
    break;

  default:
    $result = json_encode(Array('error'=>'Method not found'));
    break;
}


if (isset($_REQUEST['jsonp']))
  header("Content-Type: application/javascript");
else
  header("Content-Type: application/json");


if (isset($_REQUEST['jsonp']))
  print($_REQUEST['jsonp']."(");

print $result;

if (isset($_REQUEST['jsonp']))
  print(");");


?>
