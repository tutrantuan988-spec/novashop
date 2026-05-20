#!/bin/bash
PROJECT="/mnt/c/Users/TUAN TU/OneDrive/Desktop/Website"
NODE="/mnt/c/Program Files/nodejs/node.exe"

cd "$PROJECT"

echo "=== STEP 1: Check pet files deleted ==="
for f in src/pages/DogFoodPage.jsx src/pages/CatFoodPage.jsx src/pages/PetAccessoriesPage.jsx src/data/products.js src/data/categoryProducts.js; do
  if [ -f "$f" ]; then
    echo "FAIL: $f still exists"
  else
    echo "PASS: $f deleted"
  fi
done

echo ""
echo "=== STEP 2: Start server ==="
rm -f server-verify.log
"$NODE" server/index.js > server-verify.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 8

echo ""
echo "=== STEP 3a: GET /api/categories ==="
curl -s --max-time 5 http://localhost:3001/api/categories 2>&1 || echo "CURL FAILED"

echo ""
echo "=== STEP 3b: GET /api/categories/:id/schema (Thời trang) ==="
curl -s --max-time 5 http://localhost:3001/api/categories/ff0d5643-2246-441e-a0de-682159e813ff/schema 2>&1 || echo "CURL FAILED"

echo ""
echo "=== STEP 3c: GET /api/categories/:id/schema (Điện tử) ==="
curl -s --max-time 5 http://localhost:3001/api/categories/7a3702d2-73a5-46cc-9e6e-5a9907ac9bd9/schema 2>&1 || echo "CURL FAILED"

echo ""
echo "=== STEP 3d: GET /api/categories/:id/schema (Thú cưng) ==="
curl -s --max-time 5 http://localhost:3001/api/categories/8d2c556e-8b36-4df4-beb2-d1b77c73a69e/schema 2>&1 || echo "CURL FAILED"

echo ""
echo "=== STEP 4: File existence checks ==="
for f in src/components/DynamicProductForm.jsx src/pages/AddProductPage.jsx; do
  if [ -f "$f" ]; then
    echo "PASS: $f exists"
  else
    echo "FAIL: $f missing"
  fi
done

echo ""
echo "=== Server log tail ==="
tail -5 server-verify.log 2>&1

echo ""
echo "=== Cleaning up ==="
kill $SERVER_PID 2>/dev/null
echo "DONE"
