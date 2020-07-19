import { BaseEntity, DeepPartial } from "typeorm";
import { AuthRequest } from "..";
import Timestamps from "../models/Timestamps";
import User from "../models/User";

export class HttpError extends Error {
    constructor(public status_code: number, message?: string) {
        super(message);
    }
}

export interface IEntity extends BaseEntity {
    user?: User;
    timestamps?: Timestamps;
}
export type EntityStatic<E extends IEntity> = { new(): E } & typeof BaseEntity;

/**
 * @param Resource The Entity model
 * @param owned If the entity model should only be accecible to the associated user
 */
export default function <E extends IEntity>(Resource: EntityStatic<E>, owned: boolean) {
    return class ResourceController {

        private authorized(entity: IEntity | undefined | null, req: AuthRequest) {
            if (owned && entity) {
                if (!entity.user) throw new Error(`User not included in owned entity ${Resource}`)
                if (entity.user.id !== req.user.id) {
                    throw new HttpError(401, 'Not authorized')
                }
            }
        }

        async all(req: AuthRequest) {

            const getNumber = (key: string) => {
                const i = Number.parseInt((req.query[key] ?? '').toString());
                return isNaN(i) ? undefined : i;
            }

            const limit = getNumber('limit') ?? 100;
            const offset = getNumber('offset') ?? 0;

            const resources: IEntity[] = await Resource.find({
                where: owned ? { user: req.user } : {},
                take: limit, skip: offset,
            });

            // Hotfix until order by embedded entities works
            return resources;
            /*
            return resources.sort((a, b) => {
                const [ta, tb] = [a, b].map(e => e.timestamps?.created ?? 0);
                return tb - ta;
            })
            */
        }

        async one(req: AuthRequest) {
            const entity = await Resource.findOne<IEntity>(req.params.id);
            this.authorized(entity, req);
            return entity;
        }

        async save(req: AuthRequest) {
            const values: DeepPartial<typeof Resource> = {
                ...req.body, user: req.user,
            }
            return Resource.create(values).save();
        }

        async update(req: AuthRequest) {
            const entity = await Resource.findOne<IEntity>(req.params.id);
            this.authorized(entity, req);
            return Resource.getRepository().update(req.params.id, req.body)
        }

        async remove(req: AuthRequest) {
            const entity = await Resource.findOne<IEntity>(req.params.id);
            this.authorized(entity, req);
            return entity?.remove();
        }

    }
}