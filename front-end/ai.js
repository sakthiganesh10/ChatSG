console.log("NEW AI JS LOADED");
const textarea = document.querySelector("textarea");
const plusBtn = document.querySelector(".plus-btn");
const menu = document.querySelector(".menu");
const sendBtn = document.querySelector(".send");
const mic = document.querySelector(".mic");
const messages = document.getElementById("messages");
const greetingEl = document.getElementById("greeting");
let isBotReplying = false;

const newChatBtn = document.getElementById("newChatBtn");
const searchChatBtn = document.getElementById("searchChatBtn");
const searchBox = document.getElementById("searchBox");
const chatSearch = document.getElementById("chatSearch");
const chatList = document.getElementById("chatList");
const themeToggle = document.getElementById("themeToggle");
const searchModal = document.getElementById("searchModal");
const globalChatSearch = document.getElementById("globalChatSearch");
const searchResults = document.getElementById("searchResults");
const closeSearch = document.getElementById("closeSearch");
const recentsToggle = document.getElementById("recentsToggle");
const recentsArrow = document.getElementById("recentsArrow");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.querySelector(".sidebar");
const savedUser = JSON.parse(localStorage.getItem("chatSGUser"));
const authBtn = document.getElementById("authBtn");

const profilePhoto = document.getElementById("profilePhoto");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const userProfile = document.querySelector(".user-profile");
const profilePopup = document.getElementById("profilePopup");
const popupPhoto = document.getElementById("popupPhoto");
const popupName = document.getElementById("popupName");
const popupEmail = document.getElementById("popupEmail");
const popupSignOut = document.getElementById("popupSignOut");
const popupTheme = document.getElementById("popupTheme");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const stopBtn=document.querySelector(".stop");
const popupSettings = document.getElementById("popupSettings");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const settingTheme = document.getElementById("settingTheme");
const settingFontSize = document.getElementById("settingFontSize");
const clearAllChats = document.getElementById("clearAllChats");
const autoSaveToggle = document.getElementById("autoSaveToggle");
const responseStyle = document.getElementById("responseStyle");
const defaultLanguage = document.getElementById("defaultLanguage");
const settingsName = document.getElementById("settingsName");
const settingsEmail = document.getElementById("settingsEmail");
const appSettings =
  JSON.parse(localStorage.getItem("chatSGSettings")) || {
    theme: "dark",
    fontSize: "medium",
    autoSave: true,
    responseStyle: "normal",
    language: "english"
  };
let recentsOpen = false;
const fileInput = document.getElementById("fileInput");

let selectedFile = null;
let currentController = null;
let stopGenerating = false;
let lastPrompt="";
let editingMessageDiv = null;
let thinkingStartTime = null;
let thinkingTimer = null;

const userKey = savedUser?.email
  ? `chats_${savedUser.email}`
  : "chats_guest";

const currentChatKey = savedUser?.email
  ? `currentChatId_${savedUser.email}`
  : "currentChatId_guest";

let currentChatId =
  localStorage.getItem(currentChatKey) || Date.now().toString();

/* textarea auto height */
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
});

/* plus menu */
plusBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
});

document.addEventListener("click", (e) => {
  if (!plusBtn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = "none";
  }
});

/* greeting typing */
let username = savedUser?.name || "";

if (savedUser) {
  profileName.textContent = savedUser.name;
  profileEmail.textContent = savedUser.email;
  profilePhoto.src = savedUser.photo;

  authBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Sign out`;
  popupName.textContent = savedUser.name;
popupEmail.textContent = savedUser.email;
popupPhoto.src = savedUser.photo;
} else {
  document.querySelector(".user-profile").style.display = "none";

  authBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Sign in`;
}
const text = savedUser
  ? `Hi ${username}, can I help you with anything?`
  : `Hi, how can I assist you?`;
let i = 0;

function typeEffect() {
  if (i < text.length) {
    greetingEl.innerHTML += text.charAt(i);
    i++;
    setTimeout(typeEffect, 40);
  }
}
// typeEffect();

