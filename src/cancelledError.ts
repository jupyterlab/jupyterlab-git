export class CancelledError extends Error {
  constructor(...params: any) {
    super(...params);
    this.name = 'CancelledError';
  }
}
