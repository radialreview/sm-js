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
}

export class NodesCollection<T> {
  private onLoadMoreResults: OnLoadMoreResultsCallback;
  private onGoToNextPage: OnGoToNextPageCallback;
  private onGoToPreviousPage: OnGoToPreviousPageCallback;
  private items: T[];
  private pageInfoFromResults: PageInfoFromResults;
  private clientSidePageInfo: ClientSidePageInfo;

  constructor(opts: NodesCollectionOpts<T>) {
    this.items = opts.items;

    this.pageInfoFromResults = opts.pageInfoFromResults;
    this.clientSidePageInfo = opts.clientSidePageInfo;
    this.onLoadMoreResults = opts.onLoadMoreResults;
    this.onGoToNextPage = opts.onGoToNextPage;
    this.onGoToPreviousPage = opts.onGoToPreviousPage;
  }

  public get nodes() {
    return this.items;
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
