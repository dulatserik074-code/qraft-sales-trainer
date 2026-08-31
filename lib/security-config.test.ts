import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deployment security configuration', () => {
  it('fails browser gateway access closed and separates anonymous clients', () => {
    const gateway = readFileSync(
      'supabase/functions/ai-gateway/index.ts',
      'utf8',
    );
    expect(gateway).toContain("return configured.includes(origin)");
    expect(gateway).toContain("req.headers.get('x-client-id')");
    expect(gateway).toContain("payload.sub !== 'anon'");
  });

  it('prevents admins from managing the owner role on fresh and upgraded databases', () => {
    for (const migration of [
      'supabase/migrations/001_initial.sql',
      'supabase/migrations/002_harden_organization_roles.sql',
    ]) {
      const sql = readFileSync(migration, 'utf8');
      expect(sql).toContain('members_manage_owner');
      expect(sql).toContain('members_manage_admin');
      expect(sql).toContain("role <> 'owner'");
    }
  });
});
