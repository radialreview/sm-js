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
export declare enum ENodeCollectionLoadingState {
    'IDLE' = "IDLE",
    'LOADING' = "LOADING",
    'ERROR' = "ERROR"
}
export interface NodesCollectionOpts<T> {
    onLoadMoreResults: OnLoadMoreResultsCallback;
    onGoToNextPage: OnGoToNextPageCallback;
    onGoToPreviousPage: OnGoToPreviousPageCallback;
    onPaginationRequestStateChanged: OnPaginationRequestStateChangedCallback;
    items: T[];
    pageInfoFromResults: PageInfoFromResults;
    clientSidePageInfo: ClientSidePageInfo;
    useServerSidePaginationFilteringSorting: boolean;
}
export declare class NodesCollection<T> {
    private onLoadMoreResults;
    private onGoToNextPage;
    private onGoToPreviousPage;
    private onPaginationRequestStateChanged;
    private items;
    private pageInfoFromResults;
    private clientSidePageInfo;
    private useServerSidePaginationFilteringSorting;
    private pagesBeingDisplayed;
    loadingState: ENodeCollectionLoadingState;
    loadingError: any;
    constructor(opts: NodesCollectionOpts<T>);
    get nodes(): T[];
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
