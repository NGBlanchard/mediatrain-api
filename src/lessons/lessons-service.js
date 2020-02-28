const LessonsService = {
  getAllLessons(knex) {
    return knex.select('*').from('mediatrain_lesson')
  },

  insertLesson(knex, newLesson) {
    return knex
      .insert(newLesson)
      .into('mediatrain_lessons')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  getById(knex, id) {
    return knex
      .from('mediatrain_lessons')
      .select('*')
      .where('id', id)
      .first()
  },

  deleteLesson(knex, id) {
    return knex('mediatrain_lessons')
      .where({ id })
      .delete()
  },

  updateLesson(knex, id, newLessonFields) {
    return knex('mediatrain_lessons')
      .where({ id })
      .update(newLessonFields)
  },
}

module.exports = LessonsService
