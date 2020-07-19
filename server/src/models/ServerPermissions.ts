import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, ManyToOne, OneToOne, Index } from "typeorm";
import shell from 'child_process'
import Role from "./Role";
import Permissions from "./Permissions";
import Server from "./Server";

@Entity()
@Index('permissions_per_server_and_role', s => [s.role, s.server], { unique: true })
export default class ServerPermissions extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Server, s => s.permissions)
    server!: Promise<Server>;
    serverId?: number | string;

    @ManyToOne(() => Role, { eager: true })
    role!: Role;
    roleId?: number | string;

    @Column(() => Permissions)
    permissions!: Permissions;

}