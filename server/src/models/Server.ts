import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, JoinColumn, OneToOne, OneToMany } from "typeorm";
import shell from 'child_process'
import ServerPermissions from "./ServerPermissions";
import Role from "./Role";
import { merge } from 'lodash'
import Permissions from "./Permissions";

@Entity()
export default class Server extends BaseEntity {

    static NAME_REGEX = /^[a-z_-]{3,30}$/i

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
        shell.execSync(`screen -S "${this.name}"  java -Xms1024M -Xmx4048M -jar ${this.path}`)
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
        shell.execSync(`screen -r nether -X stuff '${escaped}^M'`)
    }

    @OneToMany(() => ServerPermissions, p => p.server, { eager: true })
    permissions!: ServerPermissions[];

    async can(what: keyof Permissions, role?: Role) {
        const permissions = await this.getPermissions(role);
        return permissions[what] === true;
    }

}