/* 🤖 AI typing function */
function addBotMessage(text) {

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", "bot");

  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;

  let i = 0;

  function type() {

    if (i < text.length) {
      msgDiv.textContent += text.charAt(i);
      i++;
      setTimeout(type, 5);
    } else {

      msgDiv.innerHTML = marked.parse(text);

      addCodeCopyButtons(msgDiv);

      const tools = document.createElement("div");
      tools.className = "message-tools";

      tools.innerHTML = `
        <button class="copy-btn">
          <i class="fa-regular fa-copy"></i> Copy
        </button>

        <button class="regen-btn">
          <i class="fa-solid fa-rotate-right"></i> Regenerate
        </button>
      `;

      msgDiv.appendChild(tools);

      tools.querySelector(".copy-btn").onclick = () => {
        navigator.clipboard.writeText(text);

        tools.querySelector(".copy-btn").innerHTML =
          `<i class="fa-solid fa-check"></i> Copied`;

        setTimeout(() => {
          tools.querySelector(".copy-btn").innerHTML =
            `<i class="fa-regular fa-copy"></i> Copy`;
        }, 1500);
      };

      tools.querySelector(".regen-btn").onclick = () => {
        textarea.value = lastPrompt;
        sendMessage();
      };

      messages.scrollTop = messages.scrollHeight;
    }
  }

  type();
}

function createUserMessage(message) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", "user");

  msgDiv.innerHTML = `
    <span class="user-text">${message}</span>
    <button class="edit-user-btn">
      <i class="fa-regular fa-pen-to-square"></i>
    </button>
  `;

  msgDiv.querySelector(".edit-user-btn").addEventListener("click", () => {
    editingMessageDiv = msgDiv;
    textarea.value = msgDiv.querySelector(".user-text").textContent;
    textarea.focus();
  });

  return msgDiv;
}

function addCodeCopyButtons(parent) {
  const codeBlocks = parent.querySelectorAll("pre code");

  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentElement;

    const wrapper = document.createElement("div");
    wrapper.className = "code-wrapper";

    const header = document.createElement("div");
    header.className = "code-header";

    const lang = codeBlock.className.replace("language-", "") || "code";

    header.innerHTML = `
      <span>${lang}</span>
      <button class="code-copy-btn">
        <i class="fa-regular fa-copy"></i> Copy code
      </button>
    `;

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    header.querySelector(".code-copy-btn").onclick = () => {
      navigator.clipboard.writeText(codeBlock.textContent);

      header.querySelector(".code-copy-btn").innerHTML =
        `<i class="fa-solid fa-check"></i> Copied`;

      setTimeout(() => {
        header.querySelector(".code-copy-btn").innerHTML =
          `<i class="fa-regular fa-copy"></i> Copy code`;
      }, 1500);
    };
  });
}

function addThinking() {
  thinkingStartTime = Date.now();

  const thinkingDiv = document.createElement("div");
  thinkingDiv.classList.add("thinking-loader");
  thinkingDiv.id = "thinkingBubble";

  thinkingDiv.innerHTML = `
    <div class="dot-thinking">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="thinking-time" id="thinkingTime">Thinking...</div>
  `;

  messages.appendChild(thinkingDiv);
  messages.scrollTop = messages.scrollHeight;

  thinkingTimer = setInterval(() => {
    const seconds = Math.floor((Date.now() - thinkingStartTime) / 1000);
    const timeEl = document.getElementById("thinkingTime");

    if (timeEl && seconds >= 1) {
      timeEl.textContent = `Thought for ${seconds}s`;
    }
  }, 1000);
}
function removeThinking() {
  if (thinkingTimer) {
    clearInterval(thinkingTimer);
    thinkingTimer = null;
  }

  const thinkingDiv = document.getElementById("thinkingBubble");

  if (thinkingDiv) {
    thinkingDiv.remove();
  }
}

