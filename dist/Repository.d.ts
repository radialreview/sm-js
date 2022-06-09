import { ISMData, SMDataDefaultFn, NodeDO, ISMNodeRepository } from './types';
/**
 * Returns an initialized instance of a repository for an SMNode
 */
export declare function RepositoryFactory<TNodeData extends Record<string, ISMData | SMDataDefaultFn>>(opts: {
    def: {
        type: string;
        properties: TNodeData;
    };
    DOClass: new (initialData?: Record<string, any>) => NodeDO;
    onDataReceived(opts: {
        data: {
            id: string;
        } & Record<string, any>;
        applyUpdateToDO: () => void;
    }): void;
    onDOConstructed?(DO: NodeDO): void;
    onDODeleted?(DO: NodeDO): void;
}): ISMNodeRepository;
