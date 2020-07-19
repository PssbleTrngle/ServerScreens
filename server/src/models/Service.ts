import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Login from "./Login";

@Entity()
export class Service extends BaseEntity {

    static hidden = ['secret'];

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 64, unique: true })
    name!: string;

    @OneToMany(() => Login, login => login.service)
    logins!: Promise<Login[]>;

    @Column()
    client_id!: string;

    @Column()
    client_secret!: string;

    @Column()
    auth_url!: string;

    @Column()
    token_url!: string;

    @Column()
    api_url!: string;

    @Column()
    token_type!: string;

    @Column({ nullable: true })
    scope?: string;

    public redirectURL() {
        return `${process.env.APP_URL}/auth/${this.name.toLowerCase()}`;
    }

}
