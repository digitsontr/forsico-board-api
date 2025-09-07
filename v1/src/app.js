const express = require("express");
const helmet = require("helmet");
const config = require("./config");
const loaders = require("./loaders");
var cors = require("cors");
const authenticate = require("./middlewares/authenticate");
const messageBusService = require("./services/messageBusService");
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
const RoleRoutes = require("./routes/roles");
const cronJob = require("./scripts/helpers/cronJob");

config();
loaders();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(helmet());

// Health check endpoint for Kubernetes probes

app.get('/health', (req, res) => {
	res.json({ message: 'OK' });
  });

app.use(authenticate);


const PORT = process.env.PORT || 8080;

// Register routes
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
app.use("/roles", RoleRoutes);

app.listen(PORT, async () => {
    console.info(`Server works ON ${PORT}`);

    // Initialize Message Bus Service
    try {
        await messageBusService.initializeSubscriptions();
        console.info('Message Bus Service initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Message Bus Service:', error.message);
        // Continue without Service Bus if it fails
    }
});
