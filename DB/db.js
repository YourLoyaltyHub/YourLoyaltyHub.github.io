// imports sqlite and password hashing libraries
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

// creates a new class called DB
class DB {
  // performs quering, and param limits what external user can input (ie. deleting table by mistake etc.).
  // this block of code is used only by this file
  query(q, ...params) {
    return new Promise((resolve, reject) => {
      this.db.all(q, params, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

// once a new row is inserted, a new unique row ID is generated, which is used to find rows as this information needed right away to use in other parts of the code
// this block of code is also used only by this file
  queryLastId(q, ...params) {
    return new Promise((resolve, reject) => {
      let stmt = this.db.prepare(q, params).run(err => {
        if (err) {
          reject(err)
        } else {
          resolve(stmt.lastID)
        }
      })
    })
  }

// when DB class is created and initialised, new tables are created (users, user_info and user_points)
  constructor() {
    (async () => {
      this.db = new sqlite3.Database('./database.db')
      await this.query('BEGIN TRANSACTION')
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL
        )
        `)
      await this.query(`
        CREATE TABLE IF NOT EXISTS user_info (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT,
          phone TEXT
        )
        `)
      await this.query(`
        CREATE TABLE IF NOT EXISTS user_points (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          data TEXT NOT NULL -- This will be JSON
        )
        `)
      await this.query('COMMIT')
    })()
  }

// when email address is provided, it pulls the user and all their info from the 'users' table
  async getUser(email) {
    let users = await this.query('SELECT * FROM users WHERE email=?', email)
    return users
  }

  // when id is provided, retrieves all of the user's info including loyalty points and returns in json format
  async getFullUser(id) {
    let user = (await this.query('SELECT * FROM users WHERE id=?', id))[0]
    let info = (await this.query('SELECT * FROM user_info WHERE user_id=?', id))[0]
    let points = await this.getPoints(id)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: info.name,
        phone: info.phone,
        card_number: points.card_number
      },
      points
    }
  }

// retrieves user points from the database by user id
  async getPoints(id) {
    return JSON.parse((await this.query(`
      SELECT * FROM user_points WHERE user_id=?
      `, id))[0].data
    )
  }

// adds a new user to the DB
  async addUser(email, passwordHash) {
    // checks and tries to retrieve user with the given email from the DB. If something was returned, user already exists
    if ((await this.getUser(email)).length) return false

    // inserts email and hashed password into the 'users' table
    let userId = await this.queryLastId(`
      INSERT INTO users(email, password_hash) VALUES (
        ?, ?
      )
      `, email, passwordHash)

    // since when user is signing up they only need to provide email + password, we require to add an empty user info as well
    // for ease of updating that info later on
    await this.query(`
      INSERT INTO user_info(user_id, name, phone) VALUES (
        ?, ?, ?
      )
      `, userId, '', '')

    // creates user points json object that has a random card number (and at that specific moment, an empty list of loyalty points)
    let points = {
      card_number: Math.round(Math.random() * 99999999).toString().padStart(8, 0),
      stores: {}
    }
    await this.query(`
      INSERT INTO user_points(user_id, data) VALUES (
        ?, ?
      )
      `, userId, JSON.stringify(points))

    return true
  }

// updates user's info, provided the id, a new email, new name, and new phone number
  async updateUser(id, email, name, phone) {
    // retrieves user from DB, compares emails to one in DB if new email already exists, it throws an error, otherwise proceeds to make an update
    let user = await this.getFullUser(id)
    if (user.user.email != email) {
      if ((await this.getUser(email)).length) return false
      await this.query(`
        UPDATE users SET email=? WHERE id=?
        `, email, id)
    }

    // this block of code updates the rest of the personal info
    await this.query(`
      UPDATE user_info SET name=?, phone=? WHERE user_id=?
      `, name, phone, id)
    return true
  }

  // Point adding process. Takes all loyalty points, extracts points for a specific store. If no points are collected, it sets it to zero. It then parses current points from a string to int, and adds them together.
  async addPoints(userId, storeId, points) {
    let allPoints = await this.getPoints(userId)
    let currentPoints = allPoints.stores[storeId]
    if (!currentPoints) currentPoints = 0
    currentPoints = Math.max(0, Number.parseInt(currentPoints) + Number.parseInt(points))
    // stores updated number of loyalty points
    allPoints.stores[storeId] = currentPoints

    // stores new json into database
    await this.query(`
      UPDATE user_points SET data=? WHERE user_id=?
      `, JSON.stringify(allPoints), userId)
    return currentPoints
  }

// takes email address and confirms the password is correct
  async verifyPasswd(email, password) {
    // this user check block of code is added just in case, as program would have done this earlier in the prpcess
    let user = await this.getUser(email)
    if (user.length) {
      user = user[0]
    } else {
      return false
    }
    // takes the inputted password by the user, hash it the same way as during the registration and compares it with the DB record. If matches, it will return true, otherwise it returns false
    return await bcrypt.compare(password, user.password_hash)
  }
}

module.exports = new DB();
