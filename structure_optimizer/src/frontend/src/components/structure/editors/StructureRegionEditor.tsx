import EditableTableCell from '@/components/ui-custom/EditableTableCell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  SchemaRegionSpecification,
  SchemaSimulationStructure,
} from '@/lib/backend';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

export default function StructureRegionEditor({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure,
  ) => void;
}) {
  const { toast } = useToast();

  const [newRegion, setNewRegion] = useState<SchemaRegionSpecification>({
    name: '',
    latitude: 0,
    longitude: 0,
    interRegionLatency: 15,
  });

  const regions = useMemo(
    () => structure.regions === undefined ? [] : [...structure.regions],
    [structure.regions],
  );

  const columns: ColumnDef<SchemaRegionSpecification>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.name ?? ""}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              regions: regions.map((r) => {
                if (r.name === row.original.name) {
                  return {
                    ...r,
                    name: value,
                  };
                }
                return r;
              }),
            }));
          }}
        />
      )
    },
    {
      accessorKey: 'latitude',
      header: 'Latitude',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.latitude?.toString() ?? "0"}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              regions: regions.map((r) => {
                if (r.name === row.original.name) {
                  return {
                    ...r,
                    latitude: parseInt(value),
                  };
                }
                return r;
              }),
            }));
          }}
          type='number'
          min={-90}
          max={90}
        />
      )
    },
    {
      accessorKey: 'longitude',
      header: 'Longitude',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.longitude?.toString() ?? "0"}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              regions: regions.map((r) => {
                if (r.name === row.original.name) {
                  return {
                    ...r,
                    longitude: parseInt(value),
                  };
                }
                return r;
              }),
            }));
          }}
          type='number'
          min={-180}
          max={180}
        />
      )
    },
    {
      accessorKey: 'interRegionLatency',
      header: 'Inter region latency',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.interRegionLatency?.toString() ?? "0"}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              regions: regions.map((r) => {
                if (r.name === row.original.name) {
                  return {
                    ...r,
                    interRegionLatency: parseInt(value),
                  };
                }
                return r;
              }),
            }));
          }}
          type='number'
          min={0}
        />
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          className="btn btn-primary"
          onClick={() => {
            setStructure((_) => ({
              ..._,
              regions: regions.filter((r) => r.name !== row.original.name),
            }));
          }}>
          Delete
        </Button>
      ),
    }
  ], [regions]);

  const table = useReactTable({
    data: regions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {

    }
  });

  return (
    <>
      <Card className='my-4'>
        <CardHeader>
          <CardTitle>Add region</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-2'>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              value={newRegion.name}
              onChange={(val) =>
                setNewRegion((_) => ({ ..._, name: val.target.value }))
              }
              placeholder='Region name'
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              type="number"
              id="latitude"
              min={-90}
              max={90}
              value={newRegion.latitude}
              onChange={(val) =>
                setNewRegion((_) => ({ ..._, latitude: parseInt(val.target.value) }))
              }
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              type="number"
              id="longitude"
              min={-180}
              max={180}
              value={newRegion.longitude}
              onChange={(val) =>
                setNewRegion((_) => ({ ..._, longitude: parseInt(val.target.value) }))
              }
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="interRegionLatency">Inter region latency</Label>
            <Input
              type="number"
              id="interRegionLatency"
              min={0}
              value={newRegion.interRegionLatency}
              onChange={(val) =>
                setNewRegion((_) => ({ ..._, interRegionLatency: parseInt(val.target.value) }))
              }
            />
          </div>
          <Button
            className="btn btn-primary"
            onClick={() => {
              if (newRegion.name === '') {
                toast({
                  title: 'Error',
                  description: 'Region name cannot be empty.',
                  variant: 'destructive',
                })
                return;
              }

              setStructure((_) => ({
                ..._,
                regions: [...regions, newRegion],
              }));
              setNewRegion({
                name: '',
                latitude: 0,
                longitude: 0,
                interRegionLatency: 0,
              });
            }}>
            Add region
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
