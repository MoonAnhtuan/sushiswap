import Redis from 'ioredis'

const redisUrl = process.env['REDIS_URL']
if (!redisUrl) throw new Error('REDIS_URL is required')

// @ts-ignore
const redis = new Redis(redisUrl)

export default redis