/* 🚀 MAIN SEND FUNCTION */
async function sendMessage() {
  if (!savedUser) {
    alert("Please sign in first daa");
    window.location.href = "login.html";
    return;
  }

  if (isBotReplying) return;
 const message = textarea.value.trim();
 lastPrompt = message;
const imageBase64 = selectedFile ? await fileToBase64(selectedFile) : null;

if (message !== "" || imageBase64 !== null) {

    /* remove greeting */
    if (greetingEl) {
  greetingEl.style.display = "none";
}
    /* user message */
   let msgDiv;

if (editingMessageDiv) {
  editingMessageDiv.querySelector(".user-text").textContent = message;
  msgDiv = editingMessageDiv;
  editingMessageDiv = null;
} else {
  msgDiv = createUserMessage(message || "File uploaded");
  messages.appendChild(msgDiv);
}

if (selectedFile) {
  const fileBox = document.createElement("div");
  fileBox.classList.add("sent-file-box");

  if (selectedFile.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(selectedFile);
    fileBox.appendChild(img);
  } else {
    if(selectedFile.type==="application/pdf"){
    fileBox.innerHTML=`
      <i class="fa-solid fa-file-pdf"></i>
    `;
}else{
    fileBox.innerHTML=`
      <i class="fa-solid fa-file"></i>
    `;
}
  }



  msgDiv.appendChild(fileBox);
}
    messages.scrollTop = messages.scrollHeight;

    textarea.value = "";
    textarea.style.height = "40px";

    addThinking();
    isBotReplying = true;
sendBtn.classList.add("loading");

currentController = new AbortController();
stopGenerating = false;

stopBtn.style.display="flex";
sendBtn.style.display="none";
lastPrompt=message;

fetch("http://192.168.29.18:3000/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  signal: currentController.signal,
  body: JSON.stringify({
  message: message,
  image: imageBase64,
  fileName: selectedFile ? selectedFile.name : null,
  fileType: selectedFile ? selectedFile.type : null
})
})
.then(res => res.json())
.then(data => {
  removeThinking();

  addBotMessage(data.reply);

  isBotReplying = false;
  sendBtn.classList.remove("loading");

  stopBtn.style.display = "none";
  sendBtn.style.display = "flex";

  selectedFile = null;
fileInput.value = "";

const oldPreview = document.querySelector(".file-preview");
if (oldPreview) oldPreview.remove();

  setTimeout(saveChat, 300);
})
.catch(err => {
  removeThinking();

  isBotReplying = false;
  sendBtn.classList.remove("loading");

  stopBtn.style.display = "none";
  sendBtn.style.display = "flex";

  if (err.name !== "AbortError") {
    console.log(err);
    addBotMessage("Server error daa 😓");
  }
});
  }
}

/* events */
sendBtn.addEventListener("click", sendMessage);

textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
const voiceRecordUI = document.getElementById("voiceRecordUI");
const cancelVoice = document.getElementById("cancelVoice");
const confirmVoice = document.getElementById("confirmVoice");

let isRecording = false;
let voiceText = "";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let finalText = "";

    for (let i = 0; i < event.results.length; i++) {
      finalText += event.results[i][0].transcript + " ";
    }

    voiceText = finalText.trim();
    console.log("VOICE TEXT:", voiceText);
  };

  recognition.onerror = (event) => {
    console.log("Voice error:", event.error);
  };
}

mic.addEventListener("click", () => {
  if (textarea.value.trim() !== "") {
  alert("First send or clear the current message daa");
  return;
}
  voiceText = "";

  textarea.style.display = "none";
  mic.style.display = "none";
  sendBtn.style.display = "none";
  voiceRecordUI.style.display = "flex";

  isRecording = true;

  if (recognition) {
    recognition.start();
  }
});

cancelVoice.addEventListener("click", () => {
  if (recognition) recognition.stop();

  voiceText = "";
  voiceRecordUI.style.display = "none";
  textarea.style.display = "block";
  mic.style.display = "flex";
  sendBtn.style.display = "flex";

  isRecording = false;
});

confirmVoice.addEventListener("click", () => {
  if (recognition) recognition.stop();

  setTimeout(() => {
    voiceRecordUI.style.display = "none";
    textarea.style.display = "block";
    mic.style.display = "flex";
    sendBtn.style.display = "flex";

    textarea.value = voiceText;
    textarea.focus();

    isRecording = false;
  }, 400);
});

function saveChat() {
  const chats = JSON.parse(localStorage.getItem(userKey)) || {};

  if (messages.innerHTML.trim() !== "") {
    chats[currentChatId] = {
      title: getChatTitle(),
      content: messages.innerHTML
    };
  }

 localStorage.setItem(userKey, JSON.stringify(chats));
localStorage.setItem(currentChatKey, currentChatId);
  loadRecentChats();
}

