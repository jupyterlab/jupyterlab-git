import {
  style
} from 'typestyle/lib'

export const branchStyle = style (
  {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'var(--md-grey-700)',
    zIndex: 1,
    boxShadow: 'var(--jp-toolbar-box-shadow)'
  }
)

export const branchLabelStyle = style (
  {
    color: 'white',
    fontSize: 'var(--jp-ui-font-size1)',
    paddingLeft: '8px',
    paddingRight: '4px'
  }
)

export const switchBranchStyle = style (
  {
    display: 'none',
  }
)

export const branchIconStyle = style (
  {
    backgroundImage: 'var(--jp-Git-icon-branch)',
    display: 'inline-block',
    height: '14px',
    width: '14px',
    margin: '6px 10px -2px 0px',
    backgroundRepeat: 'no-repeat',
  }
)

export const branchDropdownStyle = style (
  {
    backgroundImage: 'var(--jp-image-caretdownwhite)',
    backgroundColor: 'transparent',
    flex: '0 0 auto',
    verticalAlign: 'middle',
    border: 'var(--md-grey-700)',
    borderRadius: '0',
    outline: 'none',
    width: '11px',
    height: '11px',
    marginTop: '8px',
    marginBottom: '2px',
    textIndent: '20px',
    '-webkit-appearance': 'none',
    '-moz-appearance': 'none',
  }
)