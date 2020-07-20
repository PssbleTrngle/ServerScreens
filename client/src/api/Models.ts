export interface IModel {
    id: number;
}

export interface ITimestamps {
    created: number;
    updated: number;
}

export interface IOwned extends IModel {
    user: IUser;
}

export interface IUser extends IModel {
    username: string;
    email?: string;
}

export interface IApiKey extends IModel {
    timestamps: ITimestamps;
    key: string;
    purpose: string;
}

export interface IPermissions {
    visible: boolean,
    visibleOffline: boolean,
    start: boolean,
    stop: boolean,
    restart: boolean,
    update: boolean,
    create: boolean
}

export interface IRole extends IModel {
    name: string
}

export interface IServerPermissions extends IRole {
    base: IPermissions;
    specific: IPermissions;
}

export interface IServer extends IModel {
    name: string,
    online: boolean,
    id: number,
    permissions: IPermissions
    properties?: IProperties
}

export interface IProperties {
    motd: string;
    gamemode: string;
    difficulty: string;
    'server-port': number;
}

export type IList<T> = Array<T>;