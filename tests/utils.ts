import { ReadonlyJSONObject } from '@lumino/coreutils';
import { Git } from '../src/tokens';

export interface IMockedResponse {
  // Response body
  body?: (body: Object) => ReadonlyJSONObject;
  // Response status code
  status?: number;
}

export interface IMockedResponses {
  // Folder path in URI; default = DEFAULT_REPOSITORY_PATH
  path?: string;
  // Endpoints
  add_all_unstaged?: IMockedResponse;
  add_all_untracked?: IMockedResponse;
  all_history?: IMockedResponse;
  'branch/delete'?: IMockedResponse;
  branch?: IMockedResponse;
  changed_files?: IMockedResponse;
  checkout?: IMockedResponse;
  clone?: IMockedResponse;
  commit?: IMockedResponse;
  config?: IMockedResponse;
  content?: IMockedResponse;
  delete_commit?: IMockedResponse;
  detailed_log?: IMockedResponse;
  diff?: IMockedResponse;
  init?: IMockedResponse;
  log?: IMockedResponse;
  pull?: IMockedResponse;
  push?: IMockedResponse;
  'remote/add'?: IMockedResponse;
  'remote/fetch'?: IMockedResponse;
  reset?: IMockedResponse;
  reset_to_commit?: IMockedResponse;
  show_prefix?: IMockedResponse;
  show_top_level?: IMockedResponse;
  status?: IMockedResponse;
  upstream?: IMockedResponse;
  ignore?: IMockedResponse;
  tags?: IMockedResponse;
  tag_checkout?: IMockedResponse;
  add?: IMockedResponse;
  diffnotebook?: IMockedResponse;
  settings?: IMockedResponse;
}

export const DEFAULT_REPOSITORY_PATH = 'path/to/repo';

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

export function mockedRequestAPI(
  mockedResponses: IMockedResponses = defaultMockedResponses
) {
  const mockedImplementation = (
    url: string,
    method?: string,
    body?: ReadonlyJSONObject | null,
    namespace?: string
  ) => {
    const path = mockedResponses.path ?? DEFAULT_REPOSITORY_PATH;
    url = url.replace(new RegExp(`^${path}/`), ''); // Remove path + '/'
    const reply = mockedResponses[url + method as keyof Omit<IMockedResponses, 'path'>] ?? mockedResponses[url as keyof Omit<IMockedResponses, 'path'>];
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
