import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ToggleDisplay from 'react-toggle-display'

import {
  JupyterLab
} from '@jupyterlab/application';

import {
  Git, SingleCommitInfo,CommitModifiedFile
} from '../git'

import {
  StatusFiles, parseFileExtension
} from './statusFiles'

import '../../style/index.css';
import $ = require('jquery');

/**
 * The class name added to a git-plugin session item icon.
 */
const GIT_FILE_ICON = 'jp-Git-fileIcon';
const GIT_MOD = 'jp-Git-mod';

export namespace PastCommits {
  export
  interface IState {
    data: any;
    single_num:string;
    single_data:any;
    single_data_filelist:any;
    show_left_arrow:boolean;
    show_right_arrow:boolean;
  }

  export
  interface IProps {
    current_fb_path:string;
    top_repo_path: string;

    past_commits: any;
    in_new_repo: boolean;
    show_index:number;

    staged_files: any;
    unstaged_files: any;
    untracked_files: any;
    app: JupyterLab;
    refresh: any;
    show_current_work:any
  }
}

export class PastCommits extends React.Component<PastCommits.IProps, PastCommits.IState>{

  constructor(props: PastCommits.IProps) {
    super(props);
    this.state = {data: props.past_commits, single_num:'', single_data:'', single_data_filelist:[], show_left_arrow:true, show_right_arrow:false}
  }

  show_left(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop-200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft-200});
      this.setState({show_right_arrow:true});
      if(pastcommitsContainer.scrollLeft==0){
        this.setState({show_left_arrow:false});
      }
  }

  show_right(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop+200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft+200});
      this.setState({show_left_arrow:true});
      if(pastcommitsContainer.scrollLeft==pastcommitsContainer.scrollWidth){
        this.setState({show_right_arrow:false});
      }
  }

  async componentDidMount() {
    let git_temp = new Git();
    let response = await git_temp.log(this.props.current_fb_path);
    if(response.code==0){
      this.setState({data: response.commits});
    }
  }

  
  async show_past_commit_work(dj:SingleCommitInfo, dj_index:number, path:string){
    let d_j = dj;
    let git_temp = new Git();
    let response = await git_temp.log_1(dj.commit, path);
    if(response.code==0){
      d_j.modified_file_note = response.modified_file_note;
      this.setState({single_data:dj, single_num: dj_index+' commit(s) before',single_data_filelist:response.modified_files})
    }
  }

  mod_class_selection(index:number, show_index:number):string{
    switch (index) {
      case -1:
        return index==show_index?`${GIT_MOD} jp-Edit-selected`:`${GIT_MOD} jp-Edit`;
      case 0:
        return index==show_index?`${GIT_MOD} jp-Head-selected`:`${GIT_MOD} jp-Head`;
      default:
        return index==show_index?`${GIT_MOD} jp-Normal-selected`:`${GIT_MOD} jp-Normal`;
    }
  }


  render(){
    return (
      <div>
      <div className='jp-Git-timeline'>

        <ToggleDisplay show={this.state.show_left_arrow}>
        <button className='jp-Git-timeline-arrow' onClick={()=>this.show_left()}> {'\u276e'} </button>
        </ToggleDisplay>

        <div className='jp-Git-timeline-container' ref='past_commits_container'> 
            <button className={this.mod_class_selection(-1, this.props.show_index)} onDoubleClick={()=>this.props.show_current_work(-1)}>
               CUR
            </button>         
            {this.props.past_commits.map((dj, dj_index)=>
              <span className='jp-Git-mod-container' key={dj_index} onDoubleClick={()=>{this.show_past_commit_work(dj,dj_index,this.props.current_fb_path), this.props.show_current_work(dj_index)}}>---
                  <button className={this.mod_class_selection(dj_index, this.props.show_index)}>
                      <PastCommitNodeInfo index={dj_index} commit={dj.commit} author={dj.author} date={dj.date} commit_msg={dj.commit_msg}/>
                    </button>
              </span>
            )}
          </div>

          <ToggleDisplay show={this.state.show_right_arrow}>    
         <button className='jp-Git-timeline-arrow' onClick={()=>this.show_right()}> {'\u276f'} </button>
         </ToggleDisplay>

      </div>
          <ToggleDisplay show={this.props.show_index!=-1}>
          <SinglePastCommitInfo num={this.state.single_num} data={this.state.single_data} list={this.state.single_data_filelist} app={this.props.app}/>
          </ToggleDisplay>


          <ToggleDisplay show={this.props.show_index==-1}>
          <StatusFiles current_fb_path={this.props.current_fb_path} top_repo_path={this.props.top_repo_path} 
              staged_files={this.props.staged_files} unstaged_files={this.props.unstaged_files} untracked_files={this.props.untracked_files} app={this.props.app} refresh={this.props.refresh}/>
          </ToggleDisplay>
      </div>
    );
  }
}

export namespace PastCommitNodeInfo {
  export
  interface IState {

  }

  export
  interface IProps {
    index:number;
    commit:string;
    author:string;
    date:string;
    commit_msg:string;
  }
}

export class PastCommitNodeInfo extends React.Component<PastCommitNodeInfo.IProps, PastCommitNodeInfo.IState>{
  constructor(props: PastCommitNodeInfo.IProps) {
    super(props);
  }
  render(){
    return(
      <div>
        {this.props.index}
        </div>
    );
  }
}



export namespace SinglePastCommitInfo {
  export
  interface IState {
  }

  export
  interface IProps {
    num: string;
    data:SingleCommitInfo;
    list:[CommitModifiedFile];
    app: JupyterLab;
  }
}
export class SinglePastCommitInfo extends React.Component<SinglePastCommitInfo.IProps, SinglePastCommitInfo.IState>{
  constructor(props:SinglePastCommitInfo.IProps) {
    super(props);
	}
  render(){
    return (
      <div >
      <div className='jp-Git-singlePastCommit'>
        <div className='jp-Git-singlePastCommit-label'> No. {this.props.num}</div>
        <div className='jp-Git-singlePastCommit-label'> commit: {this.props.data.commit}</div>
        <div className='jp-Git-singlePastCommit-label'> author: {this.props.data.author}</div>
        <div className='jp-Git-singlePastCommit-label'> date: {this.props.data.date}</div>
        <div className='jp-Git-singlePastCommit-label'> commit_msg: {this.props.data.commit_msg}</div>
        <div className='jp-Git-singlePastCommit-label'> summary: {this.props.data.modified_file_note}</div>
      </div>
      <div className='jp-Git-singlePastCommitDetail'>
          {this.props.list.map((mf, mf_index)=>
            <li className='jp-Git-singlePastCommitDetail-file' key={mf_index} >
              <span className={`${GIT_FILE_ICON} ${parseFileExtension(mf.modified_file_path)}`} onDoubleClick={()=>window.open('https://github.com/search?q='+this.props.data.commit+'&type=Commits&utf8=%E2%9C%93')}/>
              <span className='jp-Git-singlePastCommitDetail-file-path'  onDoubleClick={()=> this.props.app.commands.execute('git:terminal-cmd',{'cmd':'git show '+this.props.data.commit}) }>{mf.modified_file_path} :{mf.insertion}(+), {mf.deletion}(-) </span>
            </li>
          )}
      </div>
      </div>
    );
  }
}

/**
 * onDoubleClick={()=>window.open('https://github.com/search?q='+this.props.data.commit+'&type=Commits&utf8=%E2%9C%93')}
 */


