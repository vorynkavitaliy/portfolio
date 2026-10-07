export const healthResponse = (): Response => {
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
};
