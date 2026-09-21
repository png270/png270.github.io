// Gallery files are images/1.jpeg through images/21.jpeg.
const totalImages = 21;
let currentNumber = 1;
let changingPostcard = false;
const postcard = document.getElementById("postcard");
const photo = document.getElementById("carousel-img");
const count = document.getElementById("gallery-count");
const hint = document.getElementById("gallery-hint");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const imageCache = new Map();
const imagePath = (number) => `images/${number}.jpeg`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadPhoto(number) {
  if (imageCache.has(number)) return imageCache.get(number);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(
      () => reject(new Error("Image load timed out")),
      15000,
    );
    image.onload = () => {
      clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Image unavailable"));
    };
    image.src = imagePath(number);
  });
  imageCache.set(number, promise);
  promise.catch(() => imageCache.delete(number));
  return promise;
}
function preloadNextPhoto() {
  loadPhoto((currentNumber % totalImages) + 1).catch(() => {});
}
postcard.addEventListener("click", async () => {
  if (changingPostcard) return;
  changingPostcard = true;
  postcard.setAttribute("aria-busy", "true");
  const nextNumber = (currentNumber % totalImages) + 1;
  try {
    await loadPhoto(nextNumber);
    if (!reducedMotion.matches) {
      postcard.classList.add("is-leaving");
      await delay(180);
    }
    currentNumber = nextNumber;
    photo.src = imagePath(currentNumber);
    photo.alt = `Picture ${currentNumber} from my gallery`;
    count.textContent = `${String(currentNumber).padStart(2, "0")} / ${totalImages}`;
    postcard.setAttribute(
      "aria-label",
      `Postcard ${currentNumber} of ${totalImages}. Show next postcard.`,
    );
    hint.textContent = "Click for the next postcard ↗";
    postcard.classList.remove("is-leaving");
    if (!reducedMotion.matches) {
      postcard.classList.add("is-entering");
      await delay(240);
    }
    preloadNextPhoto();
  } catch {
    hint.textContent = `Couldn't load ${nextNumber}.jpeg — click to retry`;
  } finally {
    postcard.classList.remove("is-leaving", "is-entering");
    postcard.removeAttribute("aria-busy");
    changingPostcard = false;
  }
});
preloadNextPhoto();

const dialog = document.getElementById("reading-dialog");
const launcher = document.getElementById("open-reading");
let previousOverflow = "";
launcher.addEventListener("click", () => {
  if (dialog.open) return;
  previousOverflow = document.body.style.overflow;
  dialog.showModal();
  document.body.style.overflow = "hidden";
  launcher.setAttribute("aria-expanded", "true");
});
document
  .getElementById("close-reading")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => {
  document.body.style.overflow = previousOverflow;
  launcher.setAttribute("aria-expanded", "false");
  launcher.focus({ preventScroll: true });
});
function outside(event) {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}
let startedOutside = false;
dialog.addEventListener("pointerdown", (event) => {
  startedOutside = outside(event);
});
dialog.addEventListener("pointercancel", () => {
  startedOutside = false;
});
dialog.addEventListener("click", (event) => {
  if (startedOutside && outside(event)) dialog.close();
  startedOutside = false;
});
