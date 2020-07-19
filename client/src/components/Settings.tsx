import { faFire, faMoon, faSun, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import l from 'lodash';
//@ts-ignore
import moment from 'moment/min/moment-with-locales';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U> ? Array<DeepPartial<U>> : T[P] extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : DeepPartial<T[P]>;
}

export interface IAccountSettings {

}

export interface IClientSettings {
    theme: string;
    lang: string;
}

export interface ISettings {
    client: IClientSettings;
    account?: IAccountSettings;
}

export const DEFAULT_SETTINGS = {
    theme: 'dark',
    lang: navigator.language,
}

const Settings = () => {

    const panels = [
        { title: 'theme', component: Theme },
    ]

    return <div className='panels'>
        {panels.map(panel =>
            <div id={panel.title} key={panel.title}>
                <h3>{panel.title}</h3>
                <panel.component />
            </div>
        )}
    </div>
}

const Theme = () => {
    const [, setSettings] = useSettings();

    const themes: [string, IconDefinition][] = [
        ['dark', faMoon],
        ['light', faSun],
        ['red', faFire],
    ];

    return (
        <ul className='buttons'>
            {themes.map(([theme, icon]) =>
                <button key={theme} className='icon-button' onClick={() => setSettings({ client: { theme } })}>
                    <Icon {...{ icon }} />
                </button>
            )}
        </ul>
    )
}

const Context = createContext<[ISettings, (changed: DeepPartial<ISettings>) => void]>([
    { client: DEFAULT_SETTINGS },
    () => { },
]);

export const Provider = Context.Provider;

export function useSettings() {
    return useContext(Context);
}

export function useSettingsProvider() {

    const client: IClientSettings = useMemo(() => {
        const saved = localStorage.getItem('settings')
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    }, []);

    const [settings, set] = useState<ISettings>({ client })
    const setSettings = (settings: DeepPartial<ISettings>) => {
        set(s => ({ ...l.merge(s, settings) }))
    }

    useEffect(() => {
        localStorage.setItem('settings', JSON.stringify(settings.client));
    }, [settings.client])

    useEffect(() => {
        // TODO post to server
    }, [settings.account])

    return [settings, setSettings] as [ISettings, (s: DeepPartial<ISettings>) => void];
}

const dateFormats: { [key: string]: string } = {
    'en-US': 'dddd, MMMM Do YYYY',
    'de-DE': 'dddd, Do Mo YYYY',
};

/**
 * @param timestamp The timestamp to convert
 * @param threshold The threshold until which '... minutes ago' is shown instead. 0 = never
 */
export function useFormat(timestamp: string | number, threshold = 1000 * 60 * 60) {
    const [{ client }] = useSettings();
    const { lang } = client;

    const diff = new Date().getTime() - new Date(timestamp).getTime();
    if (diff < threshold) return 'Ago';

    const mask = dateFormats[lang] ?? dateFormats['en-US'];
    return moment(timestamp).locale(lang).format(mask);
}

export default Settings;