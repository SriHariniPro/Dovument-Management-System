declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
  export const useState: <T>(initialState: T | (() => T)) => [T, (newState: T | ((prevState: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: readonly any[]) => void;
  export const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: readonly any[]) => T;
}

declare module 'react-router-dom' {
  export interface NavigateFunction {
    (to: string, options?: { replace?: boolean; state?: any }): void;
  }
  export function useNavigate(): NavigateFunction;
  export function useLocation(): { pathname: string; search: string; hash: string; state: any };
  export function BrowserRouter(props: { children: React.ReactNode }): JSX.Element;
  export function Routes(props: { children: React.ReactNode }): JSX.Element;
  export function Route(props: { path: string; element: React.ReactNode }): JSX.Element;
  export function Navigate(props: { to: string; replace?: boolean }): JSX.Element;
}

declare module 'react-dropzone' {
  export interface DropzoneOptions {
    onDrop: (acceptedFiles: File[]) => void;
    maxFiles?: number;
    accept?: Record<string, string[]>;
  }
  export interface DropzoneState {
    getRootProps: () => any;
    getInputProps: () => any;
    isDragActive: boolean;
  }
  export function useDropzone(options: DropzoneOptions): DropzoneState;
}

declare module 'axios' {
  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: any;
  }
  export interface AxiosError<T = any> extends Error {
    config: any;
    code?: string;
    request?: any;
    response?: AxiosResponse<T>;
  }
  export interface AxiosRequestConfig {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: Record<string, string>;
    params?: any;
    data?: any;
    timeout?: number;
    responseType?: string;
  }
  export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function deleteRequest<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
}

declare module 'date-fns' {
  export function format(date: Date | number, format: string): string;
}

declare module 'zustand' {
  export function create<T>(config: (set: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void) => T): () => T;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | null): {
    render(element: React.ReactNode): void;
  };
} 
