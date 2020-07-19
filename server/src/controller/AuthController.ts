import bcyrpt from 'bcrypt';
import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { AuthRequest } from "..";
import { debug } from '../logging';
import Apikey from "../models/Apikey";
import User from "../models/User";
import { HttpError } from './ResourceController';

export default class AuthController {

    /**
     * Source: http://emailregex.com/
     */
    private static EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

    async authenticate(req: AuthRequest, _: Response, next: NextFunction) {

        const key = (req.headers.authorization ?? '').split(' ')[1] ?? '';
        const apikey = await Apikey.findOne({ where: { key }, relations: ['user'] });
        if (apikey) {

            req.user = apikey.user;
            req.key = apikey;
    
            apikey.timestamps.updated = new Date();
            apikey.save();

        }

        next();
    }

    async register(req: Request) {
        const { username, password } = req.body;

        const password_hash = await new Promise<string>((res, rej) => bcyrpt.hash(password, process.env.SALT_ROUNDS ?? 10, (e, h) => {
            if (e) rej(e);
            else if (h) res(h);
        }));

        await User.create({ password_hash, username }).save();
        return 201;
    }

    async logout(req: AuthRequest) {
        await req.key?.remove()
        return true;
    }

    async login(req: Request, res: Response) {
        //if (req.user) throw new HttpError(403, 'Already logged in');

        const base64 = (req.headers.authorization ?? '').split(' ')[1] ?? '';
        const [usernameOrEmail, password] = Buffer.from(base64, 'base64').toString().split(':');

        debug(`Login attempt with '${usernameOrEmail}: ${password}'`);
        const isEmail = AuthController.EMAIL_REGEX.test(usernameOrEmail);
        debug('Login data is ' + (isEmail ? 'email' : 'username'))

        const user = await User.findOne({
            select: ['id', 'password_hash', 'email', 'username'],
            where: isEmail
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail.toLowerCase() }
        });
        if (!user) throw new HttpError(400, 'Username not found');

        await new Promise((res, rej) => bcyrpt.compare(password, user.password_hash, (e, r) => {
            if (e) rej(e);
            if (r === true) res();
            else rej(new HttpError(400, 'Wrong password'));
        }));

        const { purpose } = req.body;
        const payload = {
            id: user.id,
            purpose,
            date: new Date().getTime(),
        };

        if (!process.env.JWT_SECRET) throw new HttpError(500, 'Not JWT secret defined, contact admin');

        const key = jwt.sign(JSON.stringify(payload), process.env.JWT_SECRET);
        const apiKey = await Apikey.create({ user, purpose, key }).save();

        res.status(201);
        return apiKey;
    }

}