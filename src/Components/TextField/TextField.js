import { useState } from "react";
import { EyeIcon } from "../Assets/EyeIcon";
import { EyeOffIcon } from "../Assets/EyeOffIcon";
import "./TextField.css";

// Every prop goes to the <input> (type, placeholder, value, onChange...),
// className adds layout from the parent.
// A password field gets an eye button that shows or hides what is written.
// error, when set, is shown in red under the field.
export const TextField = ({
  type = "text",
  className = "",
  error = null,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const errorClass = error ? " text-field--invalid" : "";

  let field;
  if (type !== "password") {
    field = (
      <input
        type={type}
        className={`text-field${errorClass} ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    );
  } else {
    field = (
      <div className={`text-field-password ${className}`.trim()}>
        <input
          type={isPasswordVisible ? "text" : "password"}
          className={`text-field${errorClass}`}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        <button
          type="button"
          className="text-field-eye"
          aria-label={
            isPasswordVisible ? "Nascondi password" : "Mostra password"
          }
          title={isPasswordVisible ? "Nascondi password" : "Mostra password"}
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          {isPasswordVisible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>
    );
  }

  return error ? (
    <>
      {field}
      <div className="text-field-error">{error}</div>
    </>
  ) : (
    field
  );
};
