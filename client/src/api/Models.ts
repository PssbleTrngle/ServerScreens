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

export interface IServer extends IModel {
    name: string;
    online: boolean;
}

export type IList<T> = Array<T>;