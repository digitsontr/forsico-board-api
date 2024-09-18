const express = require('express');
const helmet = require('helmet');
const config = require('./config');
const loaders = require('./loaders');
const authenticate = require('./middlewares/authenticate');
const { WorkspaceRoutes } = require('./routes');


config();
loaders();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(authenticate);

 
app.listen(process.env.APP_PORT, ()=>{
    console.log(`Server works on ${ 3000 } port`);

    app.use('/workspace', WorkspaceRoutes);
});