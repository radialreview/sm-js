import { NodesCollectionPageOutOfBoundsException } from './exceptions';
import { QueryState } from './types';

export type PageInfoFromResults = {
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string;
  startCursor: string;
};

export type ClientSidePageInfo = {
  lastQueriedPage: number;
  pageSize: number;
};

export type OnPaginationRequestStateChangedCallback = () => void;
export type OnLoadMoreResultsCallback = () => Promise<void>;
export type OnGoToNextPageCallback = () => Promise<void>;
export type OnGoToPreviousPageCallback = () => Promise<void>;

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

export class NodesCollection<TItemType, TIncludeTotalCount extends boolean> {
  private onLoadMoreResults: OnLoadMoreResultsCallback;
  private onGoToNextPage: OnGoToNextPageCallback;
  private onGoToPreviousPage: OnGoToPreviousPageCallback;
  private onPaginationRequestStateChanged: OnPaginationRequestStateChangedCallback;
  private items: TItemType[];
  private pageInfoFromResults: PageInfoFromResults;
  private clientSidePageInfo: ClientSidePageInfo;
  private useServerSidePaginationFilteringSorting: boolean;
  // when "loadMore" is used, we display more than 1 page
  // however, nothing in our code needs to know about this other than the "nodes"
  // getter below, which must return multiple pages of results when loadMore is executed
  private pagesBeingDisplayed: Array<number>;

  public loadingState = QueryState.IDLE as QueryState;
  public loadingError = null as any;

  constructor(opts: NodesCollectionOpts<TItemType>) {
    this.items = opts.items;

    this.pageInfoFromResults = opts.pageInfoFromResults;
    this.clientSidePageInfo = opts.clientSidePageInfo;
    this.useServerSidePaginationFilteringSorting =
      opts.useServerSidePaginationFilteringSorting;
    this.pagesBeingDisplayed = [opts.clientSidePageInfo.lastQueriedPage];
    this.onLoadMoreResults = opts.onLoadMoreResults;
    this.onGoToNextPage = opts.onGoToNextPage;
    this.onGoToPreviousPage = opts.onGoToPreviousPage;
    this.onPaginationRequestStateChanged = opts.onPaginationRequestStateChanged;
  }

  public get nodes() {
    if (this.useServerSidePaginationFilteringSorting) return this.items;
    // this is because when doing client side pagination, all the items in this collection are expected to already
    // be cached in this class' state
    return getPageResults({
      items: this.items,
      pages: this.pagesBeingDisplayed,
      itemsPerPage: this.clientSidePageInfo.pageSize,
    });
  }

  public get hasNextPage() {
    return this.pageInfoFromResults.hasNextPage;
  }

  public get hasPreviousPage() {
    return this.pageInfoFromResults.hasPreviousPage;
  }

  public get totalPages() {
    return this.pageInfoFromResults.totalPages;
  }

  public get totalCount(): TIncludeTotalCount extends true
    ? number
    : undefined {
    return this.pageInfoFromResults
      .totalCount as TIncludeTotalCount extends true ? number : undefined;
  }

  public get page() {
    return this.clientSidePageInfo.lastQueriedPage;
  }

  public async loadMore() {
    if (!this.hasNextPage) {
      throw new NodesCollectionPageOutOfBoundsException(
        'No more results available - check results.hasNextPage before calling loadMore'
      );
    }
    await this.withPaginationEventLoadingState(async () => {
      await this.onLoadMoreResults();
      this.clientSidePageInfo.lastQueriedPage++;
      this.pagesBeingDisplayed = [
        ...this.pagesBeingDisplayed,
        this.clientSidePageInfo.lastQueriedPage,
      ];
    });
  }

  public async goToNextPage() {
    if (!this.hasNextPage) {
      throw new NodesCollectionPageOutOfBoundsException(
        'No next page available - check results.hasNextPage before calling goToNextPage'
      );
    }

    await this.withPaginationEventLoadingState(async () => {
      await this.onGoToNextPage();
      this.clientSidePageInfo.lastQueriedPage++;
      this.pagesBeingDisplayed = [this.clientSidePageInfo.lastQueriedPage];
    });
  }

  public async goToPreviousPage() {
    if (!this.hasPreviousPage) {
      throw new NodesCollectionPageOutOfBoundsException(
        'No previous page available - check results.hasPreviousPage before calling goToPreviousPage'
      );
    }

    await this.withPaginationEventLoadingState(async () => {
      await this.onGoToPreviousPage();
      this.clientSidePageInfo.lastQueriedPage--;
      this.pagesBeingDisplayed = [this.clientSidePageInfo.lastQueriedPage];
    });
  }

  private async withPaginationEventLoadingState(
    promiseGetter: () => Promise<void>
  ) {
    this.loadingState = QueryState.LOADING;
    this.loadingError = null;
    try {
      // re-render ui with the new loading state
      this.onPaginationRequestStateChanged();
      await promiseGetter();
      this.loadingState = QueryState.IDLE;
    } catch (e) {
      this.loadingState = QueryState.ERROR;
      this.loadingError = e;
      throw e;
    } finally {
      if (!this.useServerSidePaginationFilteringSorting) {
        this.setNewClientSidePageInfoAfterClientSidePaginationRequest();
      }

      // re-render the ui with the new nodes and loading/error state
      this.onPaginationRequestStateChanged();
    }
  }

  public async goToPage(_: number) {
    throw new Error('Not implemented');
  }

  // as the name implies, only runs when client side pagination is executed
  // otherwise the onLoadMoreResults, onGoToNextPage, onGoToPreviousPage are expected to return the new page info
  // this is because when doing client side pagination, all the items in this collection are expected to already
  // be cached in this class' state
  private setNewClientSidePageInfoAfterClientSidePaginationRequest() {
    this.pageInfoFromResults = {
      totalCount: this.pageInfoFromResults.totalCount,
      totalPages: this.pageInfoFromResults.totalPages,
      hasNextPage:
        this.pageInfoFromResults.totalPages >
        this.clientSidePageInfo.lastQueriedPage,
      hasPreviousPage: this.clientSidePageInfo.lastQueriedPage > 1,
      endCursor: this.pageInfoFromResults.endCursor,
      startCursor: this.pageInfoFromResults.startCursor,
    };
  }
}

function getPageResults<T>(opts: {
  items: T[];
  pages: Array<number>;
  itemsPerPage: number;
}) {
  const inChunks = chunkArray(opts.items, opts.itemsPerPage);
  return opts.pages.map(pageNumber => inChunks[pageNumber - 1]).flat();
}

export const chunkArray = <T>(arr: T[], size: number): T[][] =>
  arr.length > size
    ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)]
    : [arr];
