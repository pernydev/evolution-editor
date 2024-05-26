import { REDIS_URI } from '$env/static/private';
import { createClient } from 'redis';

export const rclient = await createClient({
    url: REDIS_URI,
}).connect();
