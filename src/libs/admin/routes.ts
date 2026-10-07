import express, {Express, Request, Response, Router} from 'express';
import fs from 'fs';
import path from 'path';
import basicAuth from '../../middleware/basic_auth';
import {apiRouter} from './api';

export const BASE_PATH = '/ai/admin'

/* Built by `yarn build` (vite, from admin/). */
const SPA_DIR = path.resolve(process.cwd(), 'dist/admin')

export function adminRouter(): Router {
    const router = express.Router()

    router.use(basicAuth())
    router.use('/api', apiRouter())
    router.use(express.static(SPA_DIR, {index: false}))
    /* Client-side routes : every other GET serves the SPA. */
    router.get('*', (req: Request, res: Response) => {
        const index = path.join(SPA_DIR, 'index.html')
        if (!fs.existsSync(index)) {
            res.status(503).type('text/plain').send('Admin front-end not built: run `yarn build`.')
            return
        }
        res.sendFile(index)
    })

    return router
}

export default function registerAdminRoutes(app: Express): void {
    app.use(BASE_PATH, adminRouter())
}