function getChatTitle() {
  const firstUserMsg = messages.querySelector(".user");
  return firstUserMsg ? firstUserMsg.textContent.slice(0, 25) : "New Chat";
}

function loadRecentChats() {
 const chats = JSON.parse(localStorage.getItem(userKey)) || {};
  chatList.innerHTML = "";

  Object.keys(chats).reverse().forEach(id => {
    const item = document.createElement("div");
    item.classList.add("chat-item");

    const title = document.createElement("span");
    title.classList.add("chat-title");
    title.textContent = chats[id].title;

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-chat");
    deleteBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;

    title.addEventListener("click", () => {
      currentChatId = id;
      messages.innerHTML = chats[id].content;

      if (greetingEl) {
        greetingEl.style.display = "none";
      }

      localStorage.setItem("currentChatId", currentChatId);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const allChats = JSON.parse(localStorage.getItem(userKey)) || {};
      delete allChats[id];

      localStorage.setItem(userKey, JSON.stringify(allChats));
      loadRecentChats();
    });

    item.appendChild(title);
    item.appendChild(deleteBtn);
    chatList.appendChild(item);
  });
}

newChatBtn.addEventListener("click", () => {
  saveChat();

  currentChatId = Date.now().toString();

  messages.innerHTML = "";
  textarea.value = "";

  if (greetingEl) {
    greetingEl.style.display = "block";
    greetingEl.innerHTML = "";
    greetingEl.classList.remove("hide");
    i = 0;
    typeEffect();
  }
});

recentsToggle.addEventListener("click", () => {
  recentsOpen = !recentsOpen;

  if (recentsOpen) {
    chatList.classList.add("open");
    recentsArrow.classList.remove("fa-chevron-down");
recentsArrow.classList.add("fa-chevron-up");
  } else {
    chatList.classList.remove("open");
    recentsArrow.classList.remove("fa-chevron-up");
recentsArrow.classList.add("fa-chevron-down");
  }
});

searchChatBtn.addEventListener("click", () => {

  searchModal.classList.add("active");

  renderSearchChats("");
});

chatSearch.addEventListener("input", () => {
  const value = chatSearch.value.toLowerCase();

  document.querySelectorAll("#chatList div").forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(value)
      ? "block"
      : "none";
  });
});

window.addEventListener("load", () => {
 currentChatId = localStorage.getItem(currentChatKey) || Date.now().toString();

  messages.innerHTML = "";

  if (greetingEl) {
    greetingEl.style.display = "block";
  }

  loadRecentChats();
});

uploadFileBtn.addEventListener("click", () => {
  fileInput.click();
  menu.style.display = "none";
});

document.querySelectorAll(".menu div").forEach((item) => {
  if (item.id !== "uploadFileBtn") {
    item.addEventListener("click", () => {
      menu.style.display = "none";

      if (greetingEl) {
        greetingEl.style.display = "none";
      }

      addBotMessage("This feature will be added later daa 😄");
    });
  }
});
fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files[0];

  if (!selectedFile) return;

  const oldPreview = document.querySelector(".file-preview");
  if (oldPreview) oldPreview.remove();

  const preview = document.createElement("div");
  preview.classList.add("file-preview");

  if (selectedFile.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(selectedFile);
    preview.appendChild(img);
  } else {
    if(selectedFile.type==="application/pdf"){
    preview.innerHTML=`
      <i class="fa-solid fa-file-pdf"></i>
    `;
}else{
    preview.innerHTML=`
      <i class="fa-solid fa-file"></i>
    `;
}
  }


  const removeBtn = document.createElement("button");
  removeBtn.innerHTML = "✕";

  removeBtn.addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    preview.remove();
  });

  preview.appendChild(removeBtn);

  textarea.before(preview);
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

closeSearch.addEventListener("click", () => {
  searchModal.classList.remove("active");
});

globalChatSearch.addEventListener("input", (e) => {
  renderSearchChats(e.target.value.toLowerCase());
});

