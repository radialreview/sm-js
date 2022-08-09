interface PaginatedArrayOpts<T> {
    itemsPerPage: number;
    page: number;
    items: T[];
}
export declare class PaginatedArray<T> {
    itemsPerPage: number;
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
