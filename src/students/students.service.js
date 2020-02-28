const xss = require('xss')
const bcrypt = require('bcryptjs')

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/

const StudentsService = {

  hasStudentWithStudentName(db, email) {
    return db('mediatrain_students')
      .where({ email })
      .first()
      .then(student => !!student)
  },

  insertStudent(db, newStudent) {
    return db
    .insert(newStudent)
    .into('mediatrain_students')
    .returning('*')
    .then(([student]) => student)
  },

  getAllStudents(knex) {
    return knex.select('*').from('mediatrain_students')
  },

  insertStudent(knex, newStudent) {
    return knex
      .insert(newStudent)
      .into ('mediatrain_students')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  getById(knex, id) {
    return knex
      .from('mediatrain_students')
      .select('*')
      .where('id', id)
      .first()
  },

  updateStudents(knex, id, newStudentFields) {
    return knex('mediatrain_students')
      .where({ id })
      .update(newStudentFields)
  },

  deleteStudent(knex, id) {
    return knex('mediatrain_students')
    .where({ id })
    .delete()
  },

  validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be longer than 8 characters'
  }
  if (password.length > 72) {
    return 'Password must be less than 72 characters'
  }
  if (password.startsWith(' ') || password.endsWith(' ')) {
    return 'Password must not start or end with empty spaces'
  }
  if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
    return 'Password must contain 1 upper case, lower case, number and special character'
  }
  return null
  },

  hashPassword(password) {
    return bcrypt.hash(password, 12)
  },
  
  serializeStudent(student) {
    return {
      id: student.id,
      firstName: xss(student.firstName),
      lastName: xss(student.lastName),
      email: xss(student.email),
      password: xss(student.password),
      progress: student.progress,
      lessons: [],
      currentGrade: student.currentGrade
    }
  },
  
}

module.exports = StudentsService

