var mysql = require('mysql')
var inquirer = require('inquirer')

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "employeeTracker_db"

})

connection.connect(err => {
    if (err) throw err
    console.log("Connected as id " + connection.threadId)
})

function add_department(dept_name) {
    connection.query(`INSERT INTO departments(dept_name) VALUES ('${dept_name}')`, (err, res) => {
        if (err) throw err;
        console.log("New department added!");
        console.table(res)
    })
}

function add_role(role_name, salary, dept_name) {
    connection.query(`SELECT id FROM departments WHERE dept_name = '${dept_name}'`,
        (err, res) => {
            var dept_id = res[0].id

            connection.query(`INSERT INTO roles(title, salary, department_id) VALUES ('${role_name}', ${salary}, ${dept_id})`,
                (err, res) => {
                    if (err) throw err;
                    console.log(`Role has been added!`)
                })
        })
}

async function add_employee(first_name, last_name, role_name) {

    var firstRes = await inquirer.prompt({ name: "has_manager", type: "list", choices: ["yes", "no"], message: "Does this employee have a manager?" })
    if (firstRes.has_manager === 'yes') var has_manager = true
    else var has_manager = false

    // Searches for the id of the employee's role
    connection.query(`SELECT id FROM roles WHERE title = '${role_name}'`, (err, res) => {
        if (err) throw err
        var role_id = res[0].id

        if (has_manager) {
            connection.query(`SELECT first_name, last_name FROM employees`, async (err, res) => {
                if (err) throw err;

                console.log(res)
                var manager_choices = [];
                for (const employee of res) {
                    manager_choices.push(employee.first_name + " " + employee.last_name)
                }

                var thirdRes = await inquirer.prompt({ name: "manager", type: "list", choices: manager_choices, message: "Who is the employee's manager?" })
                var manager = thirdRes.manager
                console.log(manager)
                var manager_first = manager.split(" ")[0];
                var manager_last = manager.split(" ")[1]
                connection.query(`SELECT id FROM employees WHERE first_name = '${manager_first}' AND last_name = '${manager_last}'`, (err, res) => {
                    if (err) throw err;
                    var manager_id = res[0].id
                    connection.query(`INSERT INTO employees(first_name, last_name, role_id, manager_id) VALUES ('${first_name}', '${last_name}', '${role_id}', '${manager_id}')`, (err, res) => {
                        if (err) throw err
                        console.log(`${first_name} ${last_name} added to database!`)
                    })
                })
            })
        }
        else {
            connection.query(`INSERT INTO employees(first_name, last_name, role_id) VALUES ('${first_name}', '${last_name}', ${role_id})`, (err, res) => {
                if (err) throw err
                console.log(`${first_name} ${last_name} added to database!`)
            })
        }
    })
}


add_employee('Sam', 'Barrow', 'Software Engineer')

