import {defineConfig, loadEnv, Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));

function sameSecret(a: string, b: string): boolean {
    const hash = (value: string) => crypto.createHash('sha256').update(value, 'utf8').digest()

    return crypto.timingSafeEqual(hash(a), hash(b))
}

/* The dev server serves the page and its sources itself : guard them with the same Basic Auth
   as src/middleware/basic_auth.ts, so the panel is never served unauthenticated, even in dev. */
function adminBasicAuth(user: string|undefined, password: string|undefined): Plugin {
    return {
        name: 'admin-basic-auth',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (!user || !password) {
                    res.statusCode = 503
                    res.setHeader('Content-Type', 'text/plain')
                    res.end('Admin panel disabled: set ADMIN_USER and ADMIN_PASSWORD in .env')
                    return
                }

                const [scheme, encoded] = (req.headers.authorization || '').split(' ')
                if ('Basic' === scheme && encoded) {
                    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
                    const separator = decoded.indexOf(':')
                    if (-1 !== separator) {
                        // Both comparisons always run, so the response time doesn't leak which one failed
                        const userOk = sameSecret(decoded.slice(0, separator), user)
                        const passwordOk = sameSecret(decoded.slice(separator + 1), password)
                        if (userOk && passwordOk) {
                            return next()
                        }
                    }
                }

                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="BSM Admin", charset="UTF-8"')
                res.setHeader('Content-Type', 'text/plain')
                res.end('Authentication required')
            })
        },
    }
}

/* Served by the `ai` handler under /ai/admin (see src/libs/admin/routes.ts). */
export default defineConfig(({mode}) => {
    /* The repository's .env, shared with the server. */
    const env = loadEnv(mode, path.resolve(root, '..'), '')

    return {
        root,
        base: '/ai/admin/',
        plugins: [react(), adminBasicAuth(env.ADMIN_USER, env.ADMIN_PASSWORD)],
        build: {
            outDir: path.resolve(root, '../dist/admin'),
            emptyOutDir: true,
        },
        server: {
            /* `yarn admin:dev` : the API comes from a running `ai` handler. The browser's Authorization
               header is forwarded as-is, so the same credentials are checked again there. */
            proxy: {
                '/ai/admin/api': env.ADMIN_API_URL || 'http://localhost:3104',
            },
        },
    }
});
