/*
 * ChromeApp
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

class ChromeApp{
    constructor(content){
        this.name = this._helper(/Name=(.*)/, content);
        this.exec = this._helper(/Exec=(.*)/, content);
        this.icon = this._helper(/Icon=(.*)/, content);
        this.app_id = this._helper(/--app-id=(.*)/, content);
        this.directory = this._helper(/--profile-directory=([^\s]*)/, content);
        this.app = this._helper(/Exec=([^\s]*)/, content);
        let re = /chromium/;
        this.chromium = re.test(this.app);
        
    }

    _helper(re, content){
        return re.exec(content)[1];
    }
}