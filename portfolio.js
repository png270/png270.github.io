// Gallery: 1 → 2 → ... → 21 → 1.
    const galleryButton = document.querySelector("#gallery-button");
    const galleryCard = document.querySelector(".gallery-card");
    const galleryImage = document.querySelector("#gallery-image");
    const galleryCount = document.querySelector("#gallery-count");
    const galleryStatus = document.querySelector("#gallery-status");

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let photoNumber = 1;
    let changingPhoto = false;

    galleryButton.addEventListener("click", async () => {
      if (changingPhoto) return;

      changingPhoto = true;
      galleryButton.setAttribute("aria-busy", "true");

      const nextNumber = photoNumber === 21 ? 1 : photoNumber + 1;
      const nextImage = new Image();
      nextImage.src = `images/${nextNumber}.jpeg`;

      try {
        await nextImage.decode();

        if (!motionPreference.matches) {
          await galleryCard.animate(
            [
              { transform: "rotateY(0deg)", opacity: 1 },
              { transform: "rotateY(-90deg)", opacity: 0.3 }
            ],
            { duration: 180, easing: "ease-in", fill: "forwards" }
          ).finished;
        }

        galleryImage.src = nextImage.src;
        galleryImage.alt = `Photo ${nextNumber} from my gallery`;
        galleryCount.textContent =
          `${String(nextNumber).padStart(2, "0")} / 21`;

        photoNumber = nextNumber;

        galleryCard.getAnimations().forEach(animation => animation.cancel());

        if (!motionPreference.matches) {
          await galleryCard.animate(
            [
              { transform: "rotateY(90deg)", opacity: 0.3 },
              { transform: "rotateY(0deg)", opacity: 1 }
            ],
            { duration: 220, easing: "ease-out" }
          ).finished;
        }

        galleryStatus.textContent = `Showing photo ${photoNumber} of 21.`;
      } catch {
        galleryStatus.textContent =
          "The next photo could not load. Click again to retry.";
      } finally {
        galleryCard.getAnimations().forEach(animation => animation.cancel());
        galleryButton.removeAttribute("aria-busy");
        changingPhoto = false;
      }
    });

    // Highlight the section currently being read.
    const navLinks = [...document.querySelectorAll(".section-nav a")];
    const sections = navLinks.map(link =>
      document.querySelector(link.hash)
    );

    let updateQueued = false;

    function updateNavigation() {
      let activeSection = sections[0];
      const readingPosition = window.innerHeight * 0.3;

      sections.forEach(section => {
        if (section.getBoundingClientRect().top <= readingPosition) {
          activeSection = section;
        }
      });

      navLinks.forEach(link => {
        if (link.hash === `#${activeSection.id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      updateQueued = false;
    }

    window.addEventListener("scroll", () => {
      if (!updateQueued) {
        updateQueued = true;
        requestAnimationFrame(updateNavigation);
      }
    }, { passive: true });

    updateNavigation();

    // Preserve labels when an external skill logo fails to load.
document.querySelectorAll(".skill-logos img").forEach(logo => {
  function useFallback() {
    if (!logo.isConnected) return;

    const namespace = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(namespace, "svg");
    const use = document.createElementNS(namespace, "use");

    icon.classList.add("skill-symbol");
    icon.setAttribute("aria-hidden", "true");
    use.setAttribute("href", "#skill-terminal");

    icon.appendChild(use);
    logo.replaceWith(icon);
  }

  logo.addEventListener("error", useFallback, { once: true });

  if (logo.complete && logo.naturalWidth === 0) {
    useFallback();
  }
});
    // Arrange About sidebars independently of the essay.
(() => {
  const about = document.querySelector(".about-section");
  if (!about) return;

  const desktop = window.matchMedia("(min-width: 701px)");
  const chapters = [...about.querySelectorAll(".chapter")];
  const sidebars = [...about.querySelectorAll(".chapter-side")];

  let scheduled = false;

  function arrangeSidebars() {
    scheduled = false;

    if (!desktop.matches) {
      sidebars.forEach(sidebar => {
        sidebar.style.removeProperty("--sidebar-top");
      });
      about.style.removeProperty("padding-bottom");
      return;
    }

    const aboutTop = about.getBoundingClientRect().top;
    const occupiedUntil = { left: 0, right: 0 };
    const sidebarGap = 24;

    chapters.forEach(chapter => {
      const chapterTop =
        chapter.getBoundingClientRect().top - aboutTop;

      chapter.querySelectorAll(".chapter-side").forEach(sidebar => {
        const side =
          sidebar.classList.contains("bsm-sidebar") ||
          chapter.classList.contains("side-right")
            ? "right"
            : "left";

        let preferredTop = chapterTop;

        // Align BSM with the summer paragraph within Hard Reset.
        if (sidebar.classList.contains("bsm-sidebar")) {
          const summerParagraph =
            chapter.querySelectorAll(".essay > p")[1];

          if (summerParagraph) {
            preferredTop =
              summerParagraph.getBoundingClientRect().top - aboutTop;
          }
        }

        const actualTop = Math.max(
          preferredTop,
          occupiedUntil[side]
        );

        sidebar.style.setProperty(
          "--sidebar-top",
          `${actualTop - chapterTop}px`
        );

        occupiedUntil[side] =
          actualTop + sidebar.getBoundingClientRect().height + sidebarGap;
      });
    });

    // Keep the footer below any side note extending past the essay.
    const lastChapter = chapters[chapters.length - 1];
    const essayBottom = lastChapter
      ? lastChapter.getBoundingClientRect().bottom - aboutTop
      : 0;

    const sidebarBottom = Math.max(
      0,
      occupiedUntil.left - sidebarGap,
      occupiedUntil.right - sidebarGap
    );

    const padding = `${Math.ceil(
      Math.max(0, sidebarBottom - essayBottom)
    )}px`;

    if (about.style.paddingBottom !== padding) {
      about.style.paddingBottom = padding;
    }
  }

  function scheduleLayout() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(arrangeSidebars);
  }

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(scheduleLayout);
    chapters.forEach(chapter => observer.observe(chapter));
    sidebars.forEach(sidebar => observer.observe(sidebar));
  }

  window.addEventListener("resize", scheduleLayout);
  window.addEventListener("load", scheduleLayout);
  desktop.addEventListener("change", scheduleLayout);

  if (document.fonts) {
    document.fonts.ready.then(scheduleLayout);
  }

  scheduleLayout();
})();
