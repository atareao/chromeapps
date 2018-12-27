/*
 * Clipman
 * A manager for the Clipboard
 *
 * Copyright (C) 2018
 *     Lorenzo Carbonell <lorenzo.carbonell.cerezo@gmail.com>,
 *
 * This file is part of Clipman.
 * 
 * Clipman is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Clipman is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-openweather.
 * If not, see <http://www.gnu.org/licenses/>.
 *
 */


/*
imports.gi.versions.Gio = "2.0";
imports.gi.versions.GLib = "2.0";
imports.gi.versions.GObject = "2.0";
imports.gi.versions.Gtk = "3.0";
imports.gi.versions.Meta = "1";
imports.gi.versions.Pango = "1.0";
imports.gi.versions.Shell = "0.1";
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
const Clutter = imports.gi.Clutter;

const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GMenu = imports.gi.GMenu;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Cogl = imports.gi.Cogl;
const Params = imports.misc.params;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

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

class IconButton extends St.Button{
    constructor(icon_name, icon_size, params){
        super(params)
        // Icon
        this.icon = new St.Icon({
            icon_name: icon_name,
            icon_size: icon_size,
            style_class: 'clipman-button'
        });
        super.set_child(this.icon);
    }
}

class ActionsIcons extends St.BoxLayout{
    constructor(position, on_copy, on_delete){
        super({vertical: true,
               y_align: Clutter.ActorAlign.CENTER,
               x_align: Clutter.ActorAlign.END});
        
        let copy_button = new IconButton('clipman-copy', 20);
        //copy_button.connect('button-press-event', on_copy);
        this.add(copy_button);

        let remove_button = new IconButton('clipman-remove', 20);
        this.add(remove_button);
        //this.set_width(30);
    }
}

class PopupMenuTextItem extends PopupMenu.PopupBaseMenuItem{
    constructor(atext, params){
        super(params);
        this.actor.y_align = Clutter.ActorAlign.CENTER;

        let boxLayout = new St.BoxLayout({vertical: false});
        boxLayout.set_width(200);
        boxLayout.set_height(80);
        let text_label = new St.Label({text: atext,
                                       y_align: Clutter.ActorAlign.CENTER,
                                       x_align: Clutter.ActorAlign.START});

                                       text_label.set_width(180);
                                       boxLayout.add(text_label);
                                       boxLayout.add(new ActionsIcons(1, null, null));
        

        this.actor.add_child(boxLayout)
        this._text = atext;
    }
}

class ChromeApps extends PanelMenu.Button{

    constructor(){
        super(St.Align.START);

        Gtk.IconTheme.get_default().append_search_path(
            Extension.dir.get_child('icons').get_path());

        let box = new St.BoxLayout();
        let label = new St.Label({text: 'Button',
                                   y_expand: true,
                                   y_align: Clutter.ActorAlign.CENTER });
        //box.add(label);
        this.icon = new St.Icon({icon_name: 'chrome',
                                 style_class: 'system-status-icon'});
        box.add(this.icon);
        //box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_child(box);

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
        let menu_item = new PopupMenu.PopupImageMenuItem(text, icon_name);
        menu_item.connect('activate', () => {
            Gio.app_info_launch_default_for_uri(url, null);
        });
        return menu_item;
    }

    _get_help(){
        let menu_help = new PopupMenu.PopupSubMenuMenuItem(_('Help'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Project Page'), 'gnome', 'https://gitlab.gnome.org/atareao/cromeapps'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Get help online...'), 'help-online', 'https://www.atareao.es/aplicacion/chromeapps/'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Translate this application...'), 'translate', 'https://translations.launchpad.net/cromeapps'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Report a issue...'), 'bug', 'https://gitlab.gnome.org/atareao/cromeapps/issues'));
        menu_help.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('El atareao'), 'web', 'https://www.atareao.es'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Follow me in Twitter'), 'twitter', 'https://twitter.com/atareao'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Follow me in Facebook'), 'facebook', 'http://www.facebook.com/elatareao'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Follow me in Google+'), 'google', 'https://plus.google.com/118214486317320563625/posts'));
        return menu_help;
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
                    if(ca.chromium){
                        afile = Gio.File.new_for_path(home + '/.cache/chromium/' + ca.directory + '/Storage/ext/' + ca.app_id);
                    }else{
                        afile = Gio.File.new_for_path(home + '/.config/google-chrome/' + ca.directory + '/Extensions/' + ca.app_id);
                    }
                    if(afile.query_exists(null)){
                        Log('Existe');
                        if(columns == 0){
                            let lineOfButtons = new PopupMenu.PopupBaseMenuItem({
                                reactive: false
                            });
                            this.linesOfButtons.push(lineOfButtons);
                            this.menu.addMenuItem(lineOfButtons)
                        }
                        let item = this._createChromeAppButton(ca.icon, ca.name);
                        item.set_style_class_name('item');
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
                /*
                for(let property in child){
                    if (_DEBUG_) global.log('ZZZ3:'+property);
                }
                */
            }
        }
        
        
        /*
        let docs = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOCUMENTS);
        let desktop = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP);
        let pics = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES);
        let videos = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_VIDEOS);
        let music = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC);
        let downloads = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD);
        let public_dir = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PUBLIC_SHARE);
        let templates = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_TEMPLATES);
        if (_DEBUG_) global.log('ZZZ4: ' + docs);
        if (_DEBUG_) global.log('ZZZ4: ' + desktop);
        if (_DEBUG_) global.log('ZZZ4: ' + pics);
        if (_DEBUG_) global.log('ZZZ4: ' + videos);
        if (_DEBUG_) global.log('ZZZ4: ' + music);
        if (_DEBUG_) global.log('ZZZ4: ' + downloads);
        if (_DEBUG_) global.log('ZZZ4: ' + public_dir);
        if (_DEBUG_) global.log('ZZZ4: ' + templates);
        */
        //Util.spawn('/usr/bin/chromium-browser --profile-directory=Default --app-id=cnidaodnidkbaplmghlelgikaiejfhja'.split(' '));
        /*
        let tree = GMenu.Tree.new_for_path('/home/lorenzo/.local/share/applications/', GMenu.TreeFlags.INCLUDE_NODISPLAY);
        let tree = new GMenu.Tree({ menu_basename: 'applications.menu' });
        tree.load_sync();
        if(_DEBUG_) global.log("ZZZ: "+tree.get_canonical_menu_path());
        let root = tree.get_root_directory();
        let iter = root.iter();
        let nextType;
        while ((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
            if (nextType == GMenu.TreeItemType.DIRECTORY) {
                let dir = iter.get_directory();
            }
            else if (nextType == GMenu.TreeItemType.ENTRY ) {
                let entry = iter.get_entry();
                let appinfo = entry.get_app_info();
                if (_DEBUG_) global.log("ZZZ: ==================");
                if (_DEBUG_) global.log("ZZZ: "+appinfo.get_generic_name());
                if (_DEBUG_) global.log("ZZZ: "+appinfo.get_categories());
                if (_DEBUG_) global.log("ZZZ: "+appinfo.get_filename());
            }
        }
        */
    }
    _createChromeAppButton(iconName, accessibleName) {
        let icon = new St.Button({ reactive: true,
                                   can_focus: true,
                                   track_hover: true,
                                   accessible_name: accessibleName,
                                   style_class: 'system-menu-action' });
        icon.child = new St.Icon({ icon_name: iconName });
        return icon;
    }
}

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
