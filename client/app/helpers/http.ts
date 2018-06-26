import { assign } from 'lodash';

interface HttpConfig {
  credentials: string;
  method: string;
  headers: object;
  body?: string;
}

export interface HttpResponse {
  status: number;
  error?: any;
  [propName: string]: any;
}

export const GET = 'GET';
export const POST = 'POST';
export const PUT = 'PUT';
export const DELETE = 'DELETE';

const getHttpConfig = (options = {}): HttpConfig => {
  return assign({
    credentials: 'same-origin',
    method: GET,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }, options);
};

const isAuthorized = (res: HttpResponse): HttpResponse => {
  if (res.status === 401) {
    // TODO: this might be a temporary hack to handle unauthorized access
    const err = assign(new Error('Not authorized!'), { status: 401 });

    throw err;
  }

  return res.json();
};

const validate = (res: HttpResponse): HttpResponse => {
  if (res.error || res.status >= 400) {
    throw new Error(res.error || res.status);
  }

  return res;
};

export const request = (endpoint: string, config: object): Promise<HttpResponse> => {
  return fetch(endpoint, config)
    .then(isAuthorized)
    .then(validate);
};

export const get = (endpoint: string): Promise<HttpResponse> => {
  const config = getHttpConfig();

  return request(endpoint, config);
};

export const post = (endpoint: string, body: object = {}): Promise<HttpResponse> => {
  const config = getHttpConfig({
    method: POST,
    body: JSON.stringify(body)
  });

  return request(endpoint, config);
};

export const put = (endpoint: string, body: object): Promise<HttpResponse> => {
  const config = getHttpConfig({
    method: PUT,
    body: JSON.stringify(body)
  });

  return request(endpoint, config);
};

export const del = (endpoint: string): Promise<HttpResponse> => {
  const config = getHttpConfig({
    method: DELETE
  });

  return request(endpoint, config);
};
