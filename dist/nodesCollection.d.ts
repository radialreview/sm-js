export declare type OnPaginateCallback = (opts: {
    page: number;
    itemsPerPage: number;
}) => void;
interface NodesCollectionOpts<T> {
    onPaginate?: OnPaginateCallback;
    itemsPerPage: number;
    page: number;
    items: T[];
}
export declare class NodesCollection<T> {
    itemsPerPage: number;
    onPaginate?: OnPaginateCallback;
    page: number;
    items: T[];
    constructor(opts: NodesCollectionOpts<T>);
    get value(): T[];
    get totalPages(): number;
    goToPage(page: number): void;
    get hasNextPage(): boolean;
    get hasPreviousPage(): boolean;
    goToNextPage(): void;
    goToPreviousPage(): void;
}
export {};
