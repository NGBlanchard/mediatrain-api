const path = require('path')
const express = require('express')
const xss = require('xss')
const UnitsService = require('./units-service')


const unitsRouter = express.Router()
const jsonParser = express.json()

const serializeUnit = unit => ({
  id: unit.id,
  unitname: unit.unitname,
})

unitsRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    UnitsService.getAllUnits(knexInstance)
      .then(units => {
        res.json(units.map(serializeUnit))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { id, unitname } = req.body
    const newUnit = { id, unitname }

    for (const [key, value] of Object.entries(newUnit))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    UnitsService.insertUnit(
      req.app.get('db'),
      newUnit
    )
      .then(unit => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${unit.id}`))
          .json(serializeUnit(unit))
      })
      .catch(next)
  })

unitsRouter
  .route('/:unit_id')
  .all((req, res, next) => {
    UnitsService.getById(
      req.app.get('db'),
      req.params.unit_id
    )
      .then(unit => {
        if (!unit) {
          return res.status(404).json({
            error: `Unit doesn't exist`
          })
        }
        res.unit = unit
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeUnit(res.unit))
  })
  .delete((req, res, next) => {
    UnitsService.deleteUnit(
      req.app.get('db'),
      req.params.unit_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { unitid, unitname } = req.body
    const unitToUpdate = { unitid, unitname }

    const numberOfValues = Object.values(unitToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'unitid' or 'unitname'`
        }
      })

    UnitsService.updateUnit(
      req.app.get('db'),
      req.params.unit_id,
      unitToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = unitsRouter