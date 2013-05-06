// DIALOGS /////////////////////////////////////////////////////////

/* The ID of onscreen dialogs.
 * Starts at 0.
 */
window.DIALOG_ID = 0;

/* All onscreen dialogs, keyed by their ID.
 */
window.DIALOGS = {};

/* Creates a dialog and puts it onscreen. Takes one parameter: options.
 * (text|html): The text or HTML to display in the dialog. Text is auto-converted to HTML.
 * title: The dialog's title
 */
window.dialog = function(options) {
  var id = 'dialog-' + window.DIALOG_ID++;
  var jqID = '#' + id;

  var html = '';
  if(options.text) {
    html = window.convertTextToTableMagic(options.text);
  } else if(options.html) {
    html = options.html;
  } else {
    console.log('window.dialog: warning: no text in dialog');
    html = window.convertTextToTableMagic('');
  }

  $('body').append('<div id="' + id + '"></div>');
  window.DIALOGS[id] = $(jqID).dialog($.extend(true, {
    autoOpen: false,
    modal: false,
    title: '#<Dialog: ' + id + '>',
    buttons: {
      'OK': function() {
	$(this).dialog('close');
      }
    },
    close: function(event, ui) {
      console.log('window.dialog: dialog ' + $(this).dialog('option', 'title') + ' closed.');
      if($(this).data('closeCallback')) {
	$(this).data('closeCallback')();
      }

      $($(this).data('jqID')).remove();
      delete window.DIALOGS[$(this).data('id')];
    }
  }, options));

  $(jqID).html(html);
  $(jqID).data('closeCallback', options.closeCallback);
  $(jqID).data('id', id);
  $(jqID).data('jqID', jqID);

  $(jqID).dialog('open');
}

/* Deprecated. Creates a dialog with default settings.
 * Use window.dialog instead.
 */
window.alert = function(text, isHTML, closeCallback) {
  var obj = {closeCallback: closeCallback};
  if(isHTML) {
    obj.html = text;
  } else {
    obj.text = text;
  }
  console.log('window.alert: this function is deprecated, please use window.dialog instead');

  window.dialog(obj);
}

window.setupDialogs = function() {
  window.DIALOG_ID = 0;
  window.DIALOGS   = {};
}
