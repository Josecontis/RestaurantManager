import { useCallback, useState } from "react";

// Error message shown by an admin section; an expired session goes back to the login
export const useAdminError = (onUnauthorized) => {
  const [error, setError] = useState(null);

  const handleError = useCallback(
    (actionError) => {
      if (actionError.status === 401) {
        onUnauthorized();
      } else {
        setError(actionError.message);
      }
    },
    [onUnauthorized]
  );

  return [error, setError, handleError];
};
