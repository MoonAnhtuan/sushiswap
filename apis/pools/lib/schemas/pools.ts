import type { PoolType } from '@sushiswap/database'
import { z } from 'zod'

export const PoolsApiSchema = z.object({
  take: z.coerce.number().lte(1000).default(20),
  ids: z
    .string()
    .transform((ids) => ids?.split(',').map((id) => id.toLowerCase()))
    .optional(),
  chainIds: z
    .string()
    .transform((val) => val.split(',').map((v) => parseInt(v)))
    .optional(),
  isIncentivized: z.coerce
    .string()
    .transform((val) => {
      if (val === 'true') {
        return true
      } else if (val === 'false') {
        return false
      } else {
        throw new Error('isIncentivized must true or false')
      }
    })
    .optional(),
  isWhitelisted: z.coerce
    .string()
    .transform((val) => {
      if (val === 'true') {
        return true
      } else if (val === 'false') {
        return false
      } else {
        throw new Error('isWhitelisted must true or false')
      }
    })
    .optional(),
  poolTypes: z
    .string()
    .transform((poolTypes) => poolTypes?.split(',') as PoolType[])
    .optional(),
  cursor: z.string().optional(),
  orderBy: z.string().default('liquidityUSD'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
})
