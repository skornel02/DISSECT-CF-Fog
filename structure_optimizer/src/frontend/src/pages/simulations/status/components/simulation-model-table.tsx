import { SchemaSimulationModel } from '@/lib/backend';
import { Button } from '@/components/ui/button.tsx';
import { Map, Scroll } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import humanizeDuration from 'humanize-duration';
import Grid from '@/components/grid';
import { useMemo } from 'react';
import { ColDef } from 'ag-grid-community';

export default function SimulationModelTable({
  data,
  running,
}: {
  data: SchemaSimulationModel[];
  running: boolean;
}) {
  const hasGenerations = useMemo(() => {
    return data.some((item) => item.generation !== -1);
  }, [data]);

  const additionalColumnDefs: ColDef[] = useMemo(() => data[0].instances 
    ? data[0].instances?.map((instance, index) => ({
      headerName: `${instance.computerType} - ${instance.region}`,
      field: `${instance.computerType} - ${instance.region}`,
      valueGetter: (params) => params.data.instances[index].count,
      sortable: true,
      filter: true,
    }))
    : [], [data]);

  console.log(additionalColumnDefs);

  return (
    <div className='h-full'>
      <Grid
        rowData={data}
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
            hide: !hasGenerations,
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
            hide: running,
          },
          {
            headerName: 'Actions',
            field: 'actions',
            sortable: false,
            filter: false,
            hide: false,
            cellRenderer: (row: any) => {
              return (
                <div className="flex flex-row gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="btn btn-primary">
                        <Map />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Structure</DialogTitle>
                        <DialogDescription>
                          <Textarea
                            value={JSON.stringify(row.data.instances, null, 2)}
                            readOnly
                            className="max-h-[80vh]"
                            rows={30}
                          />
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                  {row.data.result && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="btn btn-primary">
                          <Scroll />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Simulation logs</DialogTitle>
                          <DialogDescription>
                            <Textarea
                              value={row.data.result.logs}
                              readOnly
                              className="max-h-[80vh]"
                              rows={row.data.result.logs.split('\n').length}
                            />
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              );
            },
          },
          ...additionalColumnDefs,
        ]}
        rowGroupPanelShow='always'
      />
    </div>
  );
}
