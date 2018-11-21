import { style } from 'typestyle';

export const pastCommitNodeStyle = style({
  flex: 'auto',
  display: 'flex',
  flexDirection: 'column',
  padding: "10px",
  borderBottom: "var(--jp-border-width) solid var(--jp-border-color2)",
});

export const pastCommitHeaderStyle = style({
  display: 'flex',
  justifyContent: 'space-between',
  color: '#828282',
  paddingBottom: "5px"
});



export const branchesStyle = style({
  display: "flex",
  fontSize: "0.8em",
  marginLeft: "-5px",
});

export const branchStyle = style({
  padding: "2px",
  border: "var(--jp-border-width) solid #424242",
  borderRadius: "4px",
  margin: "3px",
});

export const remoteBranchStyle = style({
  backgroundColor: "#ffcdd3"
});

export const localBranchStyle = style({
  backgroundColor: "#b2ebf3"
});


export const workingBranchStyle = style({
  backgroundColor: "#ffce83"
});


export const pastCommitHeaderItemStyle = style({
});


export const pastCommitBodyStyle = style({
  flex: 'auto',
});