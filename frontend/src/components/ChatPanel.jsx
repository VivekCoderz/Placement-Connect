import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { Send, User, Search, RefreshCw, MessageSquare, AlertCircle, ShieldAlert } from "lucide-react";
import api from "../utils/api";

export const ChatPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      withCredentials: true
    });

    if (user?._id) {
      socketRef.current.emit("join", user._id);
    }

    socketRef.current.on("message", (newMsg) => {
      // Append if matches active conversation
      if (
        (newMsg.senderId === user._id && newMsg.receiverId === selectedContact?.id) ||
        (newMsg.senderId === selectedContact?.id && newMsg.receiverId === user._id)
      ) {
        setMessages((prev) => [...prev, newMsg]);
        setIsTyping(false);
      }
    });

    socketRef.current.on("userTyping", ({ senderId }) => {
      if (senderId === selectedContact?.id) {
        setIsTyping(true);
        // Clear typing indicator after 3 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, selectedContact]);

  // Load Contacts list
  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await api.get("/chat/contacts");
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error("Failed to load chat contacts", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Load message history
  useEffect(() => {
    if (!selectedContact) return;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/chat/messages/${selectedContact.id}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [selectedContact]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle typing triggers
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socketRef.current && selectedContact) {
      socketRef.current.emit("typing", { senderId: user._id, receiverId: selectedContact.id });
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedContact) return;
    
    if (socketRef.current) {
      socketRef.current.emit("sendMessage", {
        senderId: user._id,
        receiverId: selectedContact.id,
        message: inputText.trim()
      });
      setInputText("");
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm shadow-slate-100 flex h-[600px] overflow-hidden">
      
      {/* Left panel: Contacts */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col justify-between">
        <div className="p-4 border-b border-slate-50 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversations</h3>
          
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full bg-slate-50 border border-slate-100 text-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
          {loadingContacts ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No contacts found
            </div>
          ) : (
            filteredContacts.map(contact => {
              const isSelected = selectedContact?.id === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors border ${
                    isSelected 
                      ? "bg-blue-50/50 text-blue-600 border-blue-100/50 shadow-sm font-semibold" 
                      : "text-slate-650 hover:bg-slate-50 border-transparent"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center font-bold text-slate-650 text-[10px] uppercase shrink-0">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="truncate font-semibold">{contact.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-medium">{contact.role}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Chat messages */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {selectedContact ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center z-10 shadow-sm shadow-slate-100/20">
              <div>
                <h4 className="text-xs font-bold text-slate-800">{selectedContact.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{selectedContact.role} Chat Channel</p>
              </div>
            </div>

            {/* Message lists */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {loadingMessages ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.senderId === user._id;
                  return (
                    <div 
                      key={idx}
                      className={`flex flex-col max-w-[70%] ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <div 
                        className={`p-3 rounded-2xl text-xs leading-normal ${
                          isOwn 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "bg-white text-slate-700 border border-slate-100/80 shadow-sm"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1 font-bold">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div className="flex items-center space-x-1 px-3 py-2 bg-white border border-slate-100 text-slate-400 rounded-xl text-[10px] w-20 shadow-sm italic mr-auto">
                  <span>typing</span>
                  <span className="animate-bounce font-bold">.</span>
                  <span className="animate-bounce font-bold [animation-delay:0.2s]">.</span>
                  <span className="animate-bounce font-bold [animation-delay:0.4s]">.</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input action toolbar */}
            <div className="p-3 border-t border-slate-100 bg-white flex items-center space-x-3">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Send message to ${selectedContact.name.split(" ")[0]}...`}
                className="flex-1 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Your Communication Inbox</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Select a contact from the panel list to start a direct message dialogue channel.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatPanel;
