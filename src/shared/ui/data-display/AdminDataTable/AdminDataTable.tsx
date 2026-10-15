"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Box,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { paginate } from "../../../lib/pagination/paginate";
const tableCopy = {
  pages: "Páginas",
  first: "Primeira página",
  last: "Última página",
  next: "Próxima página",
  previous: "Página anterior",
  "start-ellipsis": "Mais páginas",
  "end-ellipsis": "Mais páginas",
};
/** Coluna com apresentação e ordenação opcional. @example const col: AdminTableColumn<string> = { key: "nome", label: "Nome", render: x => x }; */
export interface AdminTableColumn<T> {
  /** Identidade estável da coluna, também usada na ordenação. */
  key: string;
  /** Cabeçalho visível. */
  label: string;
  /** Célula de apresentação, sem E/S. */
  render: (row: T) => ReactNode;
  /** Comparador crescente opcional; a tabela inverte para decrescente sem mutar rows. */
  compare?: (a: T, b: T) => number;
}
/** Entradas controladas da tabela; dados não são buscados internamente. @example const props: AdminDataTableProps<string> = { rows: [], columns: [], label: "Fila", rowKey: x => x, rowHref: x => x, rowLabel: x => x, page: 1, onPageChange: () => {}, empty: "Vazia" }; */
export interface AdminDataTableProps<T> {
  /** Nome acessível da tabela. */
  label: string;
  /** Lista completa para paginação local, já na ordem inicial do domínio. */
  rows: readonly T[];
  /** A primeira coluna recebe o link nativo da linha. */
  columns: readonly AdminTableColumn<T>[];
  /** Identidade estável da linha. */
  rowKey: (row: T) => string;
  /** Caminho interno autorizado pelo consumidor. */
  rowHref: (row: T) => string;
  /** Nome acessível do link de detalhe. */
  rowLabel: (row: T) => string;
  /** Página de base 1; valores fora da lista são limitados para apresentação. */
  page: number;
  /** Quantidade por página, padrão 25; deve ser inteiro positivo. */
  pageSize?: number;
  /** O consumidor persiste a página na URL; ordenar solicita a página 1. */
  onPageChange: (page: number) => void;
  /** Conteúdo do estado vazio, sem inventar texto do domínio em shared. */
  empty: ReactNode;
}
/** Tabela administrativa com links nativos, ordenação local e paginação; sem HTTP ou estado de URL.
 * @example <AdminDataTable {...tableProps} />
 */
export function AdminDataTable<T>({
  label,
  rows,
  columns,
  rowKey,
  rowHref,
  rowLabel,
  page,
  pageSize = 25,
  onPageChange,
  empty,
}: AdminDataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>();
  const column = columns.find((item) => item.key === sort?.key);
  const compare = column?.compare;
  const sorted = compare ? [...rows].sort((a, b) => compare(a, b) * (sort?.direction === "desc" ? -1 : 1)) : rows;
  const result = paginate(sorted, page, pageSize);
  if (!rows.length) return <>{empty}</>;
  return (
    <Box>
      <TableContainer>
        <Table aria-label={label} size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sortDirection={sort?.key === col.key ? sort.direction : false}>
                  {col.compare ? (
                    <TableSortLabel
                      sx={{ minHeight: 44 }}
                      active={sort?.key === col.key}
                      direction={sort?.key === col.key ? sort.direction : "asc"}
                      onClick={() => {
                        setSort({
                          key: col.key,
                          direction: sort?.key === col.key && sort.direction === "asc" ? "desc" : "asc",
                        });
                        onPageChange(1);
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {result.items.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover
                sx={{ cursor: "pointer" }}
                onClick={(event) => {
                  if (!(event.target as HTMLElement).closest("a, button, input, select, textarea"))
                    event.currentTarget.querySelector<HTMLAnchorElement>("a")?.click();
                }}
              >
                {columns.map((col, index) => (
                  <TableCell key={col.key}>
                    {index === 0 ? (
                      <Link
                        href={rowHref(row)}
                        aria-label={rowLabel(row)}
                        style={{ display: "block", minHeight: 44, alignContent: "center" }}
                      >
                        {col.render(row)}
                      </Link>
                    ) : (
                      col.render(row)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {result.pages > 1 && (
        <Pagination
          aria-label={tableCopy.pages}
          getItemAriaLabel={(type, pageNumber, selected) =>
            type === "page" ? `${selected ? "Página atual" : "Ir para a página"} ${pageNumber}` : tableCopy[type]
          }
          count={result.pages}
          page={result.page}
          onChange={(_, next) => onPageChange(next)}
          sx={{ mt: 2, "& .MuiPaginationItem-root": { minWidth: 44, height: 44 } }}
        />
      )}
    </Box>
  );
}
