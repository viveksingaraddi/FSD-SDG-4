import { describe, it, expect } from 'vitest';
import { DESIGN_TOKENS } from './tokens';

describe('DESIGN_TOKENS', () => {
  it('defines brand, surface, semantic, and layout tokens aligned with Phase 3', () => {
    expect(DESIGN_TOKENS.colors.brand.primary).toBe('#1d4ed8');
    expect(DESIGN_TOKENS.colors.focusRing).toBe('#2563eb');
    expect(DESIGN_TOKENS.layout.sidebarWidth).toBe('240px');
    expect(DESIGN_TOKENS.layout.sidebarCompact).toBe('64px');
    expect(DESIGN_TOKENS.layout.headerHeight).toBe('64px');
    expect(DESIGN_TOKENS.layout.bottomNavHeight).toBe('56px');
    expect(DESIGN_TOKENS.layout.contentMaxWidth).toBe('1440px');
  });
});
