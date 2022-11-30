import { PROPERTIES_QUERIED_FOR_ALL_NODES } from './consts';

import { NotCachedException } from './exceptions';
import {
  IData,
  DataDefaultFn,
  NodeDO,
  INodeRepository,
  DeepPartial,
  GetAllAvailableNodeDataType,
} from './types';

/**
 * Returns an initialized instance of a repository for a Node
 */
export function RepositoryFactory<
  TNodeData extends Record<string, IData | DataDefaultFn>
>(opts: {
  def: {
    type: string;
    properties: TNodeData;
  };
  DOClass: new (initialData?: Record<string, any>) => NodeDO;
  onDataReceived(opts: {
    data: { id: string } & Record<string, any>;
    applyUpdateToDO: () => void;
  }): void;
  onDOConstructed?(DO: NodeDO): void;
  onDODeleted?(DO: NodeDO): void;
}): INodeRepository {
  // silences the error "A class can only implement an object type or intersection of object types with statically known members."
  // wich happens because NodeDO has non statically known members (each property on a node in the backend is mapped to a non-statically known property on the DO)
  // eslint-disable-next-line
  // @ts-ignore
  class Repository implements INodeRepository {
    private cached: Record<string, NodeDO> = {};

    public onDataReceived(
      data: { id: string; type: string } & Record<string, any>
    ) {
      if (opts.def.type !== data.type) {
        throw Error(
          `Attempted to query a node with an id belonging to a different type - Expected: ${opts.def.type} Received: ${data.type}`
        );
      }
      const cached = this.cached[data.id];

      const parsedData = this.parseDataFromBackend<TNodeData>(data);

      if (!cached) {
        const newDO = new opts.DOClass(parsedData);
        this.cached[data.id] = newDO;
        opts.onDOConstructed && opts.onDOConstructed(newDO);
      }

      // applyUpdateToDO is called conditionally by OptimisticUpdatesOrchestrator
      // see comments in that class to understand why
      opts.onDataReceived({
        data: parsedData,
        applyUpdateToDO: () => {
          // if there was no cached node it was already initialized with this data
          // calling onDataReceived again would be wasted CPU cycles
          cached && cached.onDataReceived(parsedData);
        },
      });
    }

    public byId(id: string) {
      const cached = this.cached[id];

      if (!cached) {
        throw new NotCachedException({
          nodeType: opts.def.type,
          id,
        });
      }

      return cached;
    }

    public onNodeDeleted(id: string) {
      if (this.cached[id]) {
        if (opts.onDODeleted) {
          opts.onDODeleted(this.cached[id]);
        }
        delete this.cached[id];
      }
    }
    /**
     * This method takes data that comes in from the backend and is about to be applied to this DO's instance.
     * It needs to ignore data not specified in the node definition for this node this is so that the querier
     * in dataContext can call onDataReceived on the DO with the data it receives from the backend without having to ignore the relational aliases there.
     * Without doing this, we'd get errors about attempting to set a property on a DO which is read only
     */
    private parseDataFromBackend<
      TNodeData extends Record<string, IData | DataDefaultFn>
    >(
      receivedData: any
    ): { id: string; version: number } & DeepPartial<
      GetAllAvailableNodeDataType<{
        TNodeData: TNodeData;
        TNodeComputedData: {};
      }>
    > {
      return Object.keys(receivedData).reduce((parsed, key: string) => {
        const isDataStoredOnAllNodes = Object.keys(
          PROPERTIES_QUERIED_FOR_ALL_NODES
        ).includes(key);
        if (isDataStoredOnAllNodes) {
          return {
            ...parsed,
            [key]: receivedData[key],
          };
        }

        const isDataStoredOnTheNode = Object.keys(opts.def.properties).includes(
          key
        );

        if (!isDataStoredOnTheNode) return parsed;

        parsed[key as keyof TNodeData] = receivedData[key];
        return parsed;
      }, {} as { id: string; version: number } & DeepPartial<GetAllAvailableNodeDataType<{ TNodeData: TNodeData; TNodeComputedData: {} }>>);
    }
  }

  // eslint-disable-next-line
  // @ts-ignore
  return new Repository();
}
