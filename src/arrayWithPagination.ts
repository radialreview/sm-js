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

export class ArrayWithPagination<T> extends Array<T> {
  public itemsPerPage: number;
  public currentPage: number;
  private allItems: T[];
  public totalPages: number;
  constructor(opts: { items: T[]; itemsPerPage: number; page: number }) {
    super(...getPageResults(opts));
    this.allItems = opts.items;
    this.itemsPerPage = opts.itemsPerPage;
    this.currentPage = opts.page;
    this.totalPages = Math.ceil((opts.items || []).length / opts.itemsPerPage);
  }

  public goToPage(page: number) {
    const results = getPageResults({
      page,
      items: this.allItems || [],
      itemsPerPage: this.itemsPerPage,
    });
    this.splice(0, (Array.from(this.allItems || []) || []).length);
    results.forEach(item => this.push(item));
    this.currentPage = page;
  }

  public get hasNextPage() {
    return this.totalPages > this.currentPage;
  }

  public get hasPreviousPage() {
    return this.currentPage > 1;
  }

  public goToNextPage() {
    if (!this.hasNextPage) {
      return;
    }
    this.goToPage(this.currentPage + 1);
  }

  public goToPreviousPage() {
    if (!this.hasPreviousPage) {
      return;
    }
    this.goToPage(this.currentPage - 1);
  }

  public toArray(): T[] {
    return Array.from(this);
  }
}
