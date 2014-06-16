<?php

  //--------------------------------------------------------------------------
  // PHPcoord
  // text.php
  //
  // (c) 2005 Jonathan Stott
  //
  // Created on 11-Aug-2005
  //
  // 2.3 - 24 Aug 2006
  //  - Changed OSRef->toSixFigureString() so that the eastings and northings
  //    are rounded rather than floored.
  // 2.2 - 11 Feb 2006
  //  - Used different algorithm for calculating distance between latitudes
  //    and longitudes - fixes a number of problems with distance calculations
  // 2.1 - 22 Dec 2005
  //  - Added getOSRefFromSixFigureReference function
  // 2.0 - 21 Dec 2005
  //  - Completely different object design - conversion functions now through
  //    objects rather than static functions
  //  - Updated comments and documentation
  // 1.1 - 11 Sep 2005
  //  - Added OSGB36/WGS84 data conversions
  // 1.0 - 11 Aug 2005
  //  - Initial version
  //--------------------------------------------------------------------------


  require_once("phpcoord-2.3.php");
?>

<html>

  <head>
    <title>phpcoord Test Script</title>
  </head>

  <body>

    <h1>phpcoord Test Script</h1>

    <h2>Calculate Surface Distance between two Latitudes/Longitudes</h2>

    <p>
      The LatLngDistance function takes two latitudes/longitudes and calculates
      the surface distance between the two in kilometres:
    </p>

    <p>
      <pre>$lld1 = new LatLng(40.718119, -73.995667); // New York
echo "New York Lat/Long: " . $lld1->toString() . "&lt;br /&gt;";
$lld2 = new LatLng(51.499981, -0.125313);  // London
$d = $lld1->distance($lld2);
echo "Surface Distance between New York and London: " . $d . "km";</pre>

      <?php
        $lld1 = new LatLng(40.718119, -73.995667); // New York
        echo "New York Lat/Long: " . $lld1->toString() . "<br />";
        $lld2 = new LatLng(51.499981, -0.125313);  // London
        echo "London Lat/Long: " . $lld2->toString() . "<br />";
        $d = $lld1->distance($lld2);
        echo "Surface Distance between New York and London: " . $d . "km";
      ?>
    </p>

    <h2>Convert OS Grid Reference to Latitude/Longitude</h2>

    <p>
      Note that the OSGB-Latitude/Longitude conversions use the OSGB36 datum by default. The
      majority of applications use the WGS84 datum, for which the appropriate conversions
      need to be added. See the examples below to see the difference between the two data.
    </p>

    <p>
      Using OSGB36 (convert an OSGB grid reference to a latitude and longitude using the OSGB36 datum):

      <pre>$os1 = new OSRef(651409.903, 313177.270);
echo "OS Grid Reference: " . $os1->toString() . " - " . $os1->toSixFigureString() . "&lt;br /&gt;";
$ll1 = $os1->toLatLng();
echo "Converted to Lat/Long: " . $ll1->toString();</pre>

      <?php
        $os1 = new OSRef(651409.903, 313177.270);
        echo "OS Grid Reference: " . $os1->toString() . " - " . $os1->toSixFigureString() . "<br />";
        $ll1 = $os1->toLatLng();
        echo "Converted to Lat/Long: " . $ll1->toString();
      ?>
    </p>

    <p>
      Using WGS84 (convert an OSGB grid reference to a latitude and longitude using the WGS84 datum):

      <pre>$os1w = new OSRef(651409.903, 313177.270);
echo "OS Grid Reference: " . $os1w->toString() . " - " . $os1w->toSixFigureString() . "&lt;br /&gt;";
$l1w = $os1w->toLatLng();
$l1w->OSGB36ToWGS84();
echo "Converted to Lat/Long: " . $ll1w->toString();</pre>

      <?php
        $os1w = new OSRef(651409.903, 313177.270);
        echo "OS Grid Reference: " . $os1w->toString() . " - " . $os1w->toSixFigureString() . "<br />";
        $ll1w = $os1w->toLatLng();
        $ll1w->OSGB36ToWGS84();
        echo "Converted to Lat/Long: " . $ll1w->toString();
      ?>
    </p>

    <h2>Convert Latitude/Longitude to OS Grid Reference</h2>

    <p>
      Note that the OSGB-Latitude/Longitude conversions use the OSGB36 datum by default. The
      majority of applications use the WGS84 datum, for which the appropriate conversions
      need to be added. See the examples below to see the difference between the two data.
    </p>

    <p>
      Using OSGB36 (convert a latitude and longitude using the OSGB36 datum to an OSGB grid reference):

      <pre>$ll2 = new LatLng(52.657570301933, 1.7179215806451);
