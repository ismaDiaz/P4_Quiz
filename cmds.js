// JavaScript source code

const Sequelize = require('sequelize');
const {log, biglog, colorize, errorlog} = require("./out");
const {models} = require('./model');
const net = require("net");

exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, " h|help - Muestra esta ayuda.");
    log(socket, " list - Listar los quizzes existentes.");
    log(socket, " show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket, " add - A�adir un nuevo quiz interactivamente.");
    log(socket, " delete <id> - Borrar quiz indicado.");
    log(socket, " edit <id> - Editar el quiz indicado.");
    log(socket, " test <id> - Probar el quiz indicado.");
    log(socket, " p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, " credits - Creditos.");
    log(socket, " q|quit - Salir del programa.");
    rl.prompt();
};


exports.listCmd = (socket, rl) => {
    models.quiz.findAll()
    .each(quiz => {
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

const validateId = (id) => {
    return new Sequelize.Promise((resolve, reject) => {
        if(typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>.`));
        }else{
            id = parseInt(id);
            if(Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            }else{
                resolve(id);
            }
        }
    });
};


exports.showCmd = (socket, rl, id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};




exports.addCmd = (socket,rl) => {
    makeQuestion(rl, 'Introduzca pregunta: ')
    .then(q => {
        return makeQuestion(rl, 'Introduzca la respuesta: ')
        .then(a => {
            return {question: q,answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


exports.deleteCmd = (socket, rl,id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


exports.editCmd = (socket, rl,id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }

        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
        return makeQuestion(rl, ' Introduzca la pregunta: ')
        .then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
            return makeQuestion(rl, ' Introduzca la respuesta ')
            .then(a => {
                quiz.question = q;
                quiz.answer = a;
                return quiz;
            });
        });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


exports.testCmd = (socket, rl,id) => {
    validateId(id)
    .then( id => models.quiz.findById(id))
    .then( quiz => {
        if (!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        return makeQuestion(rl, quiz.question+"?"+" ")
        .then(q => {
            if(q.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
                log(socket, 'Su respuesta es:', 'black');
                log(socket, 'CORRECTA', 'green');
            }else{
                log(socket, 'Su respuesta es:', 'black');
                log(socket, 'INCORRECTA', 'red');
            }
        });
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};




exports.playCmd = (socket, rl) => {
    let score = 0;
    let toBeResolved = [];
    const playOne = () => {
        return new Promise((resolve,reject) => {
            if( toBeResolved.length === 0){
                log(socket, 'No hay m�s preguntas.', 'black');
                log(socket, 'Fin del examen. Aciertos:', 'black');
                log(socket, score, 'green');
                resolve();
                return;
            }else{
                try{
                    let id = Math.round(Math.random() * ((toBeResolved.length)-1));
                    const quiz = toBeResolved[id];
                    let elementosEliminados = toBeResolved.splice(id, 1);
                    MakeQuestion(rl,quiz.question)
                    .then(answer => {
                    if (resp.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                        score = score + 1;
                        log(socket, `CORRECTO - Lleva ${colorize(score, 'magenta')} aciertos.`);
                        resolve(playOne());
                    } else {
                        log(socket, 'INCORRECTO.', 'black');
                        log(socket, 'Fin del examen. Aciertos:', 'black');
                        log(socket, score, 'green');
                        rl.prompt();
                   }
                    })
                }catch(error){
                    errorlog(socket, error.message);
                    rl.prompt();
                }
            }
        })
    }
    models.quiz.findAll({raw: true})
    .then(quizzes => {
        toBePlayed = quizzes;
    })                                                 
    .then(() => {
        return playOne()
    })
    .then(() => {
        rl.prompt();
    });
};

exports.creditsCmd = (socket, rl) => {
    log(socket, " Autores de la pr�ctica:");
    log(socket, 'Ismael Diaz Molina', 'green');
    rl.prompt();
};


exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};
