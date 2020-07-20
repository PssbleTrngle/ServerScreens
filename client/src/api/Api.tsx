import querystring, { ParsedUrlQueryInput } from 'querystring';
import { API_URL } from '../config';

/**
 * Replaced once we know the format the data will be sent by the server
 */
type Response<O> = O;


interface IObserver<O> {
    url: string;
    params?: ParsedUrlQueryInput | string;
    callback: (result?: O, error?: Error) => unknown;
}

type Method = 'post' | 'delete' | 'put' | 'get';
class Api {

    private observers: Set<IObserver<any>> = new Set();

    private apiURL(endpoint: string) {
        if (endpoint.startsWith('/')) return endpoint;
        return `${API_URL}/${endpoint}`
    }

    private authorization() {
        const saved = localStorage.getItem('apikey');
        if (!saved) return '';
        return `Apikey ${saved}`;
    }

    async isLoggedIn() {
        try {
            this.authorization();
            return this.fetch('user')
                .then(() => true)
                .catch(e => {
                    console.log(e);
                    localStorage.removeItem('apikey');
                    return false;
                });
        } catch {
            return false;
        }
    }

    call<O>(observer: IObserver<O>) {
        const { url, params, callback } = observer;
        this.fetch<O>(url, params)
            .then(r => callback(r))
            .catch(e => callback(undefined, e));
    }

    /**
     * Update all current subscribers
     */
    update() {
        this.observers.forEach(o => this.call(o));
    }

    /**
     * Subscibe to the current url
     * Will be updated every time a non GET request is retrieved
     * @param url The api url
     * @param params Optional query params
     */
    subscribe<O>(url: string, params?: ParsedUrlQueryInput | string) {
        return {
            then: (callback: (result?: O, error?: Error) => unknown) => {
                const o = { url, params, callback };
                this.observers.add(o);
                this.call(o);
                return () => {
                    this.observers.delete(o);
                }
            }
        }
    }

    /**
     * Sent a GET request
     * @param endpoint The api url
     * @param params Optional query params
     */
    async fetch<O>(endpoint: string, params?: ParsedUrlQueryInput | string, options: RequestInit = {}) {
        const query = typeof params === 'string' ? params : querystring.encode(params ?? {});
        return this.method<O>('get', `${endpoint}/?${query}`, undefined, false, options);
    }

    /**
     * Uploads the file to the api
     * @param endpoint The api url
     * @param file The file object
     * @param method The HTML method
     */
    async upload(endpoint: string, file: File, key = 'file', method: Method = 'post') {

        const body = new FormData()
        body.append(key, file)

        const url = this.apiURL(endpoint);

        return await fetch(url, {
            method: method.toUpperCase(),
            headers: {
                'Accept': 'application/json',
                //'Content-Type': 'application/json',
                'Authorization': this.authorization(),
            },
            body,
        });
    }

    private async method<O>(method: Method, endpoint: string, args?: any, update = true, options: RequestInit = {}) {

        const url = this.apiURL(endpoint);

        const response = await fetch(url, {
            method: method.toUpperCase(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.authorization(),
            },
            body: args ? JSON.stringify(args) : undefined,
            ...options
        });

        if (update && method !== 'get') this.update();

        if (response.ok) try {
            return (await response.json()) as O;
        } catch {
            return undefined;
        } else {
            throw new Error(await response.text() ?? 'Internal server error');
        }

    }

    async post<O = string>(url: string, args: any = {}, update = true) {
        return this.method<O>('post', url, args, update);
    }

    async put<O = string>(url: string, args: any = {}, update = true) {
        return this.method<O>('put', url, args, update);
    }

    async delete<O = string>(url: string, args: any = {}, update = true) {
        return this.method<O>('delete', url, args, update);
    }

    async logout() {
        API.delete('apikey');
        localStorage.removeItem('apikey');
        window.location.reload();
    }

    /**
     * Retrieves a new api key from the api and saves it
     * @param username The username
     * @param password The password
     */
    async login(username: string, password: string) {
        const { platform, vendor } = navigator;

        const base64 = new Buffer(`${username}:${password}`).toString('base64');

        const url = this.apiURL('apikey');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64}`,
            },
            body: JSON.stringify({ purpose: `${vendor} ${platform}` }),
        });

        this.update();

        if (response.status !== 201) throw new Error(await response.text());

        const { key } = await response.json()

        localStorage.setItem('apikey', key);
        return true;

    }

}



const API = new Api();

export default API;