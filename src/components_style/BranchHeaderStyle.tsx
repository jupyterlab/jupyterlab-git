import {
  style
} from 'typestyle/lib'

export const gitBranchStyle = style (
  {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'var(--md-grey-700)',
    zIndex: 1,
    boxShadow: 'var(--jp-toolbar-box-shadow)'
  }
)

export const gitBranchLabelStyle = style (
  {
    color: 'white',
    fontSize: 'var(--jp-ui-font-size1)',
    paddingLeft: '8px',
    paddingRight: '4px'
  }
)

export const gitSwitchBranchStyle = style (
  {
    display: 'none',
  }
)