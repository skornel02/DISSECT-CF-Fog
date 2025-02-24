import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SchemaSimulationModel } from '@/lib/backend';
import { useMemo } from 'react';
import humanizeDuration from 'humanize-duration';

const chartBestValuesConfig = {
  minExecutionTime: {
    label: 'Minimal execution time (ms)',
    color: 'hsl(var(--chart-1))',
  },
  minCost: {
    label: 'Minimal cost',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const chartBestSpecimenConfig = {
  bestExecutionTime: {
    label: 'Fastest execution',
    color: 'hsl(var(--chart-1))',
  },
  minCost: {
    label: 'Cheapest cost',
    color: 'hsl(var(--chart-2))',
  },
  minEnergyConsumption: {
    label: 'Lowest energy consumption',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export default function SimulationTrends({
  data,
}: {
  data: SchemaSimulationModel[];
}) {
  const [timeRange, setTimeRange] = React.useState(-1);

  const validData = useMemo(() => {
    return data.filter(
      (item) =>
        item.result?.executionTime !== undefined &&
        item.result?.executionTime !== 0 &&
        item.result?.executionTime !== -1,
    );
  }, [data]);

  const simulationGrouped = useMemo(() => {
    const groups: { [key: number]: SchemaSimulationModel[] } = {};

    validData.forEach((item, i) => {
      const itemGeneration =
        item.generation === undefined || item.generation === -1
          ? i
          : item.generation;

      if (!groups[itemGeneration]) {
        groups[itemGeneration] = [];
      }
      groups[itemGeneration].push(item);
    });

    return groups;
  }, [validData]);

  const filteredSimulationGrouped = useMemo(() => {
    if (timeRange === -1) {
      return simulationGrouped;
    }

    const generations = Object.keys(simulationGrouped).map((key) =>
      parseInt(key, 10),
    );
    generations.sort((a, b) => a - b);

    const lastGenerations = generations.slice(-timeRange);
    return Object.fromEntries(
      Object.entries(simulationGrouped).filter(([key]) =>
        lastGenerations.includes(parseInt(key, 10)),
      ),
    );
  }, [simulationGrouped, timeRange]);

  const chartBestValuesData = useMemo(() => {
    const result = Object.entries(filteredSimulationGrouped).map(
      ([key, value]) => {
        const minExecutionTime = Math.min(
          ...value.map(
            (item) => item.result?.executionTime ?? Number.MAX_VALUE,
          ),
        );
        const minCost = Math.min(
          ...value.map((item) => item.result?.totalCost ?? Number.MAX_VALUE),
        );
        const minEnergyConsumption = Math.min(
          ...value.map(
            (item) => item.result?.totalEnergyConsumption ?? Number.MAX_VALUE,
          ),
        );

        return {
          generation: parseInt(key, 10),
          minExecutionTime:
            minExecutionTime === Number.MAX_VALUE
              ? undefined
              : minExecutionTime,
          minCost: minCost === Number.MAX_VALUE ? undefined : minCost,
          minEnergyConsumption:
            minEnergyConsumption === Number.MAX_VALUE
              ? undefined
              : minEnergyConsumption,
        };
      },
    );

    return result;
  }, [filteredSimulationGrouped]);

  const minimalExecutionTime = useMemo(() => {
    const min = validData.reduce(
      (acc, item) =>
        acc < item.result!.executionTime ? acc : item.result!.executionTime,
      Number.MAX_VALUE,
    );

    return min === Number.MAX_VALUE ? null : min;
  }, [validData]);

  const minimalCost = useMemo(() => {
    return validData.reduce(
      (acc, item) =>
        acc < item.result!.totalCost ? acc : item.result!.totalCost,
      Number.MAX_VALUE,
    );
  }, [validData]);

  const minimalEnergyConsumption = useMemo(() => {
    return validData.reduce(
      (acc, item) =>
        acc < item.result!.totalEnergyConsumption
          ? acc
          : item.result!.totalEnergyConsumption,
      Number.MAX_VALUE,
    );
  }, [validData]);

  const chartBestSpecimensData = useMemo(() => {
    const bestExecutionTime = validData.filter(
      (item) => item.result?.executionTime === minimalExecutionTime,
    )[0];

    const bestCost = validData.filter(
      (item) => item.result?.totalCost === minimalCost,
    )[0];

    const bestEnergyConsumption = validData.filter(
      (item) =>
        item.result?.totalEnergyConsumption === minimalEnergyConsumption,
    )[0];

    const minCost = Math.log10(minimalCost === 0 ? 1 : minimalCost);
    const minEnergyConsumption = Math.log10(
      minimalEnergyConsumption === 0 ? 1 : minimalEnergyConsumption,
    );

    return [
      minimalExecutionTime
        ? {
            metricName: 'Execution time',
            bestExecutionTime:
              (bestExecutionTime?.result?.executionTime ?? 0) /
              minimalExecutionTime,
            minCost:
              (bestCost?.result?.executionTime ?? 0) / minimalExecutionTime,
            minEnergyConsumption:
              (bestEnergyConsumption?.result?.executionTime ?? 0) /
              minimalExecutionTime,
          }
        : {
            metricName: 'Execution time',
            bestExecutionTime: 0,
            minCost: 0,
            minEnergyConsumption: 0,
          },
      {
        metricName: 'Cost',
        bestExecutionTime:
          Math.log10(bestExecutionTime?.result?.totalCost ?? 0) / minCost,
        minCost: Math.log10(bestCost?.result?.totalCost ?? 0) / minCost,
        minEnergyConsumption:
          Math.log10(bestEnergyConsumption?.result?.totalCost ?? 0) / minCost,
      },
      {
        metricName: 'Energy consumption',
        bestExecutionTime:
          Math.log10(bestExecutionTime?.result?.totalEnergyConsumption ?? 0) /
          minEnergyConsumption,
        minCost:
          Math.log10(bestCost?.result?.totalEnergyConsumption ?? 0) /
          minEnergyConsumption,
        minEnergyConsumption:
          Math.log10(
            bestEnergyConsumption?.result?.totalEnergyConsumption ?? 0,
          ) / minEnergyConsumption,
      },
    ];
  }, [validData, minimalExecutionTime, minimalCost, minimalEnergyConsumption]);

  return (
    <div className="grid grid-cols-2">
      <Card className="col-span-2">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Simulation statistics</CardTitle>
          </div>
          <Select
            value={timeRange.toString()}
            onValueChange={(val) => setTimeRange(parseInt(val))}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select a value">
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
            config={chartBestValuesConfig}
            className="aspect-auto h-[250px] w-full">
            <LineChart data={chartBestValuesData}>
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
                    formatter={(val, name) => {
                      if (name === 'minExecutionTime') {
                        return humanizeDuration(
                          Number(val) * minimalExecutionTime! * 1000 * 60,
                          {
                            round: true,
                          },
                        );
                      }

                      if (name === 'minCost') {
                        return `${val} €`;
                      }

                      return val;
                    }}
                  />
                }
              />

              <YAxis
                yAxisId="left"
                dataKey="minExecutionTime"
                type="number"
                tickFormatter={(val) =>
                  humanizeDuration(Number(val) * 1000 * 60, { round: true })
                }
                width={150}
              />

              <Line
                dataKey="minExecutionTime"
                type="linear"
                stroke="var(--color-minExecutionTime)"
                strokeWidth={2}
                yAxisId="left"
              />

              <YAxis
                yAxisId="right"
                dataKey="minCost"
                type="number"
                orientation="right"
                tickFormatter={(val) => `${val} €`}
              />

              <Line
                dataKey="minCost"
                type="linear"
                stroke="var(--color-minCost)"
                strokeWidth={2}
                yAxisId="right"
              />

              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Best values</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Card className="p-4">
                <CardTitle>Minimal execution time</CardTitle>
                <CardContent>
                  <div className="font-semibold">
                    {humanizeDuration(minimalExecutionTime! * 1000 * 60, {
                      round: true,
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="p-4">
                <CardTitle>Minimal cost</CardTitle>
                <CardContent>
                  <div className="font-semibold">{minimalCost.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="p-4">
                <CardTitle>Minimal energy consumption</CardTitle>
                <CardContent>
                  <div className="font-semibold">
                    {minimalEnergyConsumption.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Best specimens</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartBestSpecimenConfig}
            className="aspect-auto h-[250px] w-full">
            <RadarChart data={chartBestSpecimensData}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarAngleAxis dataKey="metricName" />

              <PolarGrid />

              <PolarRadiusAxis tick={false} />

              <Radar
                dataKey="bestExecutionTime"
                fill="var(--color-bestExecutionTime)"
                opacity={0.6}
              />
              <Radar
                dataKey="minCost"
                fill="var(--color-minCost)"
                opacity={0.6}
              />

              <Radar
                dataKey="minEnergyConsumption"
                fill="var(--color-minEnergyConsumption)"
                opacity={0.6}
              />

              <ChartLegend content={<ChartLegendContent />} />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
