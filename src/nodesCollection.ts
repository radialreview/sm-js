export type PagingInfoFromResults = {
  hasNextPage: boolean;
  endCursor: string;
};

export type OnLoadMoreResultsCallback = () => Promise<void>;

interface NodesCollectionOpts<T> {
  onLoadMoreResults: OnLoadMoreResultsCallback;
  items: T[];
  pagingInfoFromResults: PagingInfoFromResults;
}

export class NodesCollection<T> {
  private onLoadMoreResults: OnLoadMoreResultsCallback;
  private items: T[];
  private pagingInfoFromResults: PagingInfoFromResults;

  constructor(opts: NodesCollectionOpts<T>) {
    this.items = opts.items;

    this.pagingInfoFromResults = opts.pagingInfoFromResults;
    this.onLoadMoreResults = opts.onLoadMoreResults;
  }

  public get nodes() {
    return this.items;
  }

  public get hasNextPage() {
    return this.pagingInfoFromResults.hasNextPage;
  }

  public async loadMore() {
    return this.onLoadMoreResults();
  }
}
