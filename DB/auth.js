// Importing a number of different libraries: server, validation, authentication/login, password hashing and phone number check
const express = require('express')
const { body, validationResult } = require('express-validator')
const passport = require('passport')
const bcrypt = require('bcrypt')
const phoneNumberUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()

// creating an authentication class and defining the constructor
class Auth {
  constructor(db) {
    // saves the db for further use
    this.db = db
    // creates a "mini-server" for the pages defined in this code
    this.router = express.Router()

    //creates new post request (when user is creating a profile)
    this.router.post('/signUp.html',
    // ensuring user logged out before singning up
      isLoggedOut,
      // parameters for the sign up process
      body('username').isEmail().withMessage('Invalid email'),
      body('password').isLength({ min: 8 }).withMessage('Password must be minimum 8 characters'),
      body('password-repeat').custom((value, { req }) => {
        // makes sure the password is the same in both the password and confirm password fields
        if (value != req.body.password) {
          throw new Error('Passwords do not match');
        }

        // if all above paremeters are met, allows user to proceed further
        return true;
      }),
      // this block of the code signs the user up (in case of any errors it will display the first error and stops until error is fixed, then proceed further etc)
      async (req, res, next) => {
        // ensures the email isn't taken yet
        const user = await this.db.getUser(req.body.username)
        if (user.length) {
          req.flash('error', 'Email taken')
          return res.redirect('/signUp.html')
        }
        // collects all errors that might have happened in the previous block of code (line 19-21)
        const errors = validationResult(req).array()
        if (errors.length > 0) {
          req.flash('error', errors[0].msg)
          return res.redirect('/signUp.html')
        }
        // creates hash of the inserted password (set to be hashed 10 times)
        const passwordHash = await bcrypt.hash(req.body.password, 10)
        // this creates a user in the db with the given email and passowrd hash
        await this.db.addUser(req.body.username, passwordHash)

        return next()
      },
      // automatically logs in the user after successful sign up
      passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/signUp.html',
        failureFlash: true
      })
    )

    // this block of code creates log in POST request, checks that email is correct and password matches the parameters, and checks for any errors
    this.router.post('/login.html',
      isLoggedOut,
      body('username').isEmail().withMessage('Invalid email'),
      body('password').isLength({ min: 8 }).withMessage('Password is minimum 8 characters'),
      async (req, res, next) => {
        const errors = validationResult(req).array()
        if (errors.length > 0) {
          req.flash('error', errors[0].msg)
          return res.redirect('/login.html')
        }
        return next()
      },
      // logs in user and brings them to the main page. If log in was unsuccessful, brings user back to the log in page and shows the reason as to why user couldn't log in
      passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login.html',
        failureFlash: true
      })
    )

    // performs the log out function
    this.router.get('/logout', (req, res, next) => {
      req.logOut(err => {
        if (err) return next(err)
        res.redirect('/');
      });
    })

    // this block of code automatically creates a get request and brings user the request page, and gives access to user's info and loyalty points.
    // If user is logged out, both points and user info are undefined. Next block of code does the same thing but manually for the main page
    function render(req, res) {
      if (req.user) return res.render(req.path.slice(1), {loggedIn: req.isAuthenticated(), user: req.user.user, points: req.user.points})
      res.render(req.path.slice(1), {loggedIn: req.isAuthenticated(), user: undefined, points: undefined})
    }

    // creates a get request for the main page
    this.router.get('/', (req, res) => {
      // if user already logged in, return index.html and give access to the user info and loyalty points
      if (req.user) return res.render('index.html', {loggedIn: req.isAuthenticated(), user: req.user.user, points: req.user.points})
      // if user is logged out, it performs the same process as above, but makes the user and loyalty points undefined
      res.render('index.html', {loggedIn: req.isAuthenticated(), user: undefined, points: undefined})
    })

    // renders all pages
    this.router.get('/index.html', render)
    this.router.get('/login.html', isLoggedOut, render)
    this.router.get('/signUp.html', isLoggedOut, render)
    this.router.get('/profile.html', isLoggedIn, render)
    this.router.get('/list.html', render)
    this.router.get('/faq.html', render)
    this.router.get('/tc.html', render)
    this.router.get('/pp.html', render)

    // when post request is done, it allows user to change their prersonal details
    this.router.post(
      '/profile.html',
      isLoggedIn,
      // makes sure the email, and phone number are valid
      body('email').isEmail().withMessage('Invalid email'),
      body('phone').custom((value, { req }) => {
        if (value != '' && !phoneNumberUtil.isValidNumber(phoneNumberUtil.parse(value, 'IE'))) {
          throw new Error('Invalid phone Irish number');
        }

        return true;
      }),
      // shows any errors if they occured, and saves new details (from the change made by the user from the above code)
      async (req, res) => {
        const errors = validationResult(req).array()
        if (errors.length > 0) {
          req.flash('error', errors[0].msg)
          return res.redirect('/login.html')
        }
        // if successful, it returns true. If the updated email was taken, it returns false
        let success = await this.db.updateUser(req.user.user.id, req.body.email, req.body.name, req.body.phone)
        if (!success) req.flash('error', 'Email taken')
        return res.redirect('/login.html')
      }
    )

    // creates post request to add points
    this.router.post(
      '/add_points.html',
      isLoggedIn,
      async (req, res) => {
        // adds points into the db
        await this.db.addPoints(req.user.user.id, req.body.id, req.body.points)
        return res.redirect('/list.html')
      }
    )

    // check if the user is logged in
    function isLoggedIn(req, res, next) {
      if (req.isAuthenticated()) {
        return next()
      }

      return res.redirect('/login.html')
    }

    // check if the user is logged out
    function isLoggedOut(req, res, next) {
      if (req.isAuthenticated()) {
        return res.redirect('/profile.html')
      }

      return next()
    }
  }

  getRouter() {
    // returns the "mini-server" defined earlier
    return this.router
  }
}

// turns Auth into a library
module.exports = Auth;
