import * as React from 'react'

import ToggleDisplay from 'react-toggle-display'

import {
  Widget
} from '@phosphor/widgets'

import {
  Dialog, showDialog
} from '@jupyterlab/apputils'

import {
  Git
} from '../git'

import '../../style/index.css'

export interface IBranchHeaderState {
  topRepoPath: string,
  currentBranch: string,
  data: any,
  refresh: any,
  disabled: boolean,
  showNotice: boolean
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
      showNotice: false
    }
  }

/** Switch current working branch */
  switchBranch(event, refresh) {
    let gitApi = new Git()
    if (event.target.value === '') {
      let input = new Widget({ node: document.createElement('input') })
      showDialog(
        {        
          title: 'Input a name to create a new branch and switch to it:',
          body: input,
          focusNodeSelector: 'input',
          buttons: [Dialog.cancelButton(), 
          Dialog.okButton({ label: 'Create'})]
        }
      ).then(result => {
        let targetBranch = (input.node as HTMLInputElement).value 
        if (result.button.accept && targetBranch) {
          gitApi.checkout(true, true, targetBranch, false, null, this.props.currentFileBrowserPath)
          .then(response => {
            refresh()
          })
        }
      })
    } else {
      gitApi.checkout(true, false, event.target.value, false, null, this.props.currentFileBrowserPath)
      .then(respones => {
        refresh()
      })
    }
  }

  /** Trigger notice that switching branches is currently disabled */
  switchBranchDisableNotice() {
    this.setState({showNotice: true})
    setTimeout(function() {
      this.setState({showNotice: false})
    }
    .bind(this), 3000)
  }

  render() {
    return (
      <div className='jp-Git-branch'>
        <span className ='jp-Git-branch-label'>
          <span className='jp-Git-icon-branch'/>
          {this.state.showNotice ? 
            'Stage and commit changes before switching branches' 
            : this.props.currentBranch
          }
        </span>
        <ToggleDisplay show={!this.props.disabled}>
          <select 
            ref="switch_branch_dropdown_button" 
            value={this.props.currentBranch} 
            disabled={this.props.disabled} 
            title={this.props.disabled ? 
              'Stage and commit changes before switching branches' 
              : 'select branches'
            } 
            className='jp-Git-branch-dropdown' 
            onChange={event => this.switchBranch(event, this.props.refresh)} 
          >
            <option 
              className='jp-Git-switch-branch' 
              value=' '
              disabled
            >
              **Switch Branches: 
            </option>
            {this.props.data.map((dj, dj_index) => {
                <option value ={dj.name} key={dj_index}>
                    {dj.name}
                </option>
              })
            }
            <option className='jp-Git-create-branch-line' disabled />
            <option className='jp-Git-create-branch' value=''>
              Create New
            </option>
          </select>
        </ToggleDisplay> 
        <ToggleDisplay show={this.props.disabled && !this.state.showNotice}>
          <select 
            className='jp-Git-branch-dropdown' 
            onClick={()=>this.switchBranchDisableNotice()}
          />
        </ToggleDisplay> 
      </div>
    )
  }
}




