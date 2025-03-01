import StructureEditor from '@/components/structure/StructureEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { SchemaGoalSettings, SchemaSimulationStructure } from '@/lib/backend';
import { client } from '@/lib/backend-client';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GeneticSimulationPage() {
  const navigate = useNavigate();

  const [structure, setStructure] = useState<SchemaSimulationStructure>({});
  const [goalSettings, setGoalSettings] = useState<SchemaGoalSettings>({
    timeWeight: 1,
    energyWeight: 0,
    priceWeight: 0,
    minimizingCost: true,
    useRandom: false,
    populationSize: 20,
    maximumGenerations: 100,
    maximumPrice: 10000,
  });

  const startSimulation = useCallback(
    async (
      structure: SchemaSimulationStructure,
      goalSettings: SchemaGoalSettings,
    ) => {
      const { data, response } = await client.POST('/api/simulations/genetic', {
        body: {
          structure,
          // goalSettings: {
          //   timeWeight: 1,
          //   energyWeight: 0,
          //   priceWeight: 0,
          //   minimizingCost: false,
          //   useRandom: false,
          //   populationSize: 20
          // },
          goalSettings,
        },
      });

      if (!response.ok || !data) {
        toast({
          title: 'Failed to start simulation',
          variant: 'destructive',
        });

        return;
      }

      toast({
        title: 'Simulation started',
      });

      navigate(`/simulations/${data.guid}`);
    },
    [],
  );

  return (
    <div className="p-4">
      <h1 className="mb-2 text-xl">Random Simulation</h1>
      <StructureEditor handleChange={setStructure} />
      <div className="grid grid-cols-4 grid-flow-row mt-2">
        <div className="grid grid-cols-2 gap-2 items-center min-w-[150px]">
          <Label htmlFor="timeWeight">Time weight</Label>
          <Input
            id="timeWeight"
            type="number"
            value={goalSettings.timeWeight}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                timeWeight: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center min-w-[150px]">
          <Label htmlFor="energyWeight">Energy weight</Label>
          <Input
            id="energyWeight"
            type="number"
            value={goalSettings.energyWeight}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                energyWeight: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center min-w-[150px]">
          <Label htmlFor="priceWeight">Price weight</Label>
          <Input
            id="priceWeight"
            type="number"
            value={goalSettings.priceWeight}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                priceWeight: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label htmlFor='minimize'>Minimize cost</Label>
          <Input
            id='minimize'
            type="checkbox"
            checked={goalSettings.minimizingCost}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                minimizingCost: e.target.checked,
              })
            }
            className='h-4'
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label htmlFor='random'>Use random</Label>
          <Input
            id='random'
            type="checkbox"
            checked={goalSettings.useRandom}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                useRandom: e.target.checked,
              })
            }
            className='h-4'
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label>Population size</Label>
          <Input
            type="number"
            value={goalSettings.populationSize}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                populationSize: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label>Maximum generations</Label>
          <Input
            type="number"
            value={goalSettings.maximumGenerations}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                maximumGenerations: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label>Maximum price</Label>
          <Input
            type="number"
            value={goalSettings.maximumPrice}
            onChange={(e) =>
              setGoalSettings({
                ...goalSettings,
                maximumPrice: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <Button onClick={() => startSimulation(structure, goalSettings)}>
          Start Simulation
        </Button>
      </div>
    </div>
  );
}
