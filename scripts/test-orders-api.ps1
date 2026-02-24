param(
  [string]$BaseUrl = "http://localhost:3000",
  [Parameter(Mandatory = $true)]
  [string]$AdminPhone,
  [Parameter(Mandatory = $true)]
  [string]$AdminPassword,
  [Parameter(Mandatory = $true)]
  [string]$CustomerPhone,
  [int]$Quantity = 1,
  [double]$Weight = 1.0,
  [switch]$SkipDeliveryTest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Get-Id {
  param($Value)

  if ($null -eq $Value) { return $null }
  if ($Value -is [string]) { return $Value }

  if ($Value.PSObject.Properties.Name -contains '_id') {
    if ($Value._id -is [string]) { return $Value._id }
    if ($Value._id.PSObject.Properties.Name -contains 'toString') { return $Value._id.ToString() }
  }

  if ($Value.PSObject.Properties.Name -contains 'id') {
    if ($Value.id -is [string]) { return $Value.id }
    return $Value.id.ToString()
  }

  return $Value.ToString()
}

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)] [string]$Method,
    [Parameter(Mandatory = $true)] [string]$Path,
    $Body,
    [Parameter(Mandatory = $true)] [Microsoft.PowerShell.Commands.WebRequestSession]$Session
  )

  $uri = "$BaseUrl$Path"
  $params = @{
    Method      = $Method
    Uri         = $uri
    WebSession  = $Session
    ContentType = 'application/json'
  }

  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  try {
    return Invoke-RestMethod @params
  }
  catch {
    $statusCode = $null
    $rawBody = $null

    if ($_.Exception.PSObject.Properties.Name -contains 'Response' -and $null -ne $_.Exception.Response) {
      $response = $_.Exception.Response

      if ($response.PSObject.Properties.Name -contains 'StatusCode' -and $null -ne $response.StatusCode) {
        $statusCode = [int]$response.StatusCode
      }

      if ($response.PSObject.Properties.Name -contains 'Content' -and $null -ne $response.Content) {
        try {
          $rawBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        }
        catch {
          $rawBody = $null
        }
      }
    }

    if (-not $rawBody -and $_.ErrorDetails -and $_.ErrorDetails.Message) {
      $rawBody = $_.ErrorDetails.Message
    }

    Write-Host "API call failed: $Method $Path$(if ($statusCode) { " (HTTP $statusCode)" } else { '' })" -ForegroundColor Red
    if ($rawBody) {
      Write-Host "Response: $rawBody" -ForegroundColor Yellow
    }
    throw
  }
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Step "Login as admin"
$loginResponse = Invoke-Api -Method 'POST' -Path '/api/login' -Body @{
  phone    = $AdminPhone
  password = $AdminPassword
} -Session $session

if (-not $loginResponse.success) {
  throw "Login failed."
}
Write-Host "Logged in successfully." -ForegroundColor Green

Write-Step "Fetch customer by phone"
$customerResponse = Invoke-Api -Method 'GET' -Path "/api/customers?phone=$([uri]::EscapeDataString($CustomerPhone))" -Session $session
if (-not $customerResponse.success -or -not $customerResponse.customer) {
  throw "Customer not found for phone: $CustomerPhone"
}

$customer = $customerResponse.customer
$customerId = Get-Id $customer._id
$deliveryAddress = $null
if ($customer.addresses -and $customer.addresses.Count -gt 0) {
  $deliveryAddress = $customer.addresses[0]
}

Write-Host "Customer: $($customer.firstName) $($customer.lastName) ($customerId)" -ForegroundColor Green
if ($deliveryAddress) {
  Write-Host "Delivery address found: $(Get-Id $deliveryAddress.id)" -ForegroundColor Green
} else {
  Write-Host "No customer address found; delivery test may be skipped." -ForegroundColor Yellow
}

Write-Step "Fetch available product-flavor combinations"
$combosResponse = Invoke-Api -Method 'GET' -Path '/api/product-flavor?isAvailable=true' -Session $session
if (-not $combosResponse.success -or -not $combosResponse.combinations -or $combosResponse.combinations.Count -eq 0) {
  throw "No available product-flavor combinations found."
}

$combo = $combosResponse.combinations[0]
$product = $combo.productTypeId
$flavor = $combo.flavorId

$productTypeId = Get-Id $product
$flavorId = Get-Id $flavor
$productName = $product.name
$pricingMethod = $product.pricingMethod

if (-not $productTypeId -or -not $flavorId) {
  throw "Could not resolve productTypeId/flavorId from combination response."
}

Write-Host "Using combo: Product=$productName ($pricingMethod), Flavor=$($flavor.name)" -ForegroundColor Green

