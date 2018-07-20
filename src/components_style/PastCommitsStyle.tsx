import {
  style
} from 'typestyle/lib'


export const gitTimelineStyle = style(
  {
    backgroundColor: 'var(--jp-ui-font-color1)',
    height: '70px',
    position: 'relative'
  }
)

export const gitTimelineContainerStyle = style(
  {
    backgroundColor: 'var(--jp-ui-font-color1)',
    width: '92%',
    paddingTop: '20px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    height: '50px',
    zIndex: 0,
    position: 'absolute',
    paddingRight: '8%'
  }
)

export const gitCurrentCommitStyle = style (
  {
    position: 'relative',
    color: 'var(--jp-ui-font-color1)',
    width: '28px',
    height: '28px',
    paddingBottom: '10px',
    backgroundColor: 'rgba(53,53,153,.1)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '100%',
    boxShadow: 'none',
    borderRadius: '50%',
    border: '2.72px dotted #e0e0e0',
    outline: 'none !important',
    zIndex: 1, /* raise overlapping border */
    top: '-2.7px',
  }
)

export const gitCurrentCommitModifiedStyle = style (
  {
    border: '2.72px dotted #4caf50'
  }
)

export const gitCurrentCommitActiveStyle = style (
  {
    transition: '.5s border-color, .5s height, .5s width, .5s margin-top, .5s margin-right',
    position: 'absolute',
    top: '20px',
    borderWidth: '2.68px'
  }
)

export const gitCurrentCommitActiveModifiedStyle = style (
  {
    height: '16px',
    width: '16px',
    marginTop: '6px',
    marginRight: '5px',
    border: '2.72px dotted #4caf50'
  }
)

export const gitCurrentCommitContainerStyle = style (
  {
    color: 'lightgray',
    flex: '0 0 auto',
    minWidth: '50px',
    minHeight: '50px',
    maxWidth: '50px',
    maxHeight: '50px',
    letterSpacing: '-1px'
  }
)

export const gitPastCommitStyle = style (
  {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    zIndex: 1,
    outline: 'none !important',
    backgroundColor: '#0a0a0a',  
    borderWidth: '1.0px',
    borderStyle: 'solid',
    borderColor: '#e0e0e0'
  }
)

export const gitPastCommitModifiedStyle = style (
  {
    border: '2.0px solid #4caf50'
  }
)

export const gitPastCommitActiveStyle = style (
  {
    transition: '.5s border-color, .5s height, .5s width, .5s margin-top, .5s margin-right',
    position: 'absolute',
  }
)

export const gitPastCommitActiveModifiedStyle = style (
  {
    height: '16px',
    width: '16px',
    marginTop: '6px',
    marginRight: '6px',
    border: '2.0px solid #4caf50'
  }
)

export const gitCommitIndexStyle = style (
  {
    color: 'white',
    visibility: 'hidden'
  }
)