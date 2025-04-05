import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { SchemaSimulationStructure } from '@/lib/backend';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
} from 'react-leaflet';
import { ColDef } from 'ag-grid-community';

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

  const columnDefs: ColDef<RegionLatencyType>[] = useMemo(() => {
    const baseColumns: ColDef<RegionLatencyType>[] = [
      { field: 'region', headerName: 'Region', sortable: true, filter: true },
    ];

    const dynamicColumns: ColDef<RegionLatencyType>[] = regions.map(
      (region) =>
        ({
          field: region.name ?? '-',
          headerName: region.name ?? '-',
          editable: true,
          valueParser: (params) => {
            const value = parseInt(params.newValue);
            return Number.isSafeInteger(value) ? value : 0;
          },
          valueFormatter: (params) => {
            const value = params.value;
            return Number.isSafeInteger(value) && value > 0
              ? value
              : structure.defaultLatency;
          },
          cellStyle: (params) =>
            params.value > 0
              ? { fontStyle: '', color: '' }
              : { fontStyle: 'italic', color: 'gray' },
        }) satisfies ColDef<RegionLatencyType>,
    );

    return [...baseColumns, ...dynamicColumns];
  }, [structure.defaultLatency, regions]);

  const rowData = useMemo(() => {
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

  const onCellValueChanged = (params: any) => {
    const { data, colDef, newValue } = params;
    const targetRegion = colDef.field;

    if (targetRegion && typeof newValue === 'number') {
      setStructure((_) => ({
        ..._,
        regionConnections: [
          ...regionConnections.filter(
            (r) => !(r.from === data.region && r.to === targetRegion),
          ),
          ...(newValue > 0
            ? [
                {
                  from: data.region,
                  to: targetRegion,
                  latency: newValue,
                },
              ]
            : []),
        ],
      }));
    }
  };

  return (
    <>
      <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          onCellValueChanged={onCellValueChanged}
        />
      </div>

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

          if (from === to) {
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
    </>
  );
}
