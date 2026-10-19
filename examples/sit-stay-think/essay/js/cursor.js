/* Cursor: a small inked paw print; links get a paw with a pink pad. */
(function () {
  "use strict";
  if (matchMedia("(pointer: coarse)").matches) return;
  const paw = (pad) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><g fill="#231d1a" opacity=".88"><ellipse cx="13" cy="16.5" rx="5.6" ry="4.6"/><ellipse cx="6.2" cy="10.2" rx="2.1" ry="2.7" transform="rotate(-20 6.2 10.2)"/><ellipse cx="10.6" cy="6.6" rx="2.1" ry="2.8"/><ellipse cx="15.6" cy="6.6" rx="2.1" ry="2.8"/><ellipse cx="19.9" cy="10.2" rx="2.1" ry="2.7" transform="rotate(20 19.9 10.2)"/></g>${pad ? '<ellipse cx="13" cy="16.8" rx="3.2" ry="2.4" fill="#eba796"/>' : ""}</svg>`)}`;
  const st = document.createElement("style");
  st.textContent = `html, body { cursor: url("${paw(false)}") 13 13, auto; } a, button, .hot { cursor: url("${paw(true)}") 13 13, pointer; }`;
  document.head.appendChild(st);
})();
