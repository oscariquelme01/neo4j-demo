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
  let initialPage = Math.floor(offset / 10) * 10;
  for (
    let i = initialPage * limit, j = initialPage;
    i < totalItems && j < initialPage + maxPages;
    i += limit
  ) {
    const button = document.createElement("button");
    button.classList.add("pagination-button");
    button.textContent = (j + 1).toString();
    if (activePage === j) {
      button.classList.add("active");
    }
    paginationNumberContainer.appendChild(button);
    button.addEventListener("click", () => {
      setUrlParams(j - 1, limit);
      location.reload();
    });
    j++;
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
  let offset = parseInt(urlParams.get("offset"));
  let limit = parseInt(urlParams.get("limit"));
  if (!limit) {
    limit = 20;
    urlParams.set("limit", limit);
  }
  if (!offset) {
    offset = 0;
    urlParams.set("offset", offset);
  }

  // Actualizamos la url
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.replaceState(null, "", newUrl);

  return { offset, limit };
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
