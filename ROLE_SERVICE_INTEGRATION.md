# Role Service Integration for Forsico Board API

## 🎯 Overview

This document describes the integration of the Role Service into the Forsico Board API, enabling granular permission-based access control for boards, tasks, and workspace operations.

## 🔧 Implementation Details

### Files Added/Modified

#### New Files:
- `src/services/roleServiceClient.js` - Role service HTTP client
- `src/middlewares/permission.js` - Permission checking middleware
- `src/constants/permissions.js` - Permission constants and helpers
- `src/routes/roles.js` - Role management endpoints
- `src/config/roleService.js` - Role service configuration
- `ROLE_SERVICE_INTEGRATION.md` - This documentation

#### Modified Files:
- `src/routes/board.js` - Added permission middleware to board routes
- `src/routes/task.js` - Added permission middleware to task routes
- `src/middlewares/authorize.js` - Enhanced with auth context
- `src/app.js` - Added role routes

### Permission Structure

The integration implements a hierarchical permission system:

```
Subscription Level
├── SUBSCRIPTION.USERS.MANAGE
├── SUBSCRIPTION.WORKSPACES.CREATE
└── SUBSCRIPTION.SETTINGS.MANAGE

Workspace Level
├── WORKSPACE.VIEW
├── WORKSPACE.USERS.MANAGE
├── WORKSPACE.BOARDS.CREATE
└── WORKSPACE.SETTINGS.MANAGE

Board Level
├── BOARD.VIEW
├── BOARD.MEMBERS.MANAGE
├── BOARD.TASKS.CREATE
├── BOARD.TASKS.UPDATE
└── BOARD.SETTINGS.MANAGE

Task Level
├── TASK.VIEW
├── TASK.UPDATE
├── TASK.ASSIGN
└── TASK.COMMENTS.CREATE
```

### Middleware Usage

#### Basic Permission Check:
```javascript
const { requirePermission } = require('../middlewares/permission');
const { BOARD_PERMISSIONS, SCOPE_TYPES } = require('../constants/permissions');

router.get(
  "/:boardId",
  authorize(),
  requirePermission(BOARD_PERMISSIONS.VIEW, SCOPE_TYPES.BOARD),
  getBoardById
);
```

#### Multiple Permission Check:
```javascript
const { requireAnyPermission } = require('../middlewares/permission');

router.post(
  "/special-action",
  authorize(),
  requireAnyPermission([
    BOARD_PERMISSIONS.MANAGE,
    WORKSPACE_PERMISSIONS.BOARDS.MANAGE
  ], SCOPE_TYPES.BOARD),
  specialAction
);
```

## 🔧 Configuration

### Environment Variables

Add these environment variables to your deployment:

```bash
# Role Service Connection
ROLE_SERVICE_URL=http://role-service:3001
ROLE_API_KEY=D8D275887EEC217B864D54AF85748

# Permission Settings
ROLE_PERMISSIONS_ENABLED=true
ROLE_PERMISSIONS_FAIL_SAFE=true
ROLE_PERMISSIONS_CACHE_ENABLED=true
ROLE_PERMISSIONS_CACHE_TTL=300

# Logging
LOG_PERMISSION_CHECKS=false
LOG_ROLE_SERVICE_CALLS=false
ROLE_SERVICE_LOG_LEVEL=info

# Health Check
ROLE_SERVICE_HEALTH_CHECK_ENABLED=true
ROLE_SERVICE_HEALTH_CHECK_INTERVAL=60000
```

### Kubernetes Secrets

The following secrets are already configured in the Kubernetes deployment:

```yaml
# forsico-infrastructure/k8s/base/services/board-service/secrets.yaml
ROLE_SERVICE_URL: "http://role-service:3001"
ROLE_API_KEY: "D8D275887EEC217B864D54AF85748"
```

## 🚀 API Endpoints

### Role Management Endpoints

#### Get User Roles
```http
GET /roles/user/{userId}/subscription/{subscriptionId}
Authorization: Bearer {token}
```

