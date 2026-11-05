if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}
if (location.hash) {
    history.replaceState(
        history.state,
        "",
        location.pathname + location.search
    );
}
window.addEventListener("pageshow", () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
});
