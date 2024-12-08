import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { SchemaSimulationStructure } from "@/lib/backend";
import { useCallback, useMemo } from "react";

export default function StructureSaveLoad({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure
  ) => void;
}) {

  const handleLoad = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.files);

    const file = event.target.files?.[0];

    if (!file) {
      toast({
        title: 'No file selected',
        variant: 'destructive'
      })
      return;
    }

    const text = await file.text();

    if (!text) {
      toast({
        title: 'Empty file',
        variant: 'destructive'
      })
      return;
    }

    const data = JSON.parse(text);

    setStructure((_) => ({
      ..._,
      ...data,
    }));


    toast({
      title: 'Success',
      description: 'Structure loaded successfully!',
    })
  }, [])

  const json = useMemo(() => JSON.stringify(structure, null, 2), [structure]);
  const jsonLines = useMemo(() => json.split('\n').length, [json]);

  return (
    <>
      <Card className="my-4">
        <CardHeader>
          <CardTitle>Load</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="structureJson">Structure JSON</Label>
            <Input id="structureJson" type="file" onChange={handleLoad} />
          </div>
        </CardContent>
      </Card>
      <Card className="my-4">
        <CardHeader>
          <CardTitle>Save</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'structure.json';
            a.click();
            URL.revokeObjectURL(url);
          }}>Save</Button>
          <p>Save the structure to a JSON file</p>
          <Separator className="my-4"/>
          <Textarea rows={jsonLines} value={json} readOnly={true} />
        </CardContent>
      </Card>
    </>
  );
}