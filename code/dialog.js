// DIALOGS /////////////////////////////////////////////////////////
// Inspired by TES III: Morrowind. Long live House Telvanni. ///////

/* The global ID of onscreen dialogs.
 * Starts at 0.
 */
window.DIALOG_ID = 0;

/* All onscreen dialogs, keyed by their ID.
 */
window.DIALOGS = {};

/* Creates a dialog and puts it onscreen. Takes one argument: options.
 * Here are the most commonly used ones:
 *
 * (text|html): The text or HTML to display in the dialog. Text is auto-converted to HTML.
 * title: The dialog's title.
 * closeCallback: A callback to run on close.
 * modal: Whether to open a modal dialog. Implies draggable=false; dialogClass='ui-dialog-modal'.
 *        Please note that modal dialogs hijack the entire screen and should only be used in very
 *        specific cases. (If IITC is running on mobile, modal will always be true).
 *
 * See http://docs.jquery.com/UI/API/1.8/Dialog for a list of all the options. If you previously
 * applied a class to your dialog after creating it with alert(), dialogClass may be particularly
 * useful.
 */
window.dialog = function(options) {
  // Override for smartphones. Preserve default behavior and create a modal dialog.
  options = options || {};
  if(isSmartphone()) {
    options.modal = true;
  }

  var id = 'dialog-' + (options.modal ? 'modal' : window.DIALOG_ID++);
  var jqID = '#' + id;
  var html = '';

  // Convert text to HTML if necessary
  if(options.text) {
    html = window.convertTextToTableMagic(options.text);
  } else if(options.html) {
    html = options.html;
  } else {
    console.log('window.dialog: warning: no text in dialog');
    html = window.convertTextToTableMagic('');
  }

  // Modal dialogs should not be draggable
  if(options.modal) {
    options.dialogClass = 'ui-dialog-modal';
    options.draggable = false;
  }

  // Create the window, appending a div to the body
  $('body').append('<div id="' + id + '"></div>');
  window.DIALOGS[id] = $(jqID).dialog($.extend(true, {
    autoOpen: false,
    modal: false,
    draggable: true,
    title: '#<Dialog: ' + id + '>',
    closeText: 'X',
    buttons: {
      'OK': function() {
        $(this).dialog('close');
      }
    },
    create: function(event, ui) {
      var titlebar = $(this).closest('.ui-dialog').find('.ui-dialog-titlebar');
      var close = titlebar.find('.ui-dialog-titlebar-close');

      // Title should not show up on mouseover
      close.removeAttr('title').addClass('ui-dialog-titlebar-button');

      if(!$(this).dialog('option', 'modal')) {
        // Start out with a cloned version of the close button
        var collapse = close.clone();

        // Change it into a collapse button and set the click handler
        collapse.addClass('ui-dialog-titlebar-button-collapse');
        collapse.find('.ui-button-text').html('&ndash;');
        collapse.click($.proxy(function() {
          var collapsed = ($(this).data('collapsed') === true);

          // Find the button pane and content dialog in this ui-dialog, and add or remove the 'hidden' class
          var selector = $(this).closest('.ui-dialog').find('.ui-dialog-content,.ui-dialog-buttonpane');
          if (collapsed) {
            $(selector).removeClass('ui-dialog-content-hidden');
          } else {
            $(selector).addClass('ui-dialog-content-hidden');
          }

          // Toggle collapsed state
          $(this).data('collapsed', !collapsed);
        }, this));

        // Put it into the titlebar
        titlebar.prepend(collapse);
        close.addClass('ui-dialog-titlebar-button-close');
      }
    },
    close:  function(event, ui) {
      // We're closing, so log it to the console
      console.log('window.dialog: ' + id + ' (' + $(this).dialog('option', 'title') + ') closed.');

      // Run the close callback if we have one
      if($(this).data('closeCallback')) {
        $.proxy($(this).data('closeCallback'), this)();
      }

      // Remove this window
      $($(this).data('jqID')).remove();
      delete window.DIALOGS[$(this).data('id')];
    }
  }, options));

  // Set HTML and IDs
  $(jqID).html(html);
  $(jqID).data('id', id);
  $(jqID).data('jqID', jqID);

  // Set the callback to be executed on close
  $(jqID).data('closeCallback', options.closeCallback);

  // ui-modal includes overrides for modal dialogs
  if (options.modal) {
    $(jqID).parent().addClass('ui-modal');
  }

  // Enable snapping
  $(jqID).dialog().parents('.ui-dialog').draggable('option', 'snap', true);

  // Run it
  $(jqID).dialog('open');
  return $(jqID);
}

/* Creates an alert dialog with default settings.
 * If you want more configurability, use window.dialog instead.
 */
window.alert = function(text, isHTML, closeCallback) {
  var obj = {title: '', closeCallback: closeCallback};
  if(isHTML) {
    obj.html = text;
  } else {
    obj.text = text;
  }

  window.dialog(obj);
}

window.setupDialogs = function() {
  window.DIALOG_ID = 0;
  window.DIALOGS   = {};
}
