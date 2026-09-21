// Notes sidebar: navigation remains available even with JavaScript disabled.
const sidebarToggle = document.getElementById("sidebar-toggle");
if (sidebarToggle) {
  const sidebar = document.getElementById("notes-sidebar");
  const windowElement = document.querySelector(".notes-window");
  function setSidebar(open) {
    sidebar.hidden = !open;
    windowElement.classList.toggle("sidebar-hidden", !open);
    sidebarToggle.setAttribute("aria-expanded", String(open));
  }
  setSidebar(!window.matchMedia("(max-width: 768px)").matches);
  sidebarToggle.addEventListener("click", () => setSidebar(sidebar.hidden));
}
