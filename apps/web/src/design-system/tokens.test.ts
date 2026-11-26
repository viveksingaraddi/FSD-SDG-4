import { describe, it, expect } from 'vitest';
import { DESIGN_TOKENS } from './tokens';

describe('DESIGN_TOKENS', () => {
  it('defines EDVARQ brand, surface, semantic, and layout tokens', () => {
    expect(DESIGN_TOKENS.brand.name).toBe('EDVARQ');
    expect(DESIGN_TOKENS.colors.brand.primary).toBe('#0f172a');
    expect(DESIGN_TOKENS.colors.brand.accent).toBe('#2563eb');
    expect(DESIGN_TOKENS.colors.semantic.success).toBe('#059669');
    expect(DESIGN_TOKENS.colors.semantic.warning).toBe('#d97706');
    expect(DESIGN_TOKENS.colors.semantic.danger).toBe('#dc2626');
    expect(DESIGN_TOKENS.colors.focusRing).toBe('#2563eb');
    expect(DESIGN_TOKENS.layout.sidebarWidth).toBe('240px');
    expect(DESIGN_TOKENS.layout.sidebarCompact).toBe('64px');
    expect(DESIGN_TOKENS.layout.headerHeight).toBe('64px');
    expect(DESIGN_TOKENS.layout.bottomNavHeight).toBe('56px');
    expect(DESIGN_TOKENS.layout.contentMaxWidth).toBe('1440px');
  });
});
