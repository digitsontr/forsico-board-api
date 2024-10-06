const express = require('express');
const helmet = require('helmet');
const config = require('./config');
const loaders = require('./loaders');
const authenticate = require('./middlewares/authenticate');
const { WorkspaceRoutes, BoardRoutes , ListRoutes, TaskRoutes , TaskStatusRoutes } = require('./routes');

config();
loaders();

const app = express();

app.use(express.json({limit: '10mb'}));
app.use(helmet());
app.use(authenticate);

 
app.listen(process.env.APP_PORT, ()=>{
    console.log(`Server works on ${ 3000 } port`);

    app.use('/workspace', WorkspaceRoutes);
    app.use('/board', BoardRoutes);
    app.use('/list', ListRoutes);
    app.use('/task', TaskRoutes);
    app.use('/taskstatus', TaskStatusRoutes);
});