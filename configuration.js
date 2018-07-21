imports.gi.versions.Gio = "2.0";
imports.gi.versions.GLib = "2.0";

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

class Configuration{
    constructor(config_file, preferences){
        if(typeof(config_file)=='string'){
            this.config_file = Gio.File.new_for_path(config_file);
        }else{
            this.config_file = config_file;
        }
        let parent_dir = this.config_file.get_parent();
        if(!parent_dir.query_exists(null)){
            parent_dir.make_directory_with_parents(null);
        }
        this._preferences = preferences;
    }
    read(){
        if(this.config_file.query_exists(null)){
            let fstream = this.config_file.read(null);
            let dstream = Gio.DataInputStream.new(fstream);
            let text = dstream.read_upto("", -1, null);
            fstream.close(null);
            this._preferences = JSON.parse(text[0]);
        }else{
            this._preferences = {};
        }
    }
    save(){
        let fstream = this.config_file.replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        let dstream = Gio.DataOutputStream.new(fstream);
        dstream.put_string(JSON.stringify(this._preferences), null);
        fstream.close(null);
    }
    set preferences(preferences){
        this._preferences = preferences;
    }
    get preferences(){
        return this._preferences;
    }
    set(key, value){
        this._preferences[key] = value;
    }
    get(key){
        return this._preferences[key];
    }
}
let configuration = new Configuration(GLib.get_home_dir() + '/.config/clipman/clipman.conf', {});
configuration.read();
print(JSON.stringify(configuration.preferences));
configuration.set('key6', 'value5');
configuration.save();
configuration.read();
print(JSON.stringify(configuration.preferences));
print(configuration.get('key3'));
