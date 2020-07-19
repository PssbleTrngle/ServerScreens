import { Connection, DeepPartial } from "typeorm";
import { Factory, Seeder } from "typeorm-seeding";
import Permissions from "../models/Permissions";
import Role from "../models/Role";

export default class RoleSeeder implements Seeder {
    public async run(_: Factory, connection: Connection) {

        const roles: DeepPartial<Role>[] = [
            {
                name: 'all',
                default: true,
                permissions: {
                    visible: true,
                    visibleOffline: true,
                    restart: false,
                    stop: false,
                    start: false,
                    create: false,
                    update: false,
                }
            },
            {
                name: 'admin',
                permissions: {
                    visible: true,
                    visibleOffline: true,
                    restart: true,
                    stop: true,
                    start: true,
                    create: true,
                    update: true,
                }
            },
        ]

        if (await Role.count() == 0) {

            await connection
                .createQueryBuilder()
                .insert()
                .into(Role)
                .values(roles)
                .execute()
        } else if (process.env.NODE_ENV === 'development') {

            await Promise.all(roles.map(async values => {
                const r = await Role.findOne({ name: values.name })
                if (r) {
                    Object.assign(r, values)
                    return r.save();
                }
            }))

        }
    }
}