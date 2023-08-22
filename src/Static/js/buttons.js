// Select all elements with the class "button" and store them in the "buttons" array-like NodeList
const buttons = document.querySelectorAll(".button");

// Loop through each button in the NodeList
for (const button of buttons) {
  // Add a "click" event listener to the current button
  button.addEventListener("click", () => {
    // Toggle the "button--active" class on the clicked button
    button.classList.toggle("button--active");
    // Navigate to a different page by changing the URL to "/game"
    location.href = "/game";
  });
}
