(function () {
  const config = window.MAANWIN_CONFIG;
  const menuButton = document.getElementById("menuButton");
  const mainNav = document.getElementById("mainNav");
  const routeGrid = document.getElementById("routeGrid");
  const gameGrid = document.getElementById("gameGrid");
  const faqList = document.getElementById("faqList");
  const verifyForm = document.getElementById("verifyForm");
  const domainInput = document.getElementById("domainInput");
  const verifyMessage = document.getElementById("verifyMessage");

  function getRandomDisplayedDomains() {
    const shuffledDomains = config.listedDomains.slice();
    for (let index = shuffledDomains.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temporaryDomain = shuffledDomains[index];
      shuffledDomains[index] = shuffledDomains[randomIndex];
      shuffledDomains[randomIndex] = temporaryDomain;
    }

    const selectedDomains = shuffledDomains.slice(0, 6);

    try {
      const previousDomains = JSON.parse(sessionStorage.getItem("maanwinDisplayedDomains") || "[]");
      const sameSelection = selectedDomains.length === previousDomains.length &&
        selectedDomains.every(function (domain) { return previousDomains.indexOf(domain) !== -1; });

      if (sameSelection) {
        const replacementDomain = shuffledDomains.find(function (domain) {
          return selectedDomains.indexOf(domain) === -1;
        });
        if (replacementDomain) selectedDomains[selectedDomains.length - 1] = replacementDomain;
      }

      sessionStorage.setItem("maanwinDisplayedDomains", JSON.stringify(selectedDomains));
    } catch (error) {
      // The randomized list still works when browser storage is unavailable.
    }

    return selectedDomains;
  }

  const displayedDomains = getRandomDisplayedDomains();

  function cleanDomain(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split(/[/?#:\s]/)[0];
  }

  function renderRoutes() {
    routeGrid.innerHTML = displayedDomains.map(function (domain, index) {
      return '<a href="https://' + domain + '" target="_blank" rel="noreferrer">' +
        '<span class="route-number">' + String(index + 1).padStart(2, "0") + '</span>' +
        '<span><strong>' + domain + '</strong></span>' +
        '<b>↗</b></a>';
    }).join("");
  }

  function renderGames() {
    const games = config.games.slice(0, 10);

    function createGameCard(game, index, duplicate) {
      return '<a class="game-card" href="' + config.mainUrl + '" target="_blank" rel="noreferrer"' +
        (duplicate ? ' aria-hidden="true" tabindex="-1"' : '') + '>' +
        '<div class="game-image"><img src="' + game.image + '" alt="' + game.title + '">' +
        '<span>' + String(index + 1).padStart(2, "0") + '</span><b>▶</b></div></a>';
    }

    const originalCards = games.map(function (game, index) {
      return createGameCard(game, index, false);
    }).join("");
    const duplicateCards = games.map(function (game, index) {
      return createGameCard(game, index, true);
    }).join("");

    gameGrid.innerHTML = originalCards + duplicateCards;
  }

  function renderFaq() {
    faqList.innerHTML = config.faq.map(function (item, index) {
      return '<article' + (index === 0 ? ' class="open"' : '') + '>' +
        '<button type="button" aria-expanded="' + (index === 0 ? 'true' : 'false') + '">' +
        '<span>0' + (index + 1) + '</span><b>' + item.question + '</b><i>' + (index === 0 ? '−' : '+') + '</i></button>' +
        '<div><p>' + item.answer + '</p></div></article>';
    }).join("");

    faqList.querySelectorAll("article").forEach(function (article) {
      article.querySelector("button").addEventListener("click", function () {
        const shouldOpen = !article.classList.contains("open");
        faqList.querySelectorAll("article").forEach(function (item) {
          item.classList.remove("open");
          item.querySelector("button").setAttribute("aria-expanded", "false");
          item.querySelector("i").textContent = "+";
        });
        if (shouldOpen) {
          article.classList.add("open");
          article.querySelector("button").setAttribute("aria-expanded", "true");
          article.querySelector("i").textContent = "−";
        }
      });
    });
  }

  function createVerifyLink(label, href, className) {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.textContent = label;
    if (href.charAt(0) !== "#") {
      link.target = "_blank";
      link.rel = "noreferrer";
      const arrow = document.createElement("span");
      arrow.textContent = "↗";
      link.appendChild(arrow);
    }
    return link;
  }

  function createFillDomainButton(domain) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "verify-primary";
    button.textContent = "Fill " + domain;
    button.addEventListener("click", function () {
      domainInput.value = domain;
      verifyMessage.hidden = true;
      verifyMessage.replaceChildren();
      domainInput.focus();
    });
    return button;
  }

  function findDomainSuggestion(domain) {
    const baseInput = domain.replace(/\.+$/, "");
    if (baseInput.length < 3) return "";
    return config.officialDomains.find(function (officialDomain) {
      const officialBase = officialDomain.split(".")[0];
      return officialBase === baseInput || (domain.indexOf(".") !== -1 && officialDomain.indexOf(domain) === 0);
    }) || "";
  }

  function renderVerifyResult(domain, verified, suggestedDomain) {
    const incomplete = !verified && Boolean(suggestedDomain);
    const status = verified ? "safe" : (incomplete ? "incomplete" : "unsafe");
    const icon = document.createElement("span");
    icon.className = "verify-status-icon";
    icon.textContent = verified ? "✓" : (incomplete ? "→" : "!");

    const result = document.createElement("div");
    result.className = "verify-result";

    const title = document.createElement("strong");
    title.textContent = verified ? "Official link verified" : (incomplete ? "Complete the domain" : "Link not verified");

    const description = document.createElement("p");
    description.textContent = verified
      ? "This website link appears on the Maanwin verified access list. You can continue using the secure link below."
      : incomplete
        ? '"' + domain + '" is incomplete. Enter the full registered domain "' + suggestedDomain + '" before continuing.'
        : "This website link is not on the Maanwin verified list. Avoid signing in or sharing personal information, and use one of the suggested official links below.";

    const checked = document.createElement("small");
    checked.className = "verify-domain";
    checked.textContent = (incomplete ? "YOU ENTERED: " : "WEBSITE DOMAIN: ") + domain;

    const actions = document.createElement("div");
    actions.className = "verify-actions";
    if (incomplete) {
      actions.appendChild(createFillDomainButton(suggestedDomain));
    } else {
      const actionDomain = verified ? domain : config.officialDomains[0];
      actions.appendChild(createVerifyLink(
        verified ? "Open verified link" : "Use " + actionDomain,
        "https://" + actionDomain,
        "verify-primary"
      ));
    }
    actions.appendChild(createVerifyLink("View displayed links", "#access", "verify-secondary"));

    result.append(title, description, checked, actions);
    verifyMessage.replaceChildren(icon, result);
    verifyMessage.className = "verify-message " + status;
    verifyMessage.hidden = false;
  }

  verifyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const domain = cleanDomain(domainInput.value);
    if (!domain) return;
    const verified = config.officialDomains.indexOf(domain) !== -1;
    const suggestedDomain = verified ? "" : findDomainSuggestion(domain);
    renderVerifyResult(domain, verified, suggestedDomain);
  });

  domainInput.addEventListener("input", function () {
    verifyMessage.hidden = true;
    verifyMessage.replaceChildren();
  });

  menuButton.addEventListener("click", function () {
    const open = mainNav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = open ? "×" : "☰";
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "☰";
    });
  });

  document.querySelectorAll(".main-link").forEach(function (link) {
    link.href = config.mainUrl;
  });

  let previousStartDomain = "";

  function getRandomStartDomain() {
    const availableDomains = displayedDomains.filter(function (domain) {
      return domain !== previousStartDomain;
    });
    const domainPool = availableDomains.length ? availableDomains : displayedDomains;
    const selectedDomain = domainPool[Math.floor(Math.random() * domainPool.length)];
    previousStartDomain = selectedDomain;
    return selectedDomain;
  }

  document.querySelectorAll(".primary-button").forEach(function (link) {
    function updateStartLink() {
      link.href = "https://" + getRandomStartDomain();
    }

    link.dataset.randomPoolSize = String(displayedDomains.length);
    updateStartLink();
    link.addEventListener("click", updateStartLink);
  });

  document.querySelectorAll(".telegram-link").forEach(function (link) {
    link.href = config.telegramUrl;
  });

  renderRoutes();
  renderGames();
  renderFaq();
})();
