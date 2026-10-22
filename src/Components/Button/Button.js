import "./Button.css";

// variant: "primary" (coral) or "secondary" (dark with a grey border).
// Every other prop goes to the <button>, className adds layout from the parent.
export const Button = ({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) => (
  <button
    type={type}
    className={`app-button app-button--${variant} ${className}`.trim()}
    {...props}
  />
);
