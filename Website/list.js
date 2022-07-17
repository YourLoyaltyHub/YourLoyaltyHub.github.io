function addStore(name, desc, website, promos, location, category) {
  let template = document.getElementById('store-card')
  let clone = template.content.cloneNode(true)
  document.getElementById('content-list').appendChild(clone)

  let storeElem = document.getElementById('store-name')
  storeElem.innerText = name ? name : "N/A"
  storeElem.removeAttribute('id')

  storeElem = document.getElementById('store-description')
  storeElem.innerText = desc ? desc : "N/A"
  storeElem.removeAttribute('id')

  storeElem = document.getElementById('store-website')
  storeElem.innerText = website ? website : "N/A"
  website ? storeElem.setAttribute('href', 'https://' + website) : true
  storeElem.removeAttribute('id')

  storeElem = document.getElementById('store-promotions')
  storeElem.innerText = promos ? promos : "N/A"
  storeElem.removeAttribute('id')

  storeElem = document.getElementById('store-location')
  storeElem.innerText = location ? location : "N/A"
  location ? storeElem.setAttribute('href', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location)) : true
  storeElem.removeAttribute('id')

  storeElem = document.getElementById('store-category')
  storeElem.innerText = 'Category - ' + (category ? category : "N/A")
  storeElem.removeAttribute('id')

  storeElem = document.getElementById('store-parent')
  storeElem.removeAttribute('id')
  name ? storeElem.setAttribute('data-name', name.toLowerCase()) : storeElem.setAttribute('data-name', '')
  category ? storeElem.setAttribute('data-category', category.toLowerCase()) : storeElem.setAttribute('data-category', '')
}

function parseStore(xmlDoc, storeTag) {
  let storeName = xmlDoc.querySelector(storeTag + ' depName').innerHTML
  let storeDescription = xmlDoc.querySelector(storeTag + ' description').innerHTML
  let storeWebsite = xmlDoc.querySelector(storeTag + ' webLink').innerHTML
  let storePromotions = xmlDoc.querySelector(storeTag + ' promotion').innerHTML
  let storeLocation = xmlDoc.querySelector(storeTag + ' location').innerHTML
  let storeCategory = xmlDoc.querySelector(storeTag + ' category').innerHTML

  addStore(storeName, storeDescription, storeWebsite, storePromotions, storeLocation, storeCategory)
}

function loadStores() {
  fetch('xmlFile1.xml').then(file => {
    file.text().then(xmlText => {
      let parser = new DOMParser()
      let xmlDoc = parser.parseFromString(xmlText, "text/xml")
      let stores = Array.from(xmlDoc.querySelector('department').children)

      stores.forEach(store => {
        parseStore(xmlDoc, store.tagName)
      });
    })
  })
}

function searchByName() {
  let elements = Array.from(document.getElementsByClassName('store-card'))
  let input = document.getElementById('search').value
  elements.forEach(element => {
    if (element.getAttribute('data-name').includes(input.toLowerCase())) {
      element.classList.remove('hidden')
    } else {
      element.classList.add('hidden')
    }
  });
}

function searchByCategory() {
  let elements = Array.from(document.getElementsByClassName('store-card'))
  let input = document.getElementById('search').value
  elements.forEach(element => {
    if (element.getAttribute('data-category').includes(input.toLowerCase())) {
      element.classList.remove('hidden')
    } else {
      element.classList.add('hidden')
    }
  });
}

loadStores()
