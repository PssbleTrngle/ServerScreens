import { BaseEntity } from 'typeorm';
import AuthController from './controller/AuthController';
import ResourceController, { EntityStatic } from './controller/ResourceController';
import UserController from './controller/UserController';
import Apikey from './models/Apikey';
import User from './models/User';
import ServerController from './controller/ServerController';
import ServerPermissions from './models/ServerPermissions';
import PermissionsController from './controller/PermissionsController';

interface IRoute {
    method: string;
    route: string;
    controller: any;
    action: string;
    admin?: boolean;
}

const Resources: {
    url: string;
    owned: boolean;
    filter?: Filter;
}[] = [];

const authRoutes: IRoute[] = [
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
    },
]

const permissionRoutes: IRoute[] = [
    {
        method: 'get',
        route: '/api/permissions/server/:server',
        controller: PermissionsController,
        action: 'serverAll',
        admin: true,
    },
    {
        method: 'get',
        route: '/api/permissions/server/:server/:role',
        controller: PermissionsController,
        action: 'serverOne',
        admin: true,
    },
    {
        method: 'put',
        route: '/api/permissions/server/:server/:role',
        controller: PermissionsController,
        action: 'serverUpdate',
        admin: true,
    },
]

export const Routes: IRoute[] = [
    ...resource('users', User),
    ...resource('apikeys', Apikey, true, { all: true, one: true }),
    ...authRoutes,
    ...permissionRoutes,
    {
        controller: ServerController,
        action: 'get',
        route: '/api/server/:id',
        method: 'get',
    },
    {
        controller: ServerController,
        action: 'all',
        route: '/api/server',
        method: 'get',
    },
    {
        controller: ServerController,
        action: 'start',
        route: '/api/server/:id/start',
        method: 'post',
    },
    {
        controller: ServerController,
        action: 'stop',
        route: '/api/server/:id/stop',
        method: 'post',
    },
    {
        controller: ServerController,
        action: 'create',
        route: '/api/server',
        method: 'post',
    },
    {
        controller: ServerController,
        action: 'update',
        route: '/api/server/:id',
        method: 'put',
    },
    {
        controller: ServerController,
        action: 'icon',
        route: '/api/server/:id/icon',
        method: 'get',
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