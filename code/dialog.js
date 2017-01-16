// DIALOGS /////////////////////////////////////////////////////////
// Inspired by TES III: Morrowind. Long live House Telvanni. ///////
////////////////////////////////////////////////////////////////////

/* The global ID of onscreen dialogs.
 * Starts at 0.
 */
window.DIALOG_ID = 0;

/* All onscreen dialogs, keyed by their ID.
 */
window.DIALOGS = {};

/* The number of dialogs on screen.
 */
window.DIALOG_COUNT = 0;

/* The dialog that has focus.
 */
window.DIALOG_FOCUS = null;

/* Controls how quickly the slide toggle animation
 * should play for dialog collapsing and expanding.
 */
window.DIALOG_SLIDE_DURATION = 100;

/* Creates a dialog and puts it onscreen. Takes one argument: options, a JS object.
 * == Common options
 * (text|html): The text or HTML to display in the dialog. Text is auto-converted to HTML.
 * title: The dialog's title.
 * modal: Whether to open a modal dialog. Implies draggable=false; dialogClass='ui-dialog-modal'.
 *        Please note that modal dialogs hijack the entire screen and should only be used in very
 *        specific cases. (If IITC is running on mobile, modal will always be true).
 * id:   A unique ID for this dialog. If a dialog with id `id' is already open and dialog() is called
 *       again, it will be automatically closed.
 *
 * == Callbacks
 * closeCallback: A callback to run on close. Takes no arguments.
 * collapseCallback: A callback to run on dialog collapse.  Takes no arguments.
 * expandCallback:   A callback to run on dialog expansion. Takes no arguments.
 * collapseExpandCallback: A callback to run on both collapse and expand (overrides collapseCallback
 *                         and expandCallback, takes a boolean argument `collapsing' - true if collapsing;
 *                         false if expanding)
 * focusCallback: A callback to run when the dialog gains focus.
 * blurCallback:  A callback to run when the dialog loses focus.
 *
 * See http://docs.jquery.com/UI/API/1.8/Dialog for a list of all the options. If you previously
 * applied a class to your dialog after creating it with alert(), dialogClass may be particularly
 * useful.
 */
