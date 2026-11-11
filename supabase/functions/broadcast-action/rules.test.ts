import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { permitsBroadcast, broadcastCompanyId } from './rules.ts';
Deno.test('transmissions are exclusive to Vialogistic', () => {
  assertEquals(permitsBroadcast('da17735c-5a76-4797-b338-f6e63a7b3f8b',1,false),false);
  assertEquals(permitsBroadcast(broadcastCompanyId,1,false),true);
});
Deno.test('test sends are restricted to one recipient', () => {
  assertEquals(permitsBroadcast(broadcastCompanyId,2,true),false);
  assertEquals(permitsBroadcast(broadcastCompanyId,1,true),true);
});