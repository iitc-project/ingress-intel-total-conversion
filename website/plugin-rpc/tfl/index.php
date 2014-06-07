<?php

include "phpcoord/phpcoord-2.3.php";

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
      // initial bounding box from start lat/lng
      $this->routes[$rt][$run]['bbox'] = Array ( 'sw'=> $this->routes[$rt][$run]['start']['location'], 'ne' => $this->routes[$rt][$run]['start']['location'] );
    }
    $this->routes[$rt][$run]['end'] = format_stop($row);
    //extend bounding box by end point lat/lng
    $this->routes[$rt][$run]['bbox']['sw']['lat'] = min ( $this->routes[$rt][$run]['bbox']['sw']['lat'], $this->routes[$rt][$run]['end']['location']['lat'] );
    $this->routes[$rt][$run]['bbox']['sw']['lng'] = min ( $this->routes[$rt][$run]['bbox']['sw']['lng'], $this->routes[$rt][$run]['end']['location']['lng'] );

    $this->routes[$rt][$run]['bbox']['ne']['lat'] = max ( $this->routes[$rt][$run]['bbox']['ne']['lat'], $this->routes[$rt][$run]['end']['location']['lat'] );
    $this->routes[$rt][$run]['bbox']['ne']['lng'] = max ( $this->routes[$rt][$run]['bbox']['ne']['lng'], $this->routes[$rt][$run]['end']['location']['lng'] );
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

$result = Array();

switch ($_REQUEST['method']) {

  case 'bus-routes':
    $routes = new Routes();

    load_csv_callback("bus-sequences.csv", Array($routes,'add_route'));

    $result = Array('bus-routes'=>$routes->routes);

    break;

  case 'bus-stops':
    $route = $_REQUEST['route'];
    $run = (int)$_REQUEST['run'];
    $stops = new Stops();
    $stops->route_run($route, $run);

    load_csv_callback("bus-sequences.csv", Array($stops,'add_stop'));

    $result = Array('route' => $route, 'run' => $run, 'stops' => $stops->stops);

    break;

  default:
    $result = Array('error'=>'Method not found');
    break;
}


if (isset($_REQUEST['jsonp']))
  header("Content-Type: application/javascript");
else
  header("Content-Type: application/json");


if (isset($_REQUEST['jsonp']))
  print($_REQUEST['jsonp']."(");

print json_encode($result);

if (isset($_REQUEST['jsonp']))
  print(");");


?>
