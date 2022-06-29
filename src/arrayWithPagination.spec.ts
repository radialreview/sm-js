import { ArrayWithPagination } from './arrayWithPagination';

const items = [
  { firstName: 'User 1' },
  { firstName: 'User 2' },
  { firstName: 'User 3' },
  { firstName: 'User 4' },
  { firstName: 'User 5' },
];

describe('arrayWithPagination', () => {
  test(`can paginate to next pages`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 1,
      page: 1,
    });
    expect(arrayWithPagination.toArray()).toEqual([items[0]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.toArray()).toEqual([items[1]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.toArray()).toEqual([items[2]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.toArray()).toEqual([items[3]]);
    arrayWithPagination.goToNextPage();
    expect(arrayWithPagination.toArray()).toEqual([items[4]]);
  });

  test(`can paginate to previous pages`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 1,
      page: 5,
    });
    expect(arrayWithPagination.toArray()).toEqual([items[4]]);
    arrayWithPagination.goToPreviousPage();
    expect(arrayWithPagination.toArray()).toEqual([items[3]]);
    arrayWithPagination.goToPreviousPage();
    expect(arrayWithPagination.toArray()).toEqual([items[2]]);
    arrayWithPagination.goToPreviousPage();
    expect(arrayWithPagination.toArray()).toEqual([items[1]]);
    arrayWithPagination.goToPreviousPage();
    expect(arrayWithPagination.toArray()).toEqual([items[0]]);
  });

  test(`can paginate to specific pages`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 1,
      page: 1,
    });
    expect(arrayWithPagination.toArray()).toEqual([items[0]]);
    arrayWithPagination.goToPage(3);
    expect(arrayWithPagination.toArray()).toEqual([items[2]]);
    arrayWithPagination.goToPage(2);
    expect(arrayWithPagination.toArray()).toEqual([items[1]]);
  });

  test(`'totalPages' should return total pages base on 'itemsPerPage' and 'items' length`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 2,
      page: 1,
    });
    expect(arrayWithPagination.totalPages).toEqual(3);
  });

  test(`'hasNextPage' is set to 'true' if there are next pages to paginate`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 1,
      page: 1,
    });
    expect(arrayWithPagination.hasNextPage).toBe(true);
  });

  test(`'hasNextPage' is set to 'false' if there are no next pages to paginate.`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 1,
      page: 5,
    });
    expect(arrayWithPagination.hasNextPage).toBe(false);
  });

  test(`'hasPreviousPage' is set to 'true' if there are previous pages to paginate`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 1,
      page: 2,
    });
    expect(arrayWithPagination.hasPreviousPage).toBe(true);
  });

  test(`'hasPreviousPage' is set to 'false' if there are no previous pages to paginate.`, async () => {
    const arrayWithPagination = new ArrayWithPagination({
      items,
      itemsPerPage: 1,
      page: 1,
    });
    expect(arrayWithPagination.hasPreviousPage).toBe(false);
  });
});
