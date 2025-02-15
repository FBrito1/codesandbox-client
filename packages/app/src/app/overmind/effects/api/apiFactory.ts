/* eslint-disable camelcase */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';

export const API_ROOT = '/api/v1';

export type ApiError = AxiosError<
  { errors: string[] } | { error: string } | any
>;

export type Params = {
  [key: string]: string;
};

export type Options = {
  shouldCamelize: boolean;
};

export type Api = {
  get<T>(path: string, params?: Params, options?: Options): Promise<T>;
  post<T>(path: string, body: any, options?: Options): Promise<T>;
  patch<T>(path: string, body: any, options?: Options): Promise<T>;
  put<T>(path: string, body: any, options?: Options): Promise<T>;
  delete<T>(path: string, params?: Params, options?: Options): Promise<T>;
  request<T>(requestConfig: AxiosRequestConfig, options?: Options): Promise<T>;
};

export type ApiConfig = {
  provideJwtToken: () => string;
  getParsedConfigurations: () => any;
  onError: (error: ApiError) => void;
};

export default (config: ApiConfig) => {
  const createHeaders = (jwt: string) =>
    jwt
      ? {
          Authorization: `Bearer ${jwt}`,
        }
      : {};

  const api: Api = {
    get(path, params, options) {
      return axios
        .get(API_ROOT + path, {
          params,
          headers: createHeaders(config.provideJwtToken()),
        })
        .then(response => handleResponse(response, options))
        .catch(e => {
          config.onError(e);
          return Promise.reject(e);
        });
    },
    post(path, body, options) {
      return axios
        .post(API_ROOT + path, decamelizeKeys(body), {
          headers: createHeaders(config.provideJwtToken()),
        })
        .then(response => handleResponse(response, options))
        .catch(e => {
          config.onError(e);
          return Promise.reject(e);
        });
    },
    patch(path, body, options) {
      return axios
        .patch(API_ROOT + path, decamelizeKeys(body), {
          headers: createHeaders(config.provideJwtToken()),
        })
        .then(response => handleResponse(response, options))
        .catch(e => {
          config.onError(e);
          return Promise.reject(e);
        });
    },
    put(path, body, options) {
      return axios
        .put(API_ROOT + path, decamelizeKeys(body), {
          headers: createHeaders(config.provideJwtToken()),
        })
        .then(response => handleResponse(response, options))
        .catch(e => {
          config.onError(e);
          return Promise.reject(e);
        });
    },
    delete(path, params, options) {
      return axios
        .delete(API_ROOT + path, {
          params,
          headers: createHeaders(config.provideJwtToken()),
        })
        .then(response => handleResponse(response, options))
        .catch(e => {
          config.onError(e);
          return Promise.reject(e);
        });
    },
    request(requestConfig, options) {
      return axios
        .request(
          Object.assign(requestConfig, {
            url: API_ROOT + requestConfig.url,
            data: requestConfig.data ? camelizeKeys(requestConfig.data) : null,
            headers: createHeaders(config.provideJwtToken()),
          })
        )
        .then(response => handleResponse(response, options))
        .catch(e => {
          config.onError(e);
          return Promise.reject(e);
        });
    },
  };

  return api;
};

export function handleResponse(
  response: AxiosResponse,
  { shouldCamelize = true } = {}
) {
  const camelizedData = shouldCamelize
    ? camelizeKeys(response.data)
    : response.data;

  // Quickfix to prevent underscored dependencies from being camelized.
  // Never store data as keys in the future.
  if (
    camelizedData &&
    camelizedData.data &&
    camelizedData.data.npmDependencies
  ) {
    camelizedData.data.npmDependencies = response.data.data.npm_dependencies;
  }

  return camelizedData.data ? camelizedData.data : camelizedData;
}
