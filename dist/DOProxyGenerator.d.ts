import { IMMGQL, IData, DataDefaultFn, IDOProxy, INode, NodeDO, Maybe, RelationalQueryRecordEntry } from './types';
export declare function createDOProxyGenerator(mmGQLInstance: IMMGQL): <TNodeType extends string, TNodeData extends Record<string, IData<any, any, any> | DataDefaultFn>, TNodeComputedData extends Record<string, any>, TRelationalResults extends Record<string, IDOProxy | IDOProxy[]>>(opts: {
    node: INode<TNodeType, TNodeData, TNodeComputedData, {}, {}, import("./types").NodeComputedFns<TNodeData & {
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): import("./dataTypes").Data<TStringType, TStringType, undefined>;
            _default: import("./dataTypes").Data<"", "", undefined>;
            optional: import("./dataTypes").Data<Maybe<string>, Maybe<string>, undefined>;
        };
        dateCreated: {
            (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
            _default: import("./dataTypes").Data<number, string, undefined>;
            optional: import("./dataTypes").Data<Maybe<number>, Maybe<string>, undefined>;
        };
        dateLastModified: {
            (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
            _default: import("./dataTypes").Data<number, string, undefined>;
            optional: import("./dataTypes").Data<Maybe<number>, Maybe<string>, undefined>;
        };
        lastUpdatedBy: {
            <TStringType extends string = string>(defaultValue: TStringType): import("./dataTypes").Data<TStringType, TStringType, undefined>;
            _default: import("./dataTypes").Data<"", "", undefined>;
            optional: import("./dataTypes").Data<Maybe<string>, Maybe<string>, undefined>;
        };
        lastUpdatedClientTimestamp: {
            (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
            _default: import("./dataTypes").Data<number, string, undefined>;
            optional: import("./dataTypes").Data<Maybe<number>, Maybe<string>, undefined>;
        }; /**
         * When some data fetcher like "useQuery" requests some data we do not directly return the DO instances
         * Instead, we decorate each DO instance with a bit of functionality
         * Firstly, we add getters for relational results
         *      For example, if I request a list of todos and an assignee for each of those todos
         *        this proxy generator would be adding an "assignee" getter to each todo and
         *        that assignee getter would return a PROXIED DO for that user
         *
         * Why not just store that data on the do instance directly?
         *      For this case I just described it wouldn't be a problem, since a todo has a single assignee
         *      But imagine a scenario in which a developer is querying for a specific meeting and all active todos in that meeting
         *        and then lazily querying all the archived todos for that meeting.
         *        If the developer isn't extremely careful with naming collision (activeTodos vs archivedTodos distinction, vs just calling them "todos")
         *        it's easy to see how this would create a problem if both query sources are getting the same DO instance
         *
         *      To get around this problem, EACH REQUEST RESULT WILL RETURN ITS OWN INSTANCE OF A PROXIED DO
         *         so naming collision is never a problem.
         *
         *      This also gives us the benefit of support different paging results being displayed simultaneously, since again, the relation results from different
         *         queries will never overwrite each other.
         *
         *
         * Another use for this proxy is to ensure the developer receives helpful errors when they try to read some data that is not being subscribed to
         *      This means that if I query a list of users, request their "firstName" and "id", but then attempt to read user.lastName from the result of that query
         *      we don't just return the cached value, or undefined, because this is likely unintentional. Most apps will want to have real time data.
         *
         *      Instead, we'll throw an error and tell them - hey, you tried to read this property from this node type in this query, but you didn't request it/aren't subscribed to it!
         */
    }, TNodeComputedData>, NodeDO>;
    queryId: string;
    do: NodeDO;
    allPropertiesQueried: Array<string>;
    relationalResults: Maybe<TRelationalResults>;
    relationalQueries: Maybe<Record<string, RelationalQueryRecordEntry>>;
}) => Record<string, any> & import("./types").IDOMethods & import("./types").IDOAccessors & TRelationalResults & IDOProxy;
