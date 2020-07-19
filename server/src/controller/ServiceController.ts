import axios from 'axios';
import { Response } from "express";
import jwt from 'jsonwebtoken';
import querystring from 'querystring';
import { AuthRequest } from "..";
import { debug } from "../logging";
import Login from "../models/Login";
import { Service } from "../models/Service";
import User from "../models/User";
import { HttpError } from "./ResourceController";

export const request = axios.create({
    transformRequest: r => {
        if (typeof r === 'object') return querystring.stringify(r);
        else return r;
    },
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
})

export default class ServiceController {

    static parseToken(data: any) {
        const object = typeof data === 'string' ? querystring.parse(data) : data;
        ServiceController.checkError(object);

        const { access_token, expires_in, refresh_token, refresh_token_expires_in } = object;

        const now = new Date().getTime();
        const toDate = (i: any) => i ? new Date(now + Number.parseInt(i)) : undefined

        const [expires_at, refresh_token_expires_at] = [expires_in, refresh_token_expires_in].map(toDate);

        return { access_token, refresh_token, refresh_token_expires_at, expires_at };
    }

    static checkError(response: any) {
        if (typeof response === 'string') this.checkError(querystring.parse(response))
        else {
            const { error, error_description } = response;
            if (error) throw new HttpError(500, error_description ? `${error}: ${error_description}` : error);
        }
    }

    async redirect(req: AuthRequest, res: Response) {
        const { code, state } = req.query;
        ServiceController.checkError(req.query);

        if (state && code) {

            const decoded = jwt.decode(state.toString(), { json: true });
            if (!decoded) throw new HttpError(500, 'Invalid state');

            const user = await User.findOne(decoded.user);
            const service = await Service.findOne(decoded.service);

            if (!user || !service) return null;

            debug(`Received redirect for user ${user.username}, service ${service.name}`)

            const { token_url, client_id, client_secret } = service;
            const redirect_uri = service.redirectURL();

            if (token_url) {

                //const base64 = new Buffer(`${client_id}:${client_secret}`).toString('base64');

                const params = {
                    client_id, code, state, redirect_uri, client_secret,
                    grant_type: 'authorization_code',
                }

                //debug('Retrieving token using', params)

                const { data } = await request.post(token_url, params);

                // debug('Received token data', data)

                await Login.create({
                    ...ServiceController.parseToken(data),
                    user, service,
                }).save();
            }

            res.redirect(decoded.from ?? '/');

        } else throw new HttpError(500, 'State or code missing');
    }

    async authorize(req: AuthRequest, res: Response) {
        const { name } = req.params;

        const service = await Service.createQueryBuilder()
            .where("LOWER(service.name) = LOWER(:name)", { name })
            .getOne();

        if (!service) {
            debug(`Service '${name}' not found`)
            return null;
        }

        const login = await Login.findOne({ user: req.user, service });
        if (login) throw new HttpError(400, 'Already connected to this service');

        else {
            const { auth_url, client_id, scope } = service;
            const redirect_uri = service.redirectURL();

            debug(`User '${req.user.username}' requests login to '${service.name}`);

            const secret = process.env.JWT_SECRET;
            if (!secret) throw new Error('JWT Secret missing, contact admin')

            const state = jwt.sign(JSON.stringify({
                user: req.user.id, service: service.id, from: req.body.from
            }), secret)

            const params = querystring.stringify({
                client_id, redirect_uri, state, scope,
                response_type: 'code',
            });

            res.json({ url: `${auth_url}?${params}` })
        }
    }

}