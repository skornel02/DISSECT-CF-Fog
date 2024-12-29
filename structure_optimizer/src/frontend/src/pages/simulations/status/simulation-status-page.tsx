import { useParams } from 'react-router-dom';
import { SchemaSimulationModel, SchemaSimulationStatusDto } from '@/lib/backend';
import { useCallback, useEffect, useState } from 'react';
import { client } from '@/lib/backend-client.ts';
import SimulationModelTable from '@/pages/simulations/status/components/simulation-model-table.tsx';
import { Button } from '@/components/ui/button.tsx';
import SimulationTrends from './components/simulation-trends';
import { useThrottledValue } from '@mantine/hooks';

export default function SimulationStatusPage() {
  const { id } = useParams();

  const [simulation, setSimulation] = useState<
    SchemaSimulationStatusDto | undefined | null
  >(undefined);

  const [eTag, setETag] = useState<string | null>(null);
  const [lastUpdatedVal, setLastUpdated] = useState<string | undefined>(undefined);
  const lastUpdated = useThrottledValue(lastUpdatedVal, 500);

  const [simulations, setSimulations] = useState<SchemaSimulationModel[]>([]);

  const refreshStatus = useCallback(async (eTag:string | null, lastUpdated: string | undefined) => {
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
        }
      },
      headers: {
        'If-None-Match': eTag,
      }
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

      setSimulations((prev) => ([
        ...prev.filter((item) => item.status === 'Finished'),
        ...data.simulations
      ]))
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (!simulation || simulation?.isRunning) {
      // noinspection JSIgnoredPromiseFromCall
      refreshStatus(eTag, lastUpdated);

      interval = setInterval(() => {
        // noinspection JSIgnoredPromiseFromCall
        refreshStatus(eTag, lastUpdated);
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [refreshStatus, lastUpdated]);

  if (simulation === undefined) {
    return <div>Loading...</div>;
  }

  if (simulation === null) {
    return <div>Simulation not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between align-center">
        <div>
          {simulation.isRunning && (
            <Button onClick={() => refreshStatus(eTag, lastUpdated)}>Refresh</Button>
          )}
        </div>
      </div>

      <h2 className="mb-4 text-center mt-4">Trends</h2>

      <SimulationTrends data={simulations} />

      <h2 className="mb-4 text-center mt-4">Simulations</h2>

      <SimulationModelTable data={simulations} />
    </div>
  );
}
