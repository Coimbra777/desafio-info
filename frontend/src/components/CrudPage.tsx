import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ListParams } from "../lib/resource";
import type { Paginated } from "../types/api";
import { apiErrorMessage } from "../lib/api";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { Pagination } from "./Pagination";
import { EmptyState, ErrorBanner, LoadingState } from "./ui";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: "right";
}

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "password" | "select";
  required?: boolean;
  mono?: boolean;
  uppercase?: boolean;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  minLength?: number;
  full?: boolean;
  options?: { value: string | number; label: string }[];
}

type FormValues = Record<string, string>;

export interface CrudApi<T, CreateDto, UpdateDto> {
  list: (params: ListParams) => Promise<Paginated<T>>;
  create: (dto: CreateDto) => Promise<T>;
  update: (id: number, dto: UpdateDto) => Promise<T>;
  remove: (id: number) => Promise<void>;
}

export interface CrudConfig<T, CreateDto, UpdateDto> {
  resourceKey: string;
  singular: string;
  api: CrudApi<T, CreateDto, UpdateDto>;
  rowId: (row: T) => number;
  columns: Column<T>[];
  fields: (mode: "create" | "edit") => FieldDef[];
  toValues: (row?: T) => FormValues;
  toCreateDto: (values: FormValues) => CreateDto;
  toUpdateDto: (values: FormValues) => UpdateDto;
  emptyHint?: string;
}

interface Props<T, C, U> {
  eyebrow: string;
  title: string;
  description: string;
  config: CrudConfig<T, C, U>;
}

type ModalState<T> =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; row: T };

export function CrudPage<T, C, U>({ eyebrow, title, description, config }: Props<T, C, U>) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [modal, setModal] = useState<ModalState<T>>({ mode: "closed" });
  const [confirmRow, setConfirmRow] = useState<T | null>(null);

  const listKey = [config.resourceKey, "list", page, limit] as const;

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => config.api.list({ page, limit }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [config.resourceKey] });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: "create" })}>
          + Novo {config.singular}
        </button>
      </div>

      {query.isError && <ErrorBanner message={apiErrorMessage(query.error)} />}

      {query.isLoading ? (
        <LoadingState />
      ) : query.data && query.data.data.length > 0 ? (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  {config.columns.map((column) => (
                    <th
                      key={column.header}
                      style={column.align === "right" ? { textAlign: "right" } : undefined}
                    >
                      {column.header}
                    </th>
                  ))}
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((row) => (
                  <tr key={config.rowId(row)}>
                    {config.columns.map((column) => (
                      <td
                        key={column.header}
                        style={column.align === "right" ? { textAlign: "right" } : undefined}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-icon"
                          onClick={() => setModal({ mode: "edit", row })}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => setConfirmRow(row)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            meta={query.data.meta}
            onPage={setPage}
            onLimit={(next) => {
              setLimit(next);
              setPage(1);
            }}
          />
        </>
      ) : (
        <div className="table-wrap">
          <EmptyState
            title={`Nenhum ${config.singular.toLowerCase()} ainda`}
            hint={config.emptyHint}
            action={
              <button className="btn btn-primary" onClick={() => setModal({ mode: "create" })}>
                + Novo {config.singular}
              </button>
            }
          />
        </div>
      )}

      {modal.mode !== "closed" && (
        <ResourceForm
          config={config}
          mode={modal.mode}
          row={modal.mode === "edit" ? modal.row : undefined}
          onClose={() => setModal({ mode: "closed" })}
          onSaved={(savedMode) => {
            setModal({ mode: "closed" });
            invalidate();
            toast.success(
              savedMode === "create"
                ? "Cadastro realizado com sucesso."
                : "Alterações salvas com sucesso.",
            );
          }}
        />
      )}

      {confirmRow && (
        <ConfirmDelete
          singular={config.singular}
          onCancel={() => setConfirmRow(null)}
          onConfirm={async () => {
            await config.api.remove(config.rowId(confirmRow));
          }}
          onDone={() => {
            setConfirmRow(null);
            invalidate();
            toast.success("Registro excluído com sucesso.");
          }}
        />
      )}
    </div>
  );
}

function ResourceForm<T, C, U>({
  config,
  mode,
  row,
  onClose,
  onSaved,
}: {
  config: CrudConfig<T, C, U>;
  mode: "create" | "edit";
  row?: T;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
}) {
  const fields = useMemo(() => config.fields(mode), [config, mode]);
  const [values, setValues] = useState<FormValues>(() => config.toValues(row));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "create") {
        return config.api.create(config.toCreateDto(values));
      }
      return config.api.update(config.rowId(row as T), config.toUpdateDto(values));
    },
    onSuccess: () => onSaved(mode),
  });

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const raw = (values[field.name] ?? "").trim();
      if (field.required && !raw) {
        next[field.name] = "Campo obrigatório.";
        continue;
      }
      if (!raw) continue;
      if (field.minLength && raw.length < field.minLength) {
        next[field.name] = `Mínimo de ${field.minLength} caracteres.`;
      }
      if (field.type === "number") {
        const num = Number(raw);
        if (Number.isNaN(num)) next[field.name] = "Informe um número.";
        else if (field.min !== undefined && num < field.min)
          next[field.name] = `Mínimo ${field.min}.`;
        else if (field.max !== undefined && num > field.max)
          next[field.name] = `Máximo ${field.max}.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (validate()) mutation.mutate();
  };

  return (
    <Modal
      title={`${mode === "create" ? "Novo" : "Editar"} ${config.singular}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Salvar"}
          </button>
        </>
      }
    >
      {mutation.isError && <ErrorBanner message={apiErrorMessage(mutation.error)} />}
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {fields.map((field) => (
          <div
            key={field.name}
            className={`field ${field.full ? "full" : ""} ${errors[field.name] ? "invalid" : ""}`}
          >
            <label htmlFor={field.name}>
              {field.label} {field.required && <span className="req">*</span>}
            </label>
            {field.type === "select" ? (
              <select
                id={field.name}
                value={values[field.name] ?? ""}
                onChange={(event) => setValue(field.name, event.target.value)}
              >
                <option value="">Selecione…</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                className={field.mono ? "mono" : ""}
                type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                value={values[field.name] ?? ""}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setValue(
                    field.name,
                    field.uppercase ? event.target.value.toUpperCase() : event.target.value,
                  )
                }
              />
            )}
            {field.hint && !errors[field.name] && <div className="hint">{field.hint}</div>}
            {errors[field.name] && <div className="err">{errors[field.name]}</div>}
          </div>
        ))}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function ConfirmDelete({
  singular,
  onCancel,
  onConfirm,
  onDone,
}: {
  singular: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onDone: () => void;
}) {
  const mutation = useMutation({ mutationFn: onConfirm, onSuccess: onDone });

  return (
    <Modal
      title={`Excluir ${singular}`}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel} disabled={mutation.isPending}>
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Excluindo…" : "Excluir"}
          </button>
        </>
      }
    >
      {mutation.isError && <ErrorBanner message={apiErrorMessage(mutation.error)} />}
      <p className="confirm-text">
        Esta ação é permanente. Registros vinculados podem impedir a exclusão.
      </p>
    </Modal>
  );
}
