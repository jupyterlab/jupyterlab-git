import * as React from 'react';
import { Dialog } from '@jupyterlab/apputils';
import { updateSecretsList } from '../commonData/service';
import {
  IGetSecretsListResponse,
  IShowDialogResult
} from '../commonData/interfaces';
import {
  SecretsDropDownList,
  JupyterSpinerComponent
} from '../commonData/components';
import {
  RedirectFormDialog_ContentClass,
  RedirectFormDialog_DropDownListWrapperClass,
  RedirectFormDialog_usernameInputClass,
  RedirectFormDialog_WarningClass
} from '../style/RedirectFormDialog';
import { Git } from '../tokens';

export async function ShowReactDialog(
  warningMess = '',
  prevFormValue?: Git.IAuth
): Promise<IShowDialogResult> {
  const ocButton = Dialog.okButton({ label: 'OK' });
  const result: IShowDialogResult = {
    isSubmited: false,
    value: {
      password_secret: prevFormValue.password_secret,
      username: prevFormValue.username
    }
  };

  const Body: React.FC<{}> = () => {
    const [loading, setLoading] = React.useState<boolean>(true);
    const [secrets, setSecrets] = React.useState<IGetSecretsListResponse>({});

    React.useEffect(() => {
      updateSecretsList().then((data: IGetSecretsListResponse) => {
        setSecrets(data);
        setLoading(false);
      });
    }, []);

    const usernameInputChange = React.useCallback(
      (el: React.ChangeEvent<HTMLInputElement>) => {
        result.value.username = el.target.value;
      },
      []
    );

    const secretSelectChange = React.useCallback((value: string) => {
      result.value.password_secret = value;
    }, []);

    return (
      <div className={'RedirectFormDialog'}>
        <div className={RedirectFormDialog_ContentClass}>
          <span>{'Enter credentials for remote repository'}</span>
          <input
            placeholder={'username'}
            onChange={usernameInputChange}
            className={RedirectFormDialog_usernameInputClass}
            defaultValue={prevFormValue.username}
          />
          {loading ? (
            <JupyterSpinerComponent />
          ) : (
            <div className={RedirectFormDialog_DropDownListWrapperClass}>
              <SecretsDropDownList
                defaultValue={prevFormValue.password_secret}
                secrets={secrets}
                onSecretChange={secretSelectChange}
              />
            </div>
          )}
          {warningMess && (
            <div
              className={`jp-RedirectForm-warning ${RedirectFormDialog_WarningClass}`}
            >
              {warningMess}
            </div>
          )}
        </div>
      </div>
    );
  };

  const dialog = new Dialog({
    title: 'Git credentials required',
    body: <Body />,
    buttons: [Dialog.cancelButton(), ocButton]
  });

  return new Promise<IShowDialogResult>(res => {
    dialog.launch().then(({ button }) => {
      result.isSubmited = button === ocButton;

      res(result);
    });
  });
}

type IShowReactDialogValidator = (_: {
  username: string;
  password_secret: string;
}) => { isCorrect: boolean; ans: string };
export const ShowReactDialogValidator: IShowReactDialogValidator = ({
  username,
  password_secret
}) => {
  let errorMess = '';

  if (username === '') {
    errorMess += 'Username should not be empty.\n';
  }

  if (password_secret === '') {
    errorMess += 'Password_secret should not be empty';
  }

  return {
    isCorrect: username !== '' && password_secret !== '',
    ans: errorMess
  };
};
