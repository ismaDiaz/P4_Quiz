// JavaScript source code
const { log, biglog, colorize, errorlog } = require("./out");
const model = require('./model');

exports.helpCmd = rl => {
    log("Comandos:");
    log(" h|help - Muestra esta ayuda.");
    log(" list - Listar los quizzes existentes.");
    log(" show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(" add - A�adir un nuevo quiz interactivamente.");
    log(" delete <id> - Borrar quiz indicado.");
    log(" edit <id> - Editar el quiz indicado.");
    log(" test <id> - Probar el quiz indicado.");
    log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(" credits - Creditos.");
    log(" q|quit - Salir del programa.");
    rl.prompt();
};


exports.listCmd = rl => {

    model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
    }
 );
    rl.prompt();
};


exports.showCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el par�metro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};


exports.addCmd = rl => {
    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
            model.add(question, answer);
            log(` ${colorize(' Se ha a�adido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};


exports.deleteCmd = (rl,id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el par�metro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch (error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};


exports.editCmd = (rl,id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el par�metro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);

                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};


exports.testCmd = (rl,id) => {
  
    if (typeof id === "undefined") {
        errorlog(`Falta el par�metro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
           
            rl.question(colorize(quiz.question + "?" + "", 'red'), answer => {

                if (answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase() ) {
                    log('Su respuesta es:', 'black');
                    log('CORRECTA', 'green');
                    rl.prompt();
                } else {
                    log('Su respuesta es:', 'black');
                    log('INCORRECTA', 'red');
                    rl.prompt();
                }
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }

};


exports.playCmd = rl => {

    let score = 0;
    let toBeResolved = [];
    for (let i = 0; i < model.count(); i++) {
        toBeResolved.push(i);
    }
    const playOne = () => {
        if (toBeResolved.length === 0) {
            log('No hay m�s preguntas.', 'black');
            log('Fin del examen. Aciertos:', 'black');
            log(score, 'green');
            rl.prompt();
        } else {
            let id = Math.round(Math.random() * ((toBeResolved.length)-1));
            const quiz = model.getByIndex(toBeResolved[id]);
            let elementosEliminados = toBeResolved.splice(id, 1);
            rl.question(quiz.question+'?'+'', resp => {
                if (resp.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                    score = score + 1;
                    log(`CORRECTO - Lleva ${colorize(score, 'magenta')} aciertos.`);
                    playOne();
                } else {
                    log('INCORRECTO.', 'black');
                    log('Fin del examen. Aciertos:', 'black');
                    log(score, 'green');
                    rl.prompt();
                }

            });

        }
    };
    playOne();

};


exports.creditsCmd = rl => {
    log(" Autores de la pr�ctica:");
    log('Ismael Diaz Molina', 'green');
    rl.prompt();
};


exports.quitCmd = rl => {
    rl.close();
};
