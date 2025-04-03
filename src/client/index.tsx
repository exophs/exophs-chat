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
      <div className="container">
        <div className="row">
          <h4>Choose your user</h4>
        </div>
        <div className="row">
          {names.map((nameOption) => (
        <button
          key={nameOption}
          className="button button-primary"
          style={{ 
            margin: "5px",
            display: "flex",        // Add this
            justifyContent: "center", // Add this
            alignItems: "center"   // Add this
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
    <div className="chat container" style={{ display: "flex", height: "100%" }}>
      <div className="sidebar" style={{ width: "100px", padding: "10px" }}>
        <h6>Users</h6>
        {names.map((nameOption) => (
          <button
            key={nameOption}
            className={`button ${name === nameOption ? "button-primary" : ""}`}
            style={{
              margin: "5px 0",
              width: "100%",
              padding: "5px",
              fontSize: "12px",
              display: "flex",        // Add this
              justifyContent: "center", // Add this
              alignItems: "center"   // Add this
                }}
            onClick={() => setName(nameOption)}
          >
            {nameOption}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {messages.map((message) => (
            <div key={message.id} className="row message">
              <div className="two columns user">{message.user}</div>
              <div className="ten columns">{message.content}</div>
            </div>
          ))}
        </div>
        <form
          className="row"
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
            className="ten columns my-input-text"
            placeholder={`Hello ${name}! Type a message...`}
            autoComplete="off"
          />
          <button type="submit" className="send-message two columns">
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
