import bcrypt from 'bcrypt';
import * as bodyParser from "body-parser";
import chalk from "chalk";
import express, { NextFunction } from "express";
import { ParamsDictionary, Request, Response } from 'express-serve-static-core';
import "reflect-metadata";
import { createConnection } from "typeorm";
import config from '../ormconfig';
import AuthController from "./controller/AuthController";
import { debug, error, success } from "./logging";
import Apikey from "./models/Apikey";
import User from "./models/User";
import { Routes } from "./routes";

export type AuthRequest = Request<ParamsDictionary, Response, any> & {
    user?: User,
    key?: Apikey,
};
export type ApiFunc<R extends Request = AuthRequest> = (req: R, res: Response, next: NextFunction) => unknown;
export type App = {
    get(url: string, ...func: ApiFunc[]): unknown,
    post(url: string, ...func: ApiFunc[]): unknown,
    delete(url: string, ...func: ApiFunc[]): unknown,
    put(url: string, ...func: ApiFunc[]): unknown,
    use(url: string, ...func: ApiFunc[]): unknown,
} & express.Express;


createConnection(config as any).then(async connection => {

    connection.synchronize();

    // create express app
    const app: App = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    function wrapper(func: ApiFunc): ApiFunc {
        return async (req, res, next) => {
            try {
                const r = func(req, res, next);
                const result = r instanceof Promise ? await r : r;

                if (result !== void 0) {
                    if (!!result) {

                        if (typeof result === 'number') {
                            res.status(result).send();
                        } if (result === true) {
                            res.status(200).send();
                        } else {
                            res.json(result);
                        }

                    } else {
                        res.status(404).send('Not found');
                    }
                }

            } catch (e) {

                const status_code = e.status_code ?? 500;
                if (status_code === 500 && process.env.NODE_ENV === 'development') {
                    error('Controller encountered unwanted error:')
                    error(e.message);

                    if (e.isAxiosError && e.response) {
                        error(e.response?.data);
                    }
                }

                res.status(status_code).send(e.message ?? 'Internal server error');
            }
        }
    }

    app.use(express.static('/client'));
    app.get('/', (_, res) => {
        if (process.env.NODE_ENV === 'development')
            res.redirect('http://localhost:3000')
        else
            res.sendFile('/client/index.html')
    });

    // register express routes from defined application routes
    Routes.forEach(({ controller, action, route, method, admin }) => {

        (app as any)[method](route, wrapper(new AuthController().authenticate));
        if(admin) (app as any)[method](route, wrapper(new AuthController().requireAdmin));

        const c = new controller();

        (app as any)[method](route, wrapper((req: Request, res: Response, next: Function) => {
            debug(`[${method.toUpperCase()}] -> '${route}'`);
            return c[action](req, res, next);
        }));
    });

    const PORT = process.env.PORT ?? 8080;
    app.listen(PORT, () => {
        success(`Server started on port ${chalk.underline(PORT)}`);
        console.log();
    });


}).catch(error => console.log(error));
