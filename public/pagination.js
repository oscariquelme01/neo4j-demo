function createPagButtons(totalItems, offset, activePage) {
  const { limit } = getUrlParams();
  const maxPages = 10;

  // create buttons
  const paginationNumberContainer =
    document.getElementById("pagination-numbers");
  // remove previous childs
  paginationNumberContainer.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.textContent = "<";
  paginationNumberContainer.appendChild(prevButton);
  prevButton.addEventListener("click", () => {
    if (offset - maxPages < 0) {
      return;
    }
    createPagButtons(totalItems, offset - maxPages, activePage);
  });

  // create pag buttons
  let initialPage;
  // weird edge case where multiple of 10s would get jumped to the next page
  if (offset % 10 === 0) {
    initialPage = Math.floor((offset - 1) / 10) * 10;
  } else {
    initialPage = Math.floor(offset / 10) * 10;
  }
  for (
    let i = initialPage * limit, j = initialPage;
    i < totalItems && j < initialPage + maxPages;
    i += limit
  ) {
    j++;
    const button = document.createElement("button");
    button.classList.add("pagination-button");
    button.textContent = j.toString();
    if (activePage === j) {
      button.classList.add("active");
    }
    paginationNumberContainer.appendChild(button);
    button.addEventListener("click", () => {
      setUrlParams(j, limit);
      location.reload();
    });
  }

  const nextButton = document.createElement("button");
  nextButton.textContent = ">";
  paginationNumberContainer.appendChild(nextButton);
  nextButton.addEventListener("click", () => {
    if (offset >= Math.floor(totalItems / limit)) {
      return;
    }
    createPagButtons(totalItems, offset + maxPages, activePage);
  });
}

function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const genre = urlParams.get("genre");
  let offset = parseInt(urlParams.get("offset"));
  let limit = parseInt(urlParams.get("limit"));
  if (!limit) {
    limit = 20;
    urlParams.set("limit", limit);
  }
  if (!offset) {
    offset = 1;
    urlParams.set("offset", offset);
  }

  // Actualizamos la url
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.replaceState(null, "", newUrl);

  return { offset, limit, genre };
}

function setUrlParams(offset, limit, update = true) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("offset", offset);
  urlParams.set("limit", limit);

  // Actualizamos la url
  if (update) {
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }
}
