import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  UseMutationOptions,
  UseQueryOptions,
  QueryKey,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import type { Credential, CredentialWithPassword, CredentialInput, CredentialUpdate } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";

// ── List credentials (no passwords) ──────────────────────────────────────────
export const getListCredentialsQueryKey = () => ["/api/vault"] as const;

export function useListCredentials<TData = Credential[], TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<Credential[], TError, TData>; request?: Parameters<typeof customFetch>[1] }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListCredentialsQueryKey();
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    customFetch<Credential[]>("/api/vault", { ...requestOptions, method: "GET", signal });
  const q = useQuery({ queryKey, queryFn, ...queryOptions } as UseQueryOptions<Credential[], TError, TData>);
  return Object.assign(q, { queryKey }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
}

// ── Get one credential with decrypted password ────────────────────────────────
export const getGetCredentialQueryKey = (id: string) => [`/api/vault/${id}`] as const;

export function useGetCredential<TData = CredentialWithPassword, TError = ErrorType<unknown>>(
  id: string,
  options?: { query?: UseQueryOptions<CredentialWithPassword, TError, TData>; request?: Parameters<typeof customFetch>[1] }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetCredentialQueryKey(id);
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    customFetch<CredentialWithPassword>(`/api/vault/${id}`, { ...requestOptions, method: "GET", signal });
  const q = useQuery({ queryKey, queryFn, enabled: Boolean(id), ...queryOptions } as UseQueryOptions<CredentialWithPassword, TError, TData>);
  return Object.assign(q, { queryKey }) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
}

// ── Create credential ─────────────────────────────────────────────────────────
export function useCreateCredential<TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Credential, TError, { data: BodyType<CredentialInput> }, TContext>; request?: Parameters<typeof customFetch>[1] }
): UseMutationResult<Credential, TError, { data: BodyType<CredentialInput> }, TContext> {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ data }) =>
      customFetch<Credential>("/api/vault", {
        ...requestOptions,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    ...mutationOptions,
  });
}

// ── Update credential ─────────────────────────────────────────────────────────
export function useUpdateCredential<TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Credential, TError, { id: string; data: BodyType<CredentialUpdate> }, TContext>; request?: Parameters<typeof customFetch>[1] }
): UseMutationResult<Credential, TError, { id: string; data: BodyType<CredentialUpdate> }, TContext> {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id, data }) =>
      customFetch<Credential>(`/api/vault/${id}`, {
        ...requestOptions,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    ...mutationOptions,
  });
}

// ── Delete credential ─────────────────────────────────────────────────────────
export function useDeleteCredential<TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: string }, TContext>; request?: Parameters<typeof customFetch>[1] }
): UseMutationResult<void, TError, { id: string }, TContext> {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id }) =>
      customFetch<void>(`/api/vault/${id}`, { ...requestOptions, method: "DELETE" }),
    ...mutationOptions,
  });
}
