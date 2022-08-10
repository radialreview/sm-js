export declare type OnPaginateCallback = (opts: {
    page: number;
    itemsPerPage: number;
}) => void;
interface PaginatedArrayOpts<T> {
    onPaginate?: OnPaginateCallback;
    itemsPerPage: number;
    page: number;
    items: T[];
}
export declare class PaginatedArray<T> {
    itemsPerPage: number;
    onPaginate?: OnPaginateCallback;
    page: number;
    items: T[];
    constructor(opts: PaginatedArrayOpts<T>);
    get value(): T[];
    get totalPages(): number;
    goToPage(page: number): void;
    get hasNextPage(): boolean;
    get hasPreviousPage(): boolean;
    goToNextPage(): void;
    goToPreviousPage(): void;
}
export {};
