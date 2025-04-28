  document.addEventListener("DOMContentLoaded", function () {
      const chatBox = document.getElementById("chat-box");
      const userInput = document.getElementById("user-input");

      function loadChatHistory() {
    const messages = JSON.parse(localStorage.getItem("chatHistory")) || [];
    messages.forEach(msg => appendMessage(msg.sender, msg.message, false, false));
}


      function saveMessage(sender, message) {
          const messages = JSON.parse(localStorage.getItem("chatHistory")) || [];
          messages.push({ sender, message });
          localStorage.setItem("chatHistory", JSON.stringify(messages));
      }

       document.querySelector(".clear-chat-btn").addEventListener("click", function () {
            localStorage.removeItem("chatHistory");
            document.getElementById("chat-box").innerHTML = "";
        });

        document.querySelector(".send-chat-btn").addEventListener("click", function () {
            sendMessage();
        });


      function appendMessage(sender, message, save = true, animate = true) {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper", sender);

    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");

    if (sender === "bot") {
        const chatHead = document.createElement("img");
        chatHead.src = "https://upload.wikimedia.org/wikipedia/en/2/2d/University_of_Perpetual_Help_System_DALTA_logo.png";
        chatHead.classList.add("chat-head");
        chatHead.style.width = "20px";
        chatHead.style.height = "30px";
        messageWrapper.appendChild(chatHead);
    }

    const messageBubble = document.createElement("div");
    messageBubble.classList.add("message-bubble");

    if (sender === "bot" && animate) {
        typeText(messageBubble, message);
    } else {
        const formattedMessage = message
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
        messageBubble.innerHTML = formattedMessage;
    }

    messageContainer.appendChild(messageBubble);
    messageWrapper.appendChild(messageContainer);
    chatBox.appendChild(messageWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save) {
        saveMessage(sender, message);
    }
}


  function showTypingAnimation() {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper", "bot");
    messageWrapper.setAttribute("id", "typing-indicator");

    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");

    const loader = document.createElement("div");
    loader.classList.add("loader");
    loader.innerHTML = "<span></span><span></span><span></span>";

    messageContainer.appendChild(loader);
    messageWrapper.appendChild(messageContainer);
    document.getElementById("chat-box").appendChild(messageWrapper);
    document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
}

function hideTypingAnimation() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function sendMessage() {
    const userInput = document.getElementById("user-input");
    const message = userInput.value.trim();
    if (message === "") return;

    appendMessage("user", message);
    userInput.value = "";

    showTypingAnimation(); // Show typing indicator

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("API quota exhausted. Please try again later.");
            }
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        hideTypingAnimation(); // Remove typing animation
        if (data.error) {
            appendMessage("bot", `Error: ${data.error}`.trim());
        } else {
            let botResponse = data.response.trim();
            if (botResponse.startsWith("Response to:")) {
                botResponse = botResponse.replace("Response to:", "").trim();
            }
            appendMessage("bot", botResponse);
        }
    })
    .catch(error => {
        hideTypingAnimation(); // Remove typing animation
        console.error("Error:", error);
        appendMessage("bot", error.message);
    });
}

      document.querySelector("button").addEventListener("click", sendMessage);
      userInput.addEventListener("keypress", function (event) {
          if (event.key === "Enter") sendMessage();
      });

      loadChatHistory();
  });

function typeText(element, text, delay = 20, charsPerTick = 7) {
    const chatBox = document.getElementById("chat-box");

    // Preprocess text into HTML nodes
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");

    const nodes = Array.from(tempDiv.childNodes);
    element.innerHTML = ''; // Clear previous content

    let currentNodeIndex = 0;
    let currentTextIndex = 0;
    let activeElement = null;

    function typeNext() {
        if (currentNodeIndex >= nodes.length) {
            chatBox.scrollTop = chatBox.scrollHeight;
            return;
        }

        let currentNode = nodes[currentNodeIndex];

        if (currentNode.nodeType === Node.TEXT_NODE) {
            if (!activeElement) {
                activeElement = element; // For plain text, type directly into main element
            }
            const chunk = currentNode.textContent.substr(currentTextIndex, charsPerTick);
            if (chunk.length > 0) {
                activeElement.appendChild(document.createTextNode(chunk));
                currentTextIndex += chunk.length;
            }
            if (currentTextIndex >= currentNode.textContent.length) {
                currentNodeIndex++;
                currentTextIndex = 0;
                activeElement = null;
            }
        }
        else if (currentNode.nodeType === Node.ELEMENT_NODE) {
            if (currentNode.tagName === "BR") {
                element.appendChild(document.createElement("br"));
                currentNodeIndex++;
                activeElement = null;
            } else {
                // Bold or other elements
                if (!activeElement) {
                    activeElement = document.createElement(currentNode.tagName);
                    element.appendChild(activeElement);
                }
                const chunk = currentNode.textContent.substr(currentTextIndex, charsPerTick);
                if (chunk.length > 0) {
                    activeElement.appendChild(document.createTextNode(chunk));
                    currentTextIndex += chunk.length;
                }
                if (currentTextIndex >= currentNode.textContent.length) {
                    currentNodeIndex++;
                    currentTextIndex = 0;
                    activeElement = null;
                }
            }
        }

        chatBox.scrollTop = chatBox.scrollHeight;
        setTimeout(typeNext, delay);
    }

    typeNext();
}
