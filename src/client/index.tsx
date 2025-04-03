import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router";
import { nanoid } from "nanoid";

import { names, type ChatMessage, type Message } from "../shared";

function App() {
  const [name, setName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { room } = useParams();

  const socket = usePartySocket({
    party: "chat",
    room,
    onMessage: (evt) => {
      const message = JSON.parse(evt.data as string) as Message;
      if (message.type === "add") {
        const foundIndex = messages.findIndex((m) => m.id === message.id);
        if (foundIndex === -1) {
          setMessages((messages) => [
            ...messages,
            {
              id: message.id,
              content: message.content,
              user: message.user,
              role: message.role,
            },
          ]);
        } else {
          setMessages((messages) => {
            return messages
              .slice(0, foundIndex)
              .concat({
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
              })
              .concat(messages.slice(foundIndex + 1));
          });
        }
      } else if (message.type === "update") {
        setMessages((messages) =>
          messages.map((m) =>
            m.id === message.id
              ? {
                  id: message.id,
                  content: message.content,
                  user: message.user,
                  role: message.role,
                }
              : m,
          ),
        );
      } else {
        setMessages(message.messages);
      }
    },
  });

  if (!name) {
    return (
      <div className="container" style={{ 
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh"
      }}>
        <div className="row">
          <h4>Choose your user</h4>
        </div>
        <div className="row" style={{ 
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "300px"
        }}>
          {names.map((nameOption) => (
            <button
              key={nameOption}
              className="button button-primary"
              style={{ 
                margin: "8px 0",
                width: "100%",
                padding: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
              onClick={() => setName(nameOption)}
            >
              {nameOption}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat container" style={{ display: "flex", height: "100vh" }}>
      <div className="sidebar" style={{ 
        width: "120px", 
        padding: "15px",
        backgroundColor: "#1e1e1e",
        borderRight: "1px solid #333"
      }}>
        <h6 style={{ color: "#bb86fc", marginBottom: "15px" }}>Users</h6>
        {names.map((nameOption) => (
          <button
            key={nameOption}
            className={`button ${name === nameOption ? "button-primary" : ""}`}
            style={{
              margin: "8px 0",
              width: "100%",
              padding: "8px",
              fontSize: "12px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: name === nameOption ? "#bb86fc" : "#2d2d2d",
              color: "#e0e0e0",
              border: "none",
              borderRadius: "4px"
            }}
            onClick={() => setName(nameOption)}
          >
            {nameOption}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ 
          flex: 1, 
          overflowY: "auto",
          padding: "15px",
          backgroundColor: "#121212"
        }}>
          {messages.map((message) => (
            <div key={message.id} className="row message" style={{ 
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "4px",
              backgroundColor: "#2d2d2d"
            }}>
              <div className="two columns user" style={{ 
                fontWeight: "bold",
                color: "#bb86fc"
              }}>
                {message.user}
              </div>
              <div className="ten columns" style={{ color: "#e0e0e0" }}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
<form
  className="row"
  style={{
    padding: "15px",
    backgroundColor: "#1e1e1e",
    borderTop: "1px solid #333",
    display: "flex",        // Add flex display
    alignItems: "center",   // Vertically center items
    gap: "10px"             // Add spacing between elements
  }}
  onSubmit={(e) => {
    e.preventDefault();
    const content = e.currentTarget.elements.namedItem(
      "content",
    ) as HTMLInputElement;
    const chatMessage: ChatMessage = {
      id: nanoid(8),
      content: content.value,
      user: name,
      role: "user",
    };
    setMessages((messages) => [...messages, chatMessage]);
    socket.send(
      JSON.stringify({
        type: "add",
        ...chatMessage,
      } satisfies Message),
    );
    content.value = "";
  }}
>
  <input
    type="text"
    name="content"
    style={{
      backgroundColor: "#2d2d2d",
      color: "#e0e0e0",
      border: "1px solid #333",
      padding: "10px",
      borderRadius: "4px",
      flex: 1                  // Take up remaining space
    }}
    placeholder={`Hello ${name}! Type a message...`}
    autoComplete="off"
  />
  <button 
    type="submit" 
    style={{
      backgroundColor: "#bb86fc",
      color: "#121212",
      border: "none",
      padding: "10px 20px",
      borderRadius: "4px",
      fontWeight: "bold",
      whiteSpace: "nowrap"     // Prevent text wrapping
    }}
  >
    Send
  </button>
</form>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
      <Route path="/:room" element={<App />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>,
);
