import { IData, DataDefaultFn, NodeDO, INodeRepository } from './types';
/**
 * Returns an initialized instance of a repository for a Node
 */
export declare function RepositoryFactory<TNodeData extends Record<string, IData | DataDefaultFn>>(opts: {
    def: {
        type: string;
        properties: TNodeData;
    };
    DOClass: new (initialData?: Record<string, any>) => NodeDO;
    onDataReceived(opts: {
        data: {
            id: string | number;
        } & Record<string, any>;
        applyUpdateToDO: () => void;
    }): void;
    onDOConstructed?(DO: NodeDO): void;
    onDODeleted?(DO: NodeDO): void;
}): INodeRepository;
