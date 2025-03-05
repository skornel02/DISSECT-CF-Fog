import * as React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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
import {
  SchemaGoalSettings,
  SchemaSimulationComputerInstance,
  SchemaSimulationModel,
} from '@/lib/backend';
import { useMemo } from 'react';
import humanizeDuration from 'humanize-duration';
import { Leaf, ReceiptEuro, Star, Timer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';

const chartsFitnessConfig = {
  fitness: {
    label: 'Fitness',
    color: 'hsl(var(--chart-2))',
    icon: () => <Star color="hsl(var(--chart-2))" />,
  },
  price: {
    label: 'Price',
    color: 'hsl(var(--chart-3))',
    icon: () => <ReceiptEuro color="hsl(var(--chart-3))" />,
  },
  executionTime: {
    label: 'Execution time',
    color: 'hsl(var(--chart-1))',
    icon: () => <Timer color="hsl(var(--chart-1))" />,
  },
  energyConsumption: {
    label: 'Energy consumption (kWh)',
    color: 'hsl(var(--chart-4))',
    icon: () => <Leaf color="hsl(var(--chart-4))" />,
  },
} satisfies ChartConfig;

// const chartBestSpecimenConfig = {
//   bestExecutionTime: {
//     label: 'Fastest execution',
//     color: 'hsl(var(--chart-1))',
//   },
//   minCost: {
//     label: 'Cheapest cost',
//     color: 'hsl(var(--chart-2))',
//   },
//   minEnergyConsumption: {
//     label: 'Lowest energy consumption',
//     color: 'hsl(var(--chart-3))',
//   },
// } satisfies ChartConfig;

export default function SimulationTrends({
  data,
  goalSettings,
}: {
  data: SchemaSimulationModel[];
  goalSettings?: SchemaGoalSettings;
}) {
  const [timeRange, setTimeRange] = React.useState(-1);
  const [selectedGeneration, setSelectedGeneration] = React.useState(null);

  const minimizingCost = useMemo(
    () => goalSettings?.minimizingCost ?? true,
    [goalSettings],
  );

  const bestValueSelector = useMemo(
    () => (minimizingCost ? Math.min : Math.max),
    [minimizingCost],
  );

  const simulations = useMemo(() => {
    return data.filter(
      (item) =>
        (item.result?.totalTasks ?? 0) > 0 &&
        item.result?.totalTasks === item.result?.completedTasks,
    );
  }, [data]);

  const simulationsGrouped = useMemo(() => {
    const groups: { [key: number]: SchemaSimulationModel[] } = {};

    simulations.forEach((item, i) => {
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
  }, [simulations]);

  const latestGeneration = useMemo(() => {
    const generations = Object.keys(simulationsGrouped).map((key) =>
      parseInt(key, 10),
    );

    generations.sort((a, b) => a - b);

    return generations[generations.length - 1];
  }, [simulationsGrouped]);

  const selectedSimulationGroups = useMemo(() => {
    if (timeRange === -1) {
      return simulationsGrouped;
    }

    const generations = Object.keys(simulationsGrouped).map((key) =>
      parseInt(key, 10),
    );
    generations.sort((a, b) => a - b);

    const lastGenerations = generations.slice(-timeRange);
    return Object.fromEntries(
      Object.entries(simulationsGrouped).filter(([key]) =>
        lastGenerations.includes(parseInt(key, 10)),
      ),
    );
  }, [simulationsGrouped, timeRange]);

  const chartFitnessData = useMemo(() => {
    const result = Object.entries(selectedSimulationGroups).map(
      ([key, value]) => {
        const bestFitness = bestValueSelector(
          ...value.map(
            // Use fitness if available, otherwise use execution time
            (item) =>
              (goalSettings ? item.fitness : item.result?.executionTime) ??
              Number.MAX_VALUE,
          ),
        );

        const valueWithBestFitness = value.find((item) =>
          goalSettings
            ? item.fitness === bestFitness
            : item.result?.executionTime === bestFitness,
        );

        let price = valueWithBestFitness?.result?.totalCost;
        let executionTime = valueWithBestFitness?.result?.executionTime;
        let energyConsumption =
          valueWithBestFitness?.result?.totalEnergyConsumption;

        if (goalSettings?.priceWeight && price) {
          price = price * goalSettings.priceWeight;
        }

        if (
          valueWithBestFitness?.pricePenalty &&
          price &&
          valueWithBestFitness.pricePenalty > 1
        ) {
          if (goalSettings?.minimizingCost) {
            price = price * valueWithBestFitness.pricePenalty;
          } else {
            price = price / valueWithBestFitness.pricePenalty;
          }
        }

        if (goalSettings?.timeWeight && executionTime) {
          executionTime = executionTime * goalSettings.timeWeight;
        }

        if (goalSettings?.energyWeight && energyConsumption) {
          energyConsumption = energyConsumption * goalSettings.energyWeight;
        }

        return {
          generation: parseInt(key, 10),
          fitness: bestFitness,
          price: price,
          executionTime: executionTime,
          energyConsumption: energyConsumption,
        };
      },
    );

    return result;
  }, [selectedSimulationGroups, goalSettings, bestValueSelector]);

  const selectedBestSpecimen = useMemo(() => {
    const generation = selectedGeneration ?? latestGeneration;

    const selectedSpecimens = selectedSimulationGroups[generation];

    if (!selectedSpecimens) {
      return null;
    }

    if (goalSettings) {
      selectedSpecimens.sort((a, b) => {
        return (a.fitness ?? 0) - (b.fitness ?? 0);
      });
    } else {
      selectedSpecimens.sort((a, b) => {
        return (a.result?.executionTime ?? 0) - (b.result?.executionTime ?? 0);
      });
    }

    if (!(goalSettings?.minimizingCost ?? true)) {
      selectedSpecimens.reverse();
    }

    return selectedSpecimens[0];
  }, [
    selectedSimulationGroups,
    goalSettings,
    selectedGeneration,
    latestGeneration,
  ]);

  const selectedBestSpecimenInstances = useMemo(() => {
    const instances = selectedBestSpecimen?.instances ?? [];

    const regionGroup: Record<string, SchemaSimulationComputerInstance[]> = {};

    for (const instance of instances) {
      if (instance.count === 0) {
        continue;
      }

      if (!regionGroup[instance.region!]) {
        regionGroup[instance.region!] = [];
      }

      regionGroup[instance.region!].push(instance);
    }

    return regionGroup;
  }, [selectedBestSpecimen]);

  if (simulations.length === 0) {
    return (
      <div className="grid grid-cols-2">
        <Skeleton className="col-span-2 h-[50vh]" />

        <Skeleton className="h-[50vh]" />
        <Skeleton className="h-[50vh]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2">
      <Card className="">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Simulation status</CardTitle>
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
            config={chartsFitnessConfig}
            className="aspect-auto h-[250px] w-full">
            <ComposedChart data={chartFitnessData}>
              <CartesianGrid />
              <XAxis
                dataKey="generation"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    onRender={(payload) => {
                      if (!Array.isArray(payload)) {
                        return;
                      }

                      if (payload.length === 0) {
                        setSelectedGeneration(null);
                      } else if (
                        typeof payload[0]?.payload?.generation === 'number'
                      ) {
                        setSelectedGeneration(payload[0].payload.generation);
                      }
                    }}
                  />
                }
                formatter={(val, name) => {
                  if (name === 'executionTime' && typeof val === 'number') {
                    const realTime = val / (goalSettings?.timeWeight ?? 1);

                    return humanizeDuration(realTime, { round: false });
                  }

                  if (name === 'price' && typeof val === 'number') {
                    const realPrice = val / (goalSettings?.priceWeight ?? 1);

                    return `${realPrice.toPrecision(6)} €`;
                  }

                  if (name === 'energyConsumption' && typeof val === 'number') {
                    const realEnergy = val / (goalSettings?.energyWeight ?? 1);

                    return `${realEnergy.toPrecision(6)} kWh`;
                  }

                  return val;
                }}
                trigger="hover"
              />

              <YAxis
                yAxisId="left"
                dataKey="fitness"
                type="number"
                width={150}
              />

              {(goalSettings?.timeWeight ?? 0) > 0 && (
                <Area
                  dataKey="executionTime"
                  stackId={1}
                  type="linear"
                  stroke="var(--color-executionTime)"
                  strokeWidth={2}
                  fill="var(--color-executionTime)"
                  yAxisId="left"
                />
              )}

              {(goalSettings?.priceWeight ?? 0) > 0 && (
                <Area
                  dataKey="price"
                  stackId={1}
                  type="linear"
                  stroke="var(--color-price)"
                  strokeWidth={2}
                  fill="var(--color-price)"
                  yAxisId="left"
                />
              )}

              {(goalSettings?.energyWeight ?? 0) > 0 && (
                <Area
                  dataKey="energyConsumption"
                  stackId={1}
                  type="linear"
                  stroke="var(--color-energyConsumption)"
                  strokeWidth={2}
                  fill="var(--color-energyConsumption)"
                  yAxisId="left"
                />
              )}

              <Line
                dataKey="fitness"
                type="linear"
                stroke="var(--color-fitness)"
                strokeWidth={2}
                yAxisId="left"
              />

              <ChartLegend content={<ChartLegendContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="row-span-2">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Structure</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-2 pt-4 sm:px-6 sm:pt-6">
          {Object.keys(selectedBestSpecimenInstances).length > 0 ? (
            <MapContainer
              center={[0, 0]}
              zoom={2}
              scrollWheelZoom={true}
              className="h-[500px]">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {Object.entries(selectedBestSpecimenInstances).map(
                ([region, instances]) => (
                  <Marker
                    position={[
                      instances[0].latitude!,
                      instances[0].longitude!,
                    ]}>
                    <Tooltip
                      direction="bottom"
                      offset={[-15, 25]}
                      opacity={1}
                      permanent>
                      <div>{region}:</div>
                      {instances.map((instance, i) => (
                        <div key={`instance-${i}`}>
                          {instance.computerType} ({instance.count})
                        </div>
                      ))}
                    </Tooltip>
                  </Marker>
                ),
              )}
            </MapContainer>
          ) : (
            <div className="text-center">No data available</div>
          )}
        </CardContent>
      </Card>
      <Card className="">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Best specimen</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-2 pt-4 sm:px-6 sm:pt-6">
          {selectedBestSpecimen ? (
            <>
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label>Generation</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <span>{selectedBestSpecimen.generation}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label>Fitness</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Star color="hsl(var(--chart-2))" />
                  <span>{selectedBestSpecimen.fitness}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label>Execution time</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Timer color="hsl(var(--chart-1))" />
                  <span>
                    {selectedBestSpecimen.result?.executionTime
                      ? humanizeDuration(
                          selectedBestSpecimen.result.executionTime,
                          {
                            round: false,
                          },
                        )
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label>Cost</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <ReceiptEuro color="hsl(var(--chart-3))" />
                  <span>
                    {selectedBestSpecimen.result?.totalCost
                      ? `${selectedBestSpecimen.result.totalCost.toPrecision(6)} €`
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label>Energy consumption</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Leaf color="hsl(var(--chart-4))" />
                  <span>
                    {selectedBestSpecimen.result?.totalEnergyConsumption
                      ? `${selectedBestSpecimen.result.totalEnergyConsumption.toPrecision(6)} kWh`
                      : 'N/A'}
                  </span>
                </div>
              </div>
              {selectedBestSpecimen.pricePenalty && (
                <div className="grid grid-cols-3 gap-4 items-center">
                  <Label>Price penalty</Label>
                  <div className="col-span-2 flex items-center gap-2">
                    <Leaf color="hsl(var(--chart-4))" />
                    <span>{selectedBestSpecimen.pricePenalty}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label>Total tasks</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Leaf color="hsl(var(--chart-4))" />
                  <span>{selectedBestSpecimen.result?.totalTasks}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">No data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
