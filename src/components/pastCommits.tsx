import {
  JupyterLab
} from '@jupyterlab/application'

import {
  Git, SingleCommitInfo
} from '../git'

import {
  StatusFiles
} from './statusFiles'

import {
  PastCommitNodeInfo
} from './PastCommitNodeInfo'

import {
  SinglePastCommitInfo
} from './SinglePastCommitInfo'

import * as React from 'react'

import * as ReactDOM from 'react-dom'

import ToggleDisplay from 'react-toggle-display'

import '../../style/index.css'

/** Interface for PastCommits component state */
export interface IPastCommitsState {
  data: any
  info: string
  filesChanged: string,
  insertionCount: string,
  deletionCount: string,
  singleNumber: string
  singleData: any
  singleDataFilelist: any
  showLeftArrow: boolean
  showRightArrow: boolean
}

/** Interface for PastCommits component props */
export interface IPastCommitsProps {
  currentFileBrowserPath: string
  topRepoPath: string
  pastCommits: any
  inNewRepo: boolean
  showIndex: number
  stagedFiles: any
  unstagedFiles: any
  untrackedFiles: any
  app: JupyterLab
  refresh: any
  showCurrentWork: any
  diff: any
}

export class PastCommits extends React.Component<IPastCommitsProps, IPastCommitsState> {
  constructor(props: IPastCommitsProps) {
    super(props)
    this.state = {
      data: props.pastCommits, 
      info: '', 
      filesChanged: '',
      insertionCount: '',
      deletionCount: '',
      singleNumber: '', 
      singleData: '', 
      singleDataFilelist: [], 
      showLeftArrow: true, 
      showRightArrow: false
    }
  }

  /** Scroll the list of past commits left */
  scrollCommitsLeft() {
    let pastCommitsContainer = ReactDOM.findDOMNode(this.refs.pastCommitsContainer)
    this.smoothScrollTo(pastCommitsContainer, pastCommitsContainer.scrollLeft - 200, 320)
    this.setState({ showRightArrow: true })
  }

  /** Scroll the list of past commits right */
  scrollCommitsRight() {
    let pastCommitsContainer = ReactDOM.findDOMNode(this.refs.pastCommitsContainer)
    this.smoothScrollTo(pastCommitsContainer, pastCommitsContainer.scrollLeft + 200, 320)
    this.setState({showLeftArrow: true})
    if (pastCommitsContainer.scrollLeft >= pastCommitsContainer.scrollWidth - 400) {
      this.setState({ showRightArrow: false })
    }
  }

  /** Fetch git log info on mount */
  async componentDidMount() {
    let gitApi = new Git()
    let logData = await gitApi.log(this.props.currentFileBrowserPath)
    if (logData.code === 0) {
      this.setState({ data: logData.commits })
    }
  }
  
  /** Show the commit message and changes from a past commit */
  async showPastCommitWork(pastCommit: SingleCommitInfo, pastCommitIndex: number, path: string) {
    let gitApi = new Git()
    let detailedLogData = await gitApi.detailedLog(pastCommit.commit, path)
    if (detailedLogData.code === 0) {
      this.setState(
        {
          info: detailedLogData.modified_file_note, 
          filesChanged: detailedLogData.modified_files_count,
          insertionCount: detailedLogData.number_of_insertions,
          deletionCount: detailedLogData.number_of_deletions,  
          singleData: pastCommit, 
          singleNumber: pastCommitIndex + ' commit(s) before',
          singleDataFilelist: detailedLogData.modified_files
        }
      )
    }
  }

  /** Set CSS div class based on if the currently displayed commit is current or past */
  getCommitTimeState(index: number, showIndex: number) : string {
    switch (index) {
      case -1:
        return (
          index === showIndex ? 
          'jp-Git-currentCommit-active jp-mod-active' 
          : 'jp-Git-currentCommit-active'
        )
      default:
        return (
          index === showIndex ? 
          'jp-Git-pastCommit-active jp-mod-active' 
          : 'jp-Git-pastCommit-active'
        )
    }
  }

  /** Set CSS button class based on if the currently displayed commit is current or past */
  getCommitTimeStateButton(index: number, showIndex: number) : string {
  switch (index) {
    case -1:
      return (
        index === showIndex ? 
        'jp-Git-currentCommit-btn jp-mod-active' 
        : 'jp-Git-currentCommit-btn'
      )
    default:
      return (
        index === showIndex ? 
        'jp-Git-pastCommit-btn jp-mod-active' 
        : 'jp-Git-pastCommit-btn'
      )
  }
}

