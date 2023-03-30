import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR, { SWRConfig } from 'swr'
import { Layout } from '../../../components'
import Link from 'next/link'
import { ArrowLeftIcon, ChartBarIcon, MinusIcon, PlusIcon } from '@heroicons/react/solid'
import { z } from 'zod'
import { useRouter } from 'next/router'
import { ChainId } from '@sushiswap/chain'
import { SplashController } from '@sushiswap/ui/future/components/SplashController'
import {
  useConcentratedLiquidityPool,
  useConcentratedLiquidityPositionsFromTokenId,
  useConcentratedPositionInfo,
} from '@sushiswap/wagmi/future/hooks'
import { useToken } from '@sushiswap/react-query'
import { Currency } from '@sushiswap/ui/future/components/currency'
import { Skeleton } from '@sushiswap/ui/future/components/skeleton'
import { Badge } from '@sushiswap/ui/future/components/Badge'
import { classNames, NetworkIcon } from '@sushiswap/ui'
import { List } from '@sushiswap/ui/future/components/list/List'
import { Amount, tryParseAmount } from '@sushiswap/currency'
import { usePriceInverter, useTokenAmountDollarValues } from '../../../lib/hooks'
import { formatUSD } from '@sushiswap/format'
import { getPriceOrderingFromPositionForUI, unwrapToken } from '../../../lib/functions'
import { ConcentratedLiquidityWidget } from '../../../components/ConcentratedLiquidityWidget'
import { useAccount } from 'wagmi'
import { ConcentratedLiquidityProvider } from '../../../components/ConcentratedLiquidityProvider'
import { Button } from '@sushiswap/ui/future/components/button'
import { RadioGroup } from '@headlessui/react'
import { ConcentratedLiquidityRemoveWidget } from '../../../components/ConcentratedLiquidityRemoveWidget'
import { JSBI } from '@sushiswap/math'
import { ConcentratedLiquidityCollectButton } from '../../../components/ConcentratedLiquidityCollectButton'

const PositionPage = () => {
  return (
    <SplashController>
      <ConcentratedLiquidityProvider>
        <Position />
      </ConcentratedLiquidityProvider>
    </SplashController>
  )
}

const queryParamsSchema = z.object({
  tokenId: z
    .string()
    .refine((val) => val.includes(':'), {
      message: 'TokenId not in the right format',
    })
    .transform((val) => {
      const [chainId, tokenId] = val.split(':')
      return [+chainId, +tokenId] as [ChainId, number]
    }),
})

enum SelectedTab {
  Analytics,
  DecreaseLiq,
  IncreaseLiq,
}

