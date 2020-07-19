import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, OneToOne, JoinColumn } from "typeorm";
import Apikey from "./Apikey";
import User from "./User";
import Permissions from "./Permissions";

@Entity()
export default class Role extends BaseEntity {

    static async defaultRole() {
        const r = await Role.findOne({ default: true })
        if (!r) throw new Error('No default role defined');
        return r;
    }

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: false })
    default!: boolean;

    @Column({ unique: true })
    name!: string

    @OneToMany(() => User, u => u.role)
    users!: Promise<User[]>;

    @Column(() => Permissions)
    permissions!: Permissions;

}