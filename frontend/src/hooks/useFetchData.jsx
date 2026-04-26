import { useCallback } from "react";
import api from "../api";

const useFetchData = (link, setLoading, setData) => {
  return useCallback(() => {
    setLoading(true);
    api
      .get(`api/${link}/`)
      .then((response) => {
        // !Handle both paginated and non-paginated responses
        const data = response.data.results || response.data;
        setData(data);
      })
      .catch((error) => {
        console.error(`Error fetching ${link}:`, error);
        alert(`Failed to fetch ${link}. Please try again.`);
      })
      .finally(() => setLoading(false));
  }, [link, setLoading, setData]);
};

export default useFetchData;
