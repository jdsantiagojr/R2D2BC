/*
 * Copyright 2018-2020 DITA (AM Consulting LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Developed on behalf of: CAST (http://www.cast.org)
 * Licensed to: Bokbasen AS and CAST under one or more contributor license agreements.
 */

import Store from "../../store/Store";
import { UserProperty, UserProperties, Stringable, Switchable, Incremental, JSONable } from "../../model/user-settings/UserProperties";
import * as HTMLUtilities from "../../utils/HTMLUtilities";
import { IS_DEV } from "../..";
import { addEventListenerOptional } from "../../utils/EventHandler";
import { TTSSpeechConfig } from "./TTSModule";

export class TTSREFS {

    static readonly COLOR_REF = "color"
    static readonly AUTO_SCROLL_REF = "autoscroll"
    static readonly RATE_REF = "rate"
    static readonly PITCH_REF = "pitch"
    static readonly VOLUME_REF = "volume"
    static readonly VOICE_REF = "voice"
    static readonly HIGHLIGHT_REF = "highlight"

    static readonly COLOR_KEY = "tts-" + TTSREFS.COLOR_REF
    static readonly AUTO_SCROLL_KEY = "tts-" + TTSREFS.AUTO_SCROLL_REF
    static readonly RATE_KEY = "tts-" + TTSREFS.RATE_REF
    static readonly PITCH_KEY = "tts-" + TTSREFS.PITCH_REF
    static readonly VOLUME_KEY = "tts-" + TTSREFS.VOLUME_REF
    static readonly VOICE_KEY = "tts-" + TTSREFS.VOICE_REF
    static readonly HIGHLIGHT_KEY = "tts-" + TTSREFS.HIGHLIGHT_REF

}

export interface TTSSettingsConfig {
    store: Store,
    initialTTSSettings: TTSSettings;
    headerMenu: HTMLElement;
    api: any;
}

export interface TTSVoice {
    usePublication: boolean
    name?: string
    lang?: string
}

export class TTSSettings implements TTSSpeechConfig {

    private readonly store: Store;
    private readonly TTSSETTINGS = "ttsSetting";

    highlight = "lines"
    color = "orange"
    autoScroll = true
    rate = 1.0
    pitch = 1.0
    volume = 1.0

    voice:TTSVoice = {
        usePublication : true
    }

    userProperties: UserProperties

    private rateButtons: { [key: string]: HTMLButtonElement };
    private pitchButtons: { [key: string]: HTMLButtonElement };
    private volumeButtons: { [key: string]: HTMLButtonElement };

    private settingsChangeCallback: (key?:string) => void = () => { };

    private settingsView: HTMLDivElement;
    private headerMenu: HTMLElement;
    private speechRate: HTMLInputElement;
    private speechPitch: HTMLInputElement;
    private speechVolume: HTMLInputElement;
    private speechAutoScroll: HTMLInputElement;
    private speechHighlight: HTMLInputElement;

    api: any;

    public static async create(config: TTSSettingsConfig): Promise<any> {
        const settings = new this(
            config.store,
            config.headerMenu,
            config.api
        );

        if (config.initialTTSSettings) {
            var initialTTSSettings:TTSSettings = config.initialTTSSettings

            if(initialTTSSettings.rate) {
                settings.rate = initialTTSSettings.rate
                if (IS_DEV) console.log(settings.rate)
            }
            if(initialTTSSettings.pitch) {
                settings.pitch = initialTTSSettings.pitch
                if (IS_DEV) console.log(settings.pitch)
            }
            if(initialTTSSettings.volume) {
                settings.volume = initialTTSSettings.volume
                if (IS_DEV) console.log(settings.volume)
            }
            if(initialTTSSettings.color) {
                settings.color = initialTTSSettings.color
                if (IS_DEV) console.log(settings.color)
            }
            if(initialTTSSettings.autoScroll) {
                settings.autoScroll = initialTTSSettings.autoScroll
                if (IS_DEV) console.log(settings.autoScroll)
            }
            if(initialTTSSettings.voice) {
                settings.voice = initialTTSSettings.voice
                if (IS_DEV) console.log(settings.voice)
            }
            if(initialTTSSettings.highlight) {
                settings.highlight = initialTTSSettings.highlight
                if (IS_DEV) console.log(settings.highlight)
            }

        }

        await settings.initializeSelections();
        return new Promise(resolve => resolve(settings));
    }

    protected constructor(store: Store, headerMenu: HTMLElement, api: any) {
        this.store = store;

        this.headerMenu = headerMenu;
        this.api = api;
        this.initialise();
    }

    async stop() {
        if (IS_DEV) { console.log("tts settings stop") }
    }

