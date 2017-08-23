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
    info:string;
    files_changed:string,
    insertion_count:string,
    deletion_count:string,
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
    this.state = {data: props.past_commits, info:'', files_changed:'',insertion_count:'',deletion_count:'',single_num:'', single_data:'', single_data_filelist:[], show_left_arrow:true, show_right_arrow:false}
  }

  show_left(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft-200}, 320);
      this.setState({show_right_arrow:true});
      if(pastcommitsContainer.scrollLeft==0){
        this.setState({show_left_arrow:false});
      }
  }

  show_right(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft+200},320);
      this.setState({show_left_arrow:true});
      if(pastcommitsContainer.scrollLeft>=pastcommitsContainer.scrollWidth-400){
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
    let git_temp = new Git();
    let response = await git_temp.log_1(dj.commit, path);
    if(response.code==0){
      this.setState({info:response.modified_file_note, files_changed:response.modified_files_count,insertion_count:response.number_of_insertions,deletion_count:response.number_of_deletions,  single_data:dj, single_num: dj_index+' commit(s) before',single_data_filelist:response.modified_files})
    }
  }

  mod_class_selection(index:number, show_index:number):string{
    switch (index) {
      case -1:
        return index==show_index?'jp-Git-currentCommit-active jp-mod-active':'jp-Git-currentCommit-active';
      default:
        return index==show_index?'jp-Git-pastCommit-active jp-mod-active':'jp-Git-pastCommit-active';
    }
  }
    mod_class_selection_btn(index:number, show_index:number):string{
    switch (index) {
      case -1:
        return index==show_index?'jp-Git-currentCommit-btn jp-mod-active':'jp-Git-currentCommit-btn';
      default:
        return index==show_index?'jp-Git-pastCommit-btn jp-mod-active':'jp-Git-pastCommit-btn';
    }
  }


  render(){
    return (
      <div>
      <div className='jp-Git-timeline'>
        <ToggleDisplay show={this.state.show_left_arrow}>
        <button className='jp-Git-timeline-arrow-left' onClick={()=>this.show_left()}> </button>
        </ToggleDisplay>

        <div className='jp-Git-timeline-container' ref='past_commits_container'> 
            <button className={this.mod_class_selection(-1, this.props.show_index)}>
            </button> 
            <button className={this.mod_class_selection_btn(-1, this.props.show_index)} onClick={()=>this.props.show_current_work(-1)}>
            </button>  
            {this.props.past_commits.map((dj, dj_index)=>
              <span className='jp-Git-commit-btn-container' key={dj_index} onClick={()=>{this.show_past_commit_work(dj,dj_index,this.props.current_fb_path), this.props.show_current_work(dj_index)}}>---------
                  <button className={this.mod_class_selection(dj_index, this.props.show_index)}>
                      <PastCommitNodeInfo index={dj_index} commit={dj.commit} author={dj.author} date={dj.date} commit_msg={dj.commit_msg}/>
                  </button>
                  <button className={this.mod_class_selection_btn(dj_index, this.props.show_index)} >
                      <PastCommitNodeInfo index={dj_index} commit={dj.commit} author={dj.author} date={dj.date} commit_msg={dj.commit_msg}/>
                  </button>
              </span>
            )}
          </div>

          <ToggleDisplay show={this.state.show_right_arrow}>    
         <button className='jp-Git-timeline-arrow-right' onClick={()=>this.show_right()}></button>
         </ToggleDisplay>
      </div>
          <ToggleDisplay show={this.props.show_index!=-1}>
          <SinglePastCommitInfo num={this.state.single_num} data={this.state.single_data}  info={this.state.info} files_changed={this.state.files_changed} insertion_count={this.state.insertion_count} deletion_count={this.state.deletion_count} list={this.state.single_data_filelist} app={this.props.app}/>
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
      <div className = 'jp-Git-commit-index'>
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
    info:string;
    files_changed:string,
    insertion_count:string,
    deletion_count:string,
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
        <div className='jp-Git-singlePastCommit-header'>
          <span className='jp-Git-singlePastCommit-label-commit-number'> #{this.props.data.commit?this.props.data.commit.substring(0,7):''}</span>
          <span className='jp-Git-singlePastCommit-label-summary'> 
            <span className= 'jp-files-changed-white'> 
              <span className='jp-Git-icon-directory-white'/> {this.props.files_changed} 
            </span>
            <span className= 'jp-insertions-made-white'> 
              <span className='jp-Git-icon-insertion-white'/>  {this.props.insertion_count} 
            </span>
            <span className= 'jp-deletions-made-white'> 
              <span className='jp-Git-icon-deletion-white'/>  { this.props.deletion_count} 
            </span>
          </span>
        </div>
        <div className='jp-Git-singlePastCommit-label-author'> <span className="jp-Git-icon-author"/> {this.props.data.author}</div>
        <div className='jp-Git-singlePastCommit-label-date'> {this.props.data.date}</div>
        <div className='jp-Git-singlePastCommit-label-commit-message'> "<span className="jp-past-commit-message"/>{this.props.data.commit_msg}"</div>
      </div>
      <div className='jp-Git-singlePastCommitDetail'>
          {this.props.list.map((mf, mf_index)=>
            <li className='jp-Git-singlePastCommitDetail-file' key={mf_index} >
              <span className={`${GIT_FILE_ICON} ${parseFileExtension(mf.modified_file_path)}`} onDoubleClick={()=>window.open('https://github.com/search?q='+this.props.data.commit+'&type=Commits&utf8=%E2%9C%93')}/>
              <span className='jp-Git-singlePastCommitDetail-file-path'  onDoubleClick={()=> this.props.app.commands.execute('git:terminal-cmd',{'cmd':'git show '+this.props.data.commit})}>{mf.modified_file_name}</span>
              <span className='jp-Git-light'  onDoubleClick={()=> this.props.app.commands.execute('git:terminal-cmd',{'cmd':'git show '+this.props.data.commit})}> {mf.modified_file_path}</span>
              <span className='jp-modifications'>
                <span className='jp-deletions-made-color'>
                    <span className="jp-Git-modNumber-deletions"> {mf.deletion}</span>   
                    <span className='jp-Git-icon-deletion-color'></span>   
                </span>
                <span className='jp-insertions-made-color'>
                    <span className="jp-Git-modNumber-insertions">{mf.insertion}</span>
                    <span className='jp-Git-icon-insertion-color'></span>
                </span>
              </span>
            </li>
          )}
      </div>
      </div>
    );
  }
}

/**
 * onDoubleClick={()=>window.open('https://github.com/search?q='+this.props.data.commit+'&type=Commits&utf8=%E2%9C%93')}
 *           <span className='jp-Git-icon-deletion'> {this.props.deletion_count}</span>
          <span className='jp-Git-icon-insertion'> {this.props.insertion_count}</span>
 */


