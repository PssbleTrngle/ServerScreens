import { BaseEntity } from 'typeorm';
import AuthController from './controller/AuthController';
import ResourceController, { EntityStatic } from './controller/ResourceController';
import ServiceController from './controller/ServiceController';
import UserController from './controller/UserController';
import Apikey from './models/Apikey';
import Login from './models/Login';
import { Service } from './models/Service';
import User from './models/User';

interface IRoute {
    method: string;
    route: string;
    controller: any;
    action: string;
    auth?: boolean;
}

const Resources: {
    url: string;
    owned: boolean;
    filter?: Filter;
}[] = [];

export const Routes: IRoute[] = [
    ...resource('users', User),
    ...resource('apikeys', Apikey, true, { all: true, one: true }),
    ...resource('logins', Login, true, { all: true, one: true, remove: true }),
    ...resource('services', Service),
    {
        method: 'post',
        route: '/auth/:name',
        controller: ServiceController,
        action: 'authorize',
        auth: true,
    },
    {
        method: 'get',
        route: '/auth/:name',
        controller: ServiceController,
        action: 'redirect'
    },
    {
        method: 'post',
        route: '/api/apikey',
        controller: AuthController,
        action: 'login',
    },
    {
        method: 'delete',
        route: '/api/apikey',
        controller: AuthController,
        action: 'logout',
        auth: true,
    },
    {
        method: 'get',
        route: '/api/user',
        controller: UserController,
        action: 'get',
        auth: true,
    },
    resources()
];

interface Filter {
    all?: boolean;
    one?: boolean;
    save?: boolean;
    remove?: boolean;
    update?: boolean;
}

/**
 * @param url The base API url
 * @param resource The Entity model
 * @param owned If the entity model should only be accecible to the associated user
 */
function resource<E extends BaseEntity>(url: string, resource: EntityStatic<E>, owned = false, filter?: Filter): IRoute[] {
    const controller = ResourceController(resource, owned);

    Resources.push({ url, owned, filter })
    const auth = owned;

    return [{
        method: 'get',
        route: `/api/${url}`,
        controller, auth,
        action: 'all'
    }, {
        method: 'get',
        route: `/api/${url}/:id`,
        controller, auth,
        action: 'one'
    }, {
        method: 'post',
        route: `/api/${url}`,
        controller, auth,
        action: 'save'
    }, {
        method: 'delete',
        route: `/api/${url}/:id`,
        controller, auth,
        action: 'remove'
    }, {
        method: 'post',
        route: `/api/${url}/:id`,
        controller, auth,
        action: 'update'
    }].filter(({ action }) => !filter || (action in filter && (filter as any)[action]))
}

function resources(): IRoute {
    return {
        method: 'get',
        route: '/api/endpoints',
        controller: class {
            all = () => Resources;
        },
        action: 'all'
    }
}