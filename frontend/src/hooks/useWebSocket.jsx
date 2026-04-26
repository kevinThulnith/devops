import { useEffect, useState } from "react";

function useWebSocket(url, setData, fetchData) {
  const [wsStatus, setWsStatus] = useState("Connecting...");

  useEffect(() => {
    fetchData();

    const socket = new WebSocket(`/ws/${url}/`);

    // ?Send token as first message — never expose it in the URL
    socket.onopen = () => {
      const token = localStorage.getItem("access");
      socket.send(JSON.stringify({ type: "authenticate", token }));
    };

    // TODO: Handle incoming messages
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "connection_established") {
        setWsStatus("Connected");
        return;
      }

      if (message.action) {
        setData((prevData) => {
          switch (message.action) {
            case "created":
              // !Add the new item to the beginning of the master list
              return [message.data, ...prevData];
            case "updated":
              // !Find and update the item in the master list
              return prevData.map((p) =>
                p.id === message.data.id ? message.data : p,
              );
            case "deleted":
              // !Filter out the deleted item from the master list
              return prevData.filter((p) => p.id !== message.data.id);
            default:
              return prevData;
          }
        });
      }
    };

    // TODO: Handle WebSocket close and error events
    socket.onclose = () => setWsStatus("Disconnected");

    // TODO: Handle WebSocket errors
    socket.onerror = () => setWsStatus("Error");

    return () => {
      if (
        socket &&
        (socket.readyState === WebSocket.CONNECTING ||
          socket.readyState === WebSocket.OPEN)
      ) {
        socket.close();
      }
    };
  }, [url, setData, fetchData]);

  return wsStatus;
}

export default useWebSocket;
