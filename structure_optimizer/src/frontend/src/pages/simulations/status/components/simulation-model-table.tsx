import { SchemaSimulationModel } from '@/lib/backend';
import { useMemo } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { Button } from '@/components/ui/button.tsx';
import { Map, Scroll } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import humanizeDuration from 'humanize-duration';

export default function SimulationModelTable({
  data,
}: {
  data: SchemaSimulationModel[];
}) {
  
  const columns = useMemo<
    MRT_ColumnDef<SchemaSimulationModel>[]
  >(() => {
    const columns: MRT_ColumnDef<SchemaSimulationModel>[] = [
      {
        id: 'id',
        accessorFn: (_) => _.id,
        header: 'Id',
        enableHiding: true,
      },
      {
        id: 'status',
        accessorFn: (_) => _.status,
        header: 'Status',
        sortingFn: 'text',
        filterVariant: 'select',
        mantineFilterSelectProps: {
          data: ["Waiting", "Processing", "Finished"],
        },
        maxSize: 75,
      },
      {
        id: 'executionTime',
        header: 'ET (ms)',
        sortingFn: 'basic',
        accessorFn: (_) => _.result?.executionTime,
        Cell: ({ cell }) => cell.getValue<string>() ? (
          <span>{humanizeDuration(Number(cell.getValue<string>()), { round: true })}</span>
        ) : (<span>-</span>),
        maxSize: 125,
      },
      {
        id: 'totalCost',
        accessorFn: (_) => _.result?.totalCost.toLocaleString(undefined, { maximumFractionDigits: 3}),
        header: 'TC',
        sortingFn: 'basic',
        maxSize: 125,
      },
      {
        id: 'energyConsumption',
        accessorFn: (_) => _.result?.totalEnergyConsumption.toLocaleString(undefined, { maximumFractionDigits: 3}),
        header: 'TEC',
        sortingFn: 'basic',
        maxSize: 150,
      },
      {
        id: 'finishedAt',
        accessorFn: (_) => _.finishedAt,
        header: 'Finished At',
        sortingFn: 'datetime',
        Cell: ({ cell }) => cell.getValue<string>() ? (
          <span>{new Date(cell.getValue<string>()).toLocaleString()}</span>
        ) : (<span>-</span>),
        maxSize: 85,
      },
      {
        id: 'generation',
        accessorFn: (_) => _.generation,
        header: 'Generation',
        sortingFn: 'basic',
        maxSize: 80,
      }
    ];

    return columns;
  }, []);


  const table = useMantineReactTable({
    columns,
    data: data ?? [],
    getRowId: (row) => row.id,
    state: {
      isLoading: false,
      showProgressBars: false,
      showAlertBanner: false,
    },
    enablePagination: false,
    enableRowVirtualization: true,
    enableGrouping: true,
    createDisplayMode: undefined,
    editDisplayMode: undefined,
    initialState: {
      columnVisibility: {
        id: false,
        generation: !data.some((item) => item.generation === -1),
      },
      density: 'xs',
      grouping: data.some((item) => item.generation === -1) ? [] : ['generation'],
      expanded: true,
    },
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <div className="flex flex-row gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant='ghost'
              className="btn btn-primary">
              <Map />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Structure</DialogTitle>
              <DialogDescription>
                <Textarea value={JSON.stringify(row.original.instances, null, 2)}
                  readOnly
                  className='max-h-[80vh]'
                  rows={30} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        {row.original.result && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='ghost'
                className="btn btn-primary">
                <Scroll />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Simulation logs</DialogTitle>
                <DialogDescription>
                  <Textarea value={row.original.result.logs}
                    readOnly
                    className='max-h-[80vh]'
                    rows={row.original.result.logs.split("\n").length} />
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
      </div>
    ),
    mantineTableProps: {
      style: {
        height: '100%',
      },
    }
  });


  return (
    <div className="rounded-md border h-full px-8">
      <MantineReactTable table={table} />
    </div>
  );
}
