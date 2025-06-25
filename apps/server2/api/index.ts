import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  type ChatCreateHandlerRequest,
  type ChatCreateResponse,
  ChatError,
  ChatErrorCode,
} from "@buster/server-shared/chats";

const app = new Hono().basePath("/api");

app.get("/", (c) => {
  return c.json({ message: "Congrats! You've deployed Hono to Vercel" });
});

app.post("/chats", async (c) => {
  const request = (await c.req.json()) as ChatCreateHandlerRequest;
  console.log(request);

  return c.json({
    message: "Hello, world!",
  });
});

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const OPTIONS = handler;
