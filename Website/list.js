function addStore(name, desc, website, promos) {
  let template = document.getElementById('store-card')
  let clone = template.content.cloneNode(true)
  document.getElementById('content-list').appendChild(clone)
  let storeNameElem = document.getElementById('store-name')
  storeNameElem.innerText = name ? name : "N/A"
  storeNameElem.removeAttribute('id')
  storeNameElem = document.getElementById('store-description')
  storeNameElem.innerText = desc ? desc : "N/A"
  storeNameElem.removeAttribute('id')
  storeNameElem = document.getElementById('store-website')
  storeNameElem.innerText = website ? website : "N/A"
  website ? storeNameElem.setAttribute('href', website) : true;
  storeNameElem.removeAttribute('id')
  storeNameElem = document.getElementById('store-promotions')
  storeNameElem.innerText = promos ? promos : "N/A"
  storeNameElem.removeAttribute('id')
}

function parseStore(xmlDoc, storeTag) {
  let storeName = xmlDoc.querySelector(storeTag + ' depName').innerHTML
  let storeDescription = xmlDoc.querySelector(storeTag + ' description').innerHTML
  let storeWebsite = xmlDoc.querySelector(storeTag + ' webLink').innerHTML
  let storePromotions = xmlDoc.querySelector(storeTag + ' promotion').innerHTML

  addStore(storeName, storeDescription, storeWebsite, storePromotions)
}

function loadStores() {
  fetch('xmlFile1.xml').then(file => {
    file.text().then(xmlText => {
      let parser = new DOMParser()
      let xmlDoc = parser.parseFromString(xmlText, "text/xml")
      let stores = Array.from(xmlDoc.querySelector('department').children)

      stores.forEach((store) => {
        parseStore(xmlDoc, store.tagName)
      });
    })
  })
}

loadStores()
