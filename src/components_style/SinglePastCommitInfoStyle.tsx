import {
  style
} from 'typestyle/lib'

export const commitStyle = style(
  {
    flex: '0 0 auto',
    margin: '0',
    width: '100%',
    padding: '0',
    fontSize: '12px',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    letterSpacing: '1px'
  }
)

export const headerStyle = style(
  {
    backgroundColor: 'var(--md-green-500)',
    color: 'white',
    display: 'inline-block',
    width: '100%',
    height: '30px',
  }

)

export const commitNumberLabelStyle = style (
  {
    overflow: 'hidden',
    float: 'left',
    width: '36%',
    padding: '10px 0px 10px 12px',
    textOverflow: 'ellipsis',
  }
)


export const commitAuthorLabelStyle = style (
  {
    float: 'left',
    padding: '10px 0px 10px 12px'
  }
)

export const commitAuthorIconStyle = style (
  {
    backgroundImage: 'var(--jp-Git-icon-author)',
    display: 'inline-block',
    height: '11px',
    width: '11px'
  }
)

export const commitLabelDateStyle = style (
  {
    float: 'right',
    padding: '10px'
  }
)

export const commitLabelMessageStyle = style (
  {
    clear: 'left',
    padding: '0 10px 10px 12px'
  }
)

export const commitSummaryLabelStyle = style (
  {
    width: '50%',
    fontWeight: 400
  }
)

export const commitFilesChangedStyle = style (
  {
    position: 'absolute',
    right: '80px',
    width: '15px',
    marginRight: '4px',
    float: 'right',
    marginTop: '10px'
  }
)

export const commitInsertionsMadeStyle = style (
  {
    position: 'absolute',
    right: '45px',
    width: '15px',
    marginRight: '4px',
    float: 'right',
    marginTop: '10px'
  }
)

export const commitDeletionsMadeStyle = style (
  {
    position: 'absolute',
    right: '12px',
    width: '15px',
    float: 'right',
    marginTop: '10px'
  }
)

export const commitDeletionsMadeColorStyle = style (
  {
    marginRight: '4px',
    width: '20px'
  }
)

export const commitInsertionsMadeColorStyle = style (
  {
    marginRight: '4px',
    width: '20px'
  }
)

export const commitDetailStyle = style (
  {
    flex: '1 1 auto',
    margin: '0',
    padding: '0',
    overflow: 'auto',

    $nest: {
      '&:hover': {
        backgroundColor: 'rgba(153,153,153,.1)'
      }
    }
  }
)

export const commitDetailFileStyle = style (
  {
    display: 'flex',
    flexDirection: 'row',
    color: 'var(--jp-ui-font-color1)',
    height: 'var(--jp-private-running-item-height)',
    lineHeight: 'var(--jp-private-running-item-height)',
    whiteSpace: 'nowrap'
  }
)

export const commitDetailFilePathStyle = style (
  {
    fontSize: 'var(--jp-ui-font-size1)',
    flex: '1 1 auto',
    marginRight: '4px',
    paddingLeft: '4px',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    borderRadius: '2px',
    maxWidth: '50%',
    minWidth: '30%',
    transition: 'background-color 0.1s ease'
  }
)

export const iconStyle = style (
  {
    display: 'inline-block',
    width: '30px',
    height: '11px',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '11px',
    position: 'absolute',
    right: '10px',
    marginRight: '5px'
  }
)

export const iconWhiteStyle = style (
  {
    border: 'none',
    marginRight: '0px'
  }
)

export const directoryIconWhiteStyle = style (
  {
    backgroundImage: 'var(--jp-Git-icon-directory-white)'
  }
)

export const insertionIconColorStyle = style (
  {
    backgroundImage: 'var(--jp-Git-icon-insertion-color)',
    position: 'absolute',
    right: '54px',
    marginTop: '7px'
  }
)

export const insertionIconWhiteStyle = style (
  {
    backgroundImage: 'var(--jp-Git-icon-insertion-white)'
  }
)

export const deletionIconColorStyle = style (
  {
    backgroundImage: 'var(--jp-Git-icon-deletion-color)',
    position: 'absolute',
    right: '17px',
    marginTop: '7px'
  }
)

export const deletionIconWhiteStyle = style (
  {
    backgroundImage: 'var(--jp-Git-icon-deletion-white)'
  }
)

export const numberOfDeletionsStyle = style (
  {
    position: 'absolute',
    right: '12px',
    width: '15px',
    marginTop: '1px'
  }
)

export const numberOfInsertionsStyle = style (
  {
    position: 'absolute',
    right: '50px',
    width: '15px',
    marginTop: '1px'
  }
)

export const modificationsStyle = style (
  {
    width: '40%'
  }
)