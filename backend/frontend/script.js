document.addEventListener("DOMContentLoaded", () => {
  console.log("Frontend script loaded.");

  const tasksContainer = document.getElementById("tasks-container");
  const createTaskForm = document.getElementById("create-task-form");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescriptionInput = document.getElementById("task-description");

  const API_BASE_URL = "http://localhost:8000/api/tasks/";

  // Function to fetch and display tasks
  async function fetchTasks() {
    tasksContainer.innerHTML = ""; // Clear existing tasks
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
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
        `;
        tasksContainer.appendChild(li);
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      tasksContainer.innerHTML = "<li>Error loading tasks.</li>";
    }
  }

  // Function to handle creating a new task
  createTaskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = taskTitleInput.value;
    const description = taskDescriptionInput.value;

    try {
      const response = await fetch(API_BASE_URL, {
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

  // Event delegation for complete/delete buttons
  tasksContainer.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-task")) {
      const taskId = event.target.dataset.id;
      if (confirm("Are you sure you want to delete this task?")) {
        try {
          const response = await fetch(`${API_BASE_URL}${taskId}`, {
            method: "DELETE",
          });
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
        const existingTaskResponse = await fetch(`${API_BASE_URL}${taskId}`);
        if (!existingTaskResponse.ok) {
          throw new Error(`HTTP error! status: ${existingTaskResponse.status}`);
        }
        const existingTask = await existingTaskResponse.json();

        // Toggle the completed status
        const updatedStatus = !existingTask.completed;

        const response = await fetch(`${API_BASE_URL}${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: updatedStatus,
            title: existingTask.title,
            description: existingTask.description,
          }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        fetchTasks(); // Refresh tasks after update
      } catch (error) {
        console.error("Error toggling task completion:", error);
        alert("Failed to update task status.");
      }
    }
  });

  // Initial fetch of tasks when the page loads
  fetchTasks();
});
