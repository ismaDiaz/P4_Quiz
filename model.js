
const Sequelize = require('sequelize');

const sequelize = new Sequelize("sqlite:quizzes.sqlite", {logging: false});

sequelize.define('quiz', {
    question: {
        type: Sequelize.STRING,
        unique: {nsg: "Ya no existe esta pregunta"},
        validate: {notEmpty: {nsg: "La respuesta no puede estar vacía"}}
    },
    answer: {
        type: Sequelize.STRING,
        validate: {notEmpty: {nsg: "La respuesta no puede estar vacía"}}
    }
});

sequelize.sync()
.then(() => sequelize.models.quiz.count())
.then(count => {
    if (!count) {
        return sequelize.models.quiz.bulkCreate([
            { question: "Capital de Italia", answer: "Roma"},
            { question: "Capital de Francia", answer: "Par�s"},
            { question: "Capital de Espa�a", answer: "Madrid"},
            { question: "Capital de Portugal", answer: "Lisboa"}
        ]);
    }
})
.catch(error => {
    console.log(error);
});

module.exports = sequelize;
