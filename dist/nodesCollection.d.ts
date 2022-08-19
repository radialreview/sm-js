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
    page: number;
    private onPaginate?;
    private items;
    constructor(opts: NodesCollectionOpts<T>);
    get nodes(): T[];
    get totalPages(): number;
    goToPage(page: number): void;
    get hasNextPage(): boolean;
    get hasPreviousPage(): boolean;
    goToNextPage(): void;
    goToPreviousPage(): void;
}
export {};
