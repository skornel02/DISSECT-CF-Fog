import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { SchemaSimulationModel } from '@/lib/backend';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { ArrowUpDown, Hammer, Map, Scroll } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const columns: ColumnDef<SchemaSimulationModel>[] = [
  // {
  //   header: 'Id',
  //   accessorKey: 'id',
  // },
  {
    header: 'Status',
    accessorKey: 'status',
    enableGrouping: true,
    cell: ({ row }) => {
      return (<div key={'row-status-' + row.original.id} className='flex flex-col justify-center items-center'>
        <span className='text-center my-1'> {row.original.status} </span>

        {row.original.result 
          && row.original.result.completedTasks === row.original.result.totalTasks 
          && row.original.result.totalTasks !== -1
          && (
          <Badge className='justify-center'>Success</Badge>
        )}
        {row.original.result && row.original.result.errorMessage !== null && (
          <Badge variant='destructive' className='justify-center'>Failed</Badge>
        )}

      </div>);
    }
  },
  {
    header: ({ column }) => {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                ET (ms)
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Execution Time (ms)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    accessorKey: 'result.executionTime',
    accessorFn: (row) => row.result?.executionTime ?? 'N/A',
  },
  {
    header: ({ column }) => {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>

              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                TC
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Test Cost</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    accessorKey: 'result.totalCost',
    accessorFn: (row) => row.result?.totalCost ?? 'N/A',
  },
  {
    header: ({ column }) => {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>

              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                TEC
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Test Energy Cost</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    accessorKey: 'result.totalEnergyConsumption',
    accessorFn: (row) => row.result?.totalEnergyConsumption ?? 'N/A',
  },
  {
    accessorKey: 'result',
    header: "Actions",
    cell: ({ row }) => (
      <>
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
      </>
    ),
  }
];

export default function SimulationModelTable({
  data,
}: {
  data: SchemaSimulationModel[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
