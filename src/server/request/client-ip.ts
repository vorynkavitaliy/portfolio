import 'server-only';

const IP_SHAPE = /^[0-9a-fA-F:.]{2,45}$/;

export const UNKNOWN_CLIENT_IP = 'unknown';

export const clientIp = (headers: Headers, headerName: string): string => {
  const first: string = (headers.get(headerName) ?? '').split(',')[0]?.trim() ?? '';

  return IP_SHAPE.test(first) ? first : UNKNOWN_CLIENT_IP;
};
