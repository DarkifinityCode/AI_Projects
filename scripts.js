document.addEventListener("DOMContentLoaded", () => {
  const categoryCards = document.querySelectorAll(".category-card");

  categoryCards.forEach(card => {
    card.addEventListener("click", () => {
      const targetLink = card.getAttribute("data-link");
      if (targetLink) {
        window.location.href = targetLink;
      }
    });
  });
});
