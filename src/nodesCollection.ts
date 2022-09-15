export type PageInfoFromResults = {
  hasNextPage: boolean;
  endCursor: string;
};

export type OnLoadMoreResultsCallback = () => Promise<void>;

interface NodesCollectionOpts<T> {
  onLoadMoreResults: OnLoadMoreResultsCallback;
  items: T[];
  pageInfoFromResults: PageInfoFromResults;
}

export class NodesCollection<T> {
  private onLoadMoreResults: OnLoadMoreResultsCallback;
  private items: T[];
  private pageInfoFromResults: PageInfoFromResults;

  constructor(opts: NodesCollectionOpts<T>) {
    this.items = opts.items;

    this.pageInfoFromResults = opts.pageInfoFromResults;
    this.onLoadMoreResults = opts.onLoadMoreResults;
  }

  public get nodes() {
    return this.items;
  }

  public get hasNextPage() {
    return this.pageInfoFromResults.hasNextPage;
  }

  public async loadMore() {
    return this.onLoadMoreResults();
  }
}
