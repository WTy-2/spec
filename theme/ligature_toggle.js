const inlineLog = (x) => {
  console.log(x);
  return x;
};

const buttonText = () =>
  `${ligatures_enabled ? "Disable" : "Enable"} Ligatures`;

let ligatures_enabled = true;

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

  if (ligatures_enabled == false) {
    Array.from(document.getElementsByTagName("code")).forEach((code_block) => {
      code_block.children[0].style.fontFamily = "Fira Mono Google";
    });
  } else {
    Array.from(document.getElementsByTagName("code")).forEach((code_block) => {
      code_block.children[0].style.fontFamily = "";
    });
  }
});
document.getElementsByClassName("left-buttons")[0].appendChild(button);
