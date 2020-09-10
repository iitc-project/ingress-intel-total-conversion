// ==UserScript==
// @id             iitc-plugin-fontchanger@umer936
// @name           IITC plugin: Changes the font to see agent names easier
// @category       Tweaks
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Changes the font to make it easier to differentiate I and l.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          GM_addStyle
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

GM_addStyle ( ".nickname {font-family: Lucida Console !important;}" );

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
