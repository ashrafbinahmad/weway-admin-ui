import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';

export interface Column<T> {
  id: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, loading, emptyMessage = "No records found." }: DataTableProps<T>) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading data...</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ bgcolor: 'var(--bg-panel)', border: '1px solid var(--border)', boxShadow: 'none', borderRadius: 'var(--radius)', overflow: 'auto', maxHeight: '70vh' }}>
      <Table stickyHeader sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: 'var(--bg-hover)' }}>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} sx={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)', bgcolor: 'var(--bg-hover)' }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6, color: 'var(--text-secondary)', borderBottom: 'none' }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={(row as any).id || index}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  '& td': { borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' },
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {column.render ? column.render(row) : (row as any)[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
