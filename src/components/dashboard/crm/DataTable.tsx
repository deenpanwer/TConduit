'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Column<T> {
  id: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  visibleColumnIds?: string[];
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  visibleColumnIds,
  onRowClick,
  selectable = false,
  onSelectionChange,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredColumns = visibleColumnIds 
    ? columns.filter(col => visibleColumnIds.includes(col.id))
    : columns;

  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
      onSelectionChange?.([]);
    } else {
      const allIds = data.map(item => item.id);
      setSelectedIds(allIds);
      onSelectionChange?.(allIds);
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter(sid => sid !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  return (
    <div className="rounded-md border bg-card/50 border-border/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="border-b border-border/40">
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectedIds.length === data.length && data.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
              {filteredColumns.map((column) => (
                <TableHead key={column.id} className={cn("text-xs font-semibold text-muted-foreground", column.className)}>
                  {column.header}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/10 transition-colors group",
                    selectedIds.includes(item.id) && "bg-primary/10"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <TableCell className="py-3">
                      <Checkbox 
                        checked={selectedIds.includes(item.id)}
                        onClick={(e) => toggleRow(item.id, e as any)}
                      />
                    </TableCell>
                  )}
                  {filteredColumns.map((column) => (
                    <TableCell key={column.id} className={cn("py-3 text-sm", column.className)}>
                      {column.accessor(item)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={filteredColumns.length + (selectable ? 2 : 1)}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  );
}