  /**
   * Smoothly scroll element to the given target (element.scrollLeft)
   * for the given duration.
   * Returns a promise that's fulfilled when done, or rejected if
   * interrupted
   */
  smoothScrollTo(element, target, duration) {
    target = Math.round(target)
    duration = Math.round(duration)
    if (duration < 0) {
        return Promise.reject("bad duration")
    }

    if (duration === 0) {
        element.scrollLeft = target
        return Promise.resolve()
    }

    let startTime = Date.now()
    let endTime = startTime + duration

    let startTop = element.scrollLeft
    let distance = target - startTop

    // based on http://en.wikipedia.org/wiki/Smoothstep
    let smoothStep = function(start, end, point) {
        if (point <= start) { 
          return 0 
        }
        if (point >= end) { 
          return 1 
        }
        let x = (point - start) / (end - start)
        return x * x * (3 - 2 * x)
    }

    return new Promise(function(resolve, reject) {
      // This is to keep track of where the element's scrollLeft is
      // supposed to be, based on what we're doing
      let previousTop = element.scrollLeft

      // This is like a think function from a game loop
      let scrollFrame = function() {
          if (element.scrollLeft !== previousTop) {
            reject("interrupted")
            return
          }
          // set the scrollLeft for this frame
          let now = Date.now()
          let point = smoothStep(startTime, endTime, now)
          let frameTop = Math.round(startTop + (distance * point))
          element.scrollLeft = frameTop

          // check if we're done!
          if (now >= endTime) {
            resolve()
            return
          }

          // If we were supposed to scroll but didn't, then we
          // probably hit the limit, so consider it done not
          // interrupted.
          if (element.scrollLeft === previousTop
              && element.scrollLeft !== frameTop) {
              resolve()
              return
          }
          previousTop = element.scrollLeft

          // schedule next frame for execution
          setTimeout(scrollFrame, 0)
      }
      // boostrap the animation process
      setTimeout(scrollFrame, 0)
    })
  } 

  render() {
    return (
      <div>
        <div className='jp-Git-timeline'>
          <ToggleDisplay show={this.state.showLeftArrow}>
            <button className='jp-Git-timeline-arrow-left' onClick={()=>this.scrollCommitsLeft()} />
          </ToggleDisplay>
          <div className='jp-Git-timeline-container' ref='pastCommitsContainer'> 
            <button className={this.getCommitTimeState(-1, this.props.showIndex)} />
            <button className={this.getCommitTimeStateButton(-1, this.props.showIndex)} onClick={()=>this.props.showCurrentWork(-1)} />
            {this.props.pastCommits.map((pastCommit, pastCommitIndex) =>
              <span 
                className='jp-Git-commit-btn-container' 
                key={pastCommitIndex} 
                onClick={() => {
                  this.showPastCommitWork(pastCommit, pastCommitIndex, this.props.currentFileBrowserPath), 
                  this.props.showCurrentWork(pastCommitIndex)
                  }
                }
                >
                ---------
                <button className={this.getCommitTimeState(pastCommitIndex, this.props.showIndex)}>
                  <PastCommitNodeInfo 
                    index={pastCommitIndex} 
                  />
                </button>
                <button className={this.getCommitTimeStateButton(pastCommitIndex, this.props.showIndex)} >
                  <PastCommitNodeInfo 
                    index={pastCommitIndex} 
                  />
                </button>
              </span>
              )}
            </div>
          <ToggleDisplay show={this.state.showRightArrow}>    
            <button 
              className='jp-Git-timeline-arrow-right' 
              onClick={()=>this.scrollCommitsRight()} 
            />
          </ToggleDisplay>
        </div>
        <ToggleDisplay show={this.props.showIndex !== -1}>
          <SinglePastCommitInfo 
            num={this.state.singleNumber}
            data={this.state.singleData} 
            info={this.state.info} 
            filesChanged={this.state.filesChanged} 
            insertionCount={this.state.insertionCount} 
            deletionCount={this.state.deletionCount} 
            list={this.state.singleDataFilelist} 
            app={this.props.app} 
            diff={this.props.diff}
          />
        </ToggleDisplay>
        <ToggleDisplay show={this.props.showIndex === -1}>
          <StatusFiles 
            currentFileBrowserPath={this.props.currentFileBrowserPath} 
            topRepoPath={this.props.topRepoPath} 
            stagedFiles={this.props.stagedFiles} 
            unstagedFiles={this.props.unstagedFiles} 
            untrackedFiles={this.props.untrackedFiles} 
            app={this.props.app} 
            refresh={this.props.refresh}
          />
        </ToggleDisplay>
      </div>
    )
  }
}