import Grid from '@/components/grid';
import {
  SchemaSimulationModel,
} from '@/lib/backend';
import { ColDef } from 'ag-grid-community';
import humanizeDuration from 'humanize-duration';
import { useMemo, useState } from 'react';

export default function SimulationManual({
  data,
}: {
  data: SchemaSimulationModel[];
}) {
  const computerInstances = data[0].instances ?? [];

  const [appliedFilters, setAppliedFilters] = useState<(number | null)[]>(
    computerInstances.map(() => null),
  );

  const filterColumnDefs = computerInstances.map(
    (instance, i) =>
      ({
        headerName: `${instance.computerType} - ${instance.region}`,
        sortable: false,
        filter: false,
        editable: true,
        valueGetter: (params) => params.data?.[i],
        valueSetter: (params) => {
          setAppliedFilters(
            params.data.map((match, matchI) => {
              if (matchI === i) {
                const text =
                  !params.newValue || params.newValue === ''
                    ? null
                    : params.newValue;
                const num = text ? Number(text) : NaN;
                return !isNaN(num) ? num : null;
              } else {
                return match;
              }
            }),
          );
          return true;
        },
      }) satisfies ColDef<(number | null)[]>,
  );

  const matchingSimulations = useMemo(() => {
    return data.filter((simulation) => {
      return simulation.instances?.every((instance, i) => {
        const appliedFilter = appliedFilters[i];
        if (appliedFilter === null) {
          return true;
        }
        return instance.count === appliedFilter;
      });
    });
  }, [data, appliedFilters]);

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <h2 className="text-lg font-semibold">Specify simulation instance count!</h2>
      </div>
      <div className="h-[150px]">
        <Grid
          rowData={[appliedFilters]}
          columnDefs={filterColumnDefs}
          enableQuickFilter={false}
          excelExport={false}
        />
      </div>
      <div className="flex items-center justify-between py-4">
        <h2 className="text-lg font-semibold">Matching simulation results</h2>
      </div>
      <div className='h-full'>

      <Grid
        rowData={matchingSimulations}
        columnDefs={[
          {
            headerName: 'Id',
            field: 'id',
            sortable: true,
            filter: true,
            hide: true,
          },
          {
            headerName: 'Generation',
            field: 'generation',
            sortable: true,
            filter: true,
            enableRowGroup: true,
            maxWidth: 60,
          },
          {
            headerName: 'Status',
            field: 'status',
            sortable: true,
            filter: true,
            hide: false,
            maxWidth: 110
          },
          {
            headerName: 'Time',
            field: 'result.executionTime',
            sortable: true,
            filter: true,
            hide: false,
            valueFormatter: ({ value }) =>
              value ? humanizeDuration(value, {round: false }) : 'N/A',
          },
          {
            headerName: 'Cost',
            field: 'result.totalCost',
            sortable: true,
            filter: true,
            hide: false,
            valueFormatter: ({ value }) =>
              value ? `${value.toFixed(2)} €` : 'N/A',
            maxWidth: 110
          },
          {
            headerName: 'Energy',
            field: 'result.totalEnergyConsumption',
            sortable: true,
            filter: true,
            hide: false,
            valueFormatter: ({ value }) =>
              value ? `${value.toFixed(2)} kWh` : 'N/A',
            maxWidth: 110
          },
          {
            headerName: 'Fitness',
            field: 'fitness',
            sortable: true,
            filter: true,
            hide: data.every((item) => item.fitness === 0),
            maxWidth: 160
          },
          {
            headerName: 'Best',
            field: 'bestPhenotype',
            maxWidth: 60,
          },
        ]}
        rowGroupPanelShow='always'
      />
      </div>
    </>
  );
}
