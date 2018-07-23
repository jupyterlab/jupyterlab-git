import { style } from "typestyle/lib";

export const fileChangedLabelStyle = style({
  fontSize: "10px",
  marginLeft: "5px"
});

export const fileChangedLabelBrandStyle = style({
  color: "var(--jp-brand-color0)"
});

export const fileChangedLabelInfoStyle = style({
  color: "var(--jp-info-color0)"
});

export const selectedFileStyle = style({
  color: "white",
  background: "var(--jp-brand-color1)",

  $nest: {
    "&:hover": {
      color: "white",
      background: "var(--jp-brand-color1) !important"
    }
  }
});

export const selectedFileChangedLabelStyle = style({
  color: "white"
});
