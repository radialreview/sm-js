import { Maybe, QueryState } from './types';
export declare type PageInfoFromResults = {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor: string;
    startCursor: string;
};
export declare type ClientSidePageInfo = {
    lastQueriedPage: number;
    pageSize: number;
};
export declare type OnPaginationRequestStateChangedCallback = () => void;
export declare type OnLoadMoreResultsCallback = () => Promise<void>;
export declare type OnGoToNextPageCallback = () => Promise<void>;
export declare type OnGoToPreviousPageCallback = () => Promise<void>;
export interface NodesCollectionOpts<T> {
    onLoadMoreResults: OnLoadMoreResultsCallback;
    onGoToNextPage: OnGoToNextPageCallback;
    onGoToPreviousPage: OnGoToPreviousPageCallback;
    onPaginationRequestStateChanged: OnPaginationRequestStateChangedCallback;
    items: T[];
    pageInfoFromResults: PageInfoFromResults;
    totalCount: Maybe<number>;
    clientSidePageInfo: ClientSidePageInfo;
    useServerSidePaginationFilteringSorting: boolean;
}
export declare class NodesCollection<TNodesCollectionArgs extends {
    TItemType: unknown;
    TIncludeTotalCount: boolean;
}> {
    private onLoadMoreResults;
    private onGoToNextPage;
    private onGoToPreviousPage;
    private onPaginationRequestStateChanged;
    private items;
    private pageInfoFromResults;
    private clientSidePageInfo;
    private useServerSidePaginationFilteringSorting;
    private pagesBeingDisplayed;
    loadingState: QueryState;
    loadingError: any;
    totalCount: TNodesCollectionArgs['TIncludeTotalCount'] extends true ? number : undefined;
    constructor(opts: NodesCollectionOpts<TNodesCollectionArgs['TItemType']>);
    get nodes(): TNodesCollectionArgs["TItemType"][];
    get hasNextPage(): boolean;
    get hasPreviousPage(): boolean;
    get totalPages(): number;
    get page(): number;
    loadMore(): Promise<void>;
    goToNextPage(): Promise<void>;
    goToPreviousPage(): Promise<void>;
    private withPaginationEventLoadingState;
    goToPage(_: number): Promise<void>;
    private setNewClientSidePageInfoAfterClientSidePaginationRequest;
}
export declare const chunkArray: <T>(arr: T[], size: number) => T[][];
