import { NodesCollectionPageOutOfBoundsException } from './exceptions';

export type PageInfoFromResults = {
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string;
  startCursor: string;
};

export type ClientSidePageInfo = {
  lastQueriedPage: number;
  pageSize: number;
};

export type OnLoadMoreResultsCallback = () => Promise<void>;
export type OnGoToNextPageCallback = () => Promise<void>;
export type OnGoToPreviousPageCallback = () => Promise<void>;

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
  // when "loadMore" is used, we display more than 1 page
  // however, nothing in our code needs to know about this other than the "nodes"
  // getter below, which must return multiple pages of results when loadMore is executed
  private pagesBeingDisplayed: Array<number>;

  constructor(opts: NodesCollectionOpts<T>) {
    this.items = opts.items;

    this.pageInfoFromResults = opts.pageInfoFromResults;
    this.clientSidePageInfo = opts.clientSidePageInfo;
    this.useServerSidePaginationFilteringSorting =
      opts.useServerSidePaginationFilteringSorting;
    this.pagesBeingDisplayed = [opts.clientSidePageInfo.lastQueriedPage];
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
      pages: this.pagesBeingDisplayed,
      itemsPerPage: this.clientSidePageInfo.pageSize,
    });
  }

  public get hasNextPage() {
    return this.pageInfoFromResults.hasNextPage;
  }

  public get hasPreviousPage() {
    if (this.useServerSidePaginationFilteringSorting) {
      return this.pageInfoFromResults.hasPreviousPage;
    } else {
      return this.clientSidePageInfo.lastQueriedPage > 1;
    }
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
    this.pagesBeingDisplayed = [
      ...this.pagesBeingDisplayed,
      this.clientSidePageInfo.lastQueriedPage,
    ];

    await this.onLoadMoreResults();

    if (!this.useServerSidePaginationFilteringSorting) {
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
    this.pagesBeingDisplayed = [this.clientSidePageInfo.lastQueriedPage];

    await this.onGoToNextPage();

    if (!this.useServerSidePaginationFilteringSorting) {
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
    this.pagesBeingDisplayed = [this.clientSidePageInfo.lastQueriedPage];

    await this.onGoToPreviousPage();

    if (!this.useServerSidePaginationFilteringSorting) {
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
