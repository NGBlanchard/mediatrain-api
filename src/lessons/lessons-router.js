const path = require('path')
const express = require('express')
const xss = require('xss')
const LessonsService = require('./lessons-service')


const lessonsRouter = express.Router()
const jsonParser = express.json()

const serializeLesson = lesson => ({
  id: lesson.id,
  number: lesson.number,
  name: xss(lesson.name),
  unitid: lesson.unitid,
  objective: xss(lesson.objective),
  video: xss(lesson.video),
  content: xss(lesson.content),
  closing: xss(lesson.closing),
  questions: xss(lesson.closing),
  work: xss(lesson.work)
})

lessonsRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    LessonsService.getAllLessons(knexInstance)
      .then(lessons => {
        res.json(lessons.map(serializeLesson))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { id, number, name, unitid } = req.body
    const newLesson = { id, number, name, unitid }

    for (const [key, value] of Object.entries(newLesson))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    LessonsService.insertLesson(
      req.app.get('db'),
      newLesson
    )
      .then(lesson => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${lesson.id}`))
          .json(serializeLesson(lesson))
      })
      .catch(next)
  })

lessonsRouter
  .route('/:lesson_id')
  .all((req, res, next) => {
    LessonsService.getById(
      req.app.get('db'),
      req.params.lesson_id
    )
      .then(lesson => {
        if (!lesson) {
          return res.status(404).json({
            error: `Lesson doesn't exist`
          })
        }
        res.lesson = lesson
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeLesson(res.lesson))
  })
  .delete((req, res, next) => {
    LessonsService.deleteLesson(
      req.app.get('db'),
      req.params.lesson_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { id, number, name, unitid, } = req.body
    const lessonToUpdate = { id, number, name, unitid }

    const numberOfValues = Object.values(lessonToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'id, number, name' and 'unitid'`
        }
      })

    LessonsService.updateLesson(
      req.app.get('db'),
      req.params.lesson_id,
      lessonToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = lessonsRouter