import { healthResponse } from '@/core/http/health-response';

export const dynamic = 'force-dynamic';

export const GET = (): Response => {
  return healthResponse();
};
