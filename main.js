/*
 * Checked variables
 */
const choseCategoryList = document.querySelector("#chose-category")
const entryList = document.querySelector("#display-list")

const detailsHeader = document.querySelector("#details__header")
const detailsContent = document.querySelector("#details__content")

const nextBtn = document.querySelector("#next")
const prevBtn = document.querySelector("#prev")
const navInfo = document.querySelector("#nav-info")

/*
 * Start
 */

const api = "https://swapi.dev/api/"
getCategories(api)

/*
 * FIXED EVENT LISTENERS
 */
// Handel clicks on category list (People, Planets, ...)
choseCategoryList.addEventListener("click", async (e) => {
  const nodeName = e.target.nodeName
  const clickedText = e.target.innerText
  const clickedUrl = e.target.dataset.url
  if (nodeName == "A") {
    displayCategoryHeader(clickedText)
    loadCategoryEntries(clickedUrl)
  }
})

// Next page of entries
nextBtn.addEventListener("click", (e) => {
  const clickedUrl = e.target.dataset.url
  loadCategoryEntries(clickedUrl)
})

// Prev page of entries
prevBtn.addEventListener("click", (e) => {
  const clickedUrl = e.target.dataset.url
  loadCategoryEntries(clickedUrl)
})

//Choose entry to show in details (left col)
entryList.addEventListener("click", (e) => {
  const clickedUrl = e.target.dataset.url
  if (clickedUrl) showDetails(clickedUrl)
})

//Follow links in details
detailsContent.addEventListener("click", (e) => {
  const clickedUrl = e.target.dataset.url
  if (clickedUrl) showDetails(clickedUrl)
})

/*
 * FIXED FUNCTIONS
 */

// Get and display category list (People, Planets, ...)
async function getCategories(url) {
  const categories = await getUrl(url)
  hideLoadingSpinner(".box__header")
  displayCategories(categories)
}
function displayCategories(categories) {
  const categoryList = document.querySelector("#chose-category")
  for (const category in categories) {
    const link = createApiLink(capitalize(category), categories[category], category)
    const li = document.createElement("li")
    li.appendChild(link)
    categoryList.appendChild(li)
  }
}

//Displays entries in a category
function displayCategoryHeader(headerText) {
  const title = document.querySelector("#category-title")
  title.innerText = capitalize(headerText)
}
function loadCategoryEntries(url) {
  showLoadingSpinner("#choose__content")
  const entries = getUrl(url)
  displayCategoryEntries(entries)
}

//Lists the entries in a category (Luke Skywalker, C-3Po, R2-D2, ...)
async function displayCategoryEntries(category) {
  const entryList = document.querySelector("#display-list")
  entryList.innerHTML = "" //reset

  const entireCategory = await category
  const entries = entireCategory.results

  hideLoadingSpinner("#choose__content")

  // Create list of entries
  entries.map((entry) => {
    addToCache(entry.url, entry)
    const link = createApiLink(
      capitalize(entry.name || entry.title),
      entry.url,
      makeId(entry.url)
    ) //text, url, id?, class? => <a href="#" data-url="https://swapi.dev/api/people/1/" id="people-1" class="">Luke Skywalker</a>
    const li = document.createElement("li")
    li.appendChild(link)
    entryList.appendChild(li)
  })
  // Create navigation buttons
  displayNextPrevBtn(entireCategory)
}

function displayNextPrevBtn(entireCategory) {
  //Next button
  if (entireCategory.next) {
    nextBtn.dataset.url = entireCategory.next
    nextBtn.style.display = "block"
  } else {
    nextBtn.style.display = "none"
    nextBtn.dataset.url = ""
  }

  //Previous button
  if (entireCategory.previous) {
    prevBtn.dataset.url = entireCategory.previous
    prevBtn.style.display = "block"
  } else {
    prevBtn.style.display = "none"
    prevBtn.dataset.url = ""
  }
}

async function showDetails(link) {
  //Runs when we click on a link to an detail-item
  //Reset and show loading spinner
  detailsContent.innerHTML = `<div class="loader" style="display: block;"></div>`

  const details = await getUrl(link)

  displayDetailsHeading(details)

  //Remove spinner
  detailsContent.innerHTML = ""

  displayDetailsContent(details)
}

