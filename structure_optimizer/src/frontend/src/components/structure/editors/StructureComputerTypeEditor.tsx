import { SchemaSimulationStructure } from '@/lib/backend';

export default function StructureComputerTypeEditor({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure,
  ) => void;
}) {
  return <></>;
}
