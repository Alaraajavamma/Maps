import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";

import { Application } from "./application.js";
import { Countries } from "./countries.js";
import * as Utils from "./utils.js";

export class PreferencesDownloadCountry extends Adw.NavigationPage {
    constructor(params) {
        super(params);
        this._populateList("");
    }

    _populateList(query) {
        let child = this._countryList.get_first_child();
        while (child !== null) {
            let next = child.get_next_sibling();
            this._countryList.remove(child);
            child = next;
        }

        const lowerQuery = query.toLowerCase();
        for (const country of Countries) {
            if (country.name.toLowerCase().includes(lowerQuery)) {
                const row = new Adw.ActionRow({
                    title: country.name,
                    activatable: true
                });
                row._countryData = country;
                this._countryList.append(row);
            }
        }
    }

    onSearchChanged() {
        this._populateList(this._searchEntry.get_text());
    }

    onRowActivated(listBox, row) {
        if (row && row._countryData) {
            Application.downloads.addArea(
                row._countryData.name,
                row._countryData.bbox
            );
            
            this._triggerValhallaGraphDownload(row._countryData);
            
            this.get_ancestor(Adw.PreferencesDialog).pop_subpage();
            this.get_ancestor(Adw.PreferencesDialog).pop_subpage();
        }
    }

    _triggerValhallaGraphDownload(countryData) {
        // Here we hook the Valhalla offline graph download to the exact same country selection!
        // TODO: Replace with the actual URL provided by FuriLabs / Valhalla tile server
        const graphUrl = `https://example.com/valhalla/${countryData.name.toLowerCase()}.tar.gz`;
        
        Utils.debug(`Triggering background download of Valhalla routing graphs for ${countryData.name}`);
        Utils.debug(`URL: ${graphUrl}`);
        
        // This will eventually integrate with Soup.Session and Gio.File to save and unpack
        // the routing tiles into ~/.local/share/gnome-maps/valhalla_tiles/
    }
}

GObject.registerClass(
    {
        Template: "resource:///org/gnome/Maps/ui/preferences-download-country.ui",
        InternalChildren: ["searchEntry", "countryList"],
    },
    PreferencesDownloadCountry
);
