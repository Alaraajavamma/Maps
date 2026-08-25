import Adw from "gi://Adw";
import GObject from "gi://GObject";

import { PreferencesDownloadNew } from "./preferencesDownloadNew.js";
import { PreferencesDownloadCountry } from "./preferencesDownloadCountry.js";

export class PreferencesDownloadType extends Adw.NavigationPage {
    constructor(params) {
        super(params);
    }

    onCustomAreaActivated() {
        this.get_ancestor(Adw.PreferencesDialog).push_subpage(
            new PreferencesDownloadNew()
        );
    }

    onCountryActivated() {
        this.get_ancestor(Adw.PreferencesDialog).push_subpage(
            new PreferencesDownloadCountry()
        );
    }
}

GObject.registerClass(
    {
        Template: "resource:///org/gnome/Maps/ui/preferences-download-type.ui",
        InternalChildren: [],
    },
    PreferencesDownloadType
);
