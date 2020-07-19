import { AxiosError } from "axios";
import { BaseEntity, BeforeInsert, BeforeRemove, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import ServiceController, { request } from "../controller/ServiceController";
import { debug, error } from '../logging';
import { Service } from "./Service";
import User from "./User";

type K = keyof Login;

@Entity()
@Index('service_per_user', (l: Login) => [l.service, l.user], { unique: true })
@Index('identification_per_service', (l: Login) => [l.service, l.apiId], { unique: true })
export default class Login extends BaseEntity {

    /* 10 Days */
    static refresh_threshold = 1000 * 64 * 64 * 24 * 10;
    /* 10 seconds */
    static token_threshold = 1000;

    static hidden = ['access_token', 'refresh_token'];

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    refresh_token!: string;

    @Column()
    access_token!: string;

    @Column()
    expires_at!: Date;

    @Column({ nullable: true })
    refresh_token_expires_at?: Date;

    @Column({ default: 'token' })
    type!: string;

    @ManyToOne(() => Service, service => service.logins, { eager: true })
    service!: Service;

    @ManyToOne(() => User, user => user.logins, { eager: true })
    user!: User;

    @Column()
    apiId?: number;

    @BeforeRemove()
    notifyService() {
        //TODO
    }

    @BeforeInsert()
    async fetchIdentification() {
        const { id, name, email } = await this.getUser();
        this.apiId = id ?? name ?? email;
    }

    public async getAccessToken() {

        const now = new Date().getTime();
        const expiresIn = this.expires_at.getTime() - now;
        const refreshExpiresIn = this.refresh_token_expires_at ? this.refresh_token_expires_at.getTime() - now : Login.refresh_threshold;
        const expired = expiresIn < Login.token_threshold || refreshExpiresIn < Login.refresh_threshold;

        const { refresh_token, service, user } = this;
        const { client_id, client_secret } = service;

        if (expired && this.id) {
            debug(`Refreshing token for user ${user.username}, service ${service.name}`);

            try {

                const { data } = await request.post(service.token_url, {
                    grant_type: 'refresh_token',
                    refresh_token, client_id, client_secret,
                });

                const values = ServiceController.parseToken(data);
                values.refresh_token = values.refresh_token ?? refresh_token;

                await Login.update(this.id, values);
                await this.reload();

            } catch (e) {
                error(`Error occured on refreshing of token for user ${user.username}, service ${service.name}`)
                error(e.message);                
            }
        }
        
        return this.access_token;
    }

    public async accessApi<R = any>(url: string) {
        const access_token = await this.getAccessToken();

        const response = await request.get(`${this.service.api_url}/${url}`, {
            headers: {
                Authorization: `${this.service.token_type} ${access_token}`
            }
        })

        return response.data as R;
    }

    public async getUser() {
        return this.accessApi('user').catch((e: AxiosError) => {
            if(e.response?.status === 404) return this.accessApi('me');
            else throw e;
        });
    }

}