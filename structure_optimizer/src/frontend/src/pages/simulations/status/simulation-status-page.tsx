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

  const [eTag, setETag] = useState<string | null>(null);
  const [lastUpdatedVal, setLastUpdated] = useState<string | undefined>(
    undefined,
  );

  const [simulations, setSimulations] = useState<SchemaSimulationModel[]>([]);

  const refreshStatus = useCallback(
    async (eTag: string | null, lastUpdated: string | undefined) => {
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
        setETag(response.headers.get('Etag'));

        const nextLastUpdated = response.headers.get('X-Last-Updated');
        if (nextLastUpdated && nextLastUpdated !== lastUpdated) {
          setLastUpdated(nextLastUpdated);
        }

        setSimulations((prev) => [
          ...prev.filter((item) => item.status === 'Finished'),
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
    refreshStatus(eTag, lastUpdatedVal);
  }, []);

  if (simulation === undefined) {
    return <div>Loading...</div>;
  }

  if (simulation === null) {
    return <div>Simulation not found</div>;
  }

  return (
    <div className="flex-grow overflow-clip">
      <Tabs defaultValue="stats" className="h-full flex flex-col">
        <TabsList className="w-full flex">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="data">Simulation data</TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="flex-grow">
          <SimulationTrends data={simulations} />
        </TabsContent>
        <TabsContent value="data" className="flex-grow">
          <SimulationModelTable data={simulations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
