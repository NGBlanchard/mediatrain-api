const express = require("express");
const path = require("path");
const StudentsService = require("./students-service");
const studentsRouter = express.Router();
const jsonBodyParser = express.json();
const jsonParser = express.json();
const xss = require("xss");

const { requireAuth } = require("../middleware/jwt-auth");

const serializeStudent = student => ({
  id: student.id,
  firstName: xss(student.firstName),
  lastName: xss(student.lastName),
  email: xss(student.email),
  password: xss(student.password),
  progress: student.progress,
  lessons: [],
  currentGrade: student.currentGrade
});

studentsRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    StudentsService.getAllStudents(knexInstance)
      .then(students => {
        res.json(students.map(serializeStudent));
      })
      .catch(next);
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { password, firstName, lastName } = req.body;

    for (const field of ["email", "password"])
      if (!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });

    const passwordError = StudentsService.validatePassword(password);

    if (passwordError) return res.status(400).json({ error: passwordError });

    StudentsService.hasStudentWithStudentName(req.app.get("db"), email)
      .then(hasStudentWithStudentName => {
        if (hasStudentWithStudentName)
          return res.status(400).json({ error: `Student already in system` });

        return StudentsService.hashPassword(password).then(hashedPassword => {
          const newStudent = {
            id,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            progress,
            lessons,
            currentGrade
          };

          return StudentsService.insertStudent(
            req.app.get("db"),
            newStudent
          ).then(student => {
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `/${student.id}`))
              .json(StudentsService.serializeStudent(student));
          });
        });
      })
      .catch(next);
  });

studentsRouter
  .route("/:student_id")
  .all(checkStudentExists)
  .all((req, res, next) => {
    StudentsService.getById(req.app.get("db"), req.params.student_id)
      .then(student => {
        if (!student) {
          return res.status(404).json({
            error: { message: `Student doesn't exist` }
          });
        }
        res.student = student;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeStudent(res.student));
  })
  .delete((req, res, next) => {
    StudentsService.deleteStudent(req.app.get("db"), req.params.student_id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const studentToUpdate = req.body;
    StudentsService.updateStudents(
      req.app.get("db"),
      req.params.student_id,
      studentToUpdate
    )
      .then(updatedStudent => {
        res.status(204);
        res.send(JSON.stringify(updatedStudent));
      })
      .catch(err => {
        res.status(404);
        res.end();
      });
  });

async function checkStudentExists(req, res, next) {
  try {
    const student = await StudentsService.getById(
      req.app.get("db"),
      req.params.student_id
    );
    if (!student)
      return res.status(404).json({
        error: `Student doesn't exist`
      });
    res.student = student;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = studentsRouter;
