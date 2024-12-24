import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SchemaSimulationModel } from "@/lib/backend"
import { useMemo } from "react"

const chartConfig = {
  minExecutionTime: {
    label: "Minimal Execution Time",
  },
  minCost: {
    label: "Minimal Cost",
  },
  minEnergyConsumption: {
    label: "Minimal Energy Consumption",
  },
} satisfies ChartConfig

export default function SimulationTrends({
  data,
}: {
  data: SchemaSimulationModel[];
}) {
  const [timeRange, setTimeRange] = React.useState(-1);

  const simulationGrouped = useMemo(() => {
    const groups: { [key: number]: SchemaSimulationModel[] } = {};

    data.forEach((item) => {
      if (!item.result || item.result.executionTime === undefined || item.result.executionTime === -1) {
        return;
      }

      const itemGeneration = item.generation ?? -1
      if (!groups[itemGeneration]) {
        groups[itemGeneration] = []
      }
      groups[itemGeneration].push(item)
    })

    return groups;
  }, [data]);

  const filteredSimulationGrouped = useMemo(() => {
    if (timeRange === -1) {
      return simulationGrouped;
    }

    const generations = Object.keys(simulationGrouped).map((key) => parseInt(key, 10));
    generations.sort((a, b) => a - b);

    const lastGenerations = generations.slice(-timeRange);
    return Object.fromEntries(
      Object.entries(simulationGrouped).filter(([key]) => lastGenerations.includes(parseInt(key, 10)))
    );
  }, [simulationGrouped, timeRange]);

  const chartData = useMemo(() => {

    const result = Object.entries(filteredSimulationGrouped).map(([key, value]) => {
      const minExecutionTime = Math.min(...value.map((item) => item.result?.executionTime ?? Number.MAX_VALUE));
      const minCost = Math.min(...value.map((item) => item.result?.totalCost ?? Number.MAX_VALUE));
      const minEnergyConsumption = Math.min(...value.map((item) => item.result?.totalEnergyConsumption ?? Number.MAX_VALUE));
      

      return {
        generation: parseInt(key, 10),
        minExecutionTime: minExecutionTime === Number.MAX_VALUE ? undefined : minExecutionTime,
        minCost: minCost === Number.MAX_VALUE ? undefined : minCost,
        minEnergyConsumption: minEnergyConsumption === Number.MAX_VALUE ? undefined : minEnergyConsumption,
      };
    });

    return result;

  }, [filteredSimulationGrouped]);



  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Simulation trends - Interactive</CardTitle>
          <CardDescription>
            Showing the performance of the running simulation by generation
          </CardDescription>
        </div>
        <Select value={timeRange.toString()} onValueChange={(val) => setTimeRange(parseInt(val))}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="-1" className="rounded-lg">
              All generations
            </SelectItem>
            <SelectItem value="25" className="rounded-lg">
              Last 25 generations
            </SelectItem>
            <SelectItem value="10" className="rounded-lg">
              Last 10 generations
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="generation"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return "Generation " + value;
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="minExecutionTime"
              type="monotone"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
            {/* <Area
              dataKey="minCost"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="minEnergyConsumption"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            /> */}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
