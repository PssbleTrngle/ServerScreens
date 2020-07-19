import { Column, OneToOne, Entity, BaseEntity } from "typeorm";
import Role from "./Role";

class Permissions {

    @Column({ nullable: true })
    visible?: boolean;

    @Column({ nullable: true })
    visibleOffline?: boolean;

    @Column({ nullable: true })
    start?: boolean;

    @Column({ nullable: true })
    stop?: boolean;

    @Column({ nullable: true })
    restart?: boolean;

    @Column({ nullable: true })
    update?: boolean;

    @Column({ nullable: true })
    create?: boolean;

}

export default Permissions;