echo "Latitude/Longitude: " . $ll2->toString() . "&lt;br /&gt;";
$os2 = $ll2->toOSRef();
echo "Converted to OS Grid Ref: " . $os2->toString() . " - " . $os2->toSixFigureString();</pre>

      <?php
        $ll2 = new LatLng(52.657570301933, 1.7179215806451);
        echo "Latitude/Longitude: " . $ll2->toString() . "<br />";
        $os2 = $ll2->toOSRef();
        echo "Converted to OS Grid Ref: " . $os2->toString() . " - " . $os2->toSixFigureString();
      ?>
    </p>

    <p>
      Using WGS84 (convert a latitude and longitude using the WGS84 datum to an OSGB grid reference):

      <pre>$ll2w = new LatLng(52.657570301933, 1.7179215806451);
echo "Latitude/Longitude: " . $ll2->toString() . "&lt;br /&gt;";
$ll2w->WGS84ToOSGB36();
$os2w = $ll2w->toOSRef();
echo "Converted to OS Grid Ref: " . $os2w->toString() . " - " . $os2w->toSixFigureString();</pre>

      <?php
        $ll2w = new LatLng(52.657570301933, 1.7179215806451);
        echo "Latitude/Longitude: " . $ll2->toString() . "<br />";
        $ll2w->WGS84ToOSGB36();
        $os2w = $ll2w->toOSRef();
        echo "Converted to OS Grid Ref: " . $os2w->toString() . " - " . $os2w->toSixFigureString();
      ?>
    </p>
    
    <h2>Convert Six-Figure OS Grid Reference String to an OSRef Object</h2>
    
    <p>
      To convert a string representing a six-figure OSGB grid reference:

      <pre>$os6 = "TG514131";
echo "Six figure string: " . $os6 . "&lt;br /&gt;";
$os6x = getOSRefFromSixFigureReference($os6);
echo "Converted to OS Grid Ref: " . $os6x->toString() . " - " . $os6x->toSixFigureString();</pre>    
      
      <?php
        $os6 = "TG514131";
        echo "Six figure string: " . $os6 . "<br />";
        $os6x = getOSRefFromSixFigureReference($os6);
        echo "Converted to OS Grid Ref: " . $os6x->toString() . " - " . $os6x->toSixFigureString();
      ?>
    </p>

    <h2>Convert UTM Reference to Latitude/Longitude</h2>

    <p>
      <pre>$utm1 = new UTMRef(456463.99, 3335334.05, "E", 12);
echo "UTM Reference: " . $utm1->toString() . "&lt;br /&gt;";
$ll3 = $utm1->toLatLng();
echo "Converted to Lat/Long: " . $ll3->toString();</pre>

      <?php
        $utm1 = new UTMRef(456463.99, 3335334.05, "E", 12);
        echo "UTM Reference: " . $utm1->toString() . "<br />";
        $ll3 = $utm1->toLatLng();
        echo "Converted to Lat/Long: " . $ll3->toString();
      ?>
    </p>

    <h2>Convert Latitude/Longitude to UTM Reference</h2>

    <p>
      <pre>$ll4 = new LatLng(-60.1167, -111.7833);
echo "Latitude/Longitude: " . $ll4->toString() . "&lt;br /&gt;";
$utm2 = $ll4->toUTMRef();
echo "Converted to UTM Ref: " . $utm2->toString() ;</pre>

      <?php
        $ll4 = new LatLng(-60.1167, -111.7833);
        echo "Latitude/Longitude: " . $ll4->toString() . "<br />";
        $utm2 = $ll4->toUTMRef();
        echo "Converted to UTM Ref: " . $utm2->toString() ;
      ?>
    </p>

    <p>
      (c) 2005, Jonathan Stott
    </p>

  </body>
</html>
