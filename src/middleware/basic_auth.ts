import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import conf from '../config/server';

function safeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
        // timingSafeEqual requires equal lengths ; hash both to compare in constant time anyway
        return crypto.timingSafeEqual(
            crypto.createHash('sha256').update(bufA).digest(),
            crypto.createHash('sha256').update(bufB).digest()
        );
    }

    return crypto.timingSafeEqual(bufA, bufB);
}

export default function basicAuth(realm: string = 'BSM Admin') {
    return function (req: Request, res: Response, next: NextFunction): void {
        const user = conf.admin_user;
        const password = conf.admin_password;

        if (!user || !password) {
            res.status(503).type('text/plain').send('Admin panel disabled: set ADMIN_USER and ADMIN_PASSWORD in .env');
            return;
        }

        const header = req.headers.authorization || '';
        const [scheme, encoded] = header.split(' ');

        if ('Basic' === scheme && encoded) {
            const decoded = Buffer.from(encoded, 'base64').toString('utf8');
            const separator = decoded.indexOf(':');
            if (-1 !== separator) {
                const givenUser = decoded.slice(0, separator);
                const givenPassword = decoded.slice(separator + 1);
                // Both comparisons always run, so the response time doesn't leak which one failed
                const userOk = safeEquals(givenUser, user);
                const passwordOk = safeEquals(givenPassword, password);
                if (userOk && passwordOk) {
                    return next();
                }
            }
        }

        res.setHeader('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`);
        res.status(401).type('text/plain').send('Authentication required');
    };
}
