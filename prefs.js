// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Meta = ExtensionUtils.getCurrentExtension();
const Convenience = Meta.imports.convenience;
const PreferencesWidget = Meta.imports.preferenceswidget;

const Gettext = imports.gettext.domain(Meta.uuid);
const _ = Gettext.gettext;


function init() {
    Convenience.initTranslations();
}

class AboutWidget extends Gtk.Grid{
    constructor() {
        super({
            margin_bottom: 18,
            row_spacing: 8,
            hexpand: true,
            halign: Gtk.Align.CENTER,
            orientation: Gtk.Orientation.VERTICAL
        });

        let aboutIcon = new Gtk.Image({
            icon_name: "clipman",
            pixel_size: 128
        });
        this.add(aboutIcon);

        let aboutName = new Gtk.Label({
            label: "<b>" + _("Clipman") + "</b>",
            use_markup: true
        });
        this.add(aboutName);

        let aboutVersion = new Gtk.Label({ label: _('Version: ') + Meta.metadata.version.toString() });
        this.add(aboutVersion);

        let aboutDescription = new Gtk.Label({
            label:  Meta.metadata.description
        });
        this.add(aboutDescription);

        let aboutWebsite = new Gtk.Label({
            label: '<a href="%s">%s</a>'.format(
                Meta.metadata.url,
                _("Atareao")
            ),
            use_markup: true
        });
        this.add(aboutWebsite);

        let aboutCopyright = new Gtk.Label({
            label: "<small>" + _('Copyright © 2018 Lorenzo Carbonell') + "</small>",
            use_markup: true
        });
        this.add(aboutCopyright);

        let aboutLicense = new Gtk.Label({
            label: "<small>" +
            _("This program is free software: you can redistribute it and/or modify") + "\n" +
            _("it under the terms of the GNU General Public License as published by") + "\n" +
            _("the Free Software Foundation, either version 3 of the License, or") + "\n" +
            _("(at your option) any later version.") + "\n\n" +
            _("This program is distributed in the hope that it will be useful,") + "\n" +
            _("but WITHOUT ANY WARRANTY; without even the implied warranty of") + "\n" +
            _("MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the") + "\n" +
            _("GNU General Public License for more details.") + "\n\n" +
            _("You should have received a copy of the GNU General Public License") + "\n" +
            _("along with this program.  If not, see <a href=\"https://www.gnu.org/licenses/\">https://www.gnu.org/licenses/</a>.") + "\n" +
            "</small>",
            use_markup: true,
            justify: Gtk.Justification.CENTER
        });
        this.add(aboutLicense);
    }
}

class ClipmanPreferencesWidget extends PreferencesWidget.Stack{
    constructor(){
        super();

        let preferencesPage = new PreferencesWidget.Page();
        this.add_titled(preferencesPage, "preferences", _("Preferences"));

        var settings = Convenience.getSettings();
        
        let appearanceSection = preferencesPage.addSection(_("Options"), null, {});
        appearanceSection.addGSetting(settings, "items");

        // About Page
        let aboutPage = this.addPage(
            "about",
            _("About"),
            { vscrollbar_policy: Gtk.PolicyType.NEVER }
        );
        aboutPage.box.add(new AboutWidget());
        aboutPage.box.margin_top = 18;

    }

}

function buildPrefsWidget() {
    let clipman = new ClipmanPreferencesWidget();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
        let prefsWindow = clipman.get_toplevel()
        prefsWindow.get_titlebar().custom_title = clipman.switcher;
        prefsWindow.connect("destroy", () => {
            clipman.daemon.discovering = false;
        });
        return false;
    });

    clipman.show_all();
    return clipman;
}
