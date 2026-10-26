/**
 * Tests that intentionally scan large content, map, or generated-art collections.
 * They remain part of the default full suite; the list only gives the fast and
 * data-specific commands stable, complementary entry points.
 */
export const DATA_AUDIT_TEST_FILES = [
  'tests/unit/maps.test.ts',
  'tests/unit/content.test.ts',
  'tests/unit/questions.test.ts',
  'tests/unit/skillLook.test.ts',
  'tests/unit/roadmapMenu.test.ts',
  'tests/unit/motifArt.test.ts',
  'tests/unit/meisan.test.ts',
  'tests/unit/itemIcons.test.ts',
  'tests/unit/recordAcademicReview.test.ts',
  'tests/unit/fieldArtLibrary.test.ts',
] as const;

/**
 * Small, deterministic tests for the save/progression/battle foundations that
 * nearly every gameplay change can affect. Feature work must still run
 * `test:related`; the full suite remains the integration gate.
 */
export const FAST_TEST_FILES = [
  'src/**/*.test.ts',
  'tests/unit/autosave.test.ts',
  'tests/unit/battle.test.ts',
  'tests/unit/battleInitiative.test.ts',
  'tests/unit/battleSettlement.test.ts',
  'tests/unit/eventReward.test.ts',
  'tests/unit/inventory.test.ts',
  'tests/unit/learning.test.ts',
  'tests/unit/levelCap.test.ts',
  'tests/unit/localSaveReset.test.ts',
  'tests/unit/movementDecision.test.ts',
  'tests/unit/objectDispatch.test.ts',
  'tests/unit/performanceBudget.test.ts',
  'tests/unit/progression.test.ts',
  'tests/unit/rng.test.ts',
  'tests/unit/safeInteger.test.ts',
  'tests/unit/savePersistence.test.ts',
  'tests/unit/saveSummary.test.ts',
  'tests/unit/startupRecovery.test.ts',
  'tests/unit/state.test.ts',
  'tests/unit/transitionLock.test.ts',
  'tests/unit/xpTable.test.ts',
] as const;
