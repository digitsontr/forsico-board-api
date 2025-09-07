# PowerShell script to create Service Bus subscriptions for board-api
# Run this script to create all necessary subscriptions for board-api service

Write-Host "Creating Service Bus subscriptions for board-api..." -ForegroundColor Green

# Configuration
$resourceGroup = "forsico-board-rg"
$namespaceName = "forsico-service-bus"
$subscriptionName = "board-api"

# Auth topics
$authTopics = @(
    "user-registration-dev",
    "user-registration",
    "user-profile-update-dev", 
    "user-profile-update"
)

# Subscription topics
$subscriptionTopics = @(
    "subscription-created-dev",
    "subscription-created",
    "subscription-user-added-dev",
    "subscription-user-added",
    "subscription-user-removed-dev",
    "subscription-user-removed"
)

# Combine all topics
$allTopics = $authTopics + $subscriptionTopics

Write-Host "Topics to create subscriptions for:" -ForegroundColor Yellow
$allTopics | ForEach-Object { Write-Host "  - $_" }

# Function to create subscription
function Create-ServiceBusSubscription {
    param(
        [string]$TopicName,
        [string]$SubscriptionName,
        [string]$ResourceGroup,
        [string]$NamespaceName
    )
    
    try {
        Write-Host "Creating subscription '$SubscriptionName' for topic '$TopicName'..." -ForegroundColor Cyan
        
        $result = az servicebus topic subscription create `
            --resource-group $ResourceGroup `
            --namespace-name $NamespaceName `
            --topic-name $TopicName `
            --name $SubscriptionName `
            --output json | ConvertFrom-Json
            
        if ($result) {
            Write-Host "✅ Successfully created subscription '$SubscriptionName' for topic '$TopicName'" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Failed to create subscription '$SubscriptionName' for topic '$TopicName'" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error creating subscription '$SubscriptionName' for topic '$TopicName': $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check if subscription exists
function Test-ServiceBusSubscription {
    param(
        [string]$TopicName,
        [string]$SubscriptionName,
        [string]$ResourceGroup,
        [string]$NamespaceName
    )
    
    try {
        $result = az servicebus topic subscription show `
            --resource-group $ResourceGroup `
            --namespace-name $NamespaceName `
            --topic-name $TopicName `
            --name $SubscriptionName `
            --output json 2>$null
            
        return $result -ne $null
    }
    catch {
        return $false
    }
}

# Create subscriptions
$successCount = 0
$skipCount = 0
$failCount = 0

foreach ($topic in $allTopics) {
    Write-Host "`nProcessing topic: $topic" -ForegroundColor Yellow
    
    # Check if subscription already exists
    if (Test-ServiceBusSubscription -TopicName $topic -SubscriptionName $subscriptionName -ResourceGroup $resourceGroup -NamespaceName $namespaceName) {
        Write-Host "⏭️  Subscription '$subscriptionName' already exists for topic '$topic'" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    # Create subscription
    $success = Create-ServiceBusSubscription -TopicName $topic -SubscriptionName $subscriptionName -ResourceGroup $resourceGroup -NamespaceName $namespaceName
    
    if ($success) {
        $successCount++
    } else {
        $failCount++
    }
    
    # Small delay to avoid rate limiting
    Start-Sleep -Milliseconds 500
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "✅ Successfully created: $successCount subscriptions" -ForegroundColor Green
Write-Host "⏭️  Already existed: $skipCount subscriptions" -ForegroundColor Yellow
Write-Host "❌ Failed to create: $failCount subscriptions" -ForegroundColor Red
Write-Host "📊 Total topics processed: $($allTopics.Count)" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "`n🎉 All subscriptions are ready for board-api!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some subscriptions failed to create. Please check the errors above." -ForegroundColor Yellow
}

# List all subscriptions for verification
Write-Host "`nVerifying created subscriptions..." -ForegroundColor Cyan
foreach ($topic in $allTopics) {
    try {
        $subscription = az servicebus topic subscription show `
            --resource-group $resourceGroup `
            --namespace-name $namespaceName `
            --topic-name $topic `
            --name $subscriptionName `
            --query "name" `
            --output tsv 2>$null
            
        if ($subscription -eq $subscriptionName) {
            Write-Host "✅ $topic -> $subscriptionName" -ForegroundColor Green
        } else {
            Write-Host "❌ $topic -> NOT FOUND" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ $topic -> ERROR" -ForegroundColor Red
    }
}

Write-Host "`nScript completed!" -ForegroundColor Cyan
