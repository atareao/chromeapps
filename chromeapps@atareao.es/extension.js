/*
 * chromeapps@atareao.es
 *
 * Copyright (c) 2018 Lorenzo Carbonell Cerezo <a.k.a. atareao>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

imports.gi.versions.St = "1.0";
imports.gi.versions.Clutter = "1.0";
imports.gi.versions.Gtk = "3.0";
imports.gi.versions.Gio = "2.0";
imports.gi.versions.GLib = "2.0";

const _DEBUG_ = true;

/* Import St because is the library that allow you to create UI elements */
const St = imports.gi.St;
/* Import Clutter because is the library that allow you to layout UI elements */
const {Clutter, Gtk, Gdk, GMenu, Gio, GObject, GLib, Cogl} = imports.gi;
const Util = imports.misc.util;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const FileModule = Extension.imports.helpers.file;
const ChromeApp = Extension.imports.chromeapp.ChromeApp;
const Convenience = Extension.imports.convenience;
const Configuration = Extension.imports.configuration.Configuration;
const Gettext = imports.gettext.domain(Extension.uuid);
const _ = Gettext.gettext;

function Log(message){
    if (_DEBUG_){
        let app = Extension.metadata.name.toString();
        global.log(app.toUpperCase() + ': '+message);
    }
}
function getTimeInSeconds(){
    return Math.round(Date.now() / 1000);
}
let IconButton = GObject.registerClass(
    class IconButton extends St.Button{
        _init(icon_name, icon_size, params){
            super.init(params)
            // Icon
            this.icon = new St.Icon({
                icon_name: icon_name,
                icon_size: icon_size,
                style_class: 'clipman-button'
            });
            super.set_child(this.icon);
        }
});
let ChromeApps = GObject.registerClass (
class ChromeApps extends PanelMenu.Button{

    _init(){
        super._init(0.0, Extension.metadata.name);

        Gtk.IconTheme.get_default().append_search_path(
            Extension.dir.get_child('icons').get_path());

        let box = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        let label = new St.Label({text: 'Button',
                                   y_expand: true,
                                   y_align: Clutter.ActorAlign.CENTER });
        //box.add(label);
        this.iconStopped = Gio.icon_new_for_string(Extension.path + '/icons/chrome.svg');

		this.icon = new St.Icon({gicon: this.iconStopped,
                                 style_class: 'system-status-icon'});
        box.add_actor(this.icon);
        //box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_actor(box);
		this.actor.add_style_class_name('panel-status-button');


        log('--- init menu start');
        this.settingsMenuItem = new PopupMenu.PopupMenuItem(_("Settings"));
        this.settingsMenuItem.connect('activate', () => {
            GLib.spawn_command_line_async(
                "gnome-shell-extension-prefs chromeapps@atareao.es"
            );
        });
        this._load_chrome_apps();
        this.menu.addMenuItem(this.settingsMenuItem);
        this.menu.addMenuItem(this._get_help());
    }

    _create_help_menu_item(text, icon_name, url){
        let icon = this._get_icon(icon_name);
        let menu_item = new PopupMenu.PopupImageMenuItem(text, icon);
        menu_item.connect('activate', () => {
            Gio.app_info_launch_default_for_uri(url, null);
        });
        return menu_item;
    }

    _get_help(){
        let menu_help = new PopupMenu.PopupSubMenuMenuItem(_('Help'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Project Page'), 'info', 'https://github.com/atareao/chromeapps/'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Get help online...'), 'help', 'https://www.atareao.es/aplicacion/chromeapps/'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Report a bug...'), 'bug', 'https://github.com/atareao/chromeapps/issues'));

        menu_help.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('El atareao'), 'atareao', 'https://www.atareao.es'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('GitHub'), 'github', 'https://github.com/atareao'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Twitter'), 'twitter', 'https://twitter.com/atareao'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Telegram'), 'telegram', 'https://t.me/canal_atareao'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Mastodon'), 'mastodon', 'https://mastodon.social/@atareao'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Spotify'), 'spotify', 'https://open.spotify.com/show/2v0fC8PyeeUTQDD67I0mKW'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('YouTube'), 'youtube', 'http://youtube.com/c/atareao'));
        return menu_help;
    }

    _get_icon(icon_name){
        let base_icon = Extension.path + '/icons/' + icon_name;
        let file_icon = Gio.File.new_for_path(base_icon + '.png')
        if(file_icon.query_exists(null) == false){
            file_icon = Gio.File.new_for_path(base_icon + '.svg')
        }
        if(file_icon.query_exists(null) == false){
            return null;
        }
        let icon = Gio.icon_new_for_string(file_icon.get_path());
        return icon;
    }

    _load_chrome_apps(){
        let home = GLib.getenv('HOME');
        let dir_chrome_apps = Gio.File.new_for_path(home + '/.local/share/applications/');
        let enumerador = dir_chrome_apps.enumerate_children('*', Gio.FileQueryInfoFlags.NONE, null);
        let nextItem;
        let re = /chrome-[a-z]*-Default\.desktop/
        let columns = 0;
        let rows = 0;
        this.linesOfButtons = new Array();
        while((nextItem = enumerador.next_file(null)) != null){
            let child = enumerador.get_child(nextItem);
            if(re.test(child.get_basename()))
            {
                let ans = child.load_contents(null);
                if(ans[0] == true){
                    let ca = new ChromeApp(ans[1]);
                    Log('==========');
                    Log(ca.name);
                    Log(ca.exec);
                    Log(ca.icon);
                    Log(ca.app_id);
                    Log(ca.directory);
                    Log(ca.app);
                    Log(ca.chromium);
                    let afile = null;
                    let appfile = Gio.File.new_for_path(ca.app);
                    if(ca.chromium){
                        afile = Gio.File.new_for_path(home + '/.cache/chromium/' + ca.directory + '/Storage/ext/' + ca.app_id);
                    }else{
                        afile = Gio.File.new_for_path(home + '/.config/google-chrome/' + ca.directory + '/Extensions/' + ca.app_id);
                    }
                    if(afile.query_exists(null) && appfile.query_exists(null)){
                        Log('Existe');
                        if(columns == 0){
                            let lineOfButtons = new PopupMenu.PopupBaseMenuItem({
                                reactive: false
                            });
                            this.linesOfButtons.push(lineOfButtons);
                            this.menu.addMenuItem(lineOfButtons)
                        }
                        //let item = this._createChromeAppButton(ca.icon, ca.name);
                        let item = new IconButton(ca.icon, 40);
                        item.set_style_class_name('chrome-item');
                        item.connect('clicked', ()=>{
                            //Util.spawn('/usr/bin/chromium-browser --profile-directory=Default --app-id=cnidaodnidkbaplmghlelgikaiejfhja'.split(' '));
                            Util.spawn([ca.app, '--profile-directory=' + ca.directory, '--app-id=' + ca.app_id]);
                        });
                        this.linesOfButtons[this.linesOfButtons.length - 1].actor.add_actor(item);
                        columns ++;
                        if(columns == 3){
                            columns = 0;
                        }
                    }else{
                        Log('No existe');
                    }
                }
            }
        }
    }

    _createChromeAppButton(iconName, accessibleName) {
        let icon = new IconButton(iconName, 48);
        return icon;
    }
});

var button;

function init() {
    log('--- inicio ---')
    Convenience.initTranslations();
    var settings = Convenience.getSettings();
}

function enable() {
    button = new ChromeApps();
    Main.panel.addToStatusArea('ChromeApps', button, 0, 'right');
}

function disable() {
    button.destroy();
}
