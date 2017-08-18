import * as React from 'react';
import ToggleDisplay from 'react-toggle-display'
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
    show_notice:boolean;
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
  interval:any;
  constructor(props: BranchHeader.IProps) {
    super(props);
    this.state = {top_repo_path: props.top_repo_path, current_repo_branch: props.current_branch, data: [], refresh:props.refresh, disabled:props.disabled, show_notice:false}
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

  switch_branch_diable_notice(switch_check){
    if(switch_check){
      this.setState({show_notice:true});

    }
  }
  componentDidMount() {
      this.interval = setInterval(() => this.setState({show_notice:false}), 5000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  } 

  render(){
    return (
      <div  className='jp-Git-branch'>
      <ToggleDisplay show={!(this.state.show_notice)}>
        <span className ='jp-Git-branch-label'> <span className='jp-Git-icon-branch'></span>
          {this.props.current_branch}
        </span>,
        <select required ref="switch_branch_dropdown_button" value = {this.props.current_branch}

        title = {this.props.disabled?'Please commit your changes or stash them before you switch branches':'select branches'} 
        onClick={()=>this.switch_branch_diable_notice(this.props.disabled)}
        className='jp-Git-branch-dropdown' onChange={event=>this.switch_branch(event, this.props.refresh)} >
             <option value=" " disabled>**Switch Branches: </option>
             {this.props.data.map((dj, dj_index)=>
              <option value ={dj.name} key={dj_index}>
                  {dj.name}
              </option>
              )}
              <option value=" " disabled>**Create a new branch: </option>
              <option value=''>
                CREATE NEW
              </option>
          </select>,  
      </ToggleDisplay>
      <ToggleDisplay show={this.state.show_notice}>
        <span className ='jp-Git-branch-label'> <span className='jp-Git-icon-branch'></span>
          Commit changes before switch branches
         </span>
        </ToggleDisplay>
      </div>
    );
  }
}




