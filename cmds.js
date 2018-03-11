// JavaScript source code

const Sequelize = require('sequelize');
const { log, biglog, colorize, errorlog } = require("./out");
const {models} = require('./model');

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
    models.quiz.findAll()
    .each(quiz => {
            log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

const validateId = id => {
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


exports.showCmd = (rl, id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(`[$colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(error.message);
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




exports.addCmd = rl => {
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
        log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


exports.deleteCmd = (rl,id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


exports.editCmd = (rl,id) => {
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
        log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


exports.testCmd = (rl,id) => {
    validateId(id)
    .then( id => models.quiz.findById(id))
    .then( quiz => {
        if (!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        return makeQuestion(rl, quiz.question+"?"+" ")
        .then(q => {
            if(q.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
                log('Su respuesta es:', 'black');
                log('CORRECTA', 'green');
            }else{
                log('Su respuesta es:', 'black');
                log('INCORRECTA', 'red');
            }
        });
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};



  
//    if (typeof id === "undefined") {
//      errorlog(`Falta el par�metro id.`);
//    rl.prompt();
//    } else {
//        try {
//            const quiz = model.getByIndex(id);
//         
//        rl.question(colorize(quiz.question + "?" + "", 'red'), answer => {
//
//              if (answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase() ) {
//                log('Su respuesta es:', 'black');
//              log('CORRECTA', 'green');
//            rl.prompt();
//      } else {
//        log('Su respuesta es:', 'black');
//      log('INCORRECTA', 'red');
//    rl.prompt();
//    }
//    });
//      } catch (error) {
//        errorlog(error.message);
//      rl.prompt();
//}
//    }

//};
const playOne = (toBeResolved,score) => {
    return new Sequelize.Promise((resolve,reject) => {
        if( toBeResolved.length === 0){
            log('No hay m�s preguntas.', 'black');
            log('Fin del examen. Aciertos:', 'black');
            log(score, 'green');
        }else{
            let id = Math.round(Math.random() * ((toBeResolved.length)-1));
            const quiz = model.getByIndex(toBeResolved[id]);
            let elementosEliminados = toBeResolved.splice(id, 1);
            rl.question(quiz.question+'?'+'', resp => {
               if (resp.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                score = score + 1;
                log(`CORRECTO - Lleva ${colorize(score, 'magenta')} aciertos.`);
                resolve(playOne(toBeResolved,score));
               } else {
                log('INCORRECTO.', 'black');
                log('Fin del examen. Aciertos:', 'black');
                log(score, 'green');
               }
            });
        }
    });
};

exports.playCmd = rl => {
    let score = 0;
    let toBeResolved = [];
    for (let i = 1; i < models.quiz.count ; i++) {
        toBeResolved.push(i);
    }                                                 
    playOne(toBeResolved,score)
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};



 //   let score = 0;
 //   let toBeResolved = [];
 //   for (let i = 0; i < model.count(); i++) {
 //       toBeResolved.push(i);
 //   }
 //   const playOne = () => {
 //       if (toBeResolved.length === 0) {
 //           log('No hay m�s preguntas.', 'black');
 //           log('Fin del examen. Aciertos:', 'black');
 //           log(score, 'green');
 //           rl.prompt();
 //       } else {
 //           let id = Math.round(Math.random() * ((toBeResolved.length)-1));
 //           const quiz = model.getByIndex(toBeResolved[id]);
 //           let elementosEliminados = toBeResolved.splice(id, 1);
 //           rl.question(quiz.question+'?'+'', resp => {
 //               if (resp.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
 //                   score = score + 1;
 //                   log(`CORRECTO - Lleva ${colorize(score, 'magenta')} aciertos.`);
 //                   playOne();
 //               } else {
 //                   log('INCORRECTO.', 'black');
 //                   log('Fin del examen. Aciertos:', 'black');
 //                   log(score, 'green');
 //                   rl.prompt();
 //               }
 //           });
//      }
//  };
//    playOne();
//};

exports.creditsCmd = rl => {
    log(" Autores de la pr�ctica:");
    log('Ismael Diaz Molina', 'green');
    rl.prompt();
};


exports.quitCmd = rl => {
    rl.close();
};
