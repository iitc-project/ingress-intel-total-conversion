<!DOCTYPE html>
<html lang="en">

<!-- ******** head ******** -->
<head>
 <meta charset="utf-8">
 <title>Ingress Intel Total Conversion</title>
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <meta name="description" content="">
 <meta name="author" content="">

 <!-- Le styles -->
 <link href="assets/bootstrap/css/bootstrap.min.css" rel="stylesheet">
 <link href="assets/bootstrap/css/bootstrap-theme.min.css" rel="stylesheet">
 <link href="assets/css/style.css" rel="stylesheet">
 <link href="assets/icomoon/style.css" rel="stylesheet">

 <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
 <!--[if lt IE 9]>
  <script src="assets/html5shiv/html5shiv.js"></script>
 <![endif]-->

 <!-- android uses the apple icons when adding shortcuts - looks better than favicons -->
 <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png">

 <style>
 .nowrap { white-space: nowrap; }
 </style>

<?php
if ( file_exists ( 'tracking.php' ) )
{
	include 'tracking.php';
}
?>

</head>

<!-- ******** body ******** -->
<body>
<div class="container">

 <!-- **** page header **** -->
 <div class="header well">
  <div class="media">
   <a class="pull-left" href="./">
    <img class="media-object" src="assets/img/logo.png" title="IITC" alt="IITC Logo">
   </a>
   <div class="media-body">
    <h1 class="media-heading">Ingress Intel Total Conversion</h1>

<div class="g-plusone" data-annotation="inline" data-width="300" data-href="http://iitc.jonatkins.com/"></div>

   </div>
  </div>
 </div>


 <!-- **** top alert box **** -->
 <div class="alert alert-block alert-info">
  Follow the
  <b><a href="https://plus.google.com/105383756361375410867"><span class="icon-google-plus"></span> IITC page</a></b>
  for release announcements.
  Join the
  <b><a href="https://plus.google.com/communities/105647403088015055797"><span class="icon-google-plus"></span> IITC Community</a></b>
  - a place to ask for help and discuss with other users.
 </div>

 <!-- **** alert box when standard intel site changes **** -->
 <?php
 if ( file_exists ( "flag-stock-site-changed.txt" ) )
 {
 ?>
 <div class="alert alert-block alert-danger">
  <b>Note</b>: A change has been detected to the standard intel website. Such changes may break IITC.
  The developers have been notified of the update, and will be looking to fix things as soon as possible.
  See the <a href="https://plus.google.com/communities/105647403088015055797">IITC Community</a>
  for the latest details.
 </div>
 <?php
 }
 ?>
<!--
 <div class="alert alert-block alert-danger">
  <b>IITC has yet again been broken by changes Niantic have made.</b> Further information/discussion on
  <a href="xxxxxxxxxxxxxxxxxxx">this Google+ post</a>.
 </div>
-->

 <!-- **** two column body area **** -->
 <div class="row">

  <!-- **** navigation **** -->
  <div class="col-md-3">

   <div class="list-group nowrap">
<?php

$pages = Array (
	'home' => '<span class="icon-house"></span> Home',
	'news' => '<span class="icon-newspaper"></span> News',
	'faq' => '<span class="icon-help"></span> FAQ',
	'desktop' => '<span class="icon-screen"></span> Desktop',
	'mobile' => '<span class="icon-mobile"></span> Mobile',
	'test' => '<span class="icon-tools"></span> Test Builds',
	'developer' => '<span class="icon-cog"></span> Developers',
	'about' => '<span class="icon-info"></span> About',
	'donate' => '<span class="icon-arrow-right"></span> Donate',
);

$page = 'home';
if ( array_key_exists ( 'page', $_REQUEST ) )
	$page = $_REQUEST['page'];
if ( ! array_key_exists ( $page, $pages ) )
	$page = "home";


foreach ( $pages as $key => $name )
{
	# before 'desktop', start a sub-list for the download links
	if ( $key == 'desktop' )
		print "<div class=\"list-group-item\"><div class=\"text-muted\"><span class=\"icon-arrow-right\"></span> Downloads</div><div class=\"list-group\">";

	if ( $key == "home" )
		$url = "./";
	else
		$url = "?page=$key";

	print "<a class=\"list-group-item".($page == $key ? ' active' :'')."\" href=\"$url\">$name</a>\n";

	# after 'test', end the above sub-list
	if ( $key == 'test' )
		print "</div></div>";
}

?>
   </div>
  </div>
  <!-- **** end of navigation **** -->


  <!-- **** page body **** -->
  <div class="col-md-9">
    <div class="panel panel-default">
      <div class="panel-body">

<?php
include "page/$page.php";
?>

      </div>
    </div>
  </div>
  <!-- **** end of page body **** -->

 </div> <!-- row - for navigation + page body -->


 <!-- **** footer **** -->
 <div class="alert alert-block alert-danger">
 <span class="icon-warning"></span>
 This site and the scripts are not officially affiliated with Ingress or Niantic Labs at Google.
 Using these scripts is likely to be considered against the Ingress Terms of Service. Any use is at your own risk.
 </div>


</div> <!-- container -->

<!-- ******** javascript includes ******** -->

<script src="http://code.jquery.com/jquery.js"></script>
<script src="assets/bootstrap/js/bootstrap.min.js"></script>
<script type="text/javascript" src="https://apis.google.com/js/platform.js"></script>


</body>
</html>
