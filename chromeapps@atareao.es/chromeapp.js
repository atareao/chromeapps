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
