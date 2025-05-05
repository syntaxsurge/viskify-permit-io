'use client'

import React from 'react'

import { Pie as RePie, PieChart as RePieChart, Cell } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/charts/chart'
import { cn } from '@/lib/utils'

interface PieChartProps<D extends Record<string, any> = any> {
  data: D[]
  dataKey: keyof D
  nameKey: keyof D
  config: ChartConfig
  className?: string
}

function sliceColour(sliceKey: string, cfg: ChartConfig): string | undefined {
  const entry = cfg[sliceKey]
  if (!entry) return undefined
  if ('color' in entry && entry.color) return entry.color
  return `var(--color-${sliceKey})`
}

export function PieChart<D extends Record<string, any> = any>({
  data,
  dataKey,
  nameKey,
  config,
  className,
}: PieChartProps<D>) {
  return (
    <ChartContainer
      config={config}
      className={cn(
        '[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[300px] pb-0',
        className,
      )}
    >
      <RePieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <RePie data={data} dataKey={dataKey as string} nameKey={nameKey as string} label>
          {data.map((entry, index) => {
            const key = String(entry[nameKey]).toLowerCase()
            const fill = sliceColour(key, config) ?? '#808080'
            return <Cell key={`cell-${index}`} fill={fill} />
          })}
        </RePie>
        <ChartLegend
          content={<ChartLegendContent nameKey={nameKey as string} />}
          className='-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center'
        />
      </RePieChart>
    </ChartContainer>
  )
}
