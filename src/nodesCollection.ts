import { NodesCollectionPageOutOfBoundsException } from './exceptions';

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

export type OnLoadMoreResultsCallback = () => Promise<PageInfoFromResults>;
export type OnGoToNextPageCallback = () => Promise<PageInfoFromResults>;
export type OnGoToPreviousPageCallback = () => Promise<PageInfoFromResults>;

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
    this.clientSidePageInfo.lastQueriedPage++;
    const newPageInfoFromResults = await this.onLoadMoreResults();
    this.pageInfoFromResults = newPageInfoFromResults;
  }

  public async goToNextPage() {
    this.clientSidePageInfo.lastQueriedPage++;
    const newPageInfoFromResults = await this.onGoToNextPage();
    this.pageInfoFromResults = newPageInfoFromResults;
  }

  public async goToPreviousPage() {
    if (!this.hasPreviousPage) {
      throw new NodesCollectionPageOutOfBoundsException(
        'No previous page available'
      );
    }
    this.clientSidePageInfo.lastQueriedPage--;
    const newPageInfoFromResults = await this.onGoToPreviousPage();
    this.pageInfoFromResults = newPageInfoFromResults;
  }

  public async goToPage(_: number) {
    throw new Error('Not implemented');
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
