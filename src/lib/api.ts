export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function parseBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return errorResponse(err.message, err.status);
  }
  if (err instanceof Error) {
    if (err.message === "Unauthorized") return errorResponse(err.message, 401);
    if (err.message === "Forbidden") return errorResponse(err.message, 403);
  }
  console.error(err);
  return errorResponse("Internal server error", 500);
}
