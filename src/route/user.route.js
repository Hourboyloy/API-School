const handle = require('../controller/user.controller');
const user_route = (app)=>{
    app.post("/register", handle.register);
    app.post("/login", handle.login);
}

module.exports = user_route;