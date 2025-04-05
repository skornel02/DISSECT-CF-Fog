import { SchemaSimulationStructure } from '@/lib/backend';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StructureLatencyEditor from './editors/StructureLatencyEditor';
import StructureRegionEditor from './editors/StructureRegionEditor';
import StructureSaveLoad from './editors/StructureSaveLoad';
import StructureComputerTypeEditor from './editors/StructureComputerTypeEditor';
import StructureInstanceEditor from './editors/StructureInstanceEditor';
import { setItem, getItem } from 'localforage';

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
    getItem('structure', (_, value) => {
      if (value) {
        console.log('Loaded structure from local storage!');
        setStructure(value);
      }
    });
  }, []);

  useEffect(() => {
    handleChange(structure);

    async function saveStructure() {
      await setItem('structure', structure);
    }

    saveStructure();
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
        <TabsContent value="computerTypes">
          <StructureComputerTypeEditor {...{ structure, setStructure }} />
        </TabsContent>
        <TabsContent value="instance">
          <StructureInstanceEditor {...{ structure, setStructure }} />
        </TabsContent>
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
