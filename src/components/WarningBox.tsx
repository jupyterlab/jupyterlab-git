import { CardContent } from '@mui/material';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import * as React from 'react';
import { classes } from 'typestyle';
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
        root: classes(commitRoot, dirtyStagedFilesWarningBoxClass)
      }}
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
