const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Me = ExtensionUtils.getCurrentExtension();

// add Connect import and (optional) client constants if exported
const connectModule = Me.imports.connect && Me.imports.connect.connect ? Me.imports.connect.connect : null;
const Connect = connectModule ? connectModule.Connect : null;
const CLIENT_ID = connectModule && connectModule.CLIENT_ID ? connectModule.CLIENT_ID : null;
const CLIENT_SECRET = connectModule && connectModule.CLIENT_SECRET ? connectModule.CLIENT_SECRET : null;

let _indicator = null;
let _label = null;

function init() {
	// minimal
}

function enable() {
	_indicator = new PanelMenu.Button(0.0, 'Bonjour', false);

	const box = new St.BoxLayout({
		vertical: false,
		x_expand: true,
		x_align: Clutter.ActorAlign.CENTER,
		y_align: Clutter.ActorAlign.CENTER,
		style_class: 'bonjour-box',
	});

	_label = new St.Label({
		text: 'Bonjour',
		style: 'font-weight: 600; color: #ffffff;',
		x_align: Clutter.ActorAlign.CENTER,
	});

	box.add_child(_label);
	_indicator.add_child(box);

	// add to center of panel
	Main.panel.addToStatusArea('42EW@B4nJuice', _indicator, 0, 'center');

	// add menu item to manually open login window
	const menuItem = new PopupMenu.PopupMenuItem('Open Login Window');
	menuItem.connect('activate', () => {
		_executeCookieCapture();
	});
	_indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
	_indicator.menu.addMenuItem(menuItem);

	// automatically open login window on enable
	_executeCookieCapture();

	// Attempt to get token and write it to token.txt
	if (Connect) {
		_label.set_text('Requesting token...');
		try {
			Connect.get_access_token(CLIENT_ID, CLIENT_SECRET, (token) => {
				if (token) {
					const tokenPath = GLib.build_filenamev([Me.path, 'token.txt']);
					try {
						GLib.file_set_contents(tokenPath, token);
						_label.set_text('Token saved');
						_label.set_style('color: #10b981; font-weight: 600;');
						log(`Token written to: ${tokenPath}`);
					} catch (e) {
						_label.set_text('Failed to save token');
						_label.set_style('color: #ef4444; font-weight: 600;');
						log(`Failed to write token: ${e}`);
					}
				} else {
					_label.set_text('No token received');
					_label.set_style('color: #ef4444; font-weight: 600;');
					log('Connect.get_access_token returned no token');
				}
			});
		} catch (e) {
			_label.set_text('Token request failed');
			_label.set_style('color: #ef4444; font-weight: 600;');
			log(`Error calling get_access_token: ${e}`);
		}
	} else {
		_label.set_text('Connect module missing');
		_label.set_style('color: #ef4444; font-weight: 600;');
		log('Connect module not found at Me.imports.connect.connect');
	}
}

function disable() {
	if (_indicator) {
		_indicator.destroy();
		_indicator = null;
		_label = null;
	}
}

function _executeCookieCapture() {
	_label.set_text('Opening login window...');
	_label.set_style('color: #3b82f6; font-weight: 600;');

	// script located inside the extension folder: connect/capture_cookies.py
	const scriptPath = GLib.build_filenamev([Me.path, 'connect', 'capture_cookies.py']);
	const scriptFile = Gio.File.new_for_path(scriptPath);

	if (!scriptFile.query_exists(null)) {
		_label.set_text('Login script not found');
		_label.set_style('color: #ef4444; font-weight: 600;');
		log(`Login script not found at: ${scriptPath}`);
		return;
	}

	try {
		const argv = ['python3', scriptPath];
		let [success, pid] = GLib.spawn_async(
			null,
			argv,
			null,
			GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
			null
		);

		if (success) {
			_label.set_text('Login in progress...');
			_label.set_style('color: #3b82f6; font-weight: 600;');

			GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (pid, status) => {
				log(`Cookie capture process exited with status ${status}`);
				try {
					GLib.spawn_close_pid(pid);
				} catch (e) {
					// ignore
				}
			});
		} else {
			_label.set_text('Failed to start login');
			_label.set_style('color: #ef4444; font-weight: 600;');
			log('Failed to spawn cookie capture script');
		}
	} catch (e) {
		_label.set_text('Login Failed');
		_label.set_style('color: #ef4444; font-weight: 600;');
		log(`Failed to execute cookie capture: ${e}`);
	}
}
