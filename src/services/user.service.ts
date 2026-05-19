import { Request } from "express";

class UserService {
    register(req: Request) {
        const { username, email, password } = req.body;
    }

    hashPassword(password: string): string {
    }
}