export type NodeData = {
  type?: string;
  childNodes?: Array<NodeData>;
} & Record<string, any>;

export type TransactionOperation = {
  position: number;
};
