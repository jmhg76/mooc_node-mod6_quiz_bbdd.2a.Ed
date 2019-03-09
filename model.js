const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");

const options = { logging: false, operatorsAliases: false};
const sequelize = new Sequelize("sqlite:quizzes.sqlite", options); // BDD quizzes

// Modelos de la BDD
sequelize.define(
  'quizz', // Tabla quizzes, automáticamente se crean los campos Id, createAt y updatedAt
  { question: { 
      type: Sequelize.STRING,
      unique: { msg: "La preguntas ya existe"},
      validate: { notEmpty: {msg: "La pregunta no puede estar vacía"}}
    },
    answer: {
      type: Sequelize.STRING,
      validate: { notEmpty: {msg: "La respuesta no puede estar vacía"}}
    }
  }
);

// Inicialización de la BDD

const quizz = sequelize.models.quizz; // Modelo a instanciar

sequelize.sync()
	.then(() => quizz.count()) // Comprobamos si hay alguna instancia ...
	.then((count) => { // ... la promesa anterior devuelve la cantidad de instancias ...
	  if (count===0) { // .. si no hay instancias del modelo ...         
		return ( // ... se crean
		  quizz.bulkCreate([
			{ question: 'Capital de Italia',	answer: 'Roma'   },
			{ question: 'Capital de Francia',	answer: 'París'  },
			{ question: 'Capital de España',	answer: 'Madrid' },
			{ question: 'Capital de Portugal',	answer: 'Lisboa' }
		  ])
		  .then( c => log(`  DB created with ${c.length} elems`))
		)
	  } else { // .. si ya estaban creadas se muestra
		log(`  DB exists & has ${count} elems`);
	  }
	})
	.catch( err => errorlog(`   ${err}`));

module.exports = sequelize;