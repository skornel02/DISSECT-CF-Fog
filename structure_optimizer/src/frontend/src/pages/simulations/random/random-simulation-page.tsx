import { Button } from '@/components/ui/button.tsx';
import { useCallback, useState } from 'react';
import { client } from '@/lib/backend-client.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { useNavigate } from 'react-router-dom';
import { SchemaSimulationStructure } from '@/lib/backend';
import StructureEditor from '@/components/structure/StructureEditor';

export default function RandomSimulationPage() {
  const { toast } = useToast();
  // navigate with router
  const navigate = useNavigate();

  const [structure, setStructure] = useState<SchemaSimulationStructure>({});

  const startSimulation = useCallback(
    async (structure: SchemaSimulationStructure) => {
      const { data, response } = await client.POST('/api/simulations/random', {
        body: structure,
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
      <Button onClick={() => startSimulation(structure)}>
        Start simulation
      </Button>
    </div>
  );
}
