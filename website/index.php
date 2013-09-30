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
 <link href="assets/bootstrap/css/bootstrap-responsive.css" rel="stylesheet">
 <link href="assets/css/style.css" rel="stylesheet">

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
<div class="container-fluid">

 <!-- **** page header **** -->
 <div class="row-fluid">
  <div class="span12 header well well-small">
   <div class="media">
    <a class="pull-left" href="./">
     <img class="media-object" src="assets/img/logo.png" title="IITC" alt="IITC Logo">
    </a>
    <div class="media-body">
     <h1 class="media-heading">Ingress Intel Total Conversion</h1>
<!--
<a href="//plus.google.com/105383756361375410867?prsrc=3" rel="publisher" style="text-decoration:none;">
<img src="//ssl.gstatic.com/images/icons/gplus-16.png" alt="Google+" style="border:0;width:16px;height:16px;"/></a>
-->
    </div>
   </div>
  </div>
 </div>


 <!-- **** top alert box **** -->
 <div class="alert alert-block alert-info">
  Follow the
  <b><a href="https://plus.google.com/105383756361375410867">IITC <img src="//ssl.gstatic.com/images/icons/gplus-16.png" alt="Google+" style="border:0;width:16px;height:16px;"/> page</a></b>
  for release announcements.
  Join the
  <b><a href="https://plus.google.com/communities/105647403088015055797">IITC <img src="//ssl.gstatic.com/images/icons/gplus-16.png" alt="Google+" style="border:0;width:16px;height:16px;"/> Community</a></b>
  - a place to ask for help and discuss with other users.
 </div>

<!--
 <div class="alert alert-block alert-error">
  <b>IITC has yet again been broken by changes Niantic have made.</b> Further information/discussion on
  <a href="xxxxxxxxxxxxxxxxxxx">this Google+ post</a>.
 </div>
-->

 <!-- **** two column body area **** -->

 <div class="row-fluid">
  <!-- **** navigation **** -->
  <div class="span3 well">

  <ul class="nav nav-list nowrap">
<?php

$pages = Array (
	'home' => '<i class="icon-home"></i> Home',
	'news' => '<i class="icon-list"></i> News',
	'faq' => '<i class="icon-question-sign"></i> FAQ',
	'desktop' => '<i class="icon-chevron-right"></i> Desktop',
	'mobile' => '<i class="icon-chevron-right"></i> Mobile',
	'test' => '<i class="icon-wrench"></i> Test Builds',
	'developer' => '<i class="icon-cog"></i> Developers',
	'about' => '<i class="icon-info-sign"></i> About',
	'donate' => '<i class="icon-gift"></i> Donate',
);

$page = 'home';
if ( array_key_exists ( 'page', $_REQUEST ) )
	$page = $_REQUEST['page'];
if ( ! array_key_exists ( $page, $pages ) )
	$page = "home";


foreach ( $pages as $key => $name )
{
	# before 'desktop', add a nav-header
	if ( $key == 'desktop' )
		print "<li class=\"nav-header\">Downloads</li>";

	if ( $key == "home" )
		$url = "./";
	else
		$url = "?page=$key";

	print "<li".($page == $key ? ' class="active"' :'')."><a href=\"$url\">$name</a></li>\n";

	# after 'mobile', add a horizontal seperator
	if ( $key == 'test' )
		print "<li class=\"divider\"></li>";
}

?>
  </ul> 
  </div>
  <!-- **** end of navigation **** -->


  <!-- **** page body **** -->
  <div class="span9 well">

<?php
include "page/$page.php";
?>

  </div>
  <!-- **** end of page body **** -->

 </div> <!-- row - for navigation + page body -->


 <!-- **** footer **** -->
 <div class="alert alert-block alert-error">
 This site and the scripts are not officially affiliated with Ingress or Niantic Labs at Google.
 Using these scripts is likely to be considered against the Ingress Terms of Service. Any use is at your own risk.
 </div>


</div> <!-- container -->

<!-- ******** javascript includes ******** -->

<script src="http://code.jquery.com/jquery.js"></script>
<script src="assets/bootstrap/js/bootstrap.min.js"></script>


</body>
</html>
