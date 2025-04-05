import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { SchemaSimulationStructure } from '@/lib/backend';

type StructureInstanceType = {
  [key: string]: boolean | string;
  region: string;
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
    () =>
      structure.computerTypes === undefined ? [] : [...structure.computerTypes],
    [structure.computerTypes],
  );

  const regions = useMemo(
    () => (structure.regions === undefined ? [] : [...structure.regions]),
    [structure.regions],
  );

  const computerInstances = useMemo(
    () => (structure.instances === undefined ? [] : [...structure.instances]),
    [structure.instances],
  );

  const columnDefs = useMemo(() => {
    const baseColumns = [
      { field: 'region', headerName: 'Region', sortable: true, filter: true },
    ];

    const dynamicColumns = computerTypes.map((computerType) => ({
      field: computerType.name ?? '-',
      headerName: computerType.name ?? '-',
      editable: true,
      cellRenderer: 'agCheckboxCellRenderer',
      cellRendererParams: {
        checkbox: true,
      },
    }));

    return [...baseColumns, ...dynamicColumns];
  }, [computerTypes]);

  const rowData = useMemo(() => {
    return regions.map((region) => {
      const row: StructureInstanceType = { region: region.name ?? '-' };
      computerTypes.forEach((computerType) => {
        row[computerType.name ?? '-'] = computerInstances.some(
          (instance) =>
            instance.regionSpecification === region.name &&
            instance.computerSpecification === computerType.name,
        );
      });
      return row;
    });
  }, [regions, computerTypes, computerInstances]);

  const onCellValueChanged = (params: any) => {
    const { data, colDef, newValue } = params;
    const computerTypeName = colDef.field;

    if (computerTypeName && typeof newValue === 'boolean') {
      setStructure((_) => ({
        ..._,
        instances: [
          ...computerInstances.filter(
            (r) =>
              !(
                r.regionSpecification === data.region &&
                r.computerSpecification === computerTypeName
              ),
          ),
          ...(newValue
            ? [
                {
                  regionSpecification: data.region,
                  computerSpecification: computerTypeName,
                },
              ]
            : []),
        ],
      }));
    }
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        domLayout="autoHeight"
        onCellValueChanged={onCellValueChanged}
      />
    </div>
  );
}
