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
import moment from 'moment';

export default function SimulationModelTable({
  data,
}: {
  data: SchemaSimulationModel[];
}) {
  const hasGenerations = useMemo(() => {
    return data.some((item) => item.generation !== -1);
  }, [data]);

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
            hide: false,
          },
          {
            headerName: 'Status',
            field: 'status',
            sortable: true,
            filter: true,
            hide: false,
          },
          {
            headerName: 'Time',
            field: 'result.executionTime',
            sortable: true,
            filter: true,
            hide: false,
            valueFormatter: ({ value }) =>
              value ? humanizeDuration(value * 60 * 1000) : 'N/A',
          },
          {
            headerName: 'Cost',
            field: 'result.totalCost',
            sortable: true,
            filter: true,
            hide: false,
            valueFormatter: ({ value }) =>
              value ? `${value.toFixed(2)} €` : 'N/A',
          },
          {
            headerName: 'Energy',
            field: 'result.totalEnergyConsumption',
            sortable: true,
            filter: true,
            hide: false,
            valueFormatter: ({ value }) =>
              value ? `${value.toFixed(2)} kWh` : 'N/A',
          },
          {
            headerName: 'Finished At',
            field: 'finishedAt',
            sortable: true,
            filter: true,
            hide: false,
            valueFormatter: ({ value }) => value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
          },
          {
            headerName: 'Generation',
            field: 'generation',
            sortable: true,
            filter: true,
            hide: !hasGenerations,
            enableRowGroup: true,
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
        ]}
        rowGroupPanelShow='always'
      />
    </div>
  );
}
