import StructureEditor from "@/components/structure/StructureEditor";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { SchemaSimulationStructure } from "@/lib/backend";
import { client } from "@/lib/backend-client";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GeneticSimulationPage() {
  const navigate = useNavigate();

  const [structure, setStructure] = useState<SchemaSimulationStructure>({});

  const startSimulation = useCallback(
    async (structure: SchemaSimulationStructure) => {
      const { data, response } = await client.POST('/api/simulations/genetic', {
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
