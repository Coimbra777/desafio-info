import axios, { AxiosError } from "axios";

const TOKEN_KEY = "aivacol_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback registrado pelo AuthContext para reagir a 401 sem acoplar ao router.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * Traduz mensagens conhecidas do backend (em inglês) para português, padronizando
 * o idioma exibido ao operador. Mensagens não mapeadas são exibidas como vêm.
 */
const MESSAGE_PT: Record<string, string> = {
  "Invalid credentials": "Credenciais inválidas.",
  "Email already exists": "Email já cadastrado.",
  "Nickname already exists": "Nickname já em uso.",
  "Brand name already exists": "Nome de marca já existe.",
  "License plate already exists": "Placa já cadastrada.",
  "Chassis already exists": "Chassi já cadastrado.",
  "Renavam already exists": "Renavam já cadastrado.",
  "User not found": "Usuário não encontrado.",
  "Brand not found": "Marca não encontrada.",
  "Model not found": "Modelo não encontrado.",
  "Vehicle not found": "Veículo não encontrado.",
  "Cannot delete brand because it has models linked":
    "Não é possível excluir: existem modelos vinculados.",
  "Cannot delete model because it has vehicles linked":
    "Não é possível excluir: existem veículos vinculados.",
  "Invalid audit log id": "Id de auditoria inválido.",
  "Audit log not found": "Log de auditoria não encontrado.",
};

function translate(message: string): string {
  return MESSAGE_PT[message] ?? message;
}

/** Extrai a mensagem de erro da API (400/404/409...) para exibir ao usuário. */
export function apiErrorMessage(error: unknown, fallback = "Algo deu errado."): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK") return "Sem conexão com a API.";
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message.map(translate).join(" · ");
    if (typeof message === "string") return translate(message);
  }
  return fallback;
}