const Position: FC = () => {
  const { address } = useAccount()
  const { query } = useRouter()
  const [invert, setInvert] = useState(false)
  const [tab, setTab] = useState<SelectedTab>(SelectedTab.IncreaseLiq)

  const {
    tokenId: [chainId, tokenId],
  } = queryParamsSchema.parse(query)

  const { data: positionDetails } = useConcentratedLiquidityPositionsFromTokenId({
    chainId,
    tokenId,
  })

  const { data: token0, isLoading: token0Loading } = useToken({ chainId, address: positionDetails?.token0 })
  const { data: token1, isLoading: token1Loading } = useToken({ chainId, address: positionDetails?.token1 })
  const { data: pool } = useConcentratedLiquidityPool({
    chainId,
    token0,
    token1,
    feeAmount: positionDetails?.fee,
  })

  const { data: position } = useConcentratedPositionInfo({
    chainId,
    token0,
    tokenId,
    token1,
  })

  const fiatAmounts = useMemo(() => [tryParseAmount('1', token0), tryParseAmount('1', token1)], [token0, token1])
  const fiatAmountsAsNumber = useTokenAmountDollarValues({ chainId, amounts: fiatAmounts })
  const priceOrdering = getPriceOrderingFromPositionForUI(position)

  const { priceLower, priceUpper, base, quote } = usePriceInverter({
    priceLower: priceOrdering.priceLower,
    priceUpper: priceOrdering.priceUpper,
    base: token0,
    quote: token1,
    invert,
  })

  const outOfRange =
    pool &&
    quote &&
    priceLower &&
    priceUpper &&
    (pool.priceOf(quote).lessThan(priceLower) || pool.priceOf(quote).greaterThan(priceUpper))

  const [minPriceDiff, maxPriceDiff] = useMemo(() => {
    if (!pool || !token0 || !token1 || !priceLower || !priceUpper || !base || !quote) return [0, 0]
    const min = +priceLower?.toFixed(10)
    const cur = +pool.priceOf(quote)?.toFixed(10)
    const max = +priceUpper?.toFixed(10)

    if (!invert) {
      return [-100 * ((max - cur) / max), -100 * ((min - cur) / min)]
    }

    return [((min - cur) / cur) * 100, ((max - cur) / cur) * 100]
  }, [base, invert, pool, priceLower, priceUpper, quote, token0, token1])

  const [_token0, _token1] = useMemo(
    () => [token0 ? unwrapToken(token0) : undefined, token1 ? unwrapToken(token1) : undefined],
    [token0, token1]
  )

  const amounts = useMemo(() => {
    if (positionDetails && positionDetails.fees && _token0 && _token1)
      return [
        Amount.fromRawAmount(_token0, JSBI.BigInt(positionDetails.fees[0])),
        Amount.fromRawAmount(_token1, JSBI.BigInt(positionDetails.fees[1])),
      ]

    return [undefined, undefined]
  }, [_token0, _token1, positionDetails])

  return (
    <SWRConfig>
      <Layout>
        <div className="flex flex-col gap-2">
          <Link href="/" shallow={true}>
            <ArrowLeftIcon width={24} className="dark:text-slate-50 text-gray-900" />
          </Link>
          <h1 className="text-3xl font-semibold mt-2 text-gray-900 dark:text-slate-50">
            {tab === SelectedTab.IncreaseLiq ? 'Increase Liquidity' : 'Decrease Liquidity'}
          </h1>
          <h1 className="text-xl font-medium text-gray-600 dark:text-slate-400">
            {tab === SelectedTab.IncreaseLiq
              ? "You're adding more liquidity to an existing position"
              : "You're remove liquidity from an existing position"}
          </h1>
          <RadioGroup value={tab} onChange={setTab} className="flex gap-2 mt-3 flex-wrap">
            {/*<RadioGroup.Option*/}
            {/*  value={SelectedTab.Analytics}*/}
            {/*  as={Button}*/}
            {/*  startIcon={<ChartBarIcon width={18} height={18} />}*/}
            {/*  variant={tab === SelectedTab.Analytics ? 'outlined' : 'empty'}*/}
            {/*  color={tab === SelectedTab.Analytics ? 'blue' : 'default'}*/}
            {/*>*/}
            {/*  Analytics*/}
            {/*</RadioGroup.Option>*/}
            <RadioGroup.Option
              value={SelectedTab.IncreaseLiq}
              as={Button}
              startIcon={<PlusIcon width={18} height={18} />}
              variant={tab === SelectedTab.IncreaseLiq ? 'outlined' : 'empty'}
              color={tab === SelectedTab.IncreaseLiq ? 'blue' : 'default'}
            >
              Increase Liquidity
            </RadioGroup.Option>{' '}
            <RadioGroup.Option
              value={SelectedTab.DecreaseLiq}
              as={Button}
              startIcon={<MinusIcon width={18} height={18} />}
              variant={tab === SelectedTab.DecreaseLiq ? 'outlined' : 'empty'}
              color={tab === SelectedTab.DecreaseLiq ? 'blue' : 'default'}
            >
              Decrease Liquidity
            </RadioGroup.Option>
          </RadioGroup>
        </div>
        <div className="h-0.5 w-full bg-gray-900/5 dark:bg-slate-200/5 my-10" />
        <div className="flex gap-6 h-[52px]">
          {pool ? (
            <div className="flex min-w-[44px]">
              <Badge
                className="border-2 border-slate-900 rounded-full z-[11] !bottom-0 right-[-15%]"
                position="bottom-right"
                badgeContent={<NetworkIcon chainId={chainId} width={24} height={24} />}
              >
                <Currency.IconList iconWidth={48} iconHeight={48}>
                  <Currency.Icon currency={pool?.token0} />
                  <Currency.Icon currency={pool?.token1} />
                </Currency.IconList>
              </Badge>
            </div>
          ) : (
            <div className="inline-flex">
              <Skeleton.Circle radius={48} />
              <Skeleton.Circle radius={48} style={{ marginLeft: -48 / 3 }} />
            </div>
          )}

          <div className="flex flex-col flex-grow">
            {pool && _token0 && _token1 ? (
              <>
                <h1 className="text-xl text-gray-900 dark:text-slate-50 font-semibold">
                  {_token0.symbol}/{_token1.symbol}
                </h1>
                <p className="font-medium text-gray-700 dark:text-slate-400">Concentrated • {pool.fee / 10000}%</p>
              </>
            ) : (
              <>
                <Skeleton.Text fontSize="text-xl" className="w-full" />
                <Skeleton.Text fontSize="text-base" className="w-full" />
              </>
            )}
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-[404px_auto] gap-10">
          <div className="flex flex-col gap-4">
            <List>
              <List.Label>Deposits</List.Label>
              <List.Control>
                {position?.amount0 && _token0 ? (
                  <List.KeyValue title={`${_token0.symbol}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Currency.Icon currency={_token0} width={18} height={18} />
                        {position.amount0.toSignificant(4)} {_token0.symbol}
                      </div>
                    </div>
                  </List.KeyValue>
                ) : (
                  <List.KeyValue skeleton />
                )}
                {position?.amount1 && _token1 ? (
                  <List.KeyValue title={`${_token1.symbol}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Currency.Icon currency={_token1} width={18} height={18} />
                        {position.amount1.toSignificant(4)} {_token1.symbol}
                      </div>
                    </div>
                  </List.KeyValue>
                ) : (
                  <List.KeyValue skeleton />
                )}
              </List.Control>
            </List>
            <List className="!gap-1">
              <div className="flex justify-between items-center">
                <List.Label>Unclaimed fees</List.Label>
                <ConcentratedLiquidityCollectButton
                  position={position}
                  positionDetails={positionDetails}
                  token0={token0}
                  token1={token1}
                  account={address}
                  chainId={chainId}
                >
                  {({ sendTransaction, isLoading }) => (
                    <Button
                      disabled={isLoading}
                      onClick={() => sendTransaction?.()}
                      size="xs"
                      variant="empty"
                      className="!h-[24px] font-bold"
                    >
                      Collect
                    </Button>
                  )}
                </ConcentratedLiquidityCollectButton>
              </div>
              <List.Control>
                {amounts[0] ? (
                  <List.KeyValue title={`${amounts[0].currency.symbol}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Currency.Icon currency={amounts[0].currency} width={18} height={18} />
                        {amounts[0].toSignificant(4)} {amounts[0].currency.symbol}
                      </div>
                    </div>
                  </List.KeyValue>
                ) : (
                  <List.KeyValue skeleton />
                )}
                {amounts[1] ? (
                  <List.KeyValue title={`${amounts[1].currency.symbol}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Currency.Icon currency={amounts[1].currency} width={18} height={18} />
                        {amounts[1].toSignificant(4)} {amounts[1].currency.symbol}
                      </div>
                    </div>
                  </List.KeyValue>
                ) : (
                  <List.KeyValue skeleton />
                )}
              </List.Control>
            </List>
            <List className="!gap-1">
              <div className="flex items-center justify-between">
                <List.Label>Price Range</List.Label>
                {_token0 && _token1 && (
                  <RadioGroup value={invert} onChange={setInvert} className="flex">
                    <RadioGroup.Option
                      value={true}
                      as={Button}
                      size="xs"
                      color={invert ? 'blue' : 'default'}
                      variant="empty"
                      className="!h-[24px] font-bold"
                    >
                      {_token0.symbol}
                    </RadioGroup.Option>
                    <RadioGroup.Option
                      value={false}
                      as={Button}
                      color={invert ? 'default' : 'blue'}
                      size="xs"
                      variant="empty"
                      className="!h-[24px] font-bold"
                    >
                      {_token1.symbol}
                    </RadioGroup.Option>
                  </RadioGroup>
                )}
              </div>
              <List.Control className="flex flex-col gap-3 p-4">
                <div className="p-4 inline-flex flex-col gap-2 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                  <div className="flex">
                    <div
                      className={classNames(
                        outOfRange ? 'bg-yellow/10' : 'bg-green/10',
                        'px-2 py-1 flex items-center gap-1 rounded-full'
                      )}
                    >
                      <div className={classNames(outOfRange ? 'bg-yellow' : 'bg-green', 'w-3 h-3 rounded-full')} />
                      {outOfRange ? (
                        <span className="text-xs text-yellow-900 dark:text-yellow font-medium">Inactive</span>
                      ) : (
                        <span className="text-xs text-green font-medium">In Range</span>
                      )}
                    </div>
                  </div>
                  {pool && _token0 && _token1 ? (
                    <span className="text-sm text-gray-600 dark:text-slate-200 px-1">
                      <b>
                        1 {invert ? _token1.symbol : _token0.symbol} ={' '}
                        {pool[invert ? 'token1Price' : 'token0Price'].toSignificant(6)}
                      </b>{' '}
                      {invert ? _token0.symbol : _token1.symbol} (${fiatAmountsAsNumber[invert ? 1 : 0].toFixed(2)})
                    </span>
                  ) : (
                    <Skeleton.Text fontSize="text-sm" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 flex flex-col gap-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                    <div className="flex">
                      <div className="px-2 py-1 font-medium text-xs gap-1 rounded-full bg-pink/10 text-pink">
                        Min Price
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {priceLower && pool && _token0 && _token1 ? (
                        <span className="font-medium">
                          {priceLower?.toSignificant(4)} {base?.symbol}
                        </span>
                      ) : (
                        <Skeleton.Text />
                      )}
                      {priceLower && pool && _token0 && _token1 ? (
                        <span className="text-sm text-gray-500">
                          ${(fiatAmountsAsNumber[0] * (1 + minPriceDiff / 100)).toFixed(2)} ({minPriceDiff.toFixed(2)}%)
                        </span>
                      ) : (
                        <Skeleton.Text />
                      )}
                    </div>
                  </div>
                  <div className="p-4 inline-flex flex-col gap-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                    <div className="flex">
                      <div className="px-2 py-1 flex items-center font-medium text-xs gap-1 rounded-full bg-blue/10 text-blue">
                        Max Price
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {priceUpper && pool && _token1 && _token0 ? (
                        <span className="font-medium">
                          {priceUpper?.toSignificant(4)} {base?.symbol}
                        </span>
                      ) : (
                        <Skeleton.Text />
                      )}
                      {priceUpper && pool && _token1 && _token0 ? (
                        <span className="text-sm text-gray-500">
                          ${(fiatAmountsAsNumber[0] * (1 + maxPriceDiff / 100)).toFixed(2)} ({maxPriceDiff.toFixed(2)}%)
                        </span>
                      ) : (
                        <Skeleton.Text />
                      )}
                    </div>
                  </div>
                </div>
              </List.Control>
            </List>
          </div>
          <div className="flex flex-col gap-10 w-full">
            <div className={tab === SelectedTab.Analytics ? 'block' : 'hidden'}>
              <h1 className="text-5xl">Analytics Here</h1>
            </div>
            <div className={tab === SelectedTab.IncreaseLiq ? 'block' : 'hidden'}>
              <div className="flex flex-col gap-3 pt-3">
                <List.Label>Amount</List.Label>
                <ConcentratedLiquidityWidget
                  chainId={chainId}
                  account={address}
                  token0={token0}
                  token1={token1}
                  feeAmount={positionDetails?.fee}
                  tokensLoading={token0Loading || token1Loading}
                  existingPosition={position}
                  tokenId={tokenId}
                />
              </div>
            </div>
            <div className={classNames('pt-3', tab === SelectedTab.DecreaseLiq ? 'block' : 'hidden')}>
              <ConcentratedLiquidityRemoveWidget
                token0={token0}
                token1={token1}
                account={address}
                chainId={chainId}
                position={position}
                positionDetails={positionDetails}
              />
            </div>
          </div>
        </div>
      </Layout>
    </SWRConfig>
  )
}

export default PositionPage
