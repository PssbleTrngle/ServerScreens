import { AuthRequest } from "..";

export default class UserController {

    async get(req: AuthRequest) {
        return req.user;
    }
    
}