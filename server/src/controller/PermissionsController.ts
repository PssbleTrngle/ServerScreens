import { AuthRequest } from "..";
import Server from "../models/Server";
import { HttpError } from "./ResourceController";
import { Request, Response } from "express";
import Permissions from "../models/Permissions";
import Role from "../models/Role";
import { debug } from "../logging";
import path from 'path'
import fs from 'fs'
import ServerPermissions from "../models/ServerPermissions";

async function parsePermissions(server: Server, role: Role) {
    const { id, name } = role;
    return {
        base: role.permissions,
        specific: (await server.permissions).find(p => p.role.id === role.id)?.permissions ?? {},
        id, name
    };
}

export default class PermissionsController {

    async serverAll(req: AuthRequest) {
        const server = await Server.findOne(req.params.server)
        const roles = await Role.find();
        if (!server) return null;
        return Promise.all(roles.map(r => parsePermissions(server, r)));
    }

    async serverOne(req: AuthRequest) {
        const [server, role] = await Promise.all([
            Server.findOne(req.params.server),
            Role.findOne(req.params.role),
        ])
        if (!server || !role) return null;
        return parsePermissions(server, role);
    }

    async serverUpdate(req: AuthRequest) {
        const { role: roleId, server: serverId } = req.params;
        const permissions = req.body;

        const p = await ServerPermissions.createQueryBuilder()
            .where('roleId = :roleId')
            .andWhere('serverId = :serverId')
            .setParameters({ serverId, roleId })
            .getOne();

        if (p) {
            p.permissions = permissions
            await p.save();
        } else {
            const [role, server] = await Promise.all([
                Role.findOne(roleId),
                Server.findOne(serverId),
            ])
            if (!role || !server) return null;
            await ServerPermissions.create({ role, server, permissions }).save();
        }

        return true;
    }

    async roleAll(req: AuthRequest) {
        return await Role.find();
    }

    async roleOne(req: AuthRequest) {
        return await Role.findOne(req.params.id);
    }

}