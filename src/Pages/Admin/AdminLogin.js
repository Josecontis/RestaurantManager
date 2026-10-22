import { useState } from "react";
import { adminLogin } from "../../api";

export const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setIsSending(true);
    setError(null);
    try {
      onLogin(await adminLogin(username, password));
    } catch (loginError) {
      setError(loginError.message);
      setIsSending(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={submit}>
      <div className="admin-title">Area admin</div>
      <div className="admin-subtitle">Accedi per vedere ordini e tablet</div>
      <input
        className="admin-input"
        type="text"
        placeholder="Nome utente"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <input
        className="admin-input"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && <div className="admin-error">{error}</div>}
      <button className="admin-button" type="submit" disabled={isSending}>
        {isSending ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
};