    private async initialise() {
        this.autoScroll = (await this.getProperty(TTSREFS.AUTO_SCROLL_KEY) != null) ? (await this.getProperty(TTSREFS.AUTO_SCROLL_KEY) as Switchable).value : this.autoScroll

        this.rate = (await this.getProperty(TTSREFS.RATE_KEY) != null) ? (await this.getProperty(TTSREFS.RATE_KEY) as Incremental).value : this.rate
        this.pitch = (await this.getProperty(TTSREFS.PITCH_KEY) != null) ? (await this.getProperty(TTSREFS.PITCH_KEY) as Incremental).value : this.pitch
        this.volume = (await this.getProperty(TTSREFS.VOLUME_KEY) != null) ? (await this.getProperty(TTSREFS.VOLUME_KEY) as Incremental).value : this.volume

        this.color = (await this.getProperty(TTSREFS.COLOR_KEY) != null) ? (await this.getProperty(TTSREFS.COLOR_KEY) as Stringable).value : this.color
        this.voice = (await this.getProperty(TTSREFS.VOLUME_KEY) != null) ? (await this.getProperty(TTSREFS.VOLUME_KEY) as JSONable).value : this.volume

        this.highlight = (await this.getProperty(TTSREFS.HIGHLIGHT_KEY) != null) ? (await this.getProperty(TTSREFS.HIGHLIGHT_KEY) as Stringable).value : this.highlight

        this.userProperties = this.getTTSSettings()
    }
    
    private async reset() {

        this.highlight = "lines"
        this.color = "orange"
        this.autoScroll = true
        this.rate = 1.0
        this.pitch = 1.0
        this.volume = 1.0
    
        this.voice = {
            usePublication : true
        }
        
        this.userProperties = this.getTTSSettings()
    }

    private async initializeSelections(): Promise<void> {

        if (this.headerMenu) this.settingsView = HTMLUtilities.findElement(this.headerMenu, "#container-view-tts-settings") as HTMLDivElement;

    }

    setControls() {
        if (this.settingsView) this.renderControls(this.settingsView);
    }


    private renderControls(element: HTMLElement): void {
        this.rateButtons = {};
        for (const rateName of ["decrease", "increase"]) {
            this.rateButtons[rateName] = HTMLUtilities.findElement(element, "#" + rateName + "-rate") as HTMLButtonElement;
        }
        this.pitchButtons = {};
        for (const pitchName of ["decrease", "increase"]) {
            this.pitchButtons[pitchName] = HTMLUtilities.findElement(element, "#" + pitchName + "-pitch") as HTMLButtonElement;
        }
        this.volumeButtons = {};
        for (const volumeName of ["decrease", "increase"]) {
            this.volumeButtons[volumeName] = HTMLUtilities.findElement(element, "#" + volumeName + "-volume") as HTMLButtonElement;
        }

        if (this.headerMenu) this.speechRate = HTMLUtilities.findElement(this.headerMenu, "#speechRate") as HTMLInputElement;
        if (this.headerMenu) this.speechPitch = HTMLUtilities.findElement(this.headerMenu, "#speechPitch") as HTMLInputElement;
        if (this.headerMenu) this.speechVolume = HTMLUtilities.findElement(this.headerMenu, "#speechVolume") as HTMLInputElement;


        if (this.headerMenu) this.speechAutoScroll = HTMLUtilities.findElement(this.headerMenu, "#autoScroll") as HTMLInputElement;
        if (this.headerMenu) this.speechHighlight = HTMLUtilities.findElement(this.headerMenu, "#highlight") as HTMLInputElement;

        this.setupEvents();

        if (this.speechRate) this.speechRate.value = this.rate.toString()
        if (this.speechPitch) this.speechPitch.value = this.pitch.toString()
        if (this.speechVolume) this.speechVolume.value = this.volume.toString()
        if (this.speechAutoScroll) this.speechAutoScroll.checked = this.autoScroll
        if (this.speechHighlight) this.speechHighlight.checked = this.highlight == "lines" ? true : false

        // Clicking the settings view outside the ul hides it, but clicking inside the ul keeps it up.
        addEventListenerOptional(HTMLUtilities.findElement(element, "ul"), 'click', (event: Event) => {
            event.stopPropagation();
        });
    }

    public onSettingsChange(callback: () => void) {
        this.settingsChangeCallback = callback;
    }

