import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Apikey from "./Apikey";
import Login from "./Login";

@Entity()
export default class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ select: false, default: false })
    dev!: boolean;

    @Column({
        unique: true, transformer: {
            to: (v: string) => v.toLowerCase(),
            from: (v: string) => v.toLowerCase(),
        }
    })
    username!: string;

    @Column({ select: false })
    password_hash!: string;

    @Column({ nullable: true })
    email!: string;

    @OneToMany(() => Apikey, key => key.user)
    keys!:  Promise<Apikey[]>;

    @OneToMany(() => Login, login => login.user)
    logins!: Promise<Login[]>;

}