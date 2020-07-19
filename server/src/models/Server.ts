import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, JoinColumn, OneToOne, OneToMany } from "typeorm";
import shell from 'child_process'
import ServerPermissions from "./ServerPermissions";
import Role from "./Role";
import { merge } from 'lodash'
import Permissions from "./Permissions";
import path from 'path'
import fs from 'fs';
import { debug } from '../logging'

@Entity()
export default class Server extends BaseEntity {

    static NAME_REGEX = /^[a-z_-]{3,30}$/i
    static PROPS = ['server-port', 'motd', 'gamemode', 'difficulty']

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    name!: string;

    @Column({ type: 'text' })
    path!: string;

    async isRunning() {
        try {
            shell.execSync(`screen -S ${this.name} -Q select .`)
            return true;
        } catch {
            return false;
        }
    }

    async start() {
        try {
            this.stop();
        } catch { }

        const cwd = path.resolve(this.path, '..')
        const file = path.basename(this.path)
        debug(`Executin in '${cwd}'`)
        shell.execSync(`screen -S "${this.name}" java -Xms1024M -Xmx4048M -jar ${file}`, { cwd })
    }

    async getPermissions(role?: Role) {
        const r = role ?? await Role.defaultRole();
        const specific = this.permissions.find(p => p.role.id === r.id) ?? {}
        const base = r.permissions;
        return merge({ ...specific }, base)
    }

    stop() {
        this.execute('stop')
    }

    execute(command: string) {
        const escaped = command.replace("'", "\\'")
        shell.execSync(`screen -r ${this.name} -X stuff '${escaped}^M'`)
    }

    async properties() {
        const file = path.resolve(this.path, '..', 'server.properties')

        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file).toString();
            return content.split('\n')
                .map(s => s.split('='))
                .filter(([key]) => Server.PROPS.includes(key))
                .reduce((o, [key, value]) => ({ ...o, [key]: value }), {})
        }

        return undefined;
    }

    @OneToMany(() => ServerPermissions, p => p.server, { eager: true })
    permissions!: ServerPermissions[];

    async can(what: keyof Permissions, role?: Role) {
        const permissions = await this.getPermissions(role);
        return permissions[what] === true;
    }

}