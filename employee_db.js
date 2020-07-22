var mysql = require('mysql')

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
    connection.query(`INSERT INTO departments(dept_name) VALUES '${dept_name}'`, (err, res) => {
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

add_role('CEO', 500000, 'Management')