function displayDetailsContent(details) {
  const doNotDisplay = ["created", "edited", "url"]

  // For each [categoryName, content] in details object
  for (const [key, value] of Object.entries(details)) {
    if (doNotDisplay.includes(key)) continue //Do not print

    createH3(key)

    //Print different content depending on if it is a array, a string or a number
    switch (typeof value) {
      case "object": //In case of array (or other object)
        if (!Array.isArray(value)) return //No other objects

        if (value.length <= 0) {
          //If array is empty
          detailsContent.innerHTML += "<p>N/A</p>"
          break
        }
        let createdItems = {}

        // If the array is at least one item long. We need to create a list
        const ul = document.createElement("ul")
        ul.id = key
        detailsContent.append(ul)

        //For each html link in array
        value.forEach((htmlLink) => {
          // Create empty li for later use
          createListItemForAnchor(htmlLink, ul)

          //Populate empty li with content
          getUrl(htmlLink).then((linkDetails) => {
            const linkName = linkDetails.name || linkDetails.title
            const linkUrl = linkDetails.url
            const linkId = makeId(linkDetails.url)
            const link = createApiLink(
              linkName,
              linkUrl,
              linkId,
              "details__list-item"
            )

            domItem = document.querySelector(`#${"li_" + linkId}`)
            domItem.classList.remove("dot-flashing")
            domItem.append(link)
          })
        })
        break

      case "string":
        //Make a link if the string contains a url
        if (value.includes("https")) {
          //Create empty paragraph with id
          const p = document.createElement("p")
          p.id = makeId(value)
          detailsContent.append(p)

          //Populate with content
          getUrl(value).then((linkDetails) => {
            const linkName = linkDetails.name || linkDetails.title
            //Create a nice link
            const link = createApiLink(
              linkName,
              linkDetails.url,
              makeId(value),
              "details__item"
            )
            // Place link in paragraph with the right id
            parent = document.querySelector("#" + makeId(linkDetails.url))
            parent.append(link)
          })
        }
        // Else just make first letter Capital
        else {
          const p = document.createElement("p")
          let text = capitalize(value.replace(/(\r\n|\n|\r)/gm, " "))

          // p.innerText = capitalize(value.replace(/(\r\n|\n|\r)/gm, ""))
          p.innerText = key == "height" ? value + " cm" : text
          p.innerText = key == "mass" ? value + " kg" : text
          detailsContent.append(p)
        }
        break

      default:
        {
          const p = document.createElement("p")
          p.innerText = value
          detailsContent.append(p)
        }
        break
    }
  }
}
function displayDetailsHeading(details) {
  const overHeading = document.querySelector("#details-category")
  overHeading.innerText = makeCategoryName(details.url)

  const h2 = document.querySelector("#details-title")
  h2.innerText = details.name || details.title
}

function createH3(text) {
  const heading = document.createElement("h3")
  heading.innerText = capitalize(text.replaceAll("_", " "))
  detailsContent.append(heading)
}

function createListItemForAnchor(htmlLink, parent) {
  //Empty list items with just flashing dots as placeholders until we get our data
  const idFromHtmlLink = makeId(htmlLink)
  const newListItem = document.createElement("li")
  newListItem.classList.add("dot-flashing")
  newListItem.id = "li_" + idFromHtmlLink
  newListItem.dataset.url = htmlLink
  parent.append(newListItem)
}

//Get the data from internet or from cache
async function getUrl(
  url,
  options = {
    cache: "force-cache",
    headers: {
      accept: "application/json",
    },
  },
  retries = 3
) {
  // If we find the requested link in cache - Return that instead
  const cached = localStorage.getItem(url)
  if (cached !== null) {
    console.log(`Getting ${url} from cache`)
    const parsed = JSON.parse(cached)
    return parsed
  }

  // Else try to find the data on internet
  try {
    console.log("Trying URL", url)

    const response = await fetch(url, options)
    //Throw error if the response code is not in the 200:s (eg. 404, 501, ...)
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

    //Convert from Json, add to cache and return object
    const jsObj = await response.json()
    addToCache(url, jsObj)
    return jsObj

    //Catch the error
  } catch (error) {
    //Try again if we have retries left
    if (retries > 0) {
      console.error(`Trying ${url} again, ${retries - 1} tries left`)
      return getUrl(url, options, retries - 1)
    }
    //Else log the error and do nothing
    console.error(error)
  }
}

//Adds data to cache with url as key
function addToCache(url, data) {
  localStorage.setItem(url, JSON.stringify(data))
}

/*
 * WORK IN PROGRESS
 */

/*
 * OTHER
 */
function showActive(id) {
  console.log("active", id)
  // displayList.querySelector(`#${id}`).classList.add("chosen")
  // chosen = id
}
/*
 * Helper functions
 */

async function getNameFromLink(link) {
  const subDetail = await getUrl(link)
  return capitalize(subDetail.name || subDetail.title)
}

function capitalize(str) {
  if (!typeof str === "string") return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function makeId(str) {
  const lastBit = str.match(/(\w+\/\d+)(?=\/$)/)
  return lastBit[0].replace("/", "-")
}

function makeCategoryName(str) {
  const lastBit = str.match(/(\w+)(?=\/\d+\/$)/)
  return capitalize(lastBit[0])
}

function createApiLink(linkText, url, id = "", className = "") {
  const anchor = document.createElement("a")
  anchor.href = "#"
  anchor.innerText = linkText
  anchor.dataset.url = url
  anchor.id = id
  anchor.className = className
  return anchor
}

function showLoadingSpinner(parent) {
  const spinner = document.querySelector(`${parent} > .loader`)
  spinner.style.display = "block"
}

function hideLoadingSpinner(parent) {
  const spinner = document.querySelector(`${parent} > .loader`)
  spinner.style.display = "none"
}