#### Assign Workspace Role
```http
POST /roles/assign/workspace
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "user123",
  "subscriptionId": "sub456",
  "workspaceId": "workspace789",
  "roleTemplateId": "role_template_id",
  "roleTemplateType": "RoleTemplate"
}
```

#### Assign Board Role
```http
POST /roles/assign/board
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "user123",
  "subscriptionId": "sub456",
  "workspaceId": "workspace789",
  "boardId": "board101",
  "roleTemplateId": "role_template_id",
  "roleTemplateType": "RoleTemplate"
}
```

#### Remove Role
```http
DELETE /roles/remove
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "user123",
  "subscriptionId": "sub456",
  "roleTemplateId": "role_template_id",
  "scopeId": "board101"
}
```

#### Check Permission
```http
POST /roles/check-permission
Content-Type: application/json
Authorization: Bearer {token}

{
  "subscriptionId": "sub456",
  "requiredPermission": "BOARD.VIEW",
  "scopeType": "board",
  "scopeId": "board101",
  "workspaceId": "workspace789"
}
```

## 🔍 Permission Scenarios

### Scenario 1: Workspace Admin
- **Role**: Admin at workspace level
- **Access**: Full access to all boards in workspace
- **Implementation**: Workspace admin role automatically grants board admin permissions

### Scenario 2: Board-Specific Roles
- **Role**: Member at workspace level + Admin at specific board
- **Access**: Member access to workspace, Admin access to specific board
- **Implementation**: Board-specific role overrides workspace role for that board

### Scenario 3: Board-Only Access
- **Role**: No workspace role + Viewer at specific board
- **Access**: Only view access to specific board, no workspace access
- **Implementation**: Direct board role assignment without workspace role

## 🛡️ Security Features

### Fail-Safe Mode
- When role service is unavailable, system can operate in fail-safe mode
- Configurable via `ROLE_PERMISSIONS_FAIL_SAFE` environment variable
- Logs all fail-safe operations for security audit

### Permission Caching
- Permission check results are cached to improve performance
- Configurable TTL via `ROLE_PERMISSIONS_CACHE_TTL`
- Cache invalidation on role changes

### Audit Logging
- All permission checks are logged for security audit
- Role assignments and removals are logged
- Failed permission checks are logged with context

## 🔧 Troubleshooting

### Common Issues

#### 1. Role Service Unavailable
- **Symptom**: 403 errors on all requests
- **Solution**: Check role service health, enable fail-safe mode
- **Check**: `GET /roles/health`

#### 2. Permission Denied
- **Symptom**: 403 error with "Missing required permission" message
- **Solution**: Verify user has correct role assignment
- **Check**: `POST /roles/check-permission`

#### 3. Invalid Scope ID
- **Symptom**: 403 error with "Board ID is required" message
- **Solution**: Ensure board ID is passed in URL parameters
- **Check**: Route parameter mapping

### Debug Commands

```bash
# Check role service health
curl -X GET http://board-api/roles/health

# Check user permissions
curl -X POST http://board-api/roles/check-permission \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub123",
    "requiredPermission": "BOARD.VIEW",
    "scopeType": "board",
    "scopeId": "board456"
  }'
```

## 📊 Monitoring

### Health Checks
- Role service health check: `GET /roles/health`
- Automatic health monitoring (configurable interval)
- Integration with existing monitoring systems

### Metrics
- Permission check success/failure rates
- Role service response times
- Cache hit/miss ratios
- Fail-safe mode activations

## 🔄 Migration Notes

### Backward Compatibility
- Existing `authorize()` middleware continues to work
- Legacy permission constants are mapped to new structure
- Gradual migration path available

### Deployment Strategy
1. Deploy role service first
2. Update board API with role integration
3. Test permission checks
4. Gradually enable role-based permissions
5. Monitor and adjust as needed

## 📝 Next Steps

1. **Testing**: Comprehensive testing of all permission scenarios
2. **Documentation**: Update API documentation with new endpoints
3. **Monitoring**: Set up monitoring and alerting for role service
4. **Training**: Train team on new permission system
5. **Migration**: Plan migration of existing users to new role system
