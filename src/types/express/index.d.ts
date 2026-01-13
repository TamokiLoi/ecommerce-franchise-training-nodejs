declare namespace Express {
    interface Request {
        user: {
            id: string;
            role: BaseRole | string;
            version: number;
        };
    }
}
