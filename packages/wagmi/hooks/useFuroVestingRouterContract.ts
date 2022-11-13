import furoExports from '@sushiswap/furo/exports.json'
import { Address, useContract, useProvider } from 'wagmi'

export const getFuroVestingRouterContractConfig = (chainId: number | undefined) => ({
  address:
    // @ts-ignore
    (furoExports[chainId as unknown as keyof Omit<typeof furoExports, '31337'>]?.[0]?.contracts?.FuroVestingRouter
      ?.address ?? '') as Address,
  abi:
    // @ts-ignore
    furoExports[chainId as unknown as keyof Omit<typeof furoExports, '31337'>]?.[0]?.contracts?.FuroVestingRouter
      ?.abi ?? [],
})

export function useFuroVestingRouterContract(chainId: number | undefined): ReturnType<typeof useContract> {
  return useContract({
    ...getFuroVestingRouterContractConfig(chainId),
    signerOrProvider: useProvider({ chainId }),
  })
}
