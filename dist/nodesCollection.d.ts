import { Maybe } from './types';
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
export declare type OnLoadMoreResultsCallback = () => Promise<Maybe<PageInfoFromResults>>;
export declare type OnGoToNextPageCallback = () => Promise<Maybe<PageInfoFromResults>>;
export declare type OnGoToPreviousPageCallback = () => Promise<Maybe<PageInfoFromResults>>;
export interface NodesCollectionOpts<T> {
    onLoadMoreResults: OnLoadMoreResultsCallback;
    onGoToNextPage: OnGoToNextPageCallback;
    onGoToPreviousPage: OnGoToPreviousPageCallback;
    items: T[];
    pageInfoFromResults: PageInfoFromResults;
    clientSidePageInfo: ClientSidePageInfo;
    useServerSidePaginationFilteringSorting: boolean;
}
export declare class NodesCollection<T> {
    private onLoadMoreResults;
    private onGoToNextPage;
    private onGoToPreviousPage;
    private items;
    private pageInfoFromResults;
    private clientSidePageInfo;
    private useServerSidePaginationFilteringSorting;
    private pagesBeingDisplayed;
    constructor(opts: NodesCollectionOpts<T>);
    get nodes(): T[];
    get hasNextPage(): boolean;
    get hasPreviousPage(): boolean;
    get totalPages(): number;
    get page(): number;
    loadMore(): Promise<void>;
    goToNextPage(): Promise<void>;
    goToPreviousPage(): Promise<void>;
    goToPage(_: number): Promise<void>;
    private setNewClientSidePageInfoAfterClientSidePaginationRequest;
}
export declare const chunkArray: <T>(arr: T[], size: number) => T[][];
