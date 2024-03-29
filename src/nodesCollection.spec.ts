import { NodesCollection, NodesCollectionOpts } from './nodesCollection';

const items = [
  { firstName: 'User 1' },
  { firstName: 'User 2' },
  { firstName: 'User 3' },
  { firstName: 'User 4' },
  { firstName: 'User 5' },
];

const getMockNodesCollectionConstructorArgs = (): NodesCollectionOpts<typeof items[number]> => ({
  items,
  pageInfoFromResults: {
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: true,
    endCursor: 'xyz',
    startCursor: 'zyx',
  },
  totalCount: 5,
  clientSidePageInfo: {
    lastQueriedPage: 1,
    pageSize: 1,
  },
  onGoToNextPage: async () => {},
  onGoToPreviousPage: async () => {},
  onLoadMoreResults: async () => {},
  onPaginationRequestStateChanged: () => {},
  useServerSidePaginationFilteringSorting: false,
});

describe('NodesCollection', () => {
  test(`can paginate to next pages`, async () => {
    const arrayWithPagination = new NodesCollection(
      getMockNodesCollectionConstructorArgs()
    );
    expect(arrayWithPagination.nodes).toEqual([items[0]]);
    await arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[1]]);
    await arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[2]]);
    await arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[3]]);
    await arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[4]]);
  });

  test(`can paginate to previous pages`, async () => {
    const arrayWithPagination = new NodesCollection(
      getMockNodesCollectionConstructorArgs()
    );
    expect(arrayWithPagination.nodes).toEqual([items[0]]);
    await arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.nodes).toEqual([items[1]]);
    await arrayWithPagination.goToPreviousPage();
    expect(arrayWithPagination.nodes).toEqual([items[0]]);
  });

  test(`'totalPages' contains the totalPages from the pageInfo from results`, async () => {
    const arrayWithPagination = new NodesCollection(
      getMockNodesCollectionConstructorArgs()
    );
    expect(arrayWithPagination.totalPages).toEqual(
      getMockNodesCollectionConstructorArgs().pageInfoFromResults.totalPages
    );
  });

  test(`'totalCount' contains the totalCount from the pageInfo from results`, async () => {
    const arrayWithPagination = new NodesCollection(
      getMockNodesCollectionConstructorArgs()
    );
    expect(arrayWithPagination.totalCount).toEqual(
      getMockNodesCollectionConstructorArgs().totalCount
    );
  });

  test(`'hasNextPage' is set to 'true' if there are next pages to paginate`, async () => {
    const arrayWithPagination = new NodesCollection({
      ...getMockNodesCollectionConstructorArgs(),
      pageInfoFromResults: {
        ...getMockNodesCollectionConstructorArgs().pageInfoFromResults,
        hasNextPage: true,
      },
    });
    expect(arrayWithPagination.hasNextPage).toBe(true);
  });

  test(`'hasNextPage' is set to 'false' if there are no next pages to paginate.`, async () => {
    const arrayWithPagination = new NodesCollection({
      ...getMockNodesCollectionConstructorArgs(),
      pageInfoFromResults: {
        ...getMockNodesCollectionConstructorArgs().pageInfoFromResults,
        hasNextPage: false,
      },
    });
    expect(arrayWithPagination.hasNextPage).toBe(false);
  });

  test(`'hasPreviousPage' is set to 'true' if there are previous pages to paginate`, async () => {
    const arrayWithPagination = new NodesCollection(
      getMockNodesCollectionConstructorArgs()
    );
    await arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.hasPreviousPage).toBe(true);
  });

  test(`'hasPreviousPage' is set to 'false' if there are no previous pages to paginate.`, async () => {
    const args = getMockNodesCollectionConstructorArgs();
    const arrayWithPagination = new NodesCollection({
      ...args,
      pageInfoFromResults: {
        ...args.pageInfoFromResults,
        hasPreviousPage: false,
      },
    });
    expect(arrayWithPagination.hasPreviousPage).toBe(false);
  });
});
