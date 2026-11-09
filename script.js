(() => {
    "use strict";

    const config = window.ALICE_CONFIG || {};
    const motionPreference = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );
    const mobileViewport = window.matchMedia(
        "(max-width: 760px)"
    );
    const header = document.querySelector(".site-header");
    const navigation = document.querySelector(".main-nav");
    const navigationToggle = document.querySelector(".nav-toggle");
    const menuDialog = document.querySelector("#menu-dialog");
    const photoDialog = document.querySelector("#photo-dialog");

    const setText = (selector, value) => {
        if (typeof value !== "string" || !value.trim()) {
            return;
        }
        document.querySelectorAll(selector).forEach((element) => {
            element.textContent = value;
        });
    };

    const safeUrl = (value, allowRelative = false) => {
        if (typeof value !== "string" || !value.trim()) return null;
        try {
            const parsed = new URL(value, window.location.href);
            if (["https:", "http:"].includes(parsed.protocol)) return parsed.href;
            if (allowRelative && parsed.protocol === "file:") return parsed.href;
        } catch {
            return null;
        }
        return null;
    };

    const setExternalLink = (selector, value) => {
        const href = safeUrl(value);
        if (!href) {
            return;
        }
        document.querySelectorAll(selector).forEach((link) => {
            link.href = href;
        });
    };

    setText("[data-name]", config.restaurantName);
    setText("[data-address]", config.address);
    setText("[data-locality]", config.locality);
    setText("[data-footer-note]", config.footerNote);
    setText("#menu-dialog-title", config.menuTitle);
    setText("#menu-dialog-description", config.menuDescription);
    setText("[data-year]", String(new Date().getFullYear()));
    setExternalLink("[data-maps]", config.mapsUrl);
    setExternalLink("[data-tripadvisor]", config.tripadvisorUrl);

    if (typeof config.phone === "string" && config.phone.trim()) {
        setText("[data-phone-text]", config.phone);
        const phone = config.phone.replace(/[^+\d]/g, "");
        document.querySelectorAll("[data-phone-link]").forEach((link) => {
            link.href = `tel:${phone}`;
        });
    }

    if (typeof config.email === "string" && config.email.trim()) {
        const email = document.querySelector("[data-email-row]");
        email.textContent = config.email;
        email.href = `mailto:${config.email.trim()}`;
        email.hidden = false;
    }

    if (Array.isArray(config.openingHours) && config.openingHours.length) {
        const hours = document.querySelector("[data-hours]");
        const lines = config.openingHours.filter(
            (line) => typeof line === "string" && line.trim(),
        );
        lines.forEach((line) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            hours.append(paragraph);
        });
        document.querySelector("[data-hours-fallback]").hidden = lines.length > 0;
    }

    const pdfUrl = safeUrl(config.menuPdfUrl, true);
    if (pdfUrl) {
        const pdfLink = document.querySelector("[data-menu-pdf]");
        pdfLink.href = pdfUrl;
        pdfLink.hidden = false;
        document.querySelector(".menu-status").textContent =
            "Il menù in PDF è disponibile qui sotto.";
    }

    // NAVIGAZIONE MOBILE
    const closeNavigation = () => {
        navigation.classList.remove("is-open");
        navigationToggle.setAttribute("aria-expanded", "false");
        navigationToggle.setAttribute("aria-label", "Apri navigazione");
    };

    navigationToggle.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("is-open");
        navigationToggle.setAttribute("aria-expanded", String(isOpen));
        navigationToggle.setAttribute(
            "aria-label",
            isOpen ? "Chiudi navigazione" : "Apri navigazione",
        );
    });

    navigation.querySelectorAll("a, button").forEach((item) => {
        item.addEventListener("click", closeNavigation);
    });

    document.addEventListener("click", (event) => {
        if (!header.contains(event.target)) closeNavigation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navigation.classList.contains("is-open")) {
            closeNavigation();
            navigationToggle.focus();
        }
    });

    mobileViewport.addEventListener("change", closeNavigation);

    let dialogTrigger = null;

    const openDialog = (dialog, trigger) => {
        closeNavigation();
        dialogTrigger = trigger;
        document.body.classList.add("modal-open");
        dialog.showModal();
    };

    document.querySelectorAll("[data-open-menu]").forEach((button) => {
        button.addEventListener("click", () => openDialog(menuDialog, button));
    });

    // SLIDER CUCINA: due gruppi identici per un movimento infinito.
    const galleryTrack = document.querySelector(".food-gallery-track");
    const gallerySet = document.querySelector(".food-gallery-set");

    if (galleryTrack && gallerySet) {
        const duplicate = gallerySet.cloneNode(true);
        duplicate.setAttribute("aria-hidden", "true");
        duplicate.querySelectorAll("button").forEach((button) => {
            button.tabIndex = -1;
        });
        duplicate.querySelectorAll("img").forEach((image) => {
            image.alt = "";
        });
        galleryTrack.append(duplicate);
    }

    document.querySelectorAll("[data-lightbox]").forEach((button) => {
        button.addEventListener("click", () => {
            const photo = document.querySelector("#photo-full");
            photo.src = button.dataset.lightbox;
            photo.alt = button.querySelector("img").alt;
            document.querySelector("#photo-caption").textContent =
                button.dataset.caption;
            openDialog(photoDialog, button);
        });
    });

    document.querySelectorAll("[data-open-editorial]").forEach((button) => {
        button.addEventListener("click", () => {
            const dialog = document.getElementById(button.dataset.openEditorial);
            if (dialog) openDialog(dialog, button);
        });
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
        let pointerStartedOnBackdrop = false;

        dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
            button.addEventListener("click", () => dialog.close());
        });

        dialog.addEventListener("pointerdown", (event) => {
            pointerStartedOnBackdrop = event.target === dialog;
        });

        dialog.addEventListener("click", (event) => {
            if (pointerStartedOnBackdrop && event.target === dialog) {
                const bounds = dialog.getBoundingClientRect();
                const isOutside =
                    event.clientX < bounds.left ||
                    event.clientX > bounds.right ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom;
                if (isOutside) dialog.close();
            }
            pointerStartedOnBackdrop = false;
        });

        dialog.addEventListener("close", () => {
            document.body.classList.remove("modal-open");
            if (dialogTrigger && document.contains(dialogTrigger)) {
                if (mobileViewport.matches && navigation.contains(dialogTrigger)) {
                    navigationToggle.focus({ preventScroll: true });
                } else {
                    dialogTrigger.focus({ preventScroll: true });
                }
            }
            dialogTrigger = null;
        });
    });

    const cuisine = document.querySelector(".cuisine");
    const cuisineVideo = document.querySelector(".cuisine-video");
    const videoBackground = document.querySelector(".cuisine-background");
    const cuisineVideoUrl = safeUrl(config.cuisineVideoUrl, true);

    if (cuisineVideoUrl) {
        let inView = false;
        let videoFailed = false;
        const poster = safeUrl(config.cuisineVideoPoster, true);

        cuisineVideo.muted = true;
        cuisineVideo.defaultMuted = true;
        cuisineVideo.src = cuisineVideoUrl;
        if (poster) cuisineVideo.poster = poster;

        const syncVideo = () => {
            if (videoFailed) return;
            const reducedMotion = motionPreference.matches;
            videoBackground.hidden = reducedMotion && !poster;
            cuisine.classList.toggle("has-video", !videoBackground.hidden);

            if (inView && !document.hidden && !reducedMotion) {
                cuisineVideo.play().catch(() => {
                    // Autoplay non disponibile: resta visibile il poster.
                });
            } else {
                cuisineVideo.pause();
            }
        };
        cuisineVideo.addEventListener("error", () => {
            videoFailed = true;
            videoBackground.hidden = true;
            cuisine.classList.remove("has-video");
        });
        document.addEventListener("visibilitychange", syncVideo);
        motionPreference.addEventListener("change", syncVideo);

        if ("IntersectionObserver" in window) {
            const videoObserver = new IntersectionObserver(
                ([entry]) => {
                    inView = entry.isIntersecting;
                    syncVideo();
                },
                { rootMargin: "180px 0px" },
            );
            videoObserver.observe(cuisine);
        } else {
            inView = true;
            syncVideo();
        }
    }

    const revealElements = document.querySelectorAll(".reveal");

    if (!motionPreference.matches && "IntersectionObserver" in window) {
        document.documentElement.classList.add("js-motion");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.08,
                rootMargin: "0px 0px -25px 0px",
            },
        );

        revealElements.forEach((element) => observer.observe(element));
    }

    motionPreference.addEventListener("change", () => {
        if (motionPreference.matches) {
            document.documentElement.classList.remove("js-motion");
        }
    });

    // FOTO HERO: immagine statica, nessuna logica video.
    const hero = document.querySelector(".hero");
    const heroImage = document.querySelector(".hero-image");

    const progress = document.querySelector(".scroll-progress");
    let frameRequested = false;

    const updateScroll = () => {
        const scroll = window.scrollY;
        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;
        const fraction = scrollableHeight > 0
            ? Math.min(scroll / scrollableHeight, 1)
            : 0;
        progress.style.transform = `scaleX(${fraction})`;
        header.classList.toggle("is-scrolled", scroll > 25);

        // Parallasse leggera soltanto su desktop.
        if (heroImage && hero) {
            if (
                !motionPreference.matches &&
                !mobileViewport.matches &&
                scroll < hero.offsetHeight + 100
            ) {
                const displacement = Math.min(scroll * 0.12, 80);

                heroImage.style.transform =
                    `translateY(${displacement}px) scale(1.03)`;
            } else {
                heroImage.style.transform = "none";
            }
        }

        frameRequested = false;
    };

    const requestScrollUpdate = () => {
        if (frameRequested) return;
        frameRequested = true;
        window.requestAnimationFrame(updateScroll);
    };

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    motionPreference.addEventListener("change", requestScrollUpdate);
    updateScroll();
})();
