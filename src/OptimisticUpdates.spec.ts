import { boolean, object, SMJS, string } from '.';
import { OptimisticUpdatesOrchestrator } from './OptimisticUpdates';
import { getMockConfig } from './specUtilities';

// Test cases
// 1) happy path simple update should make the DO return new data for any properties updated
// 2) if the update fails, DO should return to the previously persisted state
// 3) if updates about new persisted states are received between update being requested and that update failing, the DO should return to the last persisted state

test('happy path, an update should make the DO immediately return new data for properties updated', () => {
  const { optimisticUpdatesOrchestrator, DO, mockDataUpdate } = setupTests();

  optimisticUpdatesOrchestrator.onUpdateRequested(mockDataUpdate);

  expect(DO.name).toBe('new name');
  expect(DO.settings).toEqual({
    flagEnabled: false,
  });
});

test('if the update fails, DO should return to the previously persisted state', () => {
  const {
    optimisticUpdatesOrchestrator,
    DO,
    initialNodeData,
    mockDataUpdate,
  } = setupTests();

  const { onUpdateFailed } = optimisticUpdatesOrchestrator.onUpdateRequested(
    mockDataUpdate
  );

  expect(DO.name).toBe('new name');

  onUpdateFailed();

  expect(DO.name).toBe(initialNodeData.name);
});

test('if updates about new persisted states are received between update being requested and that update failing, the DO should return to the last persisted state', () => {
  const {
    optimisticUpdatesOrchestrator,
    DO,
    initialNodeData,
    mockDataUpdate,
  } = setupTests();

  const { onUpdateFailed } = optimisticUpdatesOrchestrator.onUpdateRequested(
    mockDataUpdate
  );

  optimisticUpdatesOrchestrator.onPersistedDataReceived({
    data: {
      ...initialNodeData,
      version: initialNodeData.version + 1,
      name: 'new name received in message',
    },
    applyUpdateToDO: () => {},
  });

  // until the update fails or succeeds, we ignore incoming messages
  expect(DO.name).toBe(mockDataUpdate.payload.name);

  onUpdateFailed();

  // revert to the last known persisted state
  expect(DO.name).toBe('new name received in message');
});

test('if multiple update requests are queued at the same time, it should stay on the last pending optimistic update until they all either fail or resolve', () => {
  const {
    optimisticUpdatesOrchestrator,
    DO,
    initialNodeData,
    mockDataUpdate,
  } = setupTests();

  const update1 = optimisticUpdatesOrchestrator.onUpdateRequested(
    mockDataUpdate
  );

  const update2 = optimisticUpdatesOrchestrator.onUpdateRequested({
    ...mockDataUpdate,
    payload: {
      ...mockDataUpdate.payload,
      name: 'new name in update 2',
    },
  });

  optimisticUpdatesOrchestrator.onPersistedDataReceived({
    data: {
      ...initialNodeData,
      version: initialNodeData.version + 9,
      name: 'new name received in message',
    },
    applyUpdateToDO: () => {},
  });

  // until all updates fail or succeed, we ignore incoming messages
  expect(DO.name).toBe('new name in update 2');
  update2.onUpdateFailed();

  // should revert to the state of the first update
  expect(DO.name).toBe(mockDataUpdate.payload.name);
  update1.onUpdateFailed();

  // if both fail, should revert to last received message
  expect(DO.name).toBe('new name received in message');
});

function setupTests() {
  const optimisticUpdatesOrchestrator = new OptimisticUpdatesOrchestrator();
  const smJS = new SMJS(getMockConfig());
  const nodeDef = smJS.def({
    type: 'mock-node',
    properties: {
      name: string,
      settings: object({
        flagEnabled: boolean(true),
      }),
    },
  });
  const initialNodeData = {
    id: 'mock-id',
    version: 1,
    name: 'mock name before update',
    lastUpdatedBy: 'mock-user-id',
    settings: {
      flagEnabled: true,
    },
  };
  const DO = new nodeDef.do(initialNodeData);
  optimisticUpdatesOrchestrator.onDOConstructed(DO);
  optimisticUpdatesOrchestrator.onPersistedDataReceived({
    data: initialNodeData,
    applyUpdateToDO: () => {},
  });
  const mockDataUpdate = {
    id: 'mock-id',
    payload: {
      name: 'new name',
      settings: {
        flagEnabled: false,
      },
      lastUpdatedBy: 'mock-user-id',
    },
  };

  return {
    optimisticUpdatesOrchestrator,
    smJS,
    DO,
    initialNodeData,
    mockDataUpdate,
  };
}
