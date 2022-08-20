import { NodesCollectionPageOutOfBoundsException } from './exceptions';

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

export type OnPaginateCallback = (opts: {
  page: number;
  itemsPerPage: number;
}) => void;

interface NodesCollectionOpts<T> {
  onPaginate?: OnPaginateCallback;
  itemsPerPage: number;
  page: number;
  items: T[];
}
export class NodesCollection<T> {
  public itemsPerPage: number;
  public page: number;
  private onPaginate?: OnPaginateCallback;
  private items: T[];

  constructor(opts: NodesCollectionOpts<T>) {
    this.itemsPerPage = opts.itemsPerPage;
    this.page = opts.page;
    this.items = opts.items;
    this.onPaginate = opts.onPaginate;
  }

  public get nodes() {
    return getPageResults({
      items: this.items,
      page: this.page,
      itemsPerPage: this.itemsPerPage,
    });
  }

  public get totalPages() {
    return Math.ceil((this.items || []).length / this.itemsPerPage);
  }

  public goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      throw new NodesCollectionPageOutOfBoundsException({ page });
    }
    this.page = page;
    this.onPaginate &&
      this.onPaginate({ page, itemsPerPage: this.itemsPerPage });
  }

  public get hasNextPage() {
    return this.totalPages > this.page;
  }

  public get hasPreviousPage() {
    return this.page > 1;
  }

  public goToNextPage() {
    if (!this.hasNextPage) {
      return;
    }
    this.goToPage(this.page + 1);
  }

  public goToPreviousPage() {
    if (!this.hasPreviousPage) {
      return;
    }
    this.goToPage(this.page - 1);
  }
}