import "./TextField.css";

// Every prop goes to the <input> (type, placeholder, value, onChange...),
// className adds layout from the parent
export const TextField = ({ type = "text", className = "", ...props }) => (
  <input
    type={type}
    className={`text-field ${className}`.trim()}
    {...props}
  />
);
