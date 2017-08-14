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

export namespace PastCommits {
  export
  interface IState {
    data: any;
    single_num:string;
    single_data:any;
    single_data_filelist:any;
  }

  export
  interface IProps {
    current_fb_path:string;
    top_repo_path: string;

    past_commits: any;
    in_new_repo: boolean;
    show_CUR:boolean;

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
    this.state = {data: props.past_commits, single_num:'', single_data:'', single_data_filelist:[]}
  }

  show_left(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop-200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft-200});
  }

  show_right(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop+200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft+200});
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


  render(){
    return (
      <div>
      <div className='jp-Git-timeline'>
        <button className='jp-Git-timeline-arrow-left' onClick={()=>this.show_left()}> {'\u276e'} </button>
        <div className='jp-Git-timeline-container' ref='past_commits_container'> 
            <button className='jp-Git-mod-current' onDoubleClick={()=>this.props.show_current_work(true)}>
               CUR
            </button>         
            {this.props.past_commits.map((dj, dj_index)=>
              <span className='jp-Git-mod-container' key={dj_index} onDoubleClick={()=>{this.show_past_commit_work(dj,dj_index,this.props.current_fb_path), this.props.show_current_work(false)}}>---
                  <button className='jp-Git-mod-pastCommit'>
                      <PastCommitNodeInfo index={dj_index} commit={dj.commit} author={dj.author} date={dj.date} commit_msg={dj.commit_msg}/>
                    </button>
              </span>
            )}
          </div>,     
         <button className='jp-Git-timeline-arrow-right' onClick={()=>this.show_right()}> {'\u276f'} </button>
      </div>
          <ToggleDisplay show={!(this.props.show_CUR)}>
          <SinglePastCommitInfo num={this.state.single_num} data={this.state.single_data} list={this.state.single_data_filelist}/>
          </ToggleDisplay>


          <ToggleDisplay show={this.props.show_CUR}>
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
              <span className={`${GIT_FILE_ICON} ${parseFileExtension(mf.modified_file_path)}`} />
              <span className='jp-Git-singlePastCommitDetail-file-path' onDoubleClick={()=>window.open('https://github.com/search?q='+this.props.data.commit+'&type=Commits&utf8=%E2%9C%93')}>{mf.modified_file_path} :{mf.insertion}(+), {mf.deletion}(-) </span>
            </li>
          )}
      </div>
      </div>
    );
  }
}




