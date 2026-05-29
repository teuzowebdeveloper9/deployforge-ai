export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}
