import { useParams } from 'react-router-dom';
import {
  SchemaSimulationModel,
  SchemaSimulationStatusDto,
} from '@/lib/backend';
import { useCallback, useEffect, useState } from 'react';
import { client } from '@/lib/backend-client.ts';
import SimulationModelTable from '@/pages/simulations/status/components/simulation-model-table.tsx';
import SimulationTrends from './components/simulation-trends';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInterval } from 'usehooks-ts';

export default function SimulationStatusPage() {
  const { id } = useParams();

  const [simulation, setSimulation] = useState<
    SchemaSimulationStatusDto | undefined | null
  >(undefined);

  const [eTag, setETag] = useState<string | undefined>(undefined);
  const [lastUpdatedVal, setLastUpdated] = useState<string | undefined>(
    undefined,
  );

  const [simulations, setSimulations] = useState<SchemaSimulationModel[]>([]);

  const refreshStatus = useCallback(
    async (eTag?: string | undefined, lastUpdated?: string | undefined) => {
      if (!id) {
        return;
      }

      const { data, response } = await client.GET('/api/simulations/{id}', {
        params: {
          path: {
            id,
          },
          query: {
            lastUpdated,
          },
        },
        headers: {
          'If-None-Match': eTag,
        },
      });

      if (response.status === 304) {
        // Not modified
        return;
      } else if (!response.ok || !data) {
        setSimulation(null);
      } else {
        setSimulation(data);
        setETag(response.headers.get('Etag') ?? undefined);

        const nextLastUpdated = response.headers.get('X-Last-Updated');
        if (nextLastUpdated && nextLastUpdated !== lastUpdated) {
          setLastUpdated(nextLastUpdated);
        }

        setSimulations((prev) => [
          ...prev.filter((item) => !data.simulations.some((s) => s.id === item.id)),
          ...data.simulations,
        ]);
      }
    },
    [id],
  );

  useInterval(
    () => {
      refreshStatus(eTag, lastUpdatedVal);
    },
    simulation?.isRunning ? 1000 : null,
  );

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus, simulation?.isRunning]);

  if (simulation === null) {
    return <div>Simulation not found</div>;
  }

  console.log(simulation);

  return (
    <div className="flex-grow overflow-clip">
      <div className="fixed top-0 left-0 right-0 h-1">
        {simulation?.isRunning && (
          <div className="h-1 bg-blue-500 animate-pulse"></div>
        )}
      </div>
      <Tabs defaultValue="stats" className="h-full flex flex-col">
        <TabsList className="w-full flex">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="data">Simulation data</TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="flex-grow">
          <SimulationTrends data={simulations} />
        </TabsContent>
        <TabsContent value="data" className="flex-grow">
          <SimulationModelTable data={simulations} running={simulation?.isRunning ?? true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
