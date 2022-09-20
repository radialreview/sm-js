import { NodesCollection, NodesCollectionOpts } from './nodesCollection';

const items = [
  { firstName: 'User 1' },
  { firstName: 'User 2' },
  { firstName: 'User 3' },
  { firstName: 'User 4' },
  { firstName: 'User 5' },
];

const mockNodesCollectionConstructorArgs: NodesCollectionOpts<typeof items[number]> = {
  items,
  pageInfoFromResults: {
    totalPages: 5,
    hasNextPage: true,
    endCursor: 'xyz',
    startCursor: 'zyx',
  },
  clientSidePageInfo: {
    lastQueriedPage: 1,
    pageSize: 1,
  },
  onGoToNextPage: async () => ({
    totalPages: 5,
    hasNextPage: true,
    endCursor: 'xyz',
    startCursor: 'zyx',
  }),
  onGoToPreviousPage: async () => ({
    totalPages: 5,
    hasNextPage: true,
    endCursor: 'xyz',
    startCursor: 'zyx',
  }),
  onLoadMoreResults: async () => ({
    totalPages: 5,
    hasNextPage: true,
    endCursor: 'xyz',
    startCursor: 'zyx',
  }),
  useServerSidePaginationFilteringSorting: false,
};

describe('NodesCollection', () => {
  test(`can paginate to next pages`, async () => {
    const arrayWithPagination = new NodesCollection(
      mockNodesCollectionConstructorArgs
    );
    expect(arrayWithPagination.nodes).toEqual([items[0]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[1]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[2]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[3]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[4]]);
  });

  test(`can paginate to previous pages`, async () => {
    const arrayWithPagination = new NodesCollection(
      mockNodesCollectionConstructorArgs
    );
    expect(arrayWithPagination.nodes).toEqual([items[0]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[1]]);
    arrayWithPagination.goToPreviousPage();
    expect(arrayWithPagination.nodes).toEqual([items[0]]);
  });

  test(`'totalPages' should return total pages base on 'itemsPerPage' and 'items' length`, async () => {
    const arrayWithPagination = new NodesCollection(
      mockNodesCollectionConstructorArgs
    );
    expect(arrayWithPagination.totalPages).toEqual(
      mockNodesCollectionConstructorArgs.pageInfoFromResults.totalPages
    );
  });

  test(`'hasNextPage' is set to 'true' if there are next pages to paginate`, async () => {
    const arrayWithPagination = new NodesCollection({
      ...mockNodesCollectionConstructorArgs,
      pageInfoFromResults: {
        ...mockNodesCollectionConstructorArgs.pageInfoFromResults,
        hasNextPage: true,
      },
    });
    expect(arrayWithPagination.hasNextPage).toBe(true);
  });

  test(`'hasNextPage' is set to 'false' if there are no next pages to paginate.`, async () => {
    const arrayWithPagination = new NodesCollection({
      ...mockNodesCollectionConstructorArgs,
      pageInfoFromResults: {
        ...mockNodesCollectionConstructorArgs.pageInfoFromResults,
        hasNextPage: false,
      },
    });
    expect(arrayWithPagination.hasNextPage).toBe(false);
  });

  test(`'hasPreviousPage' is set to 'true' if there are previous pages to paginate`, async () => {
    const arrayWithPagination = new NodesCollection(
      mockNodesCollectionConstructorArgs
    );
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.hasPreviousPage).toBe(true);
  });

  test(`'hasPreviousPage' is set to 'false' if there are no previous pages to paginate.`, async () => {
    const arrayWithPagination = new NodesCollection(
      mockNodesCollectionConstructorArgs
    );
    expect(arrayWithPagination.hasPreviousPage).toBe(false);
  });
});