window.dialog = function(options) {
  // Override for smartphones. Preserve default behavior and create a modal dialog.
  options = options || {};

  // Build an identifier for this dialog
  var id = 'dialog-' + (options.modal ? 'modal' : (options.id ? options.id : 'anon-' + window.DIALOG_ID++));
  var jqID = '#' + id;
  var html = '';

  // hint for iitc mobile that a dialog was opened
  if (typeof android !== 'undefined' && android && android.dialogOpened) {
    android.dialogOpened(id, true);
  }

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
    options.dialogClass = (options.dialogClass ? options.dialogClass + ' ' : '') + 'ui-dialog-modal';
    options.draggable = false;
  }

  // Close out existing dialogs.
  if(window.DIALOGS[id]) {
    try {
      var selector = $(window.DIALOGS[id]);
      selector.dialog('close');
      selector.remove();
    } catch(err) {
      console.log('window.dialog: Tried to close nonexistent dialog ' + id);
    }
  }

  // there seems to be a bug where width/height are set to a fixed value after moving a dialog
  function sizeFix() {
    if(dialog.data('collapsed')) return;

    var options = dialog.dialog('option');
    dialog.dialog('option', 'height', options.height);
    dialog.dialog('option', 'width', options.width);
  }

  // Create the window, appending a div to the body
  $('body').append('<div id="' + id + '"></div>');
  var dialog = $(jqID).dialog($.extend(true, {
    autoOpen: false,
    modal: false,
    draggable: true,
    closeText: '',
    title: '',
    buttons: {
      'OK': function() {
        $(this).dialog('close');
      }
    },
    open: function() {
      var titlebar = $(this).closest('.ui-dialog').find('.ui-dialog-titlebar');
      titlebar.find('.ui-dialog-title').addClass('ui-dialog-title-active');
      var close = titlebar.find('.ui-dialog-titlebar-close');

      // Title should not show up on mouseover
      close.removeAttr('title').addClass('ui-dialog-titlebar-button');

      if(!$(this).dialog('option', 'modal')) {
        // Start out with a cloned version of the close button
        var collapse = close.clone();

        // Change it into a collapse button and set the click handler
        collapse.addClass('ui-dialog-titlebar-button-collapse ui-dialog-titlebar-button-collapse-expanded');
        collapse.click($.proxy(function() {
          var collapsed = ($(this).data('collapsed') === true);

          // Run callbacks if we have them
          if($(this).data('collapseExpandCallback')) {
            $.proxy($(this).data('collapseExpandCallback'), this)(!collapsed);
          } else {
            if(!collapsed && $(this).data('collapseCallback')) {
              $.proxy($(this).data('collapseCallback'), this)();
            } else if (collapsed && $(this).data('expandCallback')) {
              $.proxy($(this).data('expandCallback'), this)();
            }
          }

          // Find the button pane and content dialog in this ui-dialog, and add or remove the 'hidden' class.
          var dialog   = $(this).closest('.ui-dialog');
          var selector = dialog.find('.ui-dialog-content,.ui-dialog-buttonpane');
          var button   = dialog.find('.ui-dialog-titlebar-button-collapse');

          // Slide toggle
          $(this).css('height', '');
          $(selector).slideToggle({duration: window.DIALOG_SLIDE_DURATION, complete: sizeFix});

          if(collapsed) {
            $(button).removeClass('ui-dialog-titlebar-button-collapse-collapsed');
            $(button).addClass('ui-dialog-titlebar-button-collapse-expanded');
          } else {
            $(button).removeClass('ui-dialog-titlebar-button-collapse-expanded');
            $(button).addClass('ui-dialog-titlebar-button-collapse-collapsed');
          }

          // Toggle collapsed state
          $(this).data('collapsed', !collapsed);
        }, this));

        // Put it into the titlebar
        titlebar.prepend(collapse);
        close.addClass('ui-dialog-titlebar-button-close');
      }

      window.DIALOGS[$(this).data('id')] = this;
      window.DIALOG_COUNT++;

      console.log('window.dialog: ' + $(this).data('id') + ' (' + $(this).dialog('option', 'title') + ') opened. ' + window.DIALOG_COUNT + ' remain.');
    },
    close: function() {
      // Run the close callback if we have one
      if($(this).data('closeCallback')) {
        $.proxy($(this).data('closeCallback'), this)();
      }

      // Make sure that we don't keep a dead dialog in focus
      if(window.DIALOG_FOCUS && $(window.DIALOG_FOCUS).data('id') === $(this).data('id')) {
        window.DIALOG_FOCUS = null;
      }

      // Finalize
      delete window.DIALOGS[$(this).data('id')];

      window.DIALOG_COUNT--;
      console.log('window.dialog: ' + $(this).data('id') + ' (' + $(this).dialog('option', 'title') + ') closed. ' + window.DIALOG_COUNT + ' remain.');
      // hint for iitc mobile that a dialog was closed
      if (typeof android !== 'undefined' && android && android.dialogOpened) {
        android.dialogOpened(id, false);
      }

      // remove from DOM and destroy
      $(this).dialog('destroy').remove();
    },
    focus: function() {
      if($(this).data('focusCallback')) {
        $.proxy($(this).data('focusCallback'), this)();
      }

      // Blur the window currently in focus unless we're gaining focus
      if(window.DIALOG_FOCUS && $(window.DIALOG_FOCUS).data('id') !== $(this).data('id')) {
        $.proxy(function(event, ui) {
          if($(this).data('blurCallback')) {
            $.proxy($(this).data('blurCallback'), this)();
          }

          $(this).closest('.ui-dialog').find('.ui-dialog-title').removeClass('ui-dialog-title-active').addClass('ui-dialog-title-inactive');
        }, window.DIALOG_FOCUS)();
      }

      // This dialog is now in focus
      window.DIALOG_FOCUS = this;
      // hint for iitc mobile that a dialog was focused
      if (typeof android !== 'undefined' && android && android.dialogFocused) {
        android.dialogFocused($(window.DIALOG_FOCUS).data('id'));
      }
      $(this).closest('.ui-dialog').find('.ui-dialog-title').removeClass('ui-dialog-title-inactive').addClass('ui-dialog-title-active');
    }
  }, options));

  dialog.on('dialogdragstop dialogresizestop', sizeFix);

  // Set HTML and IDs
  dialog.html(html);
  dialog.data('id', id);
  dialog.data('jqID', jqID);

  // Set callbacks
  dialog.data('closeCallback', options.closeCallback);
  dialog.data('collapseCallback', options.collapseCallback);
  dialog.data('expandCallback', options.expandCallback);
  dialog.data('collapseExpandCallback', options.collapseExpandCallback);
  dialog.data('focusCallback', options.focusCallback);
  dialog.data('blurCallback', options.blurCallback);

  if(options.modal) {
    // ui-modal includes overrides for modal dialogs
    dialog.parent().addClass('ui-modal');
  } else {
    // Enable snapping
    dialog.dialog().parents('.ui-dialog').draggable('option', 'snap', true);
  }

  // Run it
  dialog.dialog('open');

  return dialog;
}

/* Creates an alert dialog with default settings.
 * If you want more configurability, use window.dialog instead.
 */
window.alert = function(text, isHTML, closeCallback) {
  var obj = {closeCallback: closeCallback};
  if(isHTML) {
    obj.html = text;
  } else {
    obj.text = text;
  }

  return dialog(obj);
}

window.setupDialogs = function() {
  window.DIALOG_ID = 0;
  window.DIALOGS   = {}
  window.DIALOG_COUNT = 0;
  window.DIALOG_FOCUS = null;
}
