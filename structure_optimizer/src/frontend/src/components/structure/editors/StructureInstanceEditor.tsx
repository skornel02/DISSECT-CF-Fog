import { SchemaSimulationStructure } from '@/lib/backend';

export default function StructureInstanceEditor({
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
