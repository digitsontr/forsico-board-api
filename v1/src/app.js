const express = require("express");
const helmet = require("helmet");
const config = require("./config");
const loaders = require("./loaders");
const authenticate = require("./middlewares/authenticate");
const {
  WorkspaceRoutes,
  BoardRoutes,
  ListRoutes,
  TaskRoutes,
  TaskStatusRoutes,
  CommentRoutes,
  ChecklistRoutes,
} = require("./routes");

config();
loaders();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(helmet());
app.use(authenticate);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.info(`Server works ON ${PORT}`);

  app.use("/workspace", WorkspaceRoutes);
  app.use("/board", BoardRoutes);
  app.use("/list", ListRoutes);
  app.use("/task", TaskRoutes);
  app.use("/taskStatus", TaskStatusRoutes);
  app.use("/comment", CommentRoutes);
  app.use("/checklist", ChecklistRoutes);
});
