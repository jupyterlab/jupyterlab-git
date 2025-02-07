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
import { submoduleHeaderStyle } from '../style/SubmoduleMenuStyle';
import { desktopIcon } from '../style/icons';
import { Git, IGitExtension } from '../tokens';

const ITEM_HEIGHT = 24.8; // HTML element height for a single item
const MIN_HEIGHT = 150; // Minimal HTML element height for the list
const MAX_HEIGHT = 400; // Maximal HTML element height for the list

/**
 * Interface describing component properties.
 */
export interface ISubmoduleMenuProps {
  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * The list of submodules in the repo
   */
  submodules: Git.ISubmodule[];

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Interface describing component state.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISubmoduleMenuState {}

/**
 * React component for rendering a submodule menu.
 */
export class SubmoduleMenu extends React.Component<
  ISubmoduleMenuProps,
  ISubmoduleMenuState
> {
  /**
   * Returns a React component for rendering a submodule menu.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ISubmoduleMenuProps) {
    super(props);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return <div className={wrapperClass}>{this._renderSubmoduleList()}</div>;
  }

  /**
   * Renders list of submodules.
   *
   * @returns React element
   */
  private _renderSubmoduleList(): React.ReactElement {
    const submodules = this.props.submodules;

    return (
      <>
        <div className={submoduleHeaderStyle}>Submodules</div>
        <FixedSizeList
          height={Math.min(
            Math.max(MIN_HEIGHT, submodules.length * ITEM_HEIGHT),
            MAX_HEIGHT
          )}
          itemCount={submodules.length}
          itemData={submodules}
          itemKey={(index, data) => data[index].name}
          itemSize={ITEM_HEIGHT}
          style={{
            overflowX: 'hidden',
            paddingTop: 0,
            paddingBottom: 0
          }}
          width={'auto'}
        >
          {this._renderItem}
        </FixedSizeList>
      </>
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
    const submodule = data[index] as Git.ISubmodule;

    return (
      <ListItem
        title={this.props.trans.__('Submodule: %1', submodule.name)}
        className={listItemClass}
        role="listitem"
        style={style}
      >
        <desktopIcon.react className={listItemIconClass} tag="span" />
        <span className={nameClass}>{submodule.name}</span>
      </ListItem>
    );
  };
}