function renderSearchChats(searchText) {
 const chats = JSON.parse(localStorage.getItem(userKey)) || {};
  searchResults.innerHTML = "";

  Object.keys(chats).reverse().forEach(id => {
    const title = chats[id].title;

    if (title.toLowerCase().includes(searchText)) {
      const div = document.createElement("div");
      div.classList.add("search-chat-item");

      div.innerHTML = `
        <i class="fa-regular fa-message"></i>
        <span>${title}</span>
      `;

      div.addEventListener("click", () => {
        currentChatId = id;
        messages.innerHTML = chats[id].content;

        if (greetingEl) {
          greetingEl.style.display = "none";
        }

        searchModal.classList.remove("active");
      });

      searchResults.appendChild(div);
    }
  });
}

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  const loaderPercent = document.getElementById("loaderPercent");
  const loaderStatus = document.getElementById("loaderStatus");

  const statusTexts = [
    "Starting ChatSG...",
    "Connecting neural core...",
    "Loading memory...",
    "Preparing voice engine...",
    "Syncing interface...",
    "Almost ready..."
  ];

  let percent = 1;
  let statusIndex = 0;

  const statusTimer = setInterval(() => {
    statusIndex++;

    if (statusIndex < statusTexts.length) {
      loaderStatus.textContent = statusTexts[statusIndex];
    }
  }, 600);

  const loading = setInterval(() => {
    percent++;

    loaderPercent.textContent = percent + "%";

    if (percent >= 100) {
      clearInterval(loading);
      clearInterval(statusTimer);

      loaderStatus.textContent = "ChatSG Ready";

      setTimeout(() => {
        loader.classList.add("zoom-out");

        setTimeout(() => {
          loader.classList.add("hide");

          setTimeout(() => {
            loader.remove();

            if (greetingEl) {
              greetingEl.innerHTML = "";
              greetingEl.style.display = "block";
              i = 0;
              typeEffect();
            }
          }, 800);

        }, 1100);

      }, 400);
    }
  }, 28);
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");

  themeToggle.innerHTML = document.body.classList.contains("light-mode")
    ? `<i class="fa-solid fa-sun"></i><span>Light mode</span>`
    : `<i class="fa-solid fa-moon"></i><span>Night mode</span>`;
});

toggleSidebar.addEventListener("click",()=>{

    if(window.innerWidth<=768){

        sidebar.classList.toggle("show");

    }else{

        sidebar.classList.toggle("collapsed");

    }

});

document.addEventListener("click",(e)=>{

    if(window.innerWidth<=768){

        if(
            !sidebar.contains(e.target)
            &&
            !toggleSidebar.contains(e.target)
        ){

            sidebar.classList.remove("show");

        }

    }

});

authBtn.addEventListener("click", () => {
  if (savedUser) {
    localStorage.removeItem("chatSGUser");
    window.location.reload();
  } else {
    window.location.href = "login.html";
  }
});
userProfile.addEventListener("click", (e) => {
  e.stopPropagation();
  profilePopup.classList.toggle("active");
});

document.addEventListener("click", () => {
  profilePopup.classList.remove("active");
});

profilePopup.addEventListener("click", (e) => {
  e.stopPropagation();
});

popupSignOut.addEventListener("click", () => {
  localStorage.removeItem("chatSGUser");
  window.location.reload();
});

popupTheme.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});

mobileMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebar.classList.toggle("show");
});

stopBtn.addEventListener("click", () => {
  stopGenerating = true;

  if (currentController) {
    currentController.abort();
  }

  removeThinking();

  sendBtn.style.display = "flex";
  stopBtn.style.display = "none";

  isBotReplying = false;
});

popupSettings.addEventListener("click", () => {
  profilePopup.classList.remove("active");
  settingsModal.classList.add("active");

  settingsName.textContent = savedUser?.name || "Guest";
  settingsEmail.textContent = savedUser?.email || "Not signed in";
});

closeSettings.addEventListener("click", () => {
  settingsModal.classList.remove("active");
});

settingTheme.addEventListener("change", () => {
  document.body.classList.toggle("light-mode", settingTheme.value === "light");
});

settingFontSize.addEventListener("change", () => {
  document.body.classList.remove("font-small", "font-large");

  if (settingFontSize.value === "small") {
    document.body.classList.add("font-small");
  }

  if (settingFontSize.value === "large") {
    document.body.classList.add("font-large");
  }
});

clearAllChats.addEventListener("click", () => {
  if (confirm("Delete all chats?")) {
    localStorage.removeItem(userKey);
    messages.innerHTML = "";
    loadRecentChats();
  }
});

