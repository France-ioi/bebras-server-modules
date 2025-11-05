import platforms from '../repositories/platforms';
import jwt from 'jsonwebtoken';
import {GenericCallback} from "../types";

export default {
    path: '/tokens',

    params: {
        verify: ['token'],
    },

    actions: {

        verify: function(args: {token: string}, callback: GenericCallback) {
            const payload = jwt.decode(args.token) as { platformName?: string } | null;
            if (!payload || !payload.platformName) {
                return callback(new Error('Invalid token'))
            }
            platforms.getByName(payload.platformName, (error, platform) => {
                if (error) {
                    return callback(error)
                }
                if (!platform) {
                    return callback(new Error('Platform not found'));
                }

                jwt.verify(args.token, platform.public_key, (error: any) => {
                    callback(error ?? null);
                })
            })
        }
    }
}