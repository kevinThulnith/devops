import { useCallback } from "react";
import api from "../api";

function useDelete(url, setLoading, displayName, fetchData) {
  const handleDelete = useCallback(
    (id) => {
      if (
        window.confirm(`Are you sure you want to delete this ${displayName}?`)
      ) {
        setLoading(true);
        api
          .delete(`api/${url}/${id}/`)
          .then(() => {
            alert(`${displayName} deleted successfully!`);
            fetchData();
          })
          .catch((error) => {
            if (error.response && error.response.status === 400)
              alert(
                `Cannot delete ${displayName}. It may be in use by other records.`
              );
            else if (error.response && error.response.status === 404)
              alert(`${displayName} not found.`);
            else {
              console.error(`Error deleting ${displayName}:`, error);
              alert("An error occurred. Please try again later.");
            }
          })
          .finally(() => setLoading(false));
      }
    },
    [url, setLoading, displayName, fetchData]
  );

  return handleDelete;
}

export default useDelete;
