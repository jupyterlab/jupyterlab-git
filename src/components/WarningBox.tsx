import { CardContent } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import * as React from 'react';
import {
  commitRoot,
  dirtyStagedFilesWarningBoxClass,
  dirtyStagedFilesWarningBoxContentClass,
  dirtyStagedFilesWarningBoxHeaderClass
} from '../style/CommitBox';

/**
 * Interface describing the properties of the warning box component.
 */
export interface IWarningBoxProps {
  /**
   * The warning box's header icon.
   */
  headerIcon?: JSX.Element;
  /**
   * The warning box's header text.
   */
  title: string;
  /**
   * The warning box's content text.
   */
  content: string;
}

/**
 * Warning box component.
 */
export function WarningBox(props: IWarningBoxProps): JSX.Element {
  return (
    <Card
      classes={{
        root: commitRoot
      }}
      className={dirtyStagedFilesWarningBoxClass}
      variant="outlined"
    >
      <CardHeader
        className={dirtyStagedFilesWarningBoxHeaderClass}
        avatar={props.headerIcon}
        title={props.title}
        disableTypography={true}
      />
      <CardContent className={dirtyStagedFilesWarningBoxContentClass}>
        {props.content}
      </CardContent>
    </Card>
  );
}
