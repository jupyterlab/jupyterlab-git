import * as React from 'react';
import {
  ISecretsDropDownListProps,
  IJupyterOkButtonProps,
  IClassNameProps,
  ISecret
} from './interfaces';
import { caretDownEmptyIcon } from '@jupyterlab/ui-components';

const buildOption = (secret: ISecret) =>
  secret.is_active ? (
    <option value={secret.name} key={secret.secret_id}>
      {secret.name}
    </option>
  ) : (
    undefined
  );

const SecretsDropDownList = React.forwardRef<
  HTMLSelectElement,
  ISecretsDropDownListProps & IClassNameProps
>(({ secrets, onSecretChange, defaultValue }, ref) => {
  const onChange = React.useCallback(
    (el: React.ChangeEvent<HTMLSelectElement>) => {
      return onSecretChange(el.target.value);
    },
    []
  );

  return (
    <div className="datasphere-modal__field datasphere-modal__field_vertical">
      <div className="datasphere-modal__field-right datasphere-modal__field-right_vertical">
        <div className="jp-select-wrapper">
          <select
            placeholder="secret"
            className="jp-mod-styled s3-form__select"
            ref={ref}
            onChange={onChange}
            defaultValue={defaultValue || ''}
          >
            <option disabled value="">
              {'Select secret'}
            </option>
            {secrets.cloud && secrets.cloud.map(buildOption)}
            {secrets.folder && secrets.folder.map(buildOption)}
            {secrets.project && secrets.project.map(buildOption)}
          </select>
        </div>
        <span>
          <caretDownEmptyIcon.react className="s3-form__select-arrow" />
        </span>
      </div>
    </div>
  );
});

SecretsDropDownList.propTypes = {};
SecretsDropDownList.displayName = 'SecretsDropDownList';

const JupyterSpinerComponent: React.FC<IClassNameProps> = ({ className }) => {
  return (
    <div className={`lm-Widget p-Widget jp-Spinner ${className}`} tabIndex={-1}>
      <div className="jp-SpinnerContent" />
    </div>
  );
};

const JupyterButtonComponent: React.FC<
  IJupyterOkButtonProps & IClassNameProps
> = ({ className, title, onClick }) => {
  return (
    <button
      className={`jp-Dialog-button jp-mod-styled ${className}`}
      onClick={onClick}
    >
      <div className="jp-Dialog-buttonIcon" />
      <div className="jp-Dialog-buttonLabel" title="">
        {title || 'OK'}
      </div>
    </button>
  );
};

export { SecretsDropDownList, JupyterSpinerComponent, JupyterButtonComponent };
