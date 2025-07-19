const express = require("express");
const helmet = require("helmet");
const config = require("./config");
const loaders = require("./loaders");
var cors = require("cors");
const authenticate = require("./middlewares/authenticate");
const {
	WorkspaceRoutes,
	BoardRoutes,
	ListRoutes,
	TaskRoutes,
	TaskStatusRoutes,
	CommentRoutes,
	ChecklistRoutes,
	NotificationRoutes,
	PutBackRoutes,
	WebHookRoutes,
	InvitationRoutes,
	SubscriptionRoutes,
} = require("./routes");
const cronJob = require("./scripts/helpers/cronJob");

config();
loaders();

const app = express();

app.use(cors());
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
	app.use("/notification", NotificationRoutes);
	app.use("/putback", PutBackRoutes);
	app.use("/invitation", InvitationRoutes);
  app.use("/subscription", SubscriptionRoutes);
	
});