Write-Step "Resolve cake shape"
$productTypesResponse = Invoke-Api -Method 'GET' -Path '/api/product-type' -Session $session
if (-not $productTypesResponse.success -or -not $productTypesResponse.types) {
  throw "Failed to fetch product types"
}

$productType = $productTypesResponse.types | Where-Object { (Get-Id $_._id) -eq $productTypeId } | Select-Object -First 1
if (-not $productType) {
  throw "Selected product type not found in /api/product-type response"
}

$cakeShapeId = $null
if ($productType.shapeIds -and $productType.shapeIds.Count -gt 0) {
  $cakeShapeId = Get-Id $productType.shapeIds[0]
}

if (-not $cakeShapeId) {
  $shapesResponse = Invoke-Api -Method 'GET' -Path '/api/cake-shape' -Session $session
  if (-not $shapesResponse.success -or -not $shapesResponse.shapes -or $shapesResponse.shapes.Count -eq 0) {
    throw "No cake shape available"
  }
  $cakeShapeId = Get-Id $shapesResponse.shapes[0]._id
}

Write-Host "Using shape id: $cakeShapeId" -ForegroundColor Green

function New-OrderItem {
  $item = @{
    productTypeId        = $productTypeId
    flavorId             = $flavorId
    cakeShapeId          = $cakeShapeId
    specialInstructions  = 'Automated backend test order'
  }

  if ($pricingMethod -eq 'perkg') {
    $minWeight = 0
    if ($productType.PSObject.Properties.Name -contains 'minWeight' -and $null -ne $productType.minWeight) {
      $minWeight = [double]$productType.minWeight
    }

    $effectiveWeight = [Math]::Max([double]$Weight, $minWeight)
    if ($effectiveWeight -le 0) {
      $effectiveWeight = 1.0
    }

    $item.weight = $effectiveWeight
  } else {
    $minQuantity = 0
    if ($productType.PSObject.Properties.Name -contains 'minQuantity' -and $null -ne $productType.minQuantity) {
      $minQuantity = [int]$productType.minQuantity
    }

    $effectiveQuantity = [Math]::Max([int]$Quantity, $minQuantity)
    if ($effectiveQuantity -le 0) {
      $effectiveQuantity = 1
    }

    $item.quantity = $effectiveQuantity
  }

  return $item
}

Write-Step "Create pickup order"
$pickupPayload = @{
  customerId      = $customerId
  deliveryMethod  = 'pickup'
  orderDateTime   = (Get-Date).AddHours(3).ToString('o')
  items           = @(New-OrderItem)
  notes           = 'API automated pickup test'
  discount        = 0
  paidAmount      = 0
}

$pickupCreate = Invoke-Api -Method 'POST' -Path '/api/orders' -Body $pickupPayload -Session $session
if (-not $pickupCreate.success) {
  throw "Pickup order creation failed"
}
Write-Host "Pickup order created: $($pickupCreate.order.orderNumber)" -ForegroundColor Green

if (-not $SkipDeliveryTest -and $deliveryAddress) {
  Write-Step "Create delivery order"
  $deliveryPayload = @{
    customerId         = $customerId
    deliveryMethod     = 'delivery'
    deliveryAddressId  = (Get-Id $deliveryAddress.id)
    orderDateTime      = (Get-Date).AddDays(1).ToString('o')
    items              = @(New-OrderItem)
    notes              = 'API automated delivery test'
    discount           = 0
    paidAmount         = 0
  }

  $deliveryCreate = Invoke-Api -Method 'POST' -Path '/api/orders' -Body $deliveryPayload -Session $session
  if (-not $deliveryCreate.success) {
    throw "Delivery order creation failed"
  }
  Write-Host "Delivery order created: $($deliveryCreate.order.orderNumber)" -ForegroundColor Green
}
elseif (-not $SkipDeliveryTest) {
  Write-Host "Skipping delivery test because customer has no saved address." -ForegroundColor Yellow
}

Write-Step "Fetch customer order history"
$history = Invoke-Api -Method 'GET' -Path "/api/orders?customerId=$customerId&page=1&limit=10" -Session $session
if (-not $history.success) {
  throw "Failed to fetch order history"
}

Write-Host "Order history count (page): $($history.orders.Count) / total: $($history.total)" -ForegroundColor Green
$history.orders | Select-Object -First 5 | ForEach-Object {
  Write-Host " - $($_.orderNumber) | $($_.deliveryMethod) | total=$($_.totalAmount) | status=$($_.status)"
}

Write-Host "`nOrder backend test completed successfully." -ForegroundColor Green
