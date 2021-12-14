export type EdgePermissions = {
  view?: boolean;
  edit?: boolean;
  manage?: boolean;
  terminate?: boolean;
  addChild?: boolean;
};

export type EdgeProperties = {
  type?: string;
  from: string;
  to: string;
  permissions: EdgePermissions;
};
