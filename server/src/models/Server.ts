import chalk from 'chalk';
import shell from 'child_process';
import fs from 'fs';
import path from 'path';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { cached, clearCache } from '..';
import { debug, error, info } from '../logging';
import Permissions from "./Permissions";
import Role from "./Role";
import ServerPermissions from "./ServerPermissions";

function parseUnicode(value: string) {
    try {
        return decodeURIComponent(JSON.parse(`"${value}"`))
    } catch {
        return value.replace(/\\u00A7./, '').replace(/\\u[0-9A-Za-z]{4}/, '');
    }
}

@Entity()
export default class Server extends BaseEntity {

    static PROPS = ['server-port', 'motd', 'gamemode', 'difficulty']
    static BASE_DIR = process.env.BASE_DIR ?? ''

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text', unique: true })
    name!: string;

    @Column({ type: 'text', unique: true })
    path!: string;

    isRunning() {
        return cached(`server:${this.id}:running`, () => {
            try {
                shell.execSync(`screen -S ${this.screenName()} -Q select .`)
                return true;
            } catch {
                return false;
            }
        }, 10 * 64)
    }

    screenName() {
        const cwd = path.resolve(this.path, '..')
        return `${path.basename(cwd)}-${this.id}`;
    }

    async start() {
        try {
            this.stop();
        } catch { }

        const cwd = path.resolve(Server.BASE_DIR, this.path, '..')
        const file = path.basename(this.path)

        if (fs.existsSync(path.resolve(cwd, file))) {

            try {
                const output = shell.execSync(`screen -dm -S "${this.screenName()}" java -Xms1024M -Xmx4048M -jar ${file}`, { cwd })
                debug(output.toString());
                info(`Started server ${this.screenName()}`)
                clearCache(`server:${this.id}:properties`)
            } catch (e) {
                error(e);
                error(e.output?.toString())
                throw e;
            } finally {
                clearCache(`server:${this.id}:running`)
            }

        } else {
            error(`Server entrypoint specified at ${chalk.underline(this.path)} does not exist`)
        }
    }

    async getPermissions(role?: Role): Promise<Permissions> {
        const r = role ?? await Role.defaultRole();
        const specific = await ServerPermissions.findOne({ role: r, server: this })
        const base = r.permissions;

        return Object.keys(base)
            .map(k => k as keyof Permissions)
            .reduce((o, k) => ({ ...o, [k]: specific?.permissions?.[k] ?? base[k] }), {})
    }

    stop() {
        const output = this.execute('stop')
        debug(output.toString());
        info(`Stopped server ${this.screenName()}`)
        clearCache(`server:${this.id}:running`)
    }

    execute(command: string) {
        const escaped = command.replace("'", "\\'")
        return shell.execSync(`screen -r ${this.screenName()} -X stuff '${escaped}^M'`)
    }

    properties() {
        return cached(`server:${this.id}:properties`, () => {

            const file = path.resolve(Server.BASE_DIR, this.path, '..', 'server.properties')

            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file).toString();
                return content.split('\n')
                    .map(s => s.split('='))
                    .map(([k, v]) => [k, parseUnicode(v)])
                    .filter(([key]) => Server.PROPS.includes(key))
                    .reduce((o, [key, value]) => ({ ...o, [key]: value }), {})
            }

            return {};
        })
    }

    @OneToMany(() => ServerPermissions, p => p.server, { eager: true })
    permissions!: Promise<ServerPermissions[]>;

    async can(what: keyof Permissions, role?: Role) {
        const permissions = await this.getPermissions(role);
        return permissions[what] === true;
    }

}