import type { ClientIpCaseId } from '@tests/back/server/request/client-ip.cases';

export type ClientIpMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly ClientIpCaseId[];
}>;

const CLIENT_IP = 'src/server/request/client-ip.ts';

export const CLIENT_IP_MUTATIONS: readonly ClientIpMutation[] = [
  {
    id: 'list.last-entry',
    file: CLIENT_IP,
    find: ".split(',')[0]",
    replace: ".split(',').at(-1)",
    caseIds: ['sec.ip.first-of-list'],
  },
  {
    id: 'trim.dropped',
    file: CLIENT_IP,
    find: '?.trim() ??',
    replace: '??',
    caseIds: ['sec.ip.trimmed'],
  },
  {
    id: 'shape.any',
    file: CLIENT_IP,
    find: '/^[0-9a-fA-F:.]{2,45}$/',
    replace: '/^.{2,45}$/',
    caseIds: ['sec.ip.garbage'],
  },
  {
    id: 'shape.unanchored',
    file: CLIENT_IP,
    find: '/^[0-9a-fA-F:.]{2,45}$/',
    replace: '/[0-9a-fA-F:.]{2,45}/',
    caseIds: ['sec.ip.garbage', 'sec.ip.length-bounds'],
  },
  {
    id: 'shape.no-colon',
    file: CLIENT_IP,
    find: '/^[0-9a-fA-F:.]{2,45}$/',
    replace: '/^[0-9a-fA-F.]{2,45}$/',
    caseIds: ['sec.ip.ipv6'],
  },
  {
    id: 'shape.longer',
    file: CLIENT_IP,
    find: '{2,45}',
    replace: '{1,46}',
    caseIds: ['sec.ip.length-bounds'],
  },
  {
    id: 'header.fallback-xff',
    file: CLIENT_IP,
    find: "headers.get(headerName) ?? ''",
    replace: "headers.get(headerName) ?? headers.get('x-forwarded-for') ?? ''",
    caseIds: ['sec.ip.named-header-only'],
  },
  {
    id: 'unknown.passthrough',
    file: CLIENT_IP,
    find: '? first : UNKNOWN_CLIENT_IP',
    replace: '? first : first',
    caseIds: ['sec.ip.missing', 'sec.ip.garbage', 'sec.ip.length-bounds'],
  },
];
