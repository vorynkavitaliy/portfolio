export type ClientIpCaseSource = 'security-md' | 'owner-2026-10-07' | 'rfc-4291' | 'rfc-7239';

export type ClientIpCase = Readonly<{
  id: string;
  source: ClientIpCaseSource;
  reference: string;
  expected: string;
}>;

const CONTRACT =
  'plan 0002 §5.7 clientIp: first comma-separated value, trimmed, /^[0-9a-fA-F:.]{2,45}$/ else «unknown»';

export const CLIENT_IP_CASES = [
  {
    id: 'sec.ip.ipv4',
    source: 'security-md',
    reference: 'rules/security.md §1 «token bucket … per client IP»',
    expected: 'header 203.0.113.7 gives 203.0.113.7',
  },
  {
    id: 'sec.ip.ipv6',
    source: 'rfc-4291',
    reference: 'RFC 4291 §2.2 (text form of IPv6 addresses, «::» compression)',
    expected: 'header 2001:db8::1 gives 2001:db8::1',
  },
  {
    id: 'sec.ip.first-of-list',
    source: 'rfc-7239',
    reference: 'RFC 7239 §5.2 / x-forwarded-for convention: the first entry is the client',
    expected: 'header «203.0.113.7, 10.0.0.1» gives 203.0.113.7',
  },
  {
    id: 'sec.ip.trimmed',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected:
      'header «  203.0.113.7 , 10.0.0.1» gives 203.0.113.7 (space before the comma removed)',
  },
  {
    id: 'sec.ip.missing',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected: 'no header gives «unknown»',
  },
  {
    id: 'sec.ip.named-header-only',
    source: 'owner-2026-10-07',
    reference: `${CONTRACT}; contact-form stack: never a client-supplied x-forwarded-for alone`,
    expected:
      'with only x-forwarded-for set and the configured header x-real-ip absent the result is «unknown»',
  },
  {
    id: 'sec.ip.garbage',
    source: 'owner-2026-10-07',
    reference: CONTRACT,
    expected:
      'a value with letters outside hex or a space («evil host», «1.2.3.4x») gives «unknown»',
  },
  {
    id: 'sec.ip.length-bounds',
    source: 'owner-2026-10-07',
    reference: `${CONTRACT}; 45 = longest IPv6 text form (IPv4-mapped)`,
    expected:
      'a 45-character IPv6 text is kept; 46 characters or a single character give «unknown»',
  },
] as const satisfies readonly ClientIpCase[];

export type ClientIpCaseId = (typeof CLIENT_IP_CASES)[number]['id'];
