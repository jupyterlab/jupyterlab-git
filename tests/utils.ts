import { ReadonlyJSONObject } from '@lumino/coreutils';
import { Git } from '../src/tokens';

export interface IMockedResponses {
  [url: string]: {
    body?: (body: Object) => ReadonlyJSONObject;
    status?: number;
  };
}

export const defaultMockedResponses: IMockedResponses = {
  branch: {
    body: () => {
      return {
        code: 0,
        branches: [],
        current_branch: null
      };
    }
  },
  show_top_level: {
    body: request => {
      return {
        code: 0,
        top_repo_path: (request as any)['current_path']
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

export function mockedRequestAPI(
  mockedResponses: IMockedResponses = defaultMockedResponses
) {
  const mockedImplementation = (
    url: string,
    method?: string,
    body?: ReadonlyJSONObject | null,
    namespace?: string
  ) => {
    const reply = mockedResponses[url + method] || mockedResponses[url];
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
