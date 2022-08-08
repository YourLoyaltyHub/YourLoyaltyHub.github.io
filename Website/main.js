// Author: Elena Nastina
// if logged in, show the log out button and hide the log in/profile buttons
function checkLogin() {
  if (loggedIn) {
    let logoutElem = document.getElementById('logout')
    let loginElem = document.getElementById('login')
    let profileElem = document.getElementById('profile')

    logoutElem.classList.remove('hidden')
    loginElem.classList.add('hidden')
    profileElem.classList.remove('hidden')
  }
}

checkLogin()
