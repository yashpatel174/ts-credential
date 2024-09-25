import { Response } from "express";

export const required = (res: Response, ...fields: Array<{ [key: string]: string | undefined }>): void => {
  const missingFields = fields
    .map((field) => ({
      name: Object.keys(field)[0],
      value: Object.values(field)[0],
    }))
    .filter(({ value }) => !value || value.trim() === "");

  if (missingFields.length > 0) {
    const missingFieldNames = missingFields.map(({ name }) => name).join(", ");
    res.status(400).json({
      error: `Missing required fields: ${missingFieldNames}`,
    });
  }
};

export const response = (res: Response, message: string, status?: number, result?: object | string): Response => {
  if (status !== undefined) {
    res.status(status);
  }
  const payload: { message: string; result?: object | string } = {
    message,
  };
  if (result) {
    payload.result = result;
  }
  return res.send(payload);
};
