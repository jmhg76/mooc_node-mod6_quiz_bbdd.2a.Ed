
const Sequelize = require('sequelize'); // Importado para las promesas Sequelize.Promise

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model'); // Importamos todos los modelos a utilizar


/**
 * Esta función devuelve una promesa que:
 *   - Valida que se ha introducido un valor para el parámetro
 *   - Convierte el parámetro en un número entero
 * Si todo va bien, la promesa se satisface y devuelve el valor de id al usar
 *
 * @param id Clave del quiz a mostrar.
 */
const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id);
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetros <id> no es un número`));
			} else {
				resolve(id);
			}
		}
	});
};

/**
 * Esta función devuelve una promesa que cuando se cumple ...
 *   la llamada a then que hay que hacer es:
 *      .then(answer => {...})
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text pregunta que hay que hacerle al usuario
 */
const makeQuestion = (rl, text) => {
	// Promesa tipo Sequelize para que en su uso se permita las promesas Sequelize
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

 
 
/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
	models.quizz.findAll()
	.each(quizz => { // equivale a .then (q => .then( quizzes => quizzes.forEach( q ) => ...
		log(`  [${colorize(quizz.id, 'magenta')}]:  ${quizz.question}`);
	})
	.catch(err => {
		errorlog(`   ${err}`)
	})
	.then(() => {
		rl.prompt();
	});
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quizz.findById(id))
	.then(quizz => {
		if (!quizz) {
			throw new Error(`No existe un quizz asociado al id=${id}.`);
		}
		log(` [${colorize(id, 'magenta')}]:  ${quizz.question} ${colorize('=>', 'magenta')} ${quizz.answer}`);

	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {

    makeQuestion(rl, ' Introduzca una pregunta: ') // Pedimos la pregunta ...
	.then(q => { // ... tenemos la pregunta ...
		return makeQuestion(rl, ' Introduzca la respuesta: ') // ... pedimos la respuesta ...
		.then(a => { // ... tenemos la respuesta ...
			return { question: q , answer: a }; // ... tenemos la fila a introducir en la BDD
		});
	})
	.then(quizz => {
		return models.quizz.create(quizz); // ... llamamos a la funcion create del modelo para introducir la fila en la BDD
	}) 
	.then((quizz) => { // .. Informamos de que se creó la pregunta y su respuesta ...
		log(` ${colorize('Se ha añadido', 'magenta')}: ${quizz.question} ${colorize('=>', 'magenta')} ${quizz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => { // ... errores de validación del modelo
		errorlog(`El quizz es erróneo:`);
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => { // ... otros errores posibles
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quizz.destroy({ where: { id } }))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

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


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
    log('Probar el quiz indicado.', 'red');
    rl.prompt();
};


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {
    log('Jugar.', 'red');
    rl.prompt();
};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('Nombre 1', 'green');
    log('Nombre 2', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};

