const inlineLog = (x) => {
  console.log(x);
  return x;
};

const buttonText = () =>
  `${ligatures_enabled ? "Disable" : "Enable"} Ligatures`;

let ligatures_enabled = true;
const button = document.createElement("button");
button.innerText = buttonText();
button.addEventListener("click", () => {
  ligatures_enabled = !ligatures_enabled;
  button.innerText = buttonText();
  Array.from(document.getElementsByClassName("language-wty2 hljs")).forEach(
    (code_block) => {
      console.log(code_block);
      code_block.style.fontFamily = "yeow";
    }
  );
  if (ligatures_enabled == false) {
  }
});
document.getElementsByClassName("left-buttons")[0].appendChild(button);
