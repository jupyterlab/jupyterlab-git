import { ReadonlyJSONObject } from '@lumino/coreutils';
import { Git } from '../src/tokens';

export interface IMockedResponse {
  // Response body
  body?: (body: Object) => ReadonlyJSONObject;
  // Response status code
  status?: number;
}

export interface IMockedResponses
  extends Record<string, string | IMockedResponse> {
  // Folder path in URI; default = DEFAULT_REPOSITORY_PATH
  path?: string;
  // Endpoint
  responses?: {
    [endpoint: string]: IMockedResponse;
  };
}

export const DEFAULT_REPOSITORY_PATH = 'path/to/repo';

export const defaultMockedResponses: {
  [endpoint: string]: IMockedResponse;
} = {
  branch: {
    body: () => {
      return {
        code: 0,
        branches: [],
        current_branch: null
      };
    }
  },
  show_prefix: {
    body: () => {
      return {
        code: 0,
        path: ''
      };
    }
  },
  status: {
    body: () => {
      return {
        code: 0,
        files: []
      };
    }
  }
};

export function mockedRequestAPI(mockedResponses?: IMockedResponses) {
  const mockedImplementation = (
    url: string,
    method?: string,
    body?: ReadonlyJSONObject | null,
    namespace?: string
  ) => {
    mockedResponses = mockedResponses ?? {};
    const path = mockedResponses.path ?? DEFAULT_REPOSITORY_PATH;
    const responses = mockedResponses.responses ?? defaultMockedResponses;
    url = url.replace(new RegExp(`^${path}/`), ''); // Remove path + '/'
    const reply = responses[url + method] ?? responses[url];
    if (reply) {
      if (reply.status) {
        throw new Git.GitResponseError(
          new Response(null, {
            status: reply.status
          }),
          '',
          '',
          reply.body ? reply.body(body) : {}
        );
      } else {
        return Promise.resolve(reply.body(body));
      }
    } else {
      throw new Git.GitResponseError(
        new Response(`{"message": "No mock implementation for ${url}."}`, {
          status: 404
        })
      );
    }
  };
  return mockedImplementation;
}
