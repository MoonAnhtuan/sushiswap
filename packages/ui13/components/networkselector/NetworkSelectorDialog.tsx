'use client'

import { Popover } from '@headlessui/react'
import chains from '@sushiswap/chain'
import classNames from 'classnames'
import React, { FC, useState } from 'react'

import { Dialog } from '../dialog'
import { NetworkIcon } from '../icons'
import { Search } from '../input/Search'
import { NetworkSelectorProps } from './index'

export const NetworkSelectorDialog: FC<Omit<NetworkSelectorProps, 'variant'>> = ({ networks, onSelect, children }) => {
  const [query, setQuery] = useState<string>('')

  return (
    <Popover>
      {({ open, close }) => (
        <>
          {typeof children === 'function' ? children({ open, close }) : children}
          <Dialog open={open} onClose={() => close()}>
            <Dialog.Content className="flex flex-col gap-2 scroll sm:overflow-hidden !pb-0 !h-[75vh] sm:!h-[640px]">
              <Popover.Panel>
                <Search id="" value={query} loading={false} onChange={setQuery} />
                <div className="h-full scroll overflow-auto pb-3">
                  {networks
                    .filter((el) => (query ? chains[el].name.toLowerCase().includes(query.toLowerCase()) : Boolean))
                    .map((el) => (
                      <button
                        onClick={() => onSelect(el, close)}
                        key={el}
                        className={classNames(
                          'w-full group hover:bg-white hover:dark:bg-slate-800 px-2.5 flex rounded-lg justify-between gap-2 items-center cursor-pointer transform-all h-[40px]'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <NetworkIcon
                            type="naked"
                            chainId={el}
                            width={24}
                            height={24}
                            className="text-gray-600 group-hover:text-gray-900 dark:text-slate-50"
                          />
                          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900 dark:text-slate-300 group-hover:dark:text-slate-50">
                            {chains[el].name}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </Popover.Panel>
            </Dialog.Content>
          </Dialog>
        </>
      )}
    </Popover>
  )
}
