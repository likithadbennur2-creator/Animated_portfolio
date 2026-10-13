const chatArea = document.getElementById("chatArea");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

const suggestionButtons =
  document.querySelectorAll(".suggestions button");

const closeButton =
  document.getElementById("closeAI");


/* =========================
   CONVERSATION
========================= */

let conversation = [];


/* =========================
   ADD MESSAGE
========================= */

function addMessage(type, text) {

  const message = document.createElement("div");

  message.className =
    `message ${type}-message`;

  const formattedText =
    type === "agent"
      ? formatAIResponse(text)
      : escapeHTML(text);

  message.innerHTML = `

    <div class="message-label">
      ${type === "user" ? "YOU" : "AI"}
    </div>

    <div class="message-text">
      ${formattedText}
    </div>

  `;

  chatArea.appendChild(message);

  scrollToBottom();
}


/* =========================
   FORMAT AI RESPONSE
========================= */

function formatAIResponse(text) {

  // First escape HTML for safety
  let html = escapeHTML(text);


  /* =========================
     HEADINGS
  ========================= */

  // ### Heading
  html = html.replace(
    /^###\s+(.*?)$/gm,
    "<h3>$1</h3>"
  );

  // ## Heading
  html = html.replace(
    /^##\s+(.*?)$/gm,
    "<h3>$1</h3>"
  );


  /* =========================
     BOLD TEXT
  ========================= */

  html = html.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );


  /* =========================
     BULLET POINTS
  ========================= */

  html = html.replace(
    /^\-\s+(.*?)$/gm,
    "<li>$1</li>"
  );


  /* =========================
     NUMBERED LISTS
  ========================= */

  html = html.replace(
    /^\d+\.\s+(.*?)$/gm,
    "<li>$1</li>"
  );


  /* =========================
     WRAP LIST ITEMS
  ========================= */

  html = html.replace(
    /((?:<li>.*?<\/li>\s*)+)/gs,
    "<ul>$1</ul>"
  );


  /* =========================
     LINE BREAKS
  ========================= */

  html = html.replace(
    /\n{2,}/g,
    "<br><br>"
  );

  html = html.replace(
    /\n/g,
    "<br>"
  );


  return html;
}


/* =========================
   TYPING INDICATOR
========================= */

function showTyping() {

  const message = document.createElement("div");

  message.className =
    "message agent-message";

  message.id = "typingMessage";

  message.innerHTML = `

    <div class="message-label">
      AI
    </div>

    <div class="message-text">

      <div class="typing">

        <span></span>
        <span></span>
        <span></span>

      </div>

    </div>

  `;

  chatArea.appendChild(message);

  scrollToBottom();
}


function removeTyping() {

  const typing =
    document.getElementById("typingMessage");

  if (typing) {

    typing.remove();

  }
}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

  chatArea.scrollTop =
    chatArea.scrollHeight;

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(text) {

  text = text.trim();

  if (!text) return;


  /* USER MESSAGE */

  addMessage("user", text);


  /* SAVE MESSAGE */

  conversation.push({

    role: "user",

    content: text

  });


  chatInput.value = "";

  sendButton.disabled = true;

  showTyping();


  try {

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {

        "Content-Type":
          "application/json"

      },

      body: JSON.stringify({

        messages: conversation

      })

    });


    const data =
      await response.json();


    removeTyping();


    if (!response.ok) {

      throw new Error(
        data.error || "Server error"
      );

    }


    const reply =
      data.reply ||
      "I don't have an answer for that.";


    /* AI MESSAGE */

    addMessage("agent", reply);


    /* SAVE AI MESSAGE */

    conversation.push({

      role: "assistant",

      content: reply

    });


  } catch (error) {

    console.error(error);

    removeTyping();

    addMessage(
      "agent",
      "Sorry, I couldn't connect to my AI service right now."
    );

  }


  sendButton.disabled = false;

  chatInput.focus();

}


/* =========================
   FORM
========================= */

chatForm.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();

    sendMessage(chatInput.value);

  }
);


/* =========================
   SUGGESTIONS
========================= */

suggestionButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const question =
        button.dataset.question;

      sendMessage(question);

    }
  );

});


/* =========================
   CLOSE
========================= */

closeButton.addEventListener(
  "click",
  () => {

    window.parent.postMessage(
      {
        type: "closePortfolioAI"
      },
      "*"
    );

  }
);