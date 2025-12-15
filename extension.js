const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Me = ExtensionUtils.getCurrentExtension();
const Calendar = imports.ui.calendar;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;
const ByteArray = imports.byteArray;

const { Connect } = Me.imports.connect.connect;

let _indicator = null;

function init() {
	
}

function enable() {
	// create a simple panel button that shows "Bonjour" centered
	_indicator = new PanelMenu.Button(0.0, 'Bonjour', false);

	const box = new St.BoxLayout({
		vertical: false,
		x_expand: true,
		x_align: Clutter.ActorAlign.CENTER,
		y_align: Clutter.ActorAlign.CENTER,
		style_class: 'bonjour-box',
	});

	const label = new St.Label({
		text: 'Bonjour',
		style: 'font-weight: 600; color: #ffffff;',
		x_align: Clutter.ActorAlign.CENTER,
	});

	box.add_child(label);
	_indicator.add_child(box);

	// add to center of panel
	Main.panel.addToStatusArea('42EW@B4nJuice', _indicator, 0, 'center');

	Connect.get_access_token(CLIENT_ID, CLIENT_SECRET, (token) => {
		console.log(token);
	});
}

function disable() {
	if (_indicator) {
		_indicator.destroy();
		_indicator = null;
	}
}
