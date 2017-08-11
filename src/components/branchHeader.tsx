import * as React from 'react';

import {
  Widget
} from '@phosphor/widgets';

import {
  Dialog, showDialog
} from '@jupyterlab/apputils';

import {
  Git
} from '../git'


import '../../style/index.css';



export namespace BranchHeader {
  export
  interface IState {
    top_repo_path: string;
    current_repo_branch:string;
    data: any;
    refresh:any;
    disabled:boolean;
    value:string;
  }

  export
  interface IProps {
    current_fb_path:string;
    top_repo_path: string;
    current_branch: string;
    data:any;
    refresh: any;  
    disabled: boolean;
  }
}
export class BranchHeader extends React.Component<BranchHeader.IProps, BranchHeader.IState>{
  constructor(props: BranchHeader.IProps) {
    super(props);
    this.state = {top_repo_path: props.top_repo_path, current_repo_branch: props.current_branch, data: [], refresh:props.refresh, disabled:props.disabled, value:props.current_branch}
  }

//functions for switch branches
  switch_branch(event, refresh){
    let git_temp = new Git();
    if(event.target.value==''){
      let input = new Widget({ node: document.createElement('input') });
        showDialog({        
          title: 'Input a name to create a new branch and switch to it:',
          body: input,
          buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Create'})]
        }).then(result => {
          let target_branch = (input.node as HTMLInputElement).value ;
          if (result.button.accept&&target_branch) {
            git_temp.checkout(true, true, target_branch, false, null, this.props.current_fb_path).then(response=>{
              refresh();
            });
          }
      });
    }
    else{
      git_temp.checkout(true, false, event.target.value, false, null, this.props.current_fb_path).then(respones=>{
        refresh();
      });
    }
  }

  render(){
    return (
      <div  className='jp-Git-branch'>
        <span className ='jp-Git-branch-label'> Current Branch:{this.props.current_branch}
        </span>,
        <select required ref="switch_branch_dropdown_button" defaultValue={this.props.current_branch} disabled = {this.props.disabled} 
        title = {this.props.disabled?'Please commit your changes or stash them before you switch branches':'select branches'} 
        className='jp-Git-branch-dropdown' onChange={event=>this.switch_branch(event, this.props.refresh)} >
             <option value=" " disabled selected>Switch Branches: </option>
             {this.props.data.map((dj, dj_index)=>
              <option value ={dj.name} key={dj_index}>
                  {dj.name}
              </option>
              )}
              <option value=''>
                CREATE NEW BRANCH
              </option>
          </select>,  
      </div>
    );
  }
}




