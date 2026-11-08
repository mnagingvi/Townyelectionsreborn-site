(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");

  if (menuButton && primaryNav) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
      primaryNav.classList.remove("is-open");
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      primaryNav.classList.toggle("is-open", !isOpen);
    });

    primaryNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const modes = {
    plurality: {
      title: "Choose your mayor",
      description: "One vote. One town. Make it count.",
      selected: ["Mara Vale"],
    },
    ranked: {
      title: "Order your choices",
      description: "Tap candidates to set your first, second, and third choice.",
      selected: ["Mara Vale", "Eli Moss"],
    },
    approval: {
      title: "Who gets your support?",
      description: "Approve every candidate you would be happy to elect.",
      selected: ["Mara Vale", "Eli Moss"],
    },
  };

  const modeButtons = [...document.querySelectorAll("[data-ballot-mode]")];
  const candidateButtons = [...document.querySelectorAll("[data-candidate]")];
  const title = document.querySelector("[data-ballot-title]");
  const description = document.querySelector("[data-ballot-copy]");
  const status = document.querySelector("[data-ballot-status]");
  let currentMode = "plurality";
  let selectedCandidates = new Set(modes[currentMode].selected);

  function updateBallot() {
    candidateButtons.forEach((candidate) => {
      const name = candidate.dataset.candidate;
      const selected = selectedCandidates.has(name);
      const choice = candidate.querySelector(".candidate-choice");
      const rank = [...selectedCandidates].indexOf(name) + 1;

      candidate.classList.toggle("is-selected", selected);
      candidate.setAttribute("aria-pressed", String(selected));
      if (choice) {
        choice.textContent = selected
          ? currentMode === "ranked"
            ? String(rank)
            : "✓"
          : "";
      }
    });

    if (!status) return;
    if (currentMode === "plurality") {
      status.textContent = selectedCandidates.size ? "Your vote is set" : "Select one candidate";
    } else if (currentMode === "ranked") {
      const count = selectedCandidates.size;
      status.textContent = count
        ? `${count} ${count === 1 ? "preference" : "preferences"} ranked`
        : "Tap to rank candidates";
    } else {
      const count = selectedCandidates.size;
      status.textContent = count
        ? `${count} ${count === 1 ? "candidate" : "candidates"} approved`
        : "Tap candidates to approve";
    }
  }

  function chooseMode(mode) {
    if (!modes[mode]) return;
    currentMode = mode;
    selectedCandidates = new Set(modes[mode].selected);
    modeButtons.forEach((button) => {
      const active = button.dataset.ballotMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (title) title.textContent = modes[mode].title;
    if (description) description.textContent = modes[mode].description;
    updateBallot();
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => chooseMode(button.dataset.ballotMode));
  });

  candidateButtons.forEach((candidate) => {
    candidate.addEventListener("click", () => {
      const name = candidate.dataset.candidate;
      const isSelected = selectedCandidates.has(name);

      if (currentMode === "plurality") {
        selectedCandidates = isSelected ? new Set() : new Set([name]);
      } else if (currentMode === "ranked") {
        if (isSelected) {
          selectedCandidates.delete(name);
        } else if (selectedCandidates.size < 3) {
          selectedCandidates.add(name);
        }
      } else if (isSelected) {
        selectedCandidates.delete(name);
      } else {
        selectedCandidates.add(name);
      }

      updateBallot();
    });
  });

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Use the fallback below if clipboard permission is unavailable.
      }
    }

    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = text;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.append(temporaryInput);
    temporaryInput.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    temporaryInput.remove();
    return copied;
  }

  const copyButton = document.querySelector("[data-copy]");
  const copyLabel = document.querySelector("[data-copy-label]");
  const copyStatus = document.querySelector(".copy-status");
  let copyResetTimer;

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const command = copyButton.dataset.copy;
      const copied = await copyText(command);

      if (copyLabel) copyLabel.textContent = copied ? "Copied!" : "Select the command";
      if (copyStatus) {
        copyStatus.textContent = copied
          ? `${command} copied to clipboard.`
          : `Copy this command in game: ${command}`;
      }

      window.clearTimeout(copyResetTimer);
      copyResetTimer = window.setTimeout(() => {
        if (copyLabel) copyLabel.textContent = "Copy";
        if (copyStatus) copyStatus.textContent = "";
      }, 2600);
    });
  }
})();
