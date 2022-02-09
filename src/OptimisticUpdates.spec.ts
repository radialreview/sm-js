import { boolean, object, SMJS, string } from '.';
import { OptimisticUpdatesOrchestrator } from './OptimisticUpdates';
import { getMockConfig } from './specUtilities';

// Test cases
// 1) happy path simple update should make the DO return new data for any properties updated
// 2) if the update fails, DO should return to the previously persisted state
// 3) if updates about new persisted states are received between update being requested and that update failing, the DO should return to the last persisted state

test('happy path, an update should make the DO immediately return new data for properties updated', () => {
  const { optimisticUpdatesOrchestrator, smJS, nodeDef } = setupTests();
});

function setupTests() {
  const optimisticUpdatesOrchestrator = new OptimisticUpdatesOrchestrator();
  const smJS = new SMJS(getMockConfig());
  const nodeDef = smJS.def({
    type: 'mock-node',
    properties: {
      name: string,
      settings: object({
        flagEnabled: boolean,
      }),
    },
  });

  return { optimisticUpdatesOrchestrator, smJS, nodeDef };
}
