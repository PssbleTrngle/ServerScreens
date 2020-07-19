import { AuthRequest } from "..";
import Server from "../models/Server";
import { HttpError } from "./ResourceController";
import { Request, Response } from "express";
import Permissions from "../models/Permissions";
import Role from "../models/Role";
import { debug } from "../logging";
import path from 'path'

async function parseServer(server: Server, req: AuthRequest) {
    const online = await server.isRunning();
    const permissions = await server.getPermissions(req.user?.role)
    const show = online ? permissions.visible : permissions.visibleOffline;
    if (!show) return null;

    const { name, id } = server;
    return { name, online, id, permissions };
}

async function perform(req: AuthRequest, permission: keyof Permissions, action: (s: Server) => any) {
    const server = await Server.findOne(req.params.id);
    if (!server) return null;
    if (!server.can(permission, req.user?.role)) throw new HttpError(403, 'Illegal!')
    await action(server);
    return true;
}

export default class ServerController {

    async get(req: AuthRequest) {
        const server = await Server.findOne(req.params.id);
        if (!server) return null;
        return parseServer(server, req);
    }

    async all(req: AuthRequest) {
        const servers = await Server.find();
        const mapped = await Promise.all(servers.map(s => parseServer(s, req)));
        return mapped.filter(s => !!s)
    }

    async start(req: AuthRequest) {
        return perform(req, 'start', s => s.start())
    }

    async stop(req: AuthRequest) {
        return perform(req, 'stop', s => s.stop())
    }

    async create(req: AuthRequest) {
        const { path, name } = req.body;
        const { permissions } = (req.user?.role ?? await Role.defaultRole())
        if (!permissions.create) throw new HttpError(403, 'Illegal!')
        if (!Server.NAME_REGEX.test(name)) throw new HttpError(400, 'Not a valid server name')

        debug('Creating server with', { path, name })

        await Server.create({ path, name }).save();
        return true;
    }

    async update(req: AuthRequest) {
        const { path, name } = req.body;
        if (!Server.NAME_REGEX.test(name)) throw new HttpError(400, 'Not a valid server name')
        return perform(req, 'update', s => {
            Object.assign(s, { path, name })
            return s.save();
        })
    }

    async icon(req: AuthRequest, res: Response) {
        const s = await Server.findOne(req.params.id);
        if(!s) return null;
        const server = parseServer(s, req)
        if(!server) throw new HttpError(403, 'Illegal!')

        const iconPath = path.resolve(s.path, '..', 'server-icon.png');
        res.sendFile(iconPath);
        res.finished = true;
    }

}