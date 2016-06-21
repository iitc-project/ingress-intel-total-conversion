// ==UserScript==
// @id             iitc-plugin-showtheway@ariefwt
// @name           IITC plugin: Show the Way integration
// @category       Info
// @version        1.0.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Share portal location that agents can actually use. One link to navigate with Waze, Google Maps, HERE Maps, Uber, Apple Maps, Bing Maps, and more.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.showtheway = {
    onIitcLoaded: function () {
        $('<style>')
            .attr('type', 'text/css')
            .html(
                '#showtheway-portal-div { text-align:center }' +
                '#showtheway-portal-div input { width:100% } '
            )
            .appendTo('head');

        $('<script>')
            .attr('type', 'text/javascript')
            .attr('src', 'https://showtheway.io/w.js')
            .appendTo('body');

        $('<div>')
            .attr('id', 'showtheway-portal-div')
            .addClass('none')
            .append(
                $('<label>')
                    .attr('for', 'showtheway-portal-link')
                    .text('Show the Way portal link:')
            )
            .append(
                $('<input>')
                    .attr('id', 'showtheway-portal-link')
                    .attr('type', 'text')
                    .attr('placeholder', 'Select a portal on the map first')
                    .prop('readonly', true)
                    .addClass('showtheway-portal-url')
                    .click(function () {
                        if (!$(this).hasClass('selected')) {
                            $(this).select();
                            $(this).addClass('selected');
                        }
                    })
                    .blur(function () {
                        if ($(this).hasClass('selected')) {
                            $(this).removeClass('selected');
                        }
                    })
            )
            .append(
                $('<div>')
                    .addClass('showtheway')
            )
            .insertAfter('#portaldetails');
    },
    onPortalDetailsUpdated: function (data) {
        var ll = (data.portalData.latE6 / 1E6) + ',' + (data.portalData.lngE6 / 1E6);
        var name = data.portalData.title;
        $('input.showtheway-portal-url').val('https://showtheway.io/to/' + ll + '?' + $.param({'name': name}));
        $('.showtheway').each(function () {
            showtheway.initWidget(this, {
                ll: ll,
                name: name
            });
        });
    }
};

var setup = function () {
    window.addHook('iitcLoaded', window.plugin.showtheway.onIitcLoaded);
    window.addHook('portalDetailsUpdated', window.plugin.showtheway.onPortalDetailsUpdated);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
