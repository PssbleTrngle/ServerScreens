import { Column, ManyToOne } from "typeorm";
import User from "./User";

class Timestamps {

    @Column({ default: 'CURRENT_TIMESTAMP' })
    created!: Date;

    @Column({ default: 'CURRENT_TIMESTAMP' })
    updated!: Date;

}

export default Timestamps;