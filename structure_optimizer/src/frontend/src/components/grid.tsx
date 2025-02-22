import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AllCommunityModule,
  ExcelExportParams,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community';
import {
  ExcelExportModule,
  LicenseManager,
  MasterDetailModule,
  PivotModule,
  RowGroupingModule,
  SetFilterModule,
  TreeDataModule,
} from 'ag-grid-enterprise';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import { Download, RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';

LicenseManager.setLicenseKey(
  'ag-Grid_Evaluation_License_Not_for_Production_100Devs30_August_2037__MjU4ODczMzg3NzkyMg==9e93ed5f03b0620b142770f2594a23a2',
);

ModuleRegistry.registerModules([
  AllCommunityModule,
  MasterDetailModule,
  SetFilterModule,
  ExcelExportModule,
  RowGroupingModule,
  PivotModule,
  TreeDataModule,
]);

export default function Grid<TData, TLoaderParam>({
  dataReloader,
  enableQuickFilter = true,
  dataloaderParam,
  externalIsLoading,
  excelExport = false,
  excelParams,
  ...gridProps
}: {
  rowData?: TData[];
  dataReloader?: (params?: TLoaderParam) => Promise<TData[]>;
  dataloaderParam?: TLoaderParam;
  enableQuickFilter?: boolean;
  externalIsLoading?: boolean;
  excelExport?: boolean;
  excelParams?: ExcelExportParams;
} & AgGridReactProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [isLoading, startTransition] = useTransition();

  const [rowData, setRowData] = useState(gridProps.rowData);
  const [quickFilter, setQuickFilter] = useState('');

  const masterIsLoading = externalIsLoading || isLoading;

  const reloadData = () => {
    if (dataReloader) {
      // @ts-expect-error blabla
      startTransition(async () => {
        const data = await dataReloader(dataloaderParam);
        setRowData(data);
      });
    }
  };

  useEffect(() => {
    gridRef?.current?.api?.setGridOption('loading', masterIsLoading);

    if (!masterIsLoading) {
      gridRef?.current?.api?.refreshCells();
    }
  }, [masterIsLoading, gridRef?.current?.api]);

  useEffect(() => {
    setRowData(gridProps.rowData);
  }, [gridProps.rowData]);

  return (
    <div className="flex h-full grow flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {enableQuickFilter && (
          <Input
            placeholder="Search..."
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            className="max-w-[400px]"
          />
        )}
        {excelExport && (
          <Button
            variant="outline"
            onClick={() => {
              gridRef.current?.api.exportDataAsExcel({
                author: 'SMP Agent',
                ...excelParams,
              });
            }}>
            <Download className="size-5" />
            Excel
          </Button>
        )}
        {dataReloader && (
          <>
            <Button variant="outline" onClick={reloadData}>
              <RefreshCcw className="size-5" />
            </Button>
          </>
        )}
      </div>

      <div className="h-[400px] w-full grow">
        <AgGridReact
          {...gridProps}
          ref={gridRef}
          quickFilterText={quickFilter}
          rowData={rowData}
          theme={themeQuartz}
          loading={masterIsLoading}
        />
      </div>
    </div>
  );
}
