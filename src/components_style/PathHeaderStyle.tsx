import { style } from "typestyle/lib";

export const repoStyle = style({
  display: "flex",
  flexDirection: "row",
  backgroundColor: "var(--jp-layout-color1)",
  lineHeight: "var(--jp-private-running-item-height)"
});

export const repoPathStyle = style({
  fontSize: "var(--jp-ui-font-size1)",
  marginRight: "4px",
  paddingLeft: "4px",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  marginTop: "2px"
});

export const repoRefreshStyle = style({
  width: "var(--jp-private-running-button-width)",
  background: "var(--jp-layout-color1)",
  border: "none",
  backgroundImage: "var(--jp-icon-refresh)",
  backgroundSize: "16px",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",

  $nest: {
    "&:hover": {
      backgroundColor: "lightgray"
    },
    "&:active": {
      backgroundColor: "lightgray",
      boxShadow: "0 1px #666",
      transform: "translateY(0.5px)"
    }
  }
});

export const repoIconStyle = style({
  padding: "0px 8px",
  marginRight: "4px",
  marginLeft: "8px",
  marginBottom: "4px",
  backgroundSize: "15px",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  backgroundImage: "var(--jp-icon-home)"
});

export const arrowStyle = style({
  backgroundImage: "var(--jp-path-arrow-right)",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  width: "18px",
  backgroundSize: "18px",
  marginTop: "2.5px"
});

export const gitRepoPathContainerStyle = style({
  display: "inline-flex"
});

export const directoryStyle = style({
  paddingLeft: "5px"
});
