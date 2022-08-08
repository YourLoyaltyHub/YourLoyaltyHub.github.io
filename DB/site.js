// importing different libraries, such as server, remembering log in details by server, log in management, authentication code etc
const express = require('express')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const flash = require('express-flash')
const app = express()
const db = require('./db')
const Auth = require('./auth')
const path = require('path')
const chalk = require('chalk')

// sets the location of all pages (sotred in Website folder)
app.set('views', path.join(__dirname, '../Website'));
// allows the server to decode post requests
app.use(express.urlencoded({ extended: true }))
// allows the server to remember logins
app.use(session({
  secret: 'random secret eqw9utu9043otpu;rg/i',
  resave: false,
  saveUninitialized: false,
  store: new FileStore({
    retries: 0
  })
}))
// initialises passport, sets up error flashing, and if file is of the html format allows to use ejs features
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.set('view-engine', 'ejs')
app.engine('html', require('ejs').renderFile)

// verifies if user exists, and password is correct
const verifyUser = async (email, password, done) => {
  let user = await db.getUser(email)
  if (!user.length) {
    return done(null, false, { message: 'User does not exist' })
  }
  user = user[0]

  // verifies passwords (everything is implemented in the DB.js file where its properly encrypted/hashed)
  if (await db.verifyPasswd(email, password)) {
    return done(null, user)
  } else {
    return done(null, false, { message: 'Wrong password' })
  }
}

// creates a new local strategy instance and defines the function that retreives full details of
// all users from DB whenever a page is requested
passport.use(new LocalStrategy(verifyUser))
passport.serializeUser((user, done) => {
  done(null, user.id)
})
passport.deserializeUser(async (id, done) => {
  return done(null, await db.getFullUser(id))
})

// initialises auth and gives it the database instance
const auth = new Auth(db)

// enables all the locations defined in the auth.js file, ie profile, sign up, login etc
app.use('/', auth.getRouter())
// including code that is not included in auth file and is automatically sent from the Website folder (such as scripts, css etc)
app.use('/', express.static('../Website'))

//server is started on port 3000
console.log('You can go to the website by visiting: ' + chalk.green('localhost:3000'))
app.listen(3000)
