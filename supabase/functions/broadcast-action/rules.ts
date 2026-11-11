export const broadcastCompanyId = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';
export function permitsBroadcast(companyId: string, count: number, isTest: boolean) {
  return companyId === broadcastCompanyId && count > 0 && count <= 500 && (!isTest || count === 1);
}