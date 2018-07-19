import {
  style
} from 'typestyle/lib'

export const disabledFileStyle = style (
  {
    opacity: 0.5
  }
)

export const discardWarningStyle = style (
  {
    color: 'var(--jp-ui-font-color1)',
    marginLeft: '20px',
    height: '50px'
  }
)

export const discardButtonStyle = style (
  {
    color: 'white'
  }
)

export const cancelDiscardButtonStyle = style (
  {
    backgroundColor: 'var(--jp-border-color0)'
  }
)

export const acceptDiscardButtonStyle = style (
  {
    backgroundColor: 'var(--jp-brand-color1)',
    marginLeft: '5px',
  }
)