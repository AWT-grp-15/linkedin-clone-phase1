import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const getInitials = (u) => {
    if (!u) return "U";
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    setLoadingConv(true);
    try {
      const res = await fetch("/api/messages/conversations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0 && !selectedContact) {
          setSelectedContact(data.conversations[0].contact);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchMessages = async (contactId) => {
    if (!contactId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${contactId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact._id);
    }
  }, [selectedContact]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedContact || sending) return;

    setSending(true);
    const messageContent = text.trim();
    setText("");

    try {
      const res = await fetch(`/api/messages/${selectedContact._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: messageContent })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setTimeout(scrollToBottom, 50);

        // Update conversation last message preview
        setConversations((prev) =>
          prev.map((c) =>
            c.contact._id === selectedContact._id
              ? { ...c, lastMessage: messageContent, lastMessageTime: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const fullName = `${c.contact.firstName} ${c.contact.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div className="messaging-page-container">
      <div className="messaging-chat-box card">
        {/* Left Conversations Sidebar */}
        <div className="chat-conversations-pane">
          <div className="chat-pane-header">
            <h3>Messaging</h3>
            <span className="conv-count">{conversations.length}</span>
          </div>

          <div className="chat-search-wrap">
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="conversations-scroll-list">
            {loadingConv ? (
              <div className="chat-loading">Loading chats...</div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((item) => (
                <div
                  key={item.contact._id}
                  className={`conversation-tab-item ${selectedContact?._id === item.contact._id ? "active" : ""}`}
                  onClick={() => setSelectedContact(item.contact)}
                >
                  <div className="conv-avatar">
                    {item.contact.avatar ? (
                      <img src={item.contact.avatar} alt={item.contact.firstName} />
                    ) : (
                      <span>{getInitials(item.contact)}</span>
                    )}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name-row">
                      <strong>
                        {item.contact.firstName} {item.contact.lastName}
                      </strong>
                    </div>
                    <p className="conv-last-msg">{item.lastMessage}</p>
                  </div>
                  {item.unreadCount > 0 && (
                    <span className="conv-unread-pill">{item.unreadCount}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-conv-list">
                <p>No conversations found.</p>
                <Link to="/network" className="btn-find-conn">
                  Find Connections to Message
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Active Message Pane */}
        <div className="chat-active-pane">
          {selectedContact ? (
            <>
              {/* Active Chat Header */}
              <div className="active-chat-header">
                <div className="active-user-meta">
                  <div className="active-user-avatar">
                    {selectedContact.avatar ? (
                      <img src={selectedContact.avatar} alt={selectedContact.firstName} />
                    ) : (
                      <span>{getInitials(selectedContact)}</span>
                    )}
                  </div>
                  <div>
                    <Link to={`/profile/${selectedContact._id}`} className="active-user-name">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </Link>
                    <p className="active-user-headline">{selectedContact.headline}</p>
                  </div>
                </div>
                <Link to={`/profile/${selectedContact._id}`} className="btn-view-profile-sm">
                  View Profile
                </Link>
              </div>

              {/* Message Stream */}
              <div className="active-messages-stream">
                {loadingMessages ? (
                  <div className="chat-loading">Loading message history...</div>
                ) : messages.length > 0 ? (
                  messages.map((m) => {
                    const isMine = user && String(m.sender) === String(user._id);
                    return (
                      <div
                        key={m._id}
                        className={`message-bubble-wrapper ${isMine ? "mine" : "theirs"}`}
                      >
                        <div className="message-bubble">
                          <p className="message-text">{m.text}</p>
                          <span className="message-timestamp">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-messages-intro">
                    <p>Start your conversation with {selectedContact.firstName}!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="active-chat-input-bar">
                <input
                  type="text"
                  placeholder={`Write a message to ${selectedContact.firstName}...`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-chat-send"
                  disabled={!text.trim() || sending}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="empty-chat-icon">💬</div>
              <h3>Your Messages</h3>
              <p>Select a connection from the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagingPage;