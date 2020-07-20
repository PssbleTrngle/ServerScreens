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

function parsePermissions(server: Server, role: Role) {
    const { id, name } = role;
    return {
        base: role.permissions,
        specific: server.permissions.find(p => p.role.id === role.id) ?? {},
        id, name
    };
}

export default class PermissionsController {

    async serverAll(req: AuthRequest) {
        const server = await Server.findOne(req.params.server)
        const roles = await Role.find();
        if (!server) return null;
        return roles.map(r => parsePermissions(server, r));
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
        const { role, server } = req.params;
        const values = req.body;

        const permissions = await ServerPermissions.createQueryBuilder()
            .where('roleId = :role')
            .andWhere('serverId = :server')
            .setParameters({ server, role })
            .getOne();

        if (permissions) {
            Object.assign(permissions.permissions, values)
            await permissions.save();
        } else {
            await ServerPermissions.create({ roleId: role, serverId: server, permissions }).save();
        }
    }

    async roleAll(req: AuthRequest) {
        return await Role.find();
    }

    async roleOne(req: AuthRequest) {
        return await Role.findOne(req.params.id);
    }

}