    private async setupEvents(): Promise<void> {

        addEventListenerOptional(this.rateButtons["decrease"], 'click', (event: MouseEvent) => {
            console.log(TTSREFS.RATE_REF);
            (this.userProperties.getByRef(TTSREFS.RATE_REF) as Incremental).decrement()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.RATE_REF))
            this.settingsChangeCallback();
            event.preventDefault();
        });
        addEventListenerOptional(this.rateButtons["increase"], 'click', (event: MouseEvent) => {
            console.log(TTSREFS.RATE_REF);
            (this.userProperties.getByRef(TTSREFS.RATE_REF) as Incremental).increment()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.RATE_REF))
            this.settingsChangeCallback();
            event.preventDefault();
        });
        addEventListenerOptional(this.pitchButtons["decrease"], 'click', (event: MouseEvent) => {
            console.log(TTSREFS.PITCH_REF);
            (this.userProperties.getByRef(TTSREFS.PITCH_REF) as Incremental).decrement()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.PITCH_REF))
            this.settingsChangeCallback();
            event.preventDefault();
        });
        addEventListenerOptional(this.pitchButtons["increase"], 'click', (event: MouseEvent) => {
            console.log(TTSREFS.PITCH_REF);
            (this.userProperties.getByRef(TTSREFS.PITCH_REF) as Incremental).increment()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.PITCH_REF))
            this.settingsChangeCallback();
            event.preventDefault();
        });
        addEventListenerOptional(this.volumeButtons["decrease"], 'click', (event: MouseEvent) => {
            console.log(TTSREFS.VOLUME_REF);
            (this.userProperties.getByRef(TTSREFS.VOLUME_REF) as Incremental).decrement()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.VOLUME_REF))
            this.settingsChangeCallback();
            event.preventDefault();
        });
        addEventListenerOptional(this.volumeButtons["increase"], 'click', (event: MouseEvent) => {
            console.log(TTSREFS.VOLUME_REF);
            (this.userProperties.getByRef(TTSREFS.VOLUME_REF) as Incremental).increment()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.VOLUME_REF))
            this.settingsChangeCallback();
            event.preventDefault();
        });

    }

    private async storeProperty(property: UserProperty): Promise<void> {
        this.updateUserSettings()
        this.saveProperty(property)
    }

    private async updateUserSettings() {
        var ttsSettings:TTSSpeechConfig = {
            rate: this.userProperties.getByRef(TTSREFS.RATE_REF).value,
            pitch: this.userProperties.getByRef(TTSREFS.PITCH_REF).value,
            volume: this.userProperties.getByRef(TTSREFS.VOLUME_REF).value,
            voice: this.userProperties.getByRef(TTSREFS.VOLUME_REF).value,
            color: this.userProperties.getByRef(TTSREFS.COLOR_REF).value,
            autoScroll: this.userProperties.getByRef(TTSREFS.AUTO_SCROLL_REF).value
        }
        this.applyTTSSettings(ttsSettings)
        if (this.api && this.api.updateTTSSettings) {
            this.api.updateUserSettings(ttsSettings).then(_ => {
                if (IS_DEV) { console.log("api updated tts settings", ttsSettings) }
            })
        }
    }

    private getTTSSettings(): UserProperties {

        var userProperties = new UserProperties()

        userProperties.addSwitchable("tts-auto-scroll-off", "tts-auto-scroll-on", this.autoScroll, TTSREFS.AUTO_SCROLL_REF, TTSREFS.AUTO_SCROLL_KEY)
        userProperties.addIncremental(this.rate, 0.1, 10, 0.1, "", TTSREFS.RATE_REF, TTSREFS.RATE_KEY)
        userProperties.addIncremental(this.pitch, 0.1, 2, 0.1, "", TTSREFS.PITCH_REF, TTSREFS.PITCH_KEY)
        userProperties.addIncremental(this.volume, 0.1, 1, 0.1, "", TTSREFS.VOLUME_REF, TTSREFS.VOLUME_KEY)
        userProperties.addStringable(this.color, TTSREFS.COLOR_REF, TTSREFS.COLOR_KEY)
        userProperties.addStringable(this.highlight, TTSREFS.HIGHLIGHT_REF, TTSREFS.HIGHLIGHT_KEY)
        userProperties.addJSONable(JSON.stringify(this.voice), TTSREFS.VOICE_REF, TTSREFS.VOICE_KEY)

        return userProperties

    }

    private async saveProperty(property: any): Promise<any> {
        let savedProperties = await this.store.get(this.TTSSETTINGS);
        if (savedProperties) {
            let array = JSON.parse(savedProperties);
            array = array.filter((el: any) => el.name !== property.name);
            array.push(property);
            await this.store.set(this.TTSSETTINGS, JSON.stringify(array));
        } else {
            let array = new Array();
            array.push(property);
            await this.store.set(this.TTSSETTINGS, JSON.stringify(array));
        }
        return new Promise(resolve => resolve(property));
    }

     async getProperty(name: string): Promise<UserProperty> {
        let array = await this.store.get(this.TTSSETTINGS);
        if (array) {
            let properties = JSON.parse(array) as Array<UserProperty>;
            properties = properties.filter((el: UserProperty) => el.name === name);
            if (properties.length == 0) {
                return null;
            }
            return properties[0];
        }
        return null;
    }

    async resetTTSSettings(): Promise<void> {
        await this.store.remove(this.TTSSETTINGS)
        await this.reset()
        this.settingsChangeCallback();
    }

    async applyTTSSettings(ttsSettings: TTSSpeechConfig): Promise<void> {

        if (ttsSettings.rate) {
            console.log("rate " + this.rate)
            this.rate = ttsSettings.rate
            this.userProperties.getByRef(TTSREFS.RATE_REF).value = this.rate;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.RATE_REF))
            this.settingsChangeCallback();
        }
        if (ttsSettings.pitch) {
            console.log("pitch " + this.pitch)
            this.pitch = ttsSettings.pitch
            this.userProperties.getByRef(TTSREFS.PITCH_REF).value = this.pitch;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.PITCH_REF))
            this.settingsChangeCallback();
        }
        if (ttsSettings.volume) {
            console.log("volume " + this.volume)
            this.volume = ttsSettings.volume
            this.userProperties.getByRef(TTSREFS.VOLUME_REF).value = this.volume;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.VOLUME_REF))
            this.settingsChangeCallback();
        }

        if (ttsSettings.color) {
            this.color = ttsSettings.color
            this.userProperties.getByRef(TTSREFS.COLOR_REF).value = this.color;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.COLOR_REF))
            this.settingsChangeCallback();
        }
        if (ttsSettings.autoScroll != undefined) {
            console.log("autoScroll " + this.autoScroll)
            this.autoScroll = ttsSettings.autoScroll
            this.userProperties.getByRef(TTSREFS.AUTO_SCROLL_REF).value = this.autoScroll;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.AUTO_SCROLL_REF))
            this.settingsChangeCallback();
        }
        if (ttsSettings.voice) {
            console.log("voice " + this.voice)
            this.voice = ttsSettings.voice
            this.userProperties.getByRef(TTSREFS.VOICE_REF).value = this.voice;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.VOICE_REF))
            this.settingsChangeCallback();
        }

        if (ttsSettings.highlight) {
            console.log("highlight " + this.highlight)
            this.highlight = ttsSettings.highlight
            this.userProperties.getByRef(TTSREFS.HIGHLIGHT_REF).value = this.highlight;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.HIGHLIGHT_REF))
            this.settingsChangeCallback();
        }



    }

    async ttsSet(key: any, value: any) {

        if (key == TTSREFS.COLOR_REF) {
            this.color = value
            this.userProperties.getByRef(TTSREFS.COLOR_REF).value = this.color;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.COLOR_REF))
            this.settingsChangeCallback();
        } else if (key == TTSREFS.AUTO_SCROLL_REF) {
            this.autoScroll = value
            this.userProperties.getByRef(TTSREFS.AUTO_SCROLL_REF).value = this.autoScroll;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.AUTO_SCROLL_REF))
            this.settingsChangeCallback();
        } else if (key == TTSREFS.VOICE_REF) {
            this.voice = value
            this.userProperties.getByRef(TTSREFS.VOICE_REF).value = this.voice;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.VOICE_REF))
            this.settingsChangeCallback();
        } else if (key == TTSREFS.HIGHLIGHT_REF) {
            this.highlight = value
            this.userProperties.getByRef(TTSREFS.HIGHLIGHT_REF).value = this.highlight;
            await this.saveProperty(this.userProperties.getByRef(TTSREFS.HIGHLIGHT_REF))
            this.settingsChangeCallback();
        } 

    }


    async increase(incremental: string): Promise<void> {
        if (incremental == 'rate') {
            (this.userProperties.getByRef(TTSREFS.RATE_REF) as Incremental).increment()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.RATE_REF))
            this.settingsChangeCallback();
        } else if (incremental == 'pitch') {
            (this.userProperties.getByRef(TTSREFS.PITCH_REF) as Incremental).increment()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.PITCH_REF))
            this.settingsChangeCallback();
        } else if (incremental == 'volume') {
            (this.userProperties.getByRef(TTSREFS.VOLUME_REF) as Incremental).increment()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.VOLUME_REF))
            this.settingsChangeCallback();
        }
    }

    async decrease(incremental: string): Promise<void> {
        if (incremental == 'rate') {
            (this.userProperties.getByRef(TTSREFS.RATE_REF) as Incremental).decrement()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.RATE_REF))
            this.settingsChangeCallback();
        } else if (incremental == 'pitch') {
            (this.userProperties.getByRef(TTSREFS.PITCH_REF) as Incremental).decrement()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.PITCH_REF))
            this.settingsChangeCallback();
        } else if (incremental == 'volume') {
            (this.userProperties.getByRef(TTSREFS.VOLUME_REF) as Incremental).decrement()
            this.storeProperty(this.userProperties.getByRef(TTSREFS.VOLUME_REF))
            this.settingsChangeCallback();
        }
    }

}
