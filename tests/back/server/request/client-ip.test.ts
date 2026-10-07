import { expect } from 'vitest';

import { caseTest } from '@tests/back/server/request/client-ip.case-test';
import { clientIp } from '@/server/request/client-ip';

const HEADER = 'x-real-ip';

const ipFrom = (value: string): string => {
  return clientIp(new Headers({ [HEADER]: value }), HEADER);
};

caseTest('sec.ip.ipv4', 'an IPv4 address is kept', () => {
  expect(ipFrom('203.0.113.7')).toBe('203.0.113.7');
});

caseTest('sec.ip.ipv6', 'an IPv6 address is kept', () => {
  expect(ipFrom('2001:db8::1')).toBe('2001:db8::1');
});

caseTest('sec.ip.first-of-list', 'the first entry wins', () => {
  expect(ipFrom('203.0.113.7, 10.0.0.1')).toBe('203.0.113.7');
});

caseTest('sec.ip.trimmed', 'surrounding spaces are removed', () => {
  expect(ipFrom('  203.0.113.7 , 10.0.0.1')).toBe('203.0.113.7');
});

caseTest('sec.ip.missing', 'no header is unknown', () => {
  expect(clientIp(new Headers(), HEADER)).toBe('unknown');
});

caseTest('sec.ip.named-header-only', 'other headers are ignored', () => {
  expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7' }), HEADER)).toBe('unknown');
});

caseTest('sec.ip.garbage', 'non-address text is unknown', () => {
  expect(ipFrom('evil host')).toBe('unknown');
  expect(ipFrom('1.2.3.4x')).toBe('unknown');
});

caseTest('sec.ip.length-bounds', '2 to 45 characters', () => {
  const longest = '0000:0000:0000:0000:0000:ffff:192.168.100.200';

  expect(longest).toHaveLength(45);
  expect(ipFrom(longest)).toBe(longest);
  expect(ipFrom(`${longest}0`)).toBe('unknown');
  expect(ipFrom('1')).toBe('unknown');
});
