import {
  style
} from 'typestyle/lib'

export const fileStyle = style (
  {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    color: 'var(--jp-ui-font-color1)',
    height: '25px',
    lineHeight: 'var(--jp-private-running-item-height)',
    paddingLeft: '4px',
    listStyleType: 'none',

    $nest: {
      '&:hover': {
        backgroundColor: 'rgba(153,153,153,.1)'
      },
      '&:hover .jp-Git-button': {
        visibility: 'visible'
      }
    }
  }
)

export const expandedFileStyle = style (
  {
    height: '75px',
  }
)

export const discardAllWarningStyle = style (
  {
    height: '40px !important',

    $nest: {
      '& button': {
        marginTop: '5px'
      }
    }
  }
)

export const fileGitButtonStyle = style (
  {
    visibility: 'hidden',
    display: 'inline'
  }
)

export const fileLabelStyle = style (
  {
    fontSize: 'var(--jp-ui-font-size1)',
    flex: '1 1 auto',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    borderRadius: '2px',
    transition: 'background-color 0.1s ease',

    $nest: {
      '&:focus': {
        backgroundColor: 'var(--jp-layout-color3)'
      }
    }
  }
)

export const fileIconStyle = style (
  {
    flex: '0 0 auto',
    padding: '0px 8px',
    marginRight: '4px',
    verticalAlign: 'baseline',
    backgroundSize: '16px',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  }
)

export const textInputStyle = style (
  {
    outline: 'none'
  }
)

export const sectionFileContainerStyle = style (
  {
      flex: '1 1 auto',
      margin: '0',
      padding: '0',
      overflow: 'auto',

      $nest: {
        '& button:disabled': {
          opacity: 0.5
        }
      }
  }
)

export const sectionFileContainerDisabledStyle = style (
  {
    opacity: 0.5
  }
)

export const stagedAreaStyle = style (
  {
    display: 'flex',
    alignItems: 'center',
    color: 'white',
    backgroundColor: 'var(--md-green-500)',
    flex: '0 0 auto',
    height: '30px',
    fontWeight: 400,
    letterSpacing: '1px',
    fontSize: '12px',
    paddingLeft: '12px'
  }
)

export const stagedCommitStyle = style (
  {
    resize: 'none',
    display: 'flex',
    alignItems: 'center',
    margin: '8px'
  }
)

export const stagedCommitMessageStyle = style (
  {
    width: '75%',
    fontWeight: 300,
    height: '32px',
    overflowX: 'auto',
    border: 'var(--jp-border-width) solid var(--jp-border-color2)',
    flex: '20 1 auto',
    resize: 'none',
    padding: '4px 8px',

    $nest: {
      '&:focus': {
        outline: 'none'
      }
    }
  }
)

export const stagedCommitButtonStyle = style (
  {
    backgroundColor: 'var(--md-green-500)',
    color: 'white',
    height: '42px',
    width: '40px',
    border: '0',
    flex: '1 1 auto'
  }
)

export const stagedCommitButtonReadyStyle = style (
  {
    opacity: .3
  }
)

export const stagedCommitButtonDisabledStyle = style (
  {
    backgroundColor: 'lightgray'
  }
)

export const sectionAreaStyle = style (
  {
    flex: '0 0 auto',
    margin: '4px 0px',
    padding: '4px 1px 4px 4px',
    fontWeight: 600,
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    letterSpacing: '1px',
    fontSize: '12px'
  }
)

export const sectionHeaderLabelStyle = style (
  {
    fontSize: 'var(--jp-ui-font-size)',
    flex: '1 1 auto',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    borderRadius: '2px',
    transition: 'background-color 0.1s ease',

    $nest: {
      '&:hover': {
        backgroundColor: '0'
      },
      '&:focus': {
        backgroundColor: '0'
      }
    }
  }
)

export const changeStageButtonStyle = style (
  {
    margin: '0px 2px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    lineHeight: 'var(--jp-private-running-shutdown-button-height)',
    transition: 'background-color 0.1s ease',
    borderRadius: '2px',
    height: '12px',
    width: '12px',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    border: 'none',
    outline: 'none',

    $nest: {
      '&:hover': {
        backgroundColor: 'none',
        outline: 'none'
      },
      '&:focus':
      {
        border: 'none',
        boxShadow: 'none',
        backgroundColor: 'none'
      }
    }
  }
)

export const changeStageButtonLeftStyle = style (
  {
    float: 'left'
  }
)

export const moveFileUpButtonStyle = style (
  {
    backgroundImage: 'var(--jp-move-file-up-icon)'
  }
)

export const moveFileDownButtonStyle = style (
  {
    backgroundImage: 'var(--jp-move-file-down-icon)'
  }
)

export const moveFileUpButtonSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-move-file-up-hover-icon)'
  }
)

export const moveFileDownButtonSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-move-file-down-hover-icon)'
  }
)

export const discardFileButtonStyle = style (
  {
    backgroundImage: 'var(--jp-discard-file)',
    marginLeft: '6px',
    backgroundSize: '120%'
  }
)

export const discardFileButtonSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-discard-file-selected)',
    marginLeft: '6px',
    backgroundSize: '120%'
  }
)

export const caretdownImageStyle = style (
  {
    backgroundImage: 'var(--jp-image-caretdown)'
  }
)

export const caretrightImageStyle = style (
  {
    backgroundImage: 'var(--jp-image-caretright)'
  }
)

export const fileButtonStyle = style (
  {
    marginTop: '5px'
  }
)

export const notebookFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-book)'
  }
)

export const consoleFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-terminal)'
  }
)

export const terminalFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-terminal)'
  }
)

export const folderFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-directory)'
  }
)

export const genericFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-file)'
  }
)

export const yamlFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-yaml)'
  }
)

export const markdownFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-markdown)'
  }
)

export const imageFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-image)'
  }
)

export const spreadsheetFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-spreadsheet)'
  }
)

export const jsonFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-json)'
  }
)

export const pythonFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-python)'
  }
)

export const kernelFileIconStyle = style (
  {
    backgroundImage: 'var(--jp-icon-r)'
  }
)

export const notebookFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-book-selected)'
  }
)

export const consoleFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-terminal-selected)'
  }
)

export const terminalFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-terminal-selected)'
  }
)

export const folderFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-directory-selected)'
  }
)

export const genericFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-file-selected)'
  }
)

export const yamlFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-yaml-selected)'
  }
)

export const markdownFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-markdown-selected)'
  }
)

export const imageFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-image-selected)'
  }
)

export const spreadsheetFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-spreadsheet-selected)'
  }
)

export const jsonFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-json-selected)'
  }
)

export const pythonFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-python-selected)'
  }
)

export const kernelFileIconSelectedStyle = style (
  {
    backgroundImage: 'var(--jp-icon-r-selected)'
  }
)