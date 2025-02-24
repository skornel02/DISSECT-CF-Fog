import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  SchemaRegionSpecification,
  SchemaSimulationStructure,
} from '@/lib/backend';
import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DraggableMarker from '@/components/maps/draggable-marker';
import Grid from '@/components/grid';
import { icon } from 'leaflet';

const positionPrecision = 10e6;

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
  });

  const regions = useMemo(
    () => (structure.regions === undefined ? [] : [...structure.regions]),
    [structure.regions],
  );

  return (
    <div className="grid grid-cols-3">
      <div className="col-span-2">
        <Grid
          rowData={regions}
          pinnedTopRowData={[newRegion]}
          columnDefs={[
            {
              headerName: 'Name',
              field: 'name',
              editable: true,
            },
            {
              headerName: 'Latitude',
              field: 'latitude',
              editable: true,
              type: 'number',
            },
            {
              headerName: 'Longitude',
              field: 'longitude',
              editable: true,
              type: 'number',
            },
            {
              headerName: 'Actions',
              field: 'actions',
              cellRenderer: (params: any) => {
                if (params.node.rowPinned) {
                  return (
                    <div className="flex flex-row gap-2">
                      <Button
                        className="btn btn-primary"
                        variant="secondary"
                        onClick={() => {
                          if (newRegion.name === '') {
                            toast({
                              title: 'Error',
                              description: 'Region name cannot be empty.',
                              variant: 'destructive',
                            });
                            return;
                          }

                          if (regions.find((r) => r.name === newRegion.name)) {
                            toast({
                              title: 'Error',
                              description:
                                'Region with this name already exists.',
                              variant: 'destructive',
                            });
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
                          });
                        }}>
                        Add
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-row gap-2">
                    <Button
                      className="btn btn-primary"
                      onClick={() => {
                        setStructure((_) => ({
                          ..._,
                          regions: regions.filter(
                            (r) => r.name !== params.data.name,
                          ),
                        }));
                      }}>
                      Delete
                    </Button>
                  </div>
                );
              },
            },
          ]}
          getRowStyle={({ node }) =>
            node.rowPinned ? { background: '#f0f0f0' } : undefined
          }
          onCellEditingStopped={(params) => {
            if (params.rowPinned) {
              setNewRegion(params.data);
            } else {
              setStructure((_) => ({
                ..._,
                regions: regions.map((r) => {
                  if (r.name === params.data.name) {
                    return params.data;
                  }
                  return r;
                }),
              }));
            }
          }}
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
        <DraggableMarker
          key={`${newRegion.latitude}-${newRegion.longitude}`}
          position={[newRegion.latitude!, newRegion.longitude!]}
          setPosition={(position) => {
            setNewRegion((_) => ({
              ..._,
              latitude:
                Math.round(position.lat * positionPrecision) /
                positionPrecision,
              longitude:
                Math.round(position.lng * positionPrecision) /
                positionPrecision,
            }));
          }}
          icon={icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            shadowSize: [41, 41],
          })}>
          <Tooltip direction="bottom" offset={[-5, 5]} opacity={1} permanent>
            New region
          </Tooltip>
        </DraggableMarker>
        {regions.map((region) => (
          <DraggableMarker
            position={[region.latitude!, region.longitude!]}
            setPosition={(position) => {
              setStructure((_) => ({
                ..._,
                regions: _.regions?.map((r) => {
                  if (r.name === region.name) {
                    return {
                      ...r,
                      latitude:
                        Math.round(position.lat * positionPrecision) /
                        positionPrecision,
                      longitude:
                        Math.round(position.lng * positionPrecision) /
                        positionPrecision,
                    };
                  }
                  return r;
                }),
              }));
            }}>
            <Tooltip
              direction="bottom"
              offset={[-15, 25]}
              opacity={1}
              permanent>
              {region.name}
            </Tooltip>
          </DraggableMarker>
        ))}
      </MapContainer>
    </div>
  );
}
