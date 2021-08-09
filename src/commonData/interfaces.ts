import { Git } from '../tokens';

export enum SecretScopes {
  PROJECT = 'project',
  FOLDER = 'folder',
  CLOUD = 'cloud'
}

export interface ISecret {
  secret_id: string;
  name: string;
  content_hash: string;
  scope: SecretScopes;
  is_owner: boolean;
  updated_at: number;
  is_active: boolean;
}

export type IGetSecretsListResponse = Partial<Record<SecretScopes, ISecret[]>>;

export type ISecretsDropDownListProps = {
  secrets: IGetSecretsListResponse;
  defaultValue?: string;
  onSecretChange: (value: string) => any;
};

export type IClassNameProps = {
  className?: string;
};

export type IShowDialogResult = {
  value?: Git.IAuth;
  isSubmited: boolean;
};

export type IJupyterOkButtonProps = {
  title?: string;
  onClick?: () => any;
};
