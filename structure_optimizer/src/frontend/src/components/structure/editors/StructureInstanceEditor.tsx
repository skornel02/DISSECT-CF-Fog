import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SchemaSimulationStructure } from '@/lib/backend';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';

type StructureInstanceType = {
  [key: string]: boolean | string,
  region: string,
};

export default function StructureInstanceEditor({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure,
  ) => void;
}) {

  const computerTypes = useMemo(
    () => structure.computerTypes === undefined ? [] : [...structure.computerTypes],
    [structure.computerTypes],
  );

  const regions = useMemo(
    () => structure.regions === undefined ? [] : [...structure.regions],
    [structure.regions],
  );

  const computerInstances = useMemo(() => structure.instances === undefined ? [] : [...structure.instances], [structure.instances]);

  const columns: ColumnDef<StructureInstanceType>[] = useMemo(() => [
    {
      accessorKey: 'region',
      header: 'Region',
    },
    ...computerTypes.map(computerType => ({
      accessorKey: computerType.name ?? "-",
      header: computerType.name ?? "-",
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.original[computerType.name ?? "-"] as boolean}
          onChange={(e) => {
            if (e.target.checked) {
              setStructure((_) => ({
                ..._,
                instances: [
                  ...computerInstances,
                  {
                    regionSpecification: row.original.region,
                    computerSpecification: computerType.name,
                  },
                ],
              }));
            } else {
              setStructure((_) => ({
                ..._,
                instances: computerInstances.filter((r) => !(r.regionSpecification === row.original.region && r.computerSpecification === computerType.name)),
              }));
            }
          }}
        />
      ),
    } satisfies ColumnDef<StructureInstanceType>))
  ] satisfies ColumnDef<StructureInstanceType>[], [computerTypes, computerInstances]);

  const regionRows = useMemo(() => {
    return regions.map(region => {
      const row: StructureInstanceType = { region: region.name ?? "-" };
      computerTypes.forEach(computerType => {
        row[computerType.name ?? "-"] = computerInstances.some(instance => instance.regionSpecification === region.name && instance.computerSpecification === computerType.name);
      });
      return row;
    });
  }, [regions, computerTypes, computerInstances]);

  const table = useReactTable({
    data: regionRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return <>
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
  </>;
}
