import EditableTableCell from '@/components/ui-custom/EditableTableCell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { SchemaComputerSpecification, SchemaSimulationStructure } from '@/lib/backend';
import { Label } from '@radix-ui/react-label';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

export default function StructureComputerTypeEditor({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure,
  ) => void;
}) {
  const [newComputerSpec, setNewComputerSpec] = useState<SchemaComputerSpecification>({
    name: '',
    cores: 2,
    memory: 4294967296,
    processingPerTick: 0.001,
  });

  const computerTypes = useMemo(
    () => structure.computerTypes === undefined ? [] : [...structure.computerTypes],
    [structure.computerTypes],
  );

  const columns: ColumnDef<SchemaComputerSpecification>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.name ?? ""}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              computerTypes: computerTypes.map((r) => {
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
      accessorKey: 'cores',
      header: 'Computing cores (CPU)',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.cores?.toString() ?? "0"}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              computerTypes: computerTypes.map((r) => {
                if (r.name === row.original.name) {
                  return {
                    ...r,
                    cores: parseInt(value),
                  };
                }
                return r;
              }),
            }));
          }}
          type='number'
          min={1}
          max={1024}
        />
      )
    },
    {
      accessorKey: 'processingPerTick',
      header: 'IPS/core',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.processingPerTick?.toString() ?? "0"}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              computerTypes: computerTypes.map((r) => {
                if (r.name === row.original.name) {
                  return {
                    ...r,
                    processingPerTick: parseFloat(value),
                  };
                }
                return r;
              }),
            }));
          }}
          type='number'
          min={0.0001}
          max={100}
        />
      )
    },
    {
      accessorKey: 'memory',
      header: 'Memory (bytes)',
      cell: ({ row }) => (
        <EditableTableCell
          getValue={() => row.original.memory?.toString() ?? "0"}
          setValue={(value) => {
            setStructure((_) => ({
              ..._,
              computerTypes: computerTypes.map((r) => {
                if (r.name === row.original.name) {
                  return {
                    ...r,
                    memory: parseInt(value),
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
              computerTypes: computerTypes.filter((r) => r.name !== row.original.name),
            }));
          }}>
          Delete
        </Button>
      ),
    }
  ] satisfies ColumnDef<SchemaComputerSpecification>[], [computerTypes]);

  const table = useReactTable({
    data: computerTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {

    }
  });

  return (
    <>
      <Card className='my-4 max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Add region</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-2'>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              value={newComputerSpec.name}
              onChange={(val) =>
                setNewComputerSpec((_) => ({ ..._, name: val.target.value }))
              }
              placeholder='Comptery type name'
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cores">Computing cores (CPU)</Label>
            <Input
              type="number"
              id="cores"
              min={1}
              max={1024}
              value={newComputerSpec.cores}
              onChange={(val) =>
                setNewComputerSpec((_) => ({ ..._, cores: parseInt(val.target.value) }))
              }
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="longitude">Instructions per second per core (= MIPS / MHz)</Label>
            <Input
              type="number"
              id="longitude"
              min={0.0001}
              max={100}
              value={newComputerSpec.processingPerTick}
              onChange={(val) =>
                setNewComputerSpec((_) => ({ ..._, processingPerTick: parseFloat(val.target.value) }))
              }
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="interRegionLatency">Memory (bytes)</Label>
            <Input
              type="number"
              id="interRegionLatency"
              min={0}
              value={newComputerSpec.memory}
              onChange={(val) =>
                setNewComputerSpec((_) => ({ ..._, memory: parseInt(val.target.value) }))
              }
            />
          </div>
          <Button
            className="btn btn-primary"
            onClick={() => {
              if (newComputerSpec.name === '') {
                toast({
                  title: 'Error',
                  description: 'Computer type name cannot be empty.',
                  variant: 'destructive',
                })
                return;
              }

              if (computerTypes.find((r) => r.name === newComputerSpec.name)) {
                toast({
                  title: 'Error',
                  description: 'Computer type with this name already exists.',
                  variant: 'destructive',
                })
                return;
              }

              setStructure((_) => ({
                ..._,
                computerTypes: [...computerTypes, newComputerSpec],
              }));
              setNewComputerSpec({
                name: '',
                cores: 2,
                memory: 4294967296,
                processingPerTick: 0.001,
              });
            }}>
            Add computer type
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
                  No regions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
