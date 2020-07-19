import { Connection, DeepPartial } from "typeorm";
import { Factory, Seeder } from "typeorm-seeding";
import Permissions from "../models/Permissions";
import Role from "../models/Role";
import User from "../models/User";
import bcyrpt from 'bcrypt'

export default class UserSeeder implements Seeder {
    public async run(_: Factory, connection: Connection) {

        const { ADMIN_PASSWORD, ADMIN_USERNAME } = process.env;
        const role = await Role.findOne({ name: 'admin' })

        if (process.env.ADMIN_PASSWORD && role) {

            const password_hash = await new Promise<string>((res, rej) => bcyrpt.hash(ADMIN_PASSWORD, process.env.SALT_ROUNDS ?? 10, (e, h) => {
                if (e) rej(e);
                else if (h) res(h);
            }));

            const values: DeepPartial<User> = { username: ADMIN_USERNAME ?? 'admin', password_hash, role };
            await User.create(values).save()

        }
    }
}