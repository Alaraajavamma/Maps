/* -*- Mode: JS2; indent-tabs-mode: nil; js2-basic-offset: 4 -*- */
/* vim: set et ts=4 sw=4: */
/*
 * Copyright (c) 2026 Jan-Michael Brummer
 *
 * GNOME Maps is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * GNOME Maps is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with GNOME Maps; if not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Jan-Michael Brummer <jan-michael.brummer@tabos.org>
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import * as Utils from './utils.js';

export class Speech {

    constructor() {
        this._subprocess = null;
        this._language = this._getLanguage();
        this.muted = false;
    }

    get available() {
        return GLib.find_program_in_path('spd-say') !== null ||
               GLib.find_program_in_path('espeak-ng') !== null;
    }

    _getLanguage() {
        const locale = GLib.get_language_names()[0] ?? 'en_US';
        return locale.split('.')[0].split('@')[0].replace('_', '-').toLowerCase();
    }

    speak(text) {
        if (!text || this.muted)
            return;

        this.cancel();
        this._pauseMedia();

        try {
            let engine = GLib.find_program_in_path('spd-say') ? 'spd-say' : 'espeak-ng';
            let args = engine === 'spd-say' ? 
                       ['spd-say', '-l', this._language, '-w', text] :
                       ['espeak-ng', '-v', this._language, '--', text];
                       
            this._subprocess =
                Gio.Subprocess.new(args,
                                   Gio.SubprocessFlags.STDOUT_SILENCE |
                                   Gio.SubprocessFlags.STDERR_SILENCE);
            
            this._subprocess.wait_async(null, (obj, res) => {
                try {
                    obj.wait_finish(res);
                } catch (e) {
                    // Ignore cancellation errors
                }
                this._resumeMedia();
                this._subprocess = null;
            });
        } catch (e) {
            Utils.debug('Speech: engine failed: ' + e.message);
            this._resumeMedia();
        }
    }

    _pauseMedia() {
        if (!GLib.find_program_in_path('playerctl'))
            return;
        try {
            let proc = Gio.Subprocess.new(['playerctl', 'status'], Gio.SubprocessFlags.STDOUT_PIPE);
            let [, stdout] = proc.communicate_utf8(null, null);
            if (stdout && stdout.trim() === 'Playing') {
                this._wasPlaying = true;
                Gio.Subprocess.new(['playerctl', 'pause'], Gio.SubprocessFlags.NONE);
            } else {
                this._wasPlaying = false;
            }
        } catch(e) {}
    }

    _resumeMedia() {
        if (!this._wasPlaying || !GLib.find_program_in_path('playerctl'))
            return;
        try {
            Gio.Subprocess.new(['playerctl', 'play'], Gio.SubprocessFlags.NONE);
        } catch(e) {}
        this._wasPlaying = false;
    }

    cancel() {
        if (this._subprocess) {
            this._subprocess.force_exit();
            this._subprocess = null;
            this._resumeMedia();
        }
    }
}
