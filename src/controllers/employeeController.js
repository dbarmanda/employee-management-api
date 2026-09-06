const employees = [
    {
        id: 1,
        name: "John",
        department: "IT",
        salary: 60000
    },
    {
        id: 2,
        name: "Alice",
        department: "HR",
        salary: 55000
    }
];

function getEmployees(req, res){
    res.json(employees);
}

module.exports = {
    getEmployees
};