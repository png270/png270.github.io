const avatar = document.querySelector(".avatar-container");
    const ripple = document.querySelector(".ripple-origin");
    const scroller = document.querySelector(".window-content");

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let hovered = false;
    let focused = false;
    let frame = 0;

    function positionRipple() {
      const rect = avatar.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();

      const visible =
        rect.bottom > Math.max(0, scrollRect.top) &&
        rect.top < Math.min(window.innerHeight, scrollRect.bottom) &&
        rect.right > 0 &&
        rect.left < window.innerWidth;

      ripple.style.left = `${rect.left + rect.width / 2}px`;
      ripple.style.top = `${rect.top + rect.height / 2}px`;
      ripple.classList.toggle("active", visible);
    }

    function animateRipplePosition() {
      positionRipple();
      frame = requestAnimationFrame(animateRipplePosition);
    }

    function updateRipple() {
      cancelAnimationFrame(frame);
      ripple.classList.remove("active");

      if (
        (hovered || focused) &&
        !motionPreference.matches &&
        !document.hidden
      ) {
        animateRipplePosition();
      }
    }

    avatar.addEventListener("pointerenter", () => {
      hovered = true;
      updateRipple();
    });

    avatar.addEventListener("pointerleave", () => {
      hovered = false;
      updateRipple();
    });

    avatar.addEventListener("pointercancel", () => {
      hovered = false;
      updateRipple();
    });

    avatar.addEventListener("focus", () => {
      focused = true;
      updateRipple();
    });

    avatar.addEventListener("blur", () => {
      focused = false;
      updateRipple();
    });

    document.addEventListener("visibilitychange", updateRipple);
    motionPreference.addEventListener("change", updateRipple);

    // Gentle timeline reveal, with keyboard and reduced-motion support.
    const rows = document.querySelectorAll(".timeline-row");
    let observer;

    if ("IntersectionObserver" in window && !motionPreference.matches) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05 });

      rows.forEach((row) => {
        row.classList.add("reveal-ready");
        observer.observe(row);

        row.addEventListener("focusin", () => {
          row.classList.add("is-visible");
          observer.unobserve(row);
        });
      });
    }

    motionPreference.addEventListener("change", (event) => {
      if (event.matches) {
        observer?.disconnect();
        rows.forEach((row) => row.classList.add("is-visible"));
      }
    });
