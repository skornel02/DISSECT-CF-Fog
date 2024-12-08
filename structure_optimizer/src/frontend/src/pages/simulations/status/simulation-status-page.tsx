import { useParams } from 'react-router-dom';
import { SchemaSimulationStatusDto } from '@/lib/backend';
import { useCallback, useEffect, useState } from 'react';
import { client } from '@/lib/backend-client.ts';
import SimulationModelTable from '@/pages/simulations/status/components/simulation-model-table.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useCountdown } from 'usehooks-ts';
import { Progress } from '@/components/ui/progress.tsx';
import SimulationTrends from './components/simulation-trends';

export default function SimulationStatusPage() {
  const { id } = useParams();

  const [simulation, setSimulation] = useState<
    SchemaSimulationStatusDto | undefined | null
  >(undefined);

  const [eTag, setETag] = useState<string | null>(null);

  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 5,
      intervalMs: 750,
    });

  const refreshStatus = useCallback(async () => {
    if (!id) {
      return;
    }

    const { data, response } = await client.GET('/api/simulations/{id}', {
      params: {
        path: {
          id,
        },
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
    }
  }, [id, eTag]);

  useEffect(() => {
    // noinspection JSIgnoredPromiseFromCall
    refreshStatus();
    startCountdown();
  }, []);

  useEffect(() => {
    if (simulation?.isRunning === false) {
      stopCountdown();
    }

    if (count === 0) {
      refreshStatus().then(() => {
        resetCountdown();
        startCountdown();
      });
    }
  }, [count, simulation?.isRunning]);

  if (simulation === undefined) {
    return <div>Loading...</div>;
  }

  if (simulation === null) {
    return <div>Simulation not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between align-center">
        <h1 className="text-xl text-center ml-4 flex-grow-1">
          Simulation #{id}
        </h1>
        <div>
          {simulation.isRunning && (
            <Button onClick={refreshStatus}>Refresh</Button>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center mt-4">
        {simulation.isRunning ? (
          <Progress value={count * 20} />
        ) : (
          <span className="mb-4">Simulation finished</span>
        )}
      </div>

      <h2 className="mb-4 text-center mt-4">Trends</h2>

      <SimulationTrends data={simulation.simulations} />

      <h2 className="mb-4 text-center mt-4">Simulations</h2>

      <SimulationModelTable data={simulation.simulations} />
    </div>
  );
}
