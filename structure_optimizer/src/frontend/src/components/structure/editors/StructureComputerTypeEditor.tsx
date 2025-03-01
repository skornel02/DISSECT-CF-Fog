import Grid from '@/components/grid';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  SchemaComputerSpecification,
  SchemaSimulationStructure,
} from '@/lib/backend';
import { useMemo, useState } from 'react';
import bytes from 'bytes';

export default function StructureComputerTypeEditor({
  structure,
  setStructure,
}: {
  structure: SchemaSimulationStructure;
  setStructure: (
    mutator: (old: SchemaSimulationStructure) => SchemaSimulationStructure,
  ) => void;
}) {
  const [newComputerSpec, setNewComputerSpec] =
    useState<SchemaComputerSpecification>({
      name: '',
      cores: 2,
      memory: 4294967296,
      processingPerTick: 0.001,
      pricePerTick: 1,
    });

  const computerTypes = useMemo(
    () =>
      structure.computerTypes === undefined ? [] : [...structure.computerTypes],
    [structure.computerTypes],
  );

  return (
    <>
      <Grid
        rowData={computerTypes}
        pinnedTopRowData={[newComputerSpec]}
        columnDefs={[
          {
            headerName: 'Name',
            field: 'name',
            editable: true,
          },
          {
            headerName: 'Computing cores (CPU)',
            field: 'cores',
            editable: true,
            type: 'number',
          },
          {
            headerName: 'IPS per core',
            field: 'processingPerTick',
            editable: true,
            type: 'number',
            cellRenderer: (params: any) => {
              return (
                <div className="inline-flex gap-2">
                  <span>{params.value?.toFixed(3)}</span>
                  {/* MIPS over MHz vertically */}
                  <div className="flex flex-col">
                    <span className="text-xs border-b-2 border-black">
                      MIPS
                    </span>
                    <span className="text-xs">MHz</span>
                  </div>
                </div>
              );
            },
          },
          {
            headerName: 'Memory',
            field: 'memory',
            editable: true,
            cellEditor: 'agTextCellEditor',
            type: 'text',
            valueSetter: (params) => {
              params.data.memory = bytes(params.newValue.toString());
              return true;
            },
            valueGetter: (params) => {
              return bytes.format(params.data.memory, { unitSeparator: ' ' });
            },
          },
          {
            headerName: 'Price per tick',
            field: 'pricePerTick',
            editable: true,
            type: 'number',
            valueFormatter: ({ value }) => `${value?.toString()} €`,
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
                        if (newComputerSpec.name === '') {
                          toast({
                            title: 'Error',
                            description: 'Computer type name cannot be empty.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        if (
                          computerTypes.find(
                            (r) => r.name === newComputerSpec.name,
                          )
                        ) {
                          toast({
                            title: 'Error',
                            description:
                              'Computer type with this name already exists.',
                            variant: 'destructive',
                          });
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
                          pricePerTick: 1,
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
                        computerTypes: computerTypes.filter(
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
            setNewComputerSpec(params.data);
          } else {
            setStructure((_) => ({
              ..._,
              computerTypes: computerTypes.map((r) => {
                if (r.name === params.data.name) {
                  return params.data;
                }
                return r;
              }),
            }));
          }
        }}
      />
    </>
  );
}
