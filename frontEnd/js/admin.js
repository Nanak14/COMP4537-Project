document.addEventListener("DOMContentLoaded", function () {
    // Fetch user information from the server and populate the table
    fetch("http://localhost:5001/users")
      .then((response) => response.json())
      .then((users) => {
        const tableBody = document.getElementById("userTableBody");
        users.forEach((user) => {
          const row = tableBody.insertRow();
          const cell1 = row.insertCell(0);
          const cell2 = row.insertCell(1);
          const cell3 = row.insertCell(2);
          cell1.textContent = user.username;
          cell2.textContent = user.email;
  
          const deleteButton = document.createElement("button");
          deleteButton.textContent = "Delete";
          deleteButton.addEventListener("click", () => handleDelete(user.username));
          cell3.appendChild(deleteButton);
        });
      })
      .catch((error) => console.error("Error fetching user information:", error));
  
    // Fetch API stats from the server and populate the API table
    fetch("http://localhost:5001/admin/api/stats")
      .then((response) => response.json())
      .then((apiStats) => {
        const tableBody = document.getElementById("apiTableBody");
        apiStats.forEach((stat) => {
          const row = tableBody.insertRow();
          const cell1 = row.insertCell(0);
          const cell2 = row.insertCell(1);
          const cell3 = row.insertCell(2);
          cell1.textContent = stat.method;
          cell2.textContent = stat.endpoint;
          cell3.textContent = stat.requests;
        });
      })
      .catch((error) => console.error("Error fetching API stats:", error));
  
    // Fetch user API consumption from the server and populate the user API table
    fetch("http://localhost:5001/admin/user/api/consumption")
      .then((response) => response.json())
      .then((userApiConsumption) => {
        const tableBody = document.getElementById("userApiTableBody");
        userApiConsumption.forEach((consumption) => {
          const row = tableBody.insertRow();
          const cell1 = row.insertCell(0);
          const cell2 = row.insertCell(1);
          const cell3 = row.insertCell(2);
          const cell4 = row.insertCell(3);
          cell1.textContent = consumption.username;
          cell2.textContent = consumption.method;
          cell3.textContent = consumption.endpoint;
          cell4.textContent = consumption.totalRequests;
        });
      })
      .catch((error) => console.error("Error fetching user API consumption:", error));
  
      function handleDelete(username) {
        // Confirm if the user wants to delete
        const confirmDelete = confirm(
          `Are you sure you want to delete the user ${username}?`
        );
      
        if (confirmDelete) {
          // Get the user token from localStorage
          const userToken = localStorage.getItem("token");
      
          if (!userToken) {
            console.error("User token not found. User may not be authenticated.");
            return;
          }
      
          // Send a DELETE request to the server with user information
          fetch(`http://localhost:5001/users/${username}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userToken}`, // Include the user's token
            },
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data.message);
              // Refresh the page or update the table after successful deletion
              location.reload();
            })
            .catch((error) => console.error("Error deleting user:", error));
        }
      }
      
      
  });
  