const UnitsService = {
  getAllUnits(knex) {
    return knex.select('*').from('media_unit')
  },

  insertUnit(knex, newUnit) {
    return knex
      .insert(newUnit)
      .into('media_units')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  getById(knex, id) {
    return knex
      .from('media_units')
      .select('*')
      .where('id', id)
      .first()
  },

  deleteUnit(knex, id) {
    return knex('media_units')
      .where({ id })
      .delete()
  },

  updateUnit(knex, id, newUnitFields) {
    return knex('media_units')
      .where({ id })
      .update(newUnitFields)
  },
}

module.exports = UnitsService
