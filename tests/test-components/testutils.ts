export function createTestResponse(
  status: number,
  json: Promise<any>
): Promise<Response> {
  const testResponse: Response = {
    status: status,
    json: () => json,
    headers: Headers as any,
    ok: true,
    redirected: false,
    statusText: 'foo',
    trailer: Promise.resolve(Headers as any),
    type: 'basic',
    url: '/foo/bar',
    clone: jest.fn<Response, []>(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn<Promise<ArrayBuffer>, []>(),
    blob: jest.fn<Promise<Blob>, []>(),
    formData: jest.fn<Promise<FormData>, []>(),
    text: jest.fn<Promise<string>, []>()
  };
  return Promise.resolve(testResponse);
}
