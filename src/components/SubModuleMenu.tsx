import { TranslationBundle } from '@jupyterlab/translation';
import ListItem from '@mui/material/ListItem';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import {
  listItemClass,
  listItemIconClass,
  nameClass,
  wrapperClass
} from '../style/BranchMenu';
import { desktopIcon } from '../style/icons';
import { Git, IGitExtension } from '../tokens';

const ITEM_HEIGHT = 24.8; // HTML element height for a single tag
const MIN_HEIGHT = 150; // Minimal HTML element height for the tags list
const MAX_HEIGHT = 400; // Maximal HTML element height for the tags list

/**
 * Interface describing component properties.
 */
export interface ISubModuleMenuProps {
  /**
   * Current list of tags.
   */
  subModuleList: Git.ISubModule[];

  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Interface describing component state.
 */
export interface ISubModuleMenuState {}

/**
 * React component for rendering a tag menu.
 */
export class SubModuleMenu extends React.Component<
  ISubModuleMenuProps,
  ISubModuleMenuState
> {
  /**
   * Returns a React component for rendering a tag menu.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ISubModuleMenuProps) {
    super(props);

    this.state = {};
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return <div className={wrapperClass}>{this._renderSubModuleList()}</div>;
  }

  /**
   * Renders list of tags.
   *
   * @returns React element
   */
  private _renderSubModuleList(): React.ReactElement {
    // Perform a "simple" filter... (TODO: consider implementing fuzzy filtering)

    const subModules = this.props.subModuleList;

    return (
      <FixedSizeList
        height={Math.min(
          Math.max(MIN_HEIGHT, subModules.length * ITEM_HEIGHT),
          MAX_HEIGHT
        )}
        itemCount={subModules.length}
        itemData={subModules}
        itemKey={(index, data) => data[index].name}
        itemSize={ITEM_HEIGHT}
        style={{ overflowX: 'hidden', paddingTop: 0, paddingBottom: 0 }}
        width={'auto'}
      >
        {this._renderItem}
      </FixedSizeList>
    );
  }

  /**
   * Renders a menu item.
   *
   * @param props Row properties
   * @returns React element
   */
  private _renderItem = (props: ListChildComponentProps): JSX.Element => {
    const { data, index, style } = props;
    const subModule = data[index] as Git.ISubModule;

    return (
      <ListItem
        button
        title={this.props.trans.__('SubModule: %1', subModule.name)}
        className={listItemClass}
        style={style}
      >
        <desktopIcon.react className={listItemIconClass} tag="span" />
        <span className={nameClass}>{subModule.name}</span>
      </ListItem>
    );
  };
}
