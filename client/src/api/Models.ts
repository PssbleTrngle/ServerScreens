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

export interface IService extends IModel {
    name: string;
}

export interface ILogin extends IModel {
    service: IService;
    user: IUser;
    apiId: string | number;
}

export interface IEntry extends IOwned {
    timestamps: ITimestamps;
    text?: string;
    images?: string[];
    link?: string;
    title: string;
    service?: IService;
}

export type IList<T> = Array<T>;