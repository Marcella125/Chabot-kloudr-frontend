import React, { useState, useEffect, useRef } from "react";
import { FiMessageCircle } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import './index.css';

function removeEmojis(text) {
  return text.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF])/g,
    ""
  );
}

function Spinner() {
  return (
    <div
      aria-label="Loading"
      role="status"
      style={{
        width: 24,
        height: 24,
        border: "3px solid #90bafc",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState(null);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async (messageToSend) => {
    typingTimeout.current = setTimeout(() => setIsTyping(true), 300);
    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      const data = await response.json();
      let botText = removeEmojis(data.answer || "Sorry, we didn’t get that.");
      const botMessage = {
        sender: "bot",
        text: botText,
        timestamp: getTime(),
        error: false,
      };
      clearTimeout(typingTimeout.current);
      setIsTyping(false);
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      clearTimeout(typingTimeout.current);
      setIsTyping(false);
      const errorMessage = {
        sender: "bot",
        text: "Oops! Something went wrong. Please try again.",
        timestamp: getTime(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMessage = { sender: "user", text: input.trim(), timestamp: getTime() };
    setMessages((prev) => [...prev, userMessage]);
    setLastUserMessage(input.trim());
    setInput("");
    sendMessage(userMessage.text);
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      setMessages((prev) => prev.filter((msg) => !msg.error));
      sendMessage(lastUserMessage);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle-btn"
        aria-label="Toggle chat"
      >
        <FiMessageCircle size={28} />
      </button>

      {isOpen && (
        <div className="chat-container" role="dialog" aria-modal="true">
          <div className="chat-header">
            <img src="/kira3.png" alt="Kira" className="chat-logo" />
            <div>
              <h2 className="chat-title">Kira</h2>
              <p className="chat-subtitle">Kloudr intelligent response assistant</p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="chat-messages"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <h2 className="chat-welcome-title">
                  Hey, I'm <span className="chat-highlight">Kira</span> 👋
                </h2>
                <p className="chat-welcome-text">
                  I’m here to help with anything related to Kloudr.
                </p>
                <div className="chat-divider" />
              </div>
            ) : (
              <div className="chat-message-list">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`chat-message-wrapper ${msg.sender === "user" ? "user-message" : "bot-message"}`}
                  >
                    <div
                      className={`chat-message ${msg.error ? "error-message" : ""} ${
                        msg.sender === "user"
                          ? "user-bubble"
                          : msg.error
                          ? "error-bubble"
                          : "bot-bubble"
                      }`}
                      onClick={msg.error ? handleRetry : undefined}
                      role={msg.error ? "button" : undefined}
                      tabIndex={msg.error ? 0 : undefined}
                    >
                      {msg.sender === "bot" && !msg.error ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p style={{ margin: "0.01rem 0", lineHeight: 1.2 }}>{children}</p>,
                            h1: ({ children }) => (
                              <h1 style={{ margin: "0.2rem 0 0.01rem", fontWeight: "bold", fontSize: "1.25rem" }}>
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 style={{ margin: "0.2rem 0 0.01rem", fontWeight: "bold", fontSize: "1.1rem" }}>
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 style={{ margin: "0.2rem 0 0.01rem", fontWeight: "bold", fontSize: "1rem" }}>
                                {children}
                              </h3>
                            ),
                            ul: ({ children }) => <ul style={{ margin: "0.01rem 0", paddingLeft: "0.1rem" }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ margin: "0.01rem 0", paddingLeft: "0.1rem" }}>{children}</ol>,
                            li: ({ children }) => <li style={{ margin: "0.01rem 0", lineHeight: 1.2 }}>{children}</li>,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      {msg.sender === "bot" && !msg.error && (
                        <p className="chat-disclaimer">
                          Kira can make mistakes. Check important info.
                        </p>
                      )}
                      {msg.error && (
                        <p className="chat-error-text">
                          Click here to retry
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isTyping && (
              <div className="typing-indicator">
                <Spinner />
                <span className="typing-text">Kira is typing...</span>
              </div>
            )}
          </div>

          <div className="chat-input-wrapper">
            <div className="chat-input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={isTyping}
                placeholder="Type here..."
                className="chat-input"
                aria-label="Message input"
                autoFocus={isOpen && messages.length > 0}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="chat-send-btn"
                aria-label="Send message"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 22 22">
                  <polygon points="7,18 18,11 7,4 9,11" />
                </svg>
              </button>
            </div>
          </div>

          <div className="chat-footer">
            <img src="/kloudr.png" alt="Kloudr" className="chat-footer-logo" />
            <div>This chatbot is trained on data about Kloudr only.</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default App;
