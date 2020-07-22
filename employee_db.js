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
    init()

})

async function init() {
    var action_choices = [
        "Add an employee", "Add a role", "Add a department", "Update employee role", "View all employees", "View employees by department", "View employees by role"
    ];
    var response = await inquirer.prompt({ name: "action", type: "list", message: "What would you like to do?", "choices": action_choices })
    callAppropriateAction(response)
}

// Function which will call the appropriate function based on the inquirer response
function callAppropriateAction(inquirerRes) {
    switch (inquirerRes.action) {
        case "Add an employee":
            handleAddEmployee()
            break;
        case "Add a role":
            handleAddRole()
            break;
        case "Add a department":
            handleAddDepartment()
            break;
        case "Update employee role":
            handleUpdateEmployeeRole()
            break;
        case "View all employees":
            handleViewAllEmployees()
            break;
        case "View employees by department":
            handleViewByDepartment()
            break;
        case "View employees by role":
            handleViewByRole()
            break;

    }
}

// FUNCTIONS TO HANDLE CHOICE OF ACTION

async function handleAddDepartment() {
    var dept = await inquirer.prompt({ name: "name", type: "input", message: "What is the name of the new department to add?" })
    addDepartment(dept.name)
}

async function handleAddRole() {

    dept_choices = []
    connection.query('SELECT dept_name FROM departments', async (err, res) => {

        if (err) throw err

        for (const row of res) {
            dept_choices.push(row.dept_name)
        }
        var role = await inquirer.prompt([
            { name: "name", type: "input", message: "What is the name of the new role to add?" },
            { name: "salary", type: "number", message: "What is the salary for this role?" },
            { name: "dept", type: "list", choices: dept_choices, message: "Under which department is this role?" }
        ])
        addRole(role.name, role.salary, role.dept)
    })

}

async function handleAddEmployee() {
    var name = await inquirer.prompt([
        {name:"first", message: "What is the employee's first name?", type:"input"},
        {name:"last", message:"What is the employee's last name?", type:"input"}])
    3
    var role_choices = [];
    connection.query("SELECT title from roles", async (err, res) => {
        if (err) throw err
        for (const row of res) {
            role_choices.push(row.title)
        }
        var role = await inquirer.prompt({name: "title", type:"list", choices:role_choices, message:"What is the employee's role?"})

        addEmployee(name.first, name.last, role.title)
    })
}

function handleViewAllEmployees() {
    viewAllEmployees()
}

async function handleUpdateEmployeeRole() {
    var all_employees = [];
    var all_roles = []
    connection.query("SELECT CONCAT(first_name, ' ', last_name) AS name FROM employees", async (err, res) => {
        if (err) throw err
        for (const row of res) {
            all_employees.push(row.name)
        }
        var employee = await inquirer.prompt({name:"full_name", type:"list", "choices":all_employees, message:"Which employee's role would you like to update?"})
        connection.query(`SELECT title FROM roles`, async (err, res) => {
            if (err) throw err
            for (const row of res) {
                all_roles.push(row.title)
            }
            var role = await inquirer.prompt({name:"title", type:"list", "choices":all_roles, message:`What is ${employee.full_name}'s new role?`})
            updateEmployeeRole(employee.full_name, role.title)
        })
    })
}

async function handleViewByDepartment() {

    connection.query("SELECT dept_name FROM departments", async (err, res) => {
        if (err) throw err
        dept_choices = []
        for (const row of res) {
            dept_choices.push(row.dept_name)
        }
        var dept = await inquirer.prompt({name:"name", type:"list", choices: dept_choices, message:"Which department's employees are you looking for?"})
        viewByDepartment(dept.name)
    })
}

function handleViewByRole() {

    connection.query("SELECT title FROM roles", async (err, res) => {
        if (err) throw err
        title_choices = [];
        for (const row of res) {
            title_choices.push(row.title);
        }
        var role = await inquirer.prompt({name:'title', type:"list", choices:title_choices, message:"Which role are you looking for?"})
        viewByRole(role.title)
    })
}

// FUNCTIONS TO GATHER INFORMATION FROM SQL

function addDepartment(dept_name) {
    connection.query("SELECT * FROM departments", (err, res) => {
        if (err) throw err
        for (const row of res) {
            if (row.dept_name === dept_name) {
                console.log("This department already exists!")
                return
            }
        }
        connection.query(`INSERT INTO departments(dept_name) VALUES ('${dept_name}')`, (err, res) => {
            if (err) throw err;
            console.log("New department added!");
        })
    })
}

function addRole(role_name, salary, dept_name) {
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



async function addEmployee(first_name, last_name, role_name) {

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


function viewAllEmployees() {

    var sqlQuery = "SELECT e1.first_name AS FirstName, e1.last_name AS LastName, r.title AS Title, d.dept_name AS DepartmentName, r.salary AS Salary, CONCAT(e2.first_name, ' ', e2.last_name) AS Manager ";
    sqlQuery += "FROM employees AS e1 "
    sqlQuery += "LEFT JOIN roles AS r ON e1.role_id = r.id "
    sqlQuery += "LEFT JOIN departments AS d ON r.department_id = d.id "
    sqlQuery += "LEFT JOIN employees AS e2 ON e1.manager_id = e2.id"
    connection.query(sqlQuery, (err, res) => {
        if (err) throw err
        console.table(res)
    })
}

function updateEmployeeRole(name, new_role) {
    firstName = name.split(" ")[0]
    lastName = name.split(" ")[1]
    connection.query(`SELECT id FROM roles WHERE title = '${new_role}'`, (err, res) => {
        if (err) throw err
        roleID = res[0].id
        connection.query('UPDATE employees SET ? WHERE ? AND ?',
            [{
                role_id: roleID
            },
            {
                first_name: firstName
            },
            {
                last_name: lastName
            }
            ],
            (err, res) => {
                if (err) throw err
                console.log(`${name}'s role successfully changed!`)
            }
        )
    })
}

function viewByRole(role) {
    connection.query(`SELECT id FROM roles WHERE title = '${role}'`, (err, res) => {
        if (err) throw err;
        var role_id = res[0].id;
        var sqlQuery = "SELECT e.first_name AS FirstName, e.last_name AS LastName, CONCAT(e2.first_name, ' ', e2.last_name) AS Manager "
        sqlQuery += `FROM employees AS e INNER JOIN employees AS e2 ON e.manager_id = e2.id AND e.role_id = ${role_id}`
        connection.query(sqlQuery, (err, res) => {
            if (err) throw err
            console.table(res)

        })
    })
}
function viewByDepartment(department) {
    connection.query(`SELECT id from departments WHERE dept_name = '${department}'`, (err, res) => {
        if (err) throw err
        dept_id = res[0].id
        var sqlQuery = `SELECT e.first_name AS FirstName, e.last_name AS LastName, r.title AS Title, r.salary AS Salary, CONCAT(e2.first_name, ' ', e2.last_name) AS Manager `;
        sqlQuery += `FROM employees AS e `
        sqlQuery += `INNER JOIN departments AS d ON d.id = ${dept_id} `
        sqlQuery += `INNER JOIN roles AS r ON r.department_id = d.id AND e.role_id = r.id `
        sqlQuery += `LEFT JOIN employees AS e2 ON e.manager_id = e2.id`

        connection.query(sqlQuery, (err, res) => {
            if (err) throw err
            console.table(res)
        })
    })
}

