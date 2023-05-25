import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addMessage } from "../store";
import { ReactComponent as SendIcon } from "../images/icon-send.svg";

const Chat = ({ selectedContact }) => {
  const dispatch = useDispatch();
  const messages = useSelector(
    (state) => state.contacts.find((c) => c.id === selectedContact.id).messages
  );
  const messagesEndRef = useRef(null);

  const [input, setInput] = useState("");
  const [shouldMakeApiCall, setShouldMakeApiCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    const userMessage = {
      role: "user",
      content: input,
    };

    dispatch(
      addMessage({ contactId: selectedContact.id, message: userMessage })
    );

    setInput("");
    setShouldMakeApiCall(true);
  };

  useEffect(() => {
    const makeApiCall = async () => {
      if (messages[messages.length - 1].role !== "user") {
        return;
      }

      setIsLoading(true);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages,
            max_tokens: 2048,
            temperature: 0.9,
          }),
        }
      );

      const json = await response.json();
      console.log(json);

      const assistantMessage = {
        role: "assistant",
        content: json.choices[0].message.content.trim(),
      };

      dispatch(
        addMessage({ contactId: selectedContact.id, message: assistantMessage })
      );

      setShouldMakeApiCall(false);
      setIsLoading(false);
    };

    if (messages && messages.length > 0 && shouldMakeApiCall) {
      makeApiCall();
    }
  }, [messages, shouldMakeApiCall, dispatch, selectedContact.id]);

  useEffect(() => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-column chatbot">
      <div className="flex-row contact-header">
        <div className="contact-picture-wrap active">
          <img
            className="contact-picture active"
            src={selectedContact.picture}
          />
        </div>
        <div className="flex-column contact-details">
          <div className="contact-name">{selectedContact.name}</div>
          <div className="contact-role">{selectedContact.role}</div>
        </div>
      </div>
      <div className="flex-column messages">
        {messages.slice(1).map((message, index) => (
          <p key={index} className={`message ${message.role}`}>
            {message.content.split("\n").map((line, index) => {
              return (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              );
            })}
          </p>
        ))}
        {isLoading && (<div className="flex-row message assistant loading-message">
          <div className="message-bubble">
            <p>...</p>
            <div className="loader"></div>
          </div>
        </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-column input-container">
        <form className="flex-column input-container" onSubmit={handleSubmit}>
          <textarea
            className="message-input"
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={handleChange}
            onKeyPress={handleKeyPress} // Add key press handler
          />
          <button className="button-primary" type="submit">
            <SendIcon className="send-icon" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;