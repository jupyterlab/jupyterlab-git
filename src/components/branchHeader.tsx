import * as React from 'react'

import {
  Git
} from '../git'

import {
  branchStyle,
  branchLabelStyle,
  // switchBranchStyle,
  // branchDropdownStyle,
  changeButtonStyle,
  changeButtonDisabledStyle
} from '../components_style/BranchHeaderStyle'

import {
  classes
} from 'typestyle'

import '../../style/index.css'

export interface IBranchHeaderState {
  topRepoPath: string,
  currentBranch: string,
  data: any,
  refresh: any,
  disabled: boolean,
  showNotice: boolean,
  dropdownOpen: boolean
}

export interface IBranchHeaderProps {
  currentFileBrowserPath: string,
  topRepoPath: string,
  currentBranch: string,
  data: any,
  refresh: any,
  disabled: boolean
}

export class BranchHeader extends React.Component<IBranchHeaderProps, IBranchHeaderState>{
  interval: any
  constructor(props: IBranchHeaderProps) {
    super(props)
    this.state = {
      topRepoPath: props.topRepoPath, 
      currentBranch: props.currentBranch, 
      data: [], 
      refresh: props.refresh, 
      disabled: props.disabled, 
      showNotice: false,
      dropdownOpen: false
    }
  }

/** Switch current working branch */
  switchBranch(branchName: string) {
    let gitApi = new Git()
    // if (event.target.value === '') {
    //   let input = new Widget({ node: document.createElement('input') })
    //   showDialog(
    //     {        
    //       title: 'Input a name to create a new branch and switch to it:',
    //       body: input,
    //       focusNodeSelector: 'input',
    //       buttons: [Dialog.cancelButton(), 
    //       Dialog.okButton({ label: 'Create'})]
    //     }
    //   ).then(result => {
    //     let targetBranch = (input.node as HTMLInputElement).value 
    //     if (result.button.accept && targetBranch) {
    //       gitApi.checkout(true, true, targetBranch, false, null, this.props.currentFileBrowserPath)
    //       .then(response => {
    //         refresh()
    //       })
    //     }
    //   })
    // } else {
    gitApi.checkout(true, false, branchName, false, null, this.props.currentFileBrowserPath)
    .then(respones => {
      this.props.refresh()
    })
    // }
  }

  toggleSelect() {
    this.props.refresh()
    console.log('toggle')
    console.log(this.props)
    if (!this.props.disabled) {
      console.log('open dropdown')
      this.setState({
        dropdownOpen: !this.state.dropdownOpen
      })
    } else {  
      console.log('show message')
    }
  }

  render() {
    return (
      <div className={branchStyle}>
        <h3 className={branchLabelStyle}>
          {this.props.currentBranch}
        </h3>
        <a className={this.props.disabled ? 
          classes(changeButtonStyle, changeButtonDisabledStyle) 
          : changeButtonStyle} 
          onClick={() => this.toggleSelect()}
        >
          Change
        </a>
        {this.state.dropdownOpen &&
          <div>
            {this.props.data.map((branch, branchIndex) => {
                  <li key={branchIndex} onClick={() => this.switchBranch(branch.name)}>
                      {branch.name}
                  </li>
                })
              }
          </div>
        }
          {/* <select 
            ref="switch_branch_dropdown_button" 
            value={this.props.currentBranch} 
            disabled={this.props.disabled} 
            title={this.props.disabled ? 
              'Stage and commit changes before switching branches' 
              : 'select branches'
            } 
            className={branchDropdownStyle}
            onChange={event => this.switchBranch(event, this.props.refresh)} 
          >
            <option 
              className={switchBranchStyle}
              value=' '
              disabled
            >
              Change
            </option>
            <option className='jp-Git-create-branch-line' disabled />
            <option className='jp-Git-create-branch' value=''>
              Create New
            </option>
          </select> */}
      </div>
    )
  }
}




