import { z } from 'zod';

import { MAIL_API_ORIGIN } from '@tests/front/e2e/support/e2e-env';

const POLL_INTERVAL_MS = 250;
const DEFAULT_WAIT_MS = 15_000;

const addressSchema = z.object({ Address: z.string() });

const searchSchema = z.object({
  messages: z.array(z.object({ ID: z.string() })).nullable(),
});

const messageSchema = z.object({
  ID: z.string(),
  From: addressSchema,
  To: z.array(addressSchema).nullable(),
  ReplyTo: z.array(addressSchema).nullable(),
  Subject: z.string(),
  Text: z.string(),
  HTML: z.string(),
});

export type SinkMessage = Readonly<{
  id: string;
  from: string;
  to: readonly string[];
  replyTo: readonly string[];
  subject: string;
  text: string;
  html: string;
}>;

const addresses = (list: ReadonlyArray<z.infer<typeof addressSchema>> | null): string[] => {
  return (list ?? []).map((entry) => {
    return entry.Address;
  });
};

const fetchJson = async (path: string): Promise<unknown> => {
  const response: Response = await fetch(`${MAIL_API_ORIGIN}${path}`);

  if (!response.ok) {
    throw new Error(`mail sink ${path} answered ${response.status}`);
  }

  return response.json();
};

const pause = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const readMessage = async (id: string): Promise<SinkMessage> => {
  const parsed = messageSchema.parse(await fetchJson(`/api/v1/message/${encodeURIComponent(id)}`));

  return {
    id: parsed.ID,
    from: parsed.From.Address,
    to: addresses(parsed.To),
    replyTo: addresses(parsed.ReplyTo),
    subject: parsed.Subject,
    text: parsed.Text,
    html: parsed.HTML,
  };
};

export const searchMessages = async (query: string): Promise<SinkMessage[]> => {
  const parsed = searchSchema.parse(
    await fetchJson(`/api/v1/search?query=${encodeURIComponent(query)}`),
  );

  return Promise.all(
    (parsed.messages ?? []).map((entry) => {
      return readMessage(entry.ID);
    }),
  );
};

export const waitForMessages = async (
  query: string,
  count: number,
  timeoutMs: number = DEFAULT_WAIT_MS,
): Promise<SinkMessage[]> => {
  const deadline: number = Date.now() + timeoutMs;

  for (;;) {
    const found: SinkMessage[] = await searchMessages(query);

    if (found.length >= count || Date.now() >= deadline) {
      return found;
    }

    await pause(POLL_INTERVAL_MS);
  }
};

export const waitForMessage = async (
  query: string,
  timeoutMs: number = DEFAULT_WAIT_MS,
): Promise<SinkMessage> => {
  const [first] = await waitForMessages(query, 1, timeoutMs);

  if (first === undefined) {
    throw new Error(`no message matching "${query}" arrived within ${timeoutMs} ms`);
  }

  return first;
};
