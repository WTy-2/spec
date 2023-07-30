// Simple utility function for logging
const inlineLog = (x) => {
  console.log(x);
  return x;
};

const buttonText = () =>
  `${ligatures_enabled ? "Disable" : "Enable"} Ligatures`;

let ligatures_enabled = true;

// Nest a span element inside every code block to allow for configuring the
// style
Array.from(document.getElementsByTagName("code")).forEach((code_block) => {
  let span = document.createElement("span");
  span.innerText = code_block.innerText;
  code_block.innerText = "";
  code_block.appendChild(span);
});

const button = document.createElement("button");
button.innerText = buttonText();
button.addEventListener("click", () => {
  ligatures_enabled = !ligatures_enabled;
  button.innerText = buttonText();
  Array.from(document.getElementsByTagName("code")).forEach((code_block) => {
    code_block.children[0].style.fontFamily = ligatures_enabled
      ? ""
      : "Fira Mono Google";
  });
});
document.getElementsByClassName("left-buttons")[0].appendChild(button);
