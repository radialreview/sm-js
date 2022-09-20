import { NodesCollectionPageOutOfBoundsException } from './exceptions';
import { Maybe } from './types';

export type PageInfoFromResults = {
  totalPages: number;
  hasNextPage: boolean;
  endCursor: string;
  startCursor: string;
};

export type ClientSidePageInfo = {
  lastQueriedPage: number;
  pageSize: number;
};

export type OnLoadMoreResultsCallback = () => Promise<
  Maybe<PageInfoFromResults>
>;
export type OnGoToNextPageCallback = () => Promise<Maybe<PageInfoFromResults>>;
export type OnGoToPreviousPageCallback = () => Promise<
  Maybe<PageInfoFromResults>
>;

export interface NodesCollectionOpts<T> {
  onLoadMoreResults: OnLoadMoreResultsCallback;
  onGoToNextPage: OnGoToNextPageCallback;
  onGoToPreviousPage: OnGoToPreviousPageCallback;
  items: T[];
  pageInfoFromResults: PageInfoFromResults;
  clientSidePageInfo: ClientSidePageInfo;
  useServerSidePaginationFilteringSorting: boolean;
}

export class NodesCollection<T> {
  private onLoadMoreResults: OnLoadMoreResultsCallback;
  private onGoToNextPage: OnGoToNextPageCallback;
  private onGoToPreviousPage: OnGoToPreviousPageCallback;
  private items: T[];
  private pageInfoFromResults: PageInfoFromResults;
  private clientSidePageInfo: ClientSidePageInfo;
  private useServerSidePaginationFilteringSorting: boolean;

  constructor(opts: NodesCollectionOpts<T>) {
    this.items = opts.items;

    this.pageInfoFromResults = opts.pageInfoFromResults;
    this.clientSidePageInfo = opts.clientSidePageInfo;
    this.useServerSidePaginationFilteringSorting =
      opts.useServerSidePaginationFilteringSorting;
    this.onLoadMoreResults = opts.onLoadMoreResults;
    this.onGoToNextPage = opts.onGoToNextPage;
    this.onGoToPreviousPage = opts.onGoToPreviousPage;
  }

  public get nodes() {
    if (this.useServerSidePaginationFilteringSorting) return this.items;
    // this is because when doing client side pagination, all the items in this collection are expected to already
    // be cached in this class' state
    return getPageResults({
      items: this.items,
      page: this.page,
      itemsPerPage: this.clientSidePageInfo.pageSize,
    });
  }

  public get hasNextPage() {
    return this.pageInfoFromResults.hasNextPage;
  }

  public get hasPreviousPage() {
    return this.clientSidePageInfo.lastQueriedPage > 1;
  }

  public get totalPages() {
    return this.pageInfoFromResults.totalPages;
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
    this.clientSidePageInfo.lastQueriedPage++;

    const newPageInfoFromResults = await this.onLoadMoreResults();
    if (newPageInfoFromResults)
      this.pageInfoFromResults = newPageInfoFromResults;
    else if (!this.useServerSidePaginationFilteringSorting) {
      this.setNewClientSidePageInfoAfterClientSidePaginationRequest();
    }
  }

  public async goToNextPage() {
    if (!this.hasNextPage) {
      throw new NodesCollectionPageOutOfBoundsException(
        'No next page available - check results.hasNextPage before calling goToNextPage'
      );
    }
    this.clientSidePageInfo.lastQueriedPage++;
    const newPageInfoFromResults = await this.onGoToNextPage();
    if (newPageInfoFromResults)
      this.pageInfoFromResults = newPageInfoFromResults;
    else if (!this.useServerSidePaginationFilteringSorting) {
      this.setNewClientSidePageInfoAfterClientSidePaginationRequest();
    }
  }

  public async goToPreviousPage() {
    if (!this.hasPreviousPage) {
      throw new NodesCollectionPageOutOfBoundsException(
        'No previous page available - check results.hasPreviousPage before calling goToPreviousPage'
      );
    }
    this.clientSidePageInfo.lastQueriedPage--;
    const newPageInfoFromResults = await this.onGoToPreviousPage();
    if (newPageInfoFromResults)
      this.pageInfoFromResults = newPageInfoFromResults;
    else if (!this.useServerSidePaginationFilteringSorting) {
      this.setNewClientSidePageInfoAfterClientSidePaginationRequest();
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
      totalPages: this.pageInfoFromResults.totalPages,
      hasNextPage:
        this.clientSidePageInfo.lastQueriedPage >=
        this.pageInfoFromResults.totalPages
          ? false
          : true,
      endCursor: this.pageInfoFromResults.endCursor,
      startCursor: this.pageInfoFromResults.startCursor,
    };
  }
}

function getPageResults<T>(opts: {
  items: T[];
  page: number;
  itemsPerPage: number;
}) {
  const startIndex = opts.page === 1 ? 0 : (opts.page - 1) * opts.itemsPerPage;
  return Array.from(opts.items || []).slice(
    startIndex,
    startIndex + opts.itemsPerPage
  );
}
