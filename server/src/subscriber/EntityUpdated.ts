import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent } from "typeorm";
import { IEntity } from "../controller/ResourceController";
import { debug } from "../logging";
import Timestamps from "../models/Timestamps";

@EventSubscriber()
export class EntityUpdated implements EntitySubscriberInterface<any> {

    beforeUpdate(event: UpdateEvent<IEntity>) {
        if (event.entity.timestamps) {
            event.entity.timestamps.updated = new Date();
        }
    }

    /*
    beforeInsert(event: InsertEvent<any>) {
        const date = event.entity.timestamps?.created ?? new Date().getTime();
        event.entity.timestamps = {
            created: date,
            updated: date,
        }
    }
    */

}
