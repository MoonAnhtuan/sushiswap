'use client'

import { SteerVault } from '@sushiswap/client/src/pure/steer-vault/vault'
import { Amount, Token } from '@sushiswap/currency'
import { formatUSD } from '@sushiswap/format'
import { useSteerAccountPosition } from '@sushiswap/steer-sdk/hooks'
import {
  CardContent,
  CardCurrencyAmountItem,
  CardDescription,
  CardGroup,
  CardHeader,
  CardLabel,
  CardTitle,
} from '@sushiswap/ui'
import { useAccount } from '@sushiswap/wagmi'
import { useTokenAmountDollarValues } from 'lib/hooks'
import React, { FC, useMemo } from 'react'

interface SteerPositionDetails {
  vault: SteerVault
}

export const SteerPositionDetails: FC<SteerPositionDetails> = ({ vault }) => {
  const { address } = useAccount()
  const {
    data: position,
    isLoading: isPositionLoading,
    ...rest
  } = useSteerAccountPosition({
    account: address,
    vaultId: vault.id,
  })

  const currencies = useMemo(() => {
    const currency0 = new Token({ ...vault.token0, chainId: vault.chainId })
    const currency1 = new Token({ ...vault.token1, chainId: vault.chainId })

    return [currency0, currency1]
  }, [vault])

  const amounts = useMemo(() => {
    if (!position) return undefined

    const amount0 = Amount.fromRawAmount(currencies[0], position.token0Balance)
    const amount1 = Amount.fromRawAmount(currencies[1], position.token1Balance)

    return [amount0, amount1]
  }, [position, currencies])

  const fiatValuesAmounts = useTokenAmountDollarValues({ chainId: vault.chainId, amounts })
  const fiatValuesAmountsTotal = useMemo(
    () => fiatValuesAmounts.reduce((acc, cur) => acc + cur, 0),
    [fiatValuesAmounts]
  )

  console.log(position, rest)

  return (
    <>
      <CardHeader>
        <CardTitle>Position details</CardTitle>
        <CardDescription>{formatUSD(fiatValuesAmountsTotal)}</CardDescription>
      </CardHeader>
      <CardContent>
        <CardGroup>
          <CardLabel>Tokens</CardLabel>
          <CardCurrencyAmountItem
            amount={amounts?.[0]}
            isLoading={isPositionLoading}
            fiatValue={formatUSD(fiatValuesAmounts[0])}
          />
          <CardCurrencyAmountItem
            amount={amounts?.[1]}
            isLoading={isPositionLoading}
            fiatValue={formatUSD(fiatValuesAmounts[1])}
          />
        </CardGroup>
      </CardContent>
    </>
  )
}
