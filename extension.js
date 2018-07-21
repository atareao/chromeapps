/*
 * Clipman
 * This a extension for manage the Touchpad
 * with GNOME Shell
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

/* Import St because is the library that allow you to create UI elements */
const St = imports.gi.St;
/* Import Clutter because is the library that allow you to layout UI elements */
const Clutter = imports.gi.Clutter;

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Cogl = imports.gi.Cogl;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const Configuration = Extension.imports.configuration.Configuration;
const Gettext = imports.gettext.domain(Extension.uuid);
const _ = Gettext.gettext;

class ActionsIcons extends St.BoxLayout{
    constructor(on_copy, on_delete){
        super({vertical: true,
               y_align: Clutter.ActorAlign.CENTER,
               x_align: Clutter.ActorAlign.CENTER});

        this.copy_icon = new St.Icon({icon_name: 'copy',
                                      icon_size: 48,
                                      y_align: Clutter.ActorAlign.CENTER,
                                      x_align: Clutter.ActorAlign.CENTER});
        this.copy_icon.connect('click', on_copy);
        this.add(this.copy_icon);

        this.delete_icon = new St.Icon({icon_name: 'delete',
                                      icon_size: 48,
                                       y_align: Clutter.ActorAlign.CENTER,
                                       x_align: Clutter.ActorAlign.CENTER});
        this.delete_icon.connect('click', on_delete);
        this.add(this.delete_icon);
    }
}

class TextItem extends St.BoxLayout{
    constructor(text, on_copy, on_delete){
        super({vertical: false,
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER});
            text_label = new St.Label({text: text,
                                       y_align: Clutter.ActorAlign.CENTER,
                                       x_align: Clutter.ActorAlign.CENTER});
        this.add(text_label);
        this.add(new ActionsIcons(on_copy, on_delete));
        this._text = text;
    }
}

class ImageItem extends St.BoxLayout{
    constructor(pixbuf, on_copy, on_delete){
        super({vertical: false,
               y_align: Clutter.ActorAlign.CENTER,
               x_align: Clutter.ActorAlign.CENTER});
               this.image_container = new St.Bin({y_align: Clutter.ActorAlign.CENTER,
                                                  x_align: Clutter.ActorAlign.CENTER});
        this.add(this.image_container);
        this.add(new ActionsIcons(on_copy, on_delete));
        this._pixbuf = pixbuf;
        this
    }

    set_image(pixbuf){
        let thumbnail_pixbuf = pixbuf.scale_simple(256, 256, GdkPixbuf.InterpType. BILINEAR)
        let {width, height} = thumbnail_pixbuf;
        if (height == 0) {
            return;
        }
        let image = new Clutter.Image();
        let success = image.set_data(
            thumbnail_pixbuf.get_pixels(),
            thumbnail_pixbuf.get_has_alpha()
                ? Cogl.PixelFormat.RGBA_8888
                : Cogl.PixelFormat.RGB_888,
            width,
            height,
            thumbnail_pixbuf.get_rowstride()
        );
        if (!success) {
            throw Error("error creating Clutter.Image()");
        }
        this.image_container.set_child(image);
    }
}

class Clipman extends PanelMenu.Button{

    constructor(){
        super(St.Align.START);

        Gtk.IconTheme.get_default().append_search_path(
            Extension.dir.get_child('icons').get_path());

        let box = new St.BoxLayout();
        let label = new St.Label({text: 'Button',
                                   y_expand: true,
                                   y_align: Clutter.ActorAlign.CENTER });
        //box.add(label);
        this.icon = new St.Icon({icon_name: 'clipman',
                                 style_class: 'system-status-icon'});
        box.add(this.icon);
        //box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_child(box);

        log('--- init menu start');
        this.touchpadSwitch = new PopupMenu.PopupSwitchMenuItem(_('Touchpad status'),
                                                                {active: true})
        this.touchpadSwitch.label.set_text(_('Disable touchpad'));
        this.touchpadSwitch.connect('toggled', (widget, value) => {
            log('--- active: ' + value);
            log('--- active: ' + widget);
            if(value){
                this.icon.set_icon_name('touchpad-light-enabled');
                this.touchpadSwitch.label.set_text(_('Disable touchpad'));
                notify('Touchpad Manager',
                       _('Touchpad enabled'),
                       'touchpad-light-enabled');
            }else{
                this.icon.set_icon_name('touchpad-light-disabled');
                this.touchpadSwitch.label.set_text(_('Enable touchpad'));
                notify('Touchpad Manager',
                       _('Touchpad disabled'),
                       'touchpad-light-disabled');
            }
        });
        this.menu.addMenuItem(this.touchpadSwitch)
        this.settingsMenuItem = new PopupMenu.PopupMenuItem(_("Settings"));
        this.settingsMenuItem.connect('activate', () => {
            GLib.spawn_command_line_async(
                "gnome-shell-extension-prefs touchpad-manager@atareao.es"
            );
        });
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
            _('Project Page'), 'github', 'https://github.com/atareao/Touchpad-Indicator'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Get help online...'), 'help-online', 'https://www.atareao.es/aplicacion/touchpad-indicator-para-ubuntu/'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Translate this application...'), 'translate', 'https://translations.launchpad.net/touchpad-indicator'));
        menu_help.menu.addMenuItem(this._create_help_menu_item(
            _('Report a bug...'), 'bug', 'https://github.com/atareao/Touchpad-Indicator/issues'));
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
}

var button;

function init() {
    log('--- inicio ---')
    Convenience.initTranslations();
    var settings = Convenience.getSettings();
}

function enable() {
    button = new TouchpadManagerButton();
    Main.panel.addToStatusArea('Touchpad-Indicator', button, 0, 'right');
}

function disable() {
    button.destroy();
}
