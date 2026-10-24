import { useState } from "react";
import { EyeIcon } from "../Assets/EyeIcon";
import { EyeOffIcon } from "../Assets/EyeOffIcon";
import "./TextField.css";

// Every prop goes to the <input> (type, placeholder, value, onChange...),
// className adds layout from the parent.
// A password field gets an eye button that shows or hides what is written.
export const TextField = ({ type = "text", className = "", ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  if (type !== "password") {
    return (
      <input
        type={type}
        className={`text-field ${className}`.trim()}
        {...props}
      />
    );
  }

  return (
    <div className={`text-field-password ${className}`.trim()}>
      <input
        type={isPasswordVisible ? "text" : "password"}
        className="text-field"
        {...props}
      />
      <button
        type="button"
        className="text-field-eye"
        aria-label={isPasswordVisible ? "Nascondi password" : "Mostra password"}
        title={isPasswordVisible ? "Nascondi password" : "Mostra password"}
        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
      >
        {isPasswordVisible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
      </button>
    </div>
  );
};
