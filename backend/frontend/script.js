document.addEventListener("DOMContentLoaded", () => {
  console.log("Frontend script loaded.");

  const tasksContainer = document.getElementById("tasks-container");
  const createTaskForm = document.getElementById("create-task-form");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescriptionInput = document.getElementById("task-description");

  // Chatbot elements
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendChatBtn = document.getElementById("send-chat-btn");
  const aiChatModal = document.getElementById("ai-chat-modal");
  const openAiChatButton = document.getElementById("open-ai-chat-button");
  const closeAiChatButton = document.getElementById("close-ai-chat-button");

  const registerForm = document.getElementById("register-form");
  const registerUsernameInput = document.getElementById("register-username");
  const registerPasswordInput = document.getElementById("register-password");

  const loginForm = document.getElementById("login-form");
  const loginUsernameInput = document.getElementById("login-username");
  const loginPasswordInput = document.getElementById("login-password");

  const logoutButton = document.getElementById("logout-button");
  const currentUserUsernameSpan = document.getElementById(
    "current-user-username"
  );
  const authMessage = document.getElementById("auth-message");

  const loggedOutView = document.getElementById("logged-out-view");
  const loggedInView = document.getElementById("logged-in-view");
  const taskManagementSection = document.getElementById("task-management");

  const API_BASE_URL = "http://localhost:8000";
  let accessToken = null;

  // Chat History
  let chatHistory = [];

  function setAuthToken(token) {
    accessToken = token;
    localStorage.setItem("access_token", token);
  }

  function getAuthToken() {
    return localStorage.getItem("access_token");
  }

  function removeAuthToken() {
    accessToken = null;
    localStorage.removeItem("access_token");
  }

  function isAuthenticated() {
    return !!getAuthToken();
  }

  async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
      removeAuthToken();
      setAuthView();
      alert("Session expired or unauthorized. Please log in again.");
    }
    return response;
  }

  async function updateCurrentUser() {
    if (isAuthenticated()) {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/me/`);
        if (response.ok) {
          const user = await response.json();
          currentUserUsernameSpan.textContent = user.username;
        } else {
          console.error("Failed to fetch current user.", response.statusText);
          removeAuthToken();
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        removeAuthToken();
      }
    }
  }

  function setAuthView() {
    if (isAuthenticated()) {
      loggedOutView.style.display = "none";
      loggedInView.style.display = "block";
      taskManagementSection.style.display = "block";
      updateCurrentUser();
    } else {
      loggedOutView.style.display = "block";
      loggedInView.style.display = "none";
      taskManagementSection.style.display = "none";
      currentUserUsernameSpan.textContent = "";
    }
  }

  // Function to fetch and display tasks
  async function fetchTasks() {
    if (!isAuthenticated()) {
      tasksContainer.innerHTML = "";
      return;
    }
    tasksContainer.innerHTML = ""; // Clear existing tasks
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/tasks/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      if (tasks.length === 0) {
        tasksContainer.innerHTML = "<li>No tasks found. Create one!</li>";
      } else {
        tasks.forEach((task) => {
          const li = document.createElement("li");
          li.className = task.completed ? "completed" : "";
          li.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || "No description"}</p>
            <button class="toggle-complete" data-id="${task.id}">${
            task.completed ? "Mark Incomplete" : "Mark Complete"
          }</button>
            <button class="delete-task" data-id="${task.id}">Delete</button>
            <button class="edit-task" data-id="${task.id}">Edit</button>
          `;
          tasksContainer.appendChild(li);
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      tasksContainer.innerHTML = "<li>Error loading tasks. Please log in.</li>";
    }
  }

  // Function to handle creating a new task
  createTaskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = taskTitleInput.value;
    const description = taskDescriptionInput.value;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/tasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json(); // Get the created task
      taskTitleInput.value = "";
      taskDescriptionInput.value = "";
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task.");
    }
  });

  // Event delegation for complete/delete/edit buttons
  tasksContainer.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-task")) {
      const taskId = event.target.dataset.id;
      if (confirm("Are you sure you want to delete this task?")) {
        try {
          const response = await fetchWithAuth(
            `${API_BASE_URL}/api/tasks/${taskId}`,
            {
              method: "DELETE",
            }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          fetchTasks(); // Refresh tasks after deletion
        } catch (error) {
          console.error("Error deleting task:", error);
          alert("Failed to delete task.");
        }
      }
    } else if (event.target.classList.contains("toggle-complete")) {
      const taskId = event.target.dataset.id;
      // First, fetch the existing task to get its current completed status
      try {
        const existingTaskResponse = await fetchWithAuth(
          `${API_BASE_URL}/api/tasks/${taskId}`
        );
        if (!existingTaskResponse.ok) {
          throw new Error(`HTTP error! status: ${existingTaskResponse.status}`);
        }
        const existingTask = await existingTaskResponse.json();

        // Toggle the completed status
        const updatedStatus = !existingTask.completed;

        const response = await fetchWithAuth(
          `${API_BASE_URL}/api/tasks/${taskId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              completed: updatedStatus,
              title: existingTask.title,
              description: existingTask.description,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        fetchTasks(); // Refresh tasks after update
      } catch (error) {
        console.error("Error toggling task completion:", error);
        alert("Failed to update task status.");
      }
    } else if (event.target.classList.contains("edit-task")) {
      const taskId = event.target.dataset.id;
      openEditModal(taskId);
    }
  });

  // Edit Task Modal Logic
  const editTaskModal = document.getElementById("edit-task-modal");
  const closeButton = editTaskModal.querySelector(".close-button");
  const cancelEditButton = document.getElementById("cancel-edit-button");
  const editTaskForm = document.getElementById("edit-task-form");
  const editTaskIdInput = document.getElementById("edit-task-id");
  const editTaskTitleInput = document.getElementById("edit-task-title");
  const editTaskDescriptionInput = document.getElementById(
    "edit-task-description"
  );
  const editTaskCompletedInput = document.getElementById("edit-task-completed");

  closeButton.addEventListener("click", () => {
    editTaskModal.style.display = "none";
  });

  cancelEditButton.addEventListener("click", () => {
    editTaskModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == editTaskModal) {
      editTaskModal.style.display = "none";
    }
  });

  async function openEditModal(taskId) {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/tasks/${taskId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const task = await response.json();

      editTaskIdInput.value = task.id;
      editTaskTitleInput.value = task.title;
      editTaskDescriptionInput.value = task.description || "";
      editTaskCompletedInput.checked = task.completed;

      editTaskModal.style.display = "block";
    } catch (error) {
      console.error("Error fetching task for editing:", error);
      alert("Failed to load task for editing.");
    }
  }

  editTaskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const taskId = editTaskIdInput.value;
    const title = editTaskTitleInput.value;
    const description = editTaskDescriptionInput.value;
    const completed = editTaskCompletedInput.checked;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, description, completed }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      editTaskModal.style.display = "none";
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task.");
    }
  });

  // Handle user registration
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authMessage.textContent = "";
    const username = registerUsernameInput.value;
    const password = registerPasswordInput.value;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      authMessage.textContent = "Registration successful! You can now log in.";
      registerUsernameInput.value = "";
      registerPasswordInput.value = "";
    } catch (error) {
      console.error("Error during registration:", error);
      authMessage.textContent = `Registration failed: ${error.message}`;
    }
  });

  // Handle user login
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authMessage.textContent = "";
    const username = loginUsernameInput.value;
    const password = loginPasswordInput.value;

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(`${API_BASE_URL}/api/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      setAuthView();
      fetchTasks();
      loginUsernameInput.value = "";
      loginPasswordInput.value = "";
      authMessage.textContent = "Login successful!";
    } catch (error) {
      console.error("Error during login:", error);
      authMessage.textContent = `Login failed: ${error.message}`;
    }
  });

  // Handle logout
  logoutButton.addEventListener("click", () => {
    removeAuthToken();
    setAuthView();
    fetchTasks(); // Clear tasks
    authMessage.textContent = "Logged out successfully.";
  });

  function saveChatHistory() {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }

  function loadChatHistory() {
    const storedHistory = localStorage.getItem("chatHistory");
    if (storedHistory) {
      chatHistory = JSON.parse(storedHistory);
      chatHistory.forEach((message) => {
        addMessageToChatBox(message.sender, message.text, false); // Do not save again
      });
    }
  }

  function addMessageToChatBox(sender, message, save = true) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom

    if (save) {
      chatHistory.push({ sender, text: message });
      saveChatHistory();
    }
  }

  async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessageToChatBox("You", message);
    chatInput.value = "";

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/chatbot/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message, history: chatHistory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      addMessageToChatBox("AI Assistant", data.response);
    } catch (error) {
      console.error("Error sending message to AI Assistant:", error);
      addMessageToChatBox("AI Assistant", "Error: Could not get a response.");
    }
  }

  sendChatBtn.addEventListener("click", sendChatMessage);
  chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      sendChatMessage();
    }
  });

  openAiChatButton.addEventListener("click", () => {
    aiChatModal.style.display = "block";
  });

  closeAiChatButton.addEventListener("click", () => {
    aiChatModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == aiChatModal) {
      aiChatModal.style.display = "none";
    }
  });

  // Call setAuthView and fetchTasks on page load
  setAuthView();
  fetchTasks();
  loadChatHistory(); // Load chat history on initial page load
});
