import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SchemaSimulationStructure } from '@/lib/backend';

export default function StructureLatencyEditor({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure,
  ) => void;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Default latency between regions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="defaultLatency">Latency in ms</Label>
            <Input
              type="number"
              id="defaultLatency"
              min={0}
              placeholder="10"
              value={structure.defaultLatency}
              onChange={(val) =>
                setStructure((_) => ({
                  ..._,
                  defaultLatency: parseInt(val.target.value),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
