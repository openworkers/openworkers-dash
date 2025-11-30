export interface INameDesc {
  name: string;
  desc: string | null;
}

export interface IResourceCommon extends INameDesc {
  id: string;
  createdAt: string;
  updatedAt: string;
}
