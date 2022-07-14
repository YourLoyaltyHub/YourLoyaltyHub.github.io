// Author: Elena Nastina

function loggedIn() {
  console.log("Login check not yet implemented!")
  return false;
}

function logout() {
  console.log("Logout not yet implemented!")
}

function checkLogin() {
  if (loggedIn()) {
    let logoutElem = document.getElementById('logout')
    let loginElem = document.getElementById('login')
    let profileElem = document.getElementById('profile')

    logoutElem.classList.remove('hidden')
    loginElem.classList.add('hidden')
    profileElem.classList.remove('hidden')
  }
}

checkLogin()
