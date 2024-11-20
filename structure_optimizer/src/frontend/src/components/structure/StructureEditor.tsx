import { SchemaSimulationStructure } from '@/lib/backend';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StructureLatencyEditor from './editors/StructureLatencyEditor';
import StructureRegionEditor from './editors/StructureRegionEditor';
import StructureSaveLoad from './editors/StructureSaveLoad';

export default function StructureEditor({
  handleChange,
}: {
  handleChange: (structure: SchemaSimulationStructure) => void;
}) {
  const [structure, setStructure] = useState<SchemaSimulationStructure>({
    regions: [],
    computerTypes: [],
    instances: [],
    regionConnections: [],
    defaultLatency: 100,
  });

  useEffect(() => {
    handleChange(structure);
  }, [structure]);

  return (
    <>
      <h2>Structure editor</h2>
      <Tabs defaultValue="regions" className="w-full">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="computerTypes">Computer types</TabsTrigger>
          <TabsTrigger value="instance">Computer instances</TabsTrigger>
          <TabsTrigger value="latency">Region latency</TabsTrigger>
          <TabsTrigger value="saveload">Save/Load</TabsTrigger>
        </TabsList>
        <TabsContent value="regions">
          <StructureRegionEditor {...{ structure, setStructure }} />
        </TabsContent>
        <TabsContent value="computerTypes"></TabsContent>
        <TabsContent value="instance"></TabsContent>
        <TabsContent value="latency">
          <StructureLatencyEditor {...{ structure, setStructure }} />
        </TabsContent>
        <TabsContent value="saveload">
          <StructureSaveLoad {...{ structure, setStructure }} />
        </TabsContent>
      </Tabs>
    </>
  );
}
