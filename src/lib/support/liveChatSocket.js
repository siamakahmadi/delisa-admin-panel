"use client";

import { io } from "socket.io-client";

// Single shared socket for the whole admin panel — the live support chat
// pushes two kinds of events to it: a new chat opening, and any message
// (customer/guest or staff) landing on an existing ticket. Both the tickets
// list and a ticket's detail page subscribe to the same connection.
let socket = null;

export function getLiveChatSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socket.on("connect", () => socket.emit("support:join"));
    socket.on("reconnect", () => socket.emit("support:join"));
  }
  return socket;
}
