import EditableTableCell from '@/components/ui-custom/EditableTableCell';
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
import { SchemaSimulationStructure } from '@/lib/backend';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
} from 'react-leaflet';

type RegionLatencyType = {
  region: string;
  [key: string]: number | string;
};

export default function StructureLatencyEditor({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure,
  ) => void;
}) {
  const regions = useMemo(
    () => (structure.regions === undefined ? [] : [...structure.regions]),
    [structure.regions],
  );

  const regionConnections = useMemo(
    () =>
      structure.regionConnections === undefined
        ? []
        : [...structure.regionConnections],
    [structure.regionConnections],
  );

  const columns: ColumnDef<RegionLatencyType>[] = useMemo(
    () =>
      [
        {
          accessorKey: 'region',
          header: 'Region',
        },
        ...regions.map(
          (region) =>
            ({
              accessorKey: region.name ?? '-',
              header: region.name ?? '-',
              cell: ({ row }) => (
                <EditableTableCell
                  type="number"
                  getValue={() => {
                    const value = row.original[region.name ?? '-'];

                    return value === 0 ? '' : value.toString();
                  }}
                  placeholder={structure.defaultLatency?.toString()}
                  setValue={(value) => {
                    if (Number.isSafeInteger(parseInt(value))) {
                      console.log(
                        'Setting latency',
                        row.original.region,
                        region.name,
                        parseInt(value),
                      );
                      setStructure((_) => ({
                        ..._,
                        regionConnections: [
                          ...regionConnections.filter(
                            (r) =>
                              !(
                                r.from === row.original.region &&
                                r.to === region.name
                              ),
                          ),
                          {
                            from: row.original.region,
                            to: region.name,
                            latency: parseInt(value),
                          },
                        ],
                      }));
                    } else {
                      setStructure((_) => ({
                        ..._,
                        regionConnections: regionConnections.filter(
                          (r) =>
                            !(
                              r.from === row.original.region &&
                              r.to === region.name
                            ),
                        ),
                      }));
                    }
                  }}
                />
              ),
            }) satisfies ColumnDef<RegionLatencyType>,
        ),
      ] satisfies ColumnDef<RegionLatencyType>[],
    [regions, regionConnections],
  );

  const regionRows = useMemo(() => {
    return regions.map((region) => {
      const row: RegionLatencyType = { region: region.name ?? '-' };

      regions.forEach((region2) => {
        const connection = regionConnections.find(
          (r) => r.from === region.name && r.to === region2.name,
        );

        row[region2.name ?? '-'] = connection?.latency ?? 0;
      });
      return row;
    });
  }, [regions, regionConnections]);

  const table = useReactTable({
    data: regionRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

        <MapContainer
          center={[0, 0]}
          zoom={2}
          scrollWheelZoom={true}
          className="h-[500px]">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {regions.map((region) => (
            <Marker position={[region.latitude!, region.longitude!]}>
              <Tooltip
                direction="bottom"
                offset={[-15, 25]}
                opacity={1}
                permanent>
                {region.name}
              </Tooltip>
            </Marker>
          ))}
          {regionConnections.map((connection) => {
            const from = regions.find((r) => r.name === connection.from);
            const to = regions.find((r) => r.name === connection.to);

            if (from === undefined || to === undefined) {
              return null;
            }

            return (
              <Polyline
                positions={[
                  [from.latitude!, from.longitude!],
                  [to.latitude!, to.longitude!],
                ]}
                pathOptions={{
                  color: 'black',
                  weight: 1,
                }}>
                <Tooltip
                  direction="top"
                  offset={[0, -20]}
                  opacity={0.5}
                  permanent>
                  {connection.latency}ms
                </Tooltip>
              </Polyline>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
}
