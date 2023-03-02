---
to: <%= abs_path %>/<%= component_name %>.tsx
---
<% if (have_style) { -%>
import useStyles from "./<%= component_name %>.styles"
<% } -%>
// ______________________________________________________
//
export type Props = {
<% if (have_children) { -%>
  children?: React.ReactNode;
<% } -%>
};
// ______________________________________________________
//
export const <%= component_name %> = ({}: Props): JSX.Element => {
<% if (have_style) { -%>
  const { classes } = useStyles();

<% } -%>
  return (
    <<%= tag %>>
<% if (have_children) { -%>
      {children}
<% } -%>
    </<%= tag %>>
  );
}
