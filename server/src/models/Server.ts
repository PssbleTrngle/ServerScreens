import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, JoinColumn, OneToOne, OneToMany } from "typeorm";
import shell from 'child_process'
import ServerPermissions from "./ServerPermissions";
import Role from "./Role";
import { merge } from 'lodash'
import Permissions from "./Permissions";
import path from 'path'
import fs from 'fs';
import { debug } from '../logging'
import { cached, clearCache } from '..'
import { clear } from "console";

@Entity()
export default class Server extends BaseEntity {

    static PROPS = ['server-port', 'motd', 'gamemode', 'difficulty']

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text', unique: true })
    name!: string;

    @Column({ type: 'text', unique: true })
    path!: string;

    async isRunning() {
        return cached(`${this.screenName()}:running`, () => {
            try {
                (shell.execSync(`screen -S ${this.screenName()} -Q select .`))
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

        const cwd = path.resolve(this.path, '..')
        const file = path.basename(this.path)
        try {
            shell.execSync(`screen -dm -S "${this.screenName()}" java -Xms1024M -Xmx4048M -jar ${file}`, { cwd })
            clearCache(`${this.screenName()}:properties`)
        } catch (e) {
            console.error(e);
            console.error(e.output?.toString())
            throw e;
        } finally {
            clearCache(`${this.screenName()}:running`)
        }
    }

    async getPermissions(role?: Role): Promise<Permissions> {
        const r = role ?? await Role.defaultRole();
        const specific = await ServerPermissions.findOne({ role: r, server: this })
        const base = r.permissions;
        if (specific) {
            debug('Server has specific roles for ' + r.name)
            debug(specific)
        }
        return Object.keys(base)
            .map(k => k as keyof Permissions)
            .reduce((o, k) => ({ ...o, [k]: specific?.permissions?.[k] ?? base[k] }), {})
    }

    stop() {
        this.execute('stop')
        clearCache(`${this.screenName()}:running`)
    }

    execute(command: string) {
        const escaped = command.replace("'", "\\'")
        shell.execSync(`screen -r ${this.screenName()} -X stuff '${escaped}^M'`)
    }

    async properties() {
        return cached(`${this.screenName()}:properties`, () => {

            const file = path.resolve(this.screenName(), '..', 'server.properties')

            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file).toString();
                return content.split('\n')
                    .map(s => s.split('='))
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