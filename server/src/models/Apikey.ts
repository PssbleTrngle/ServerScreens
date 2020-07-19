import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne } from "typeorm";
import User from "./User";
import Timestamps from "./Timestamps";

@Entity()
export default class Apikey extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column(() => Timestamps)
    timestamps!: Timestamps;

    @Column({ unique: true })
    key!: string;

    @Column()
    purpose!: string;

    @ManyToOne(() => User, user => user.keys, { eager: true })
    user!: User;

}
