import fs from "fs";

const SHOP = "the-sverve.myshopify.com";
const TOKEN = "acda1d5a1d41bc5b8d927f4efd56d9f3";
const API_VERSION = "2025-04";

let products = [];
let allProductHandles = new Set(); // Track handles to avoid duplicates

async function fetchProductsBatch(createdAfter, createdBefore) {
  let cursor = null;
  let hasNextPage = true;
  let batchCount = 0;

  const dateFilter = createdAfter && createdBefore 
    ? `created_at:>='${createdAfter}' AND created_at:<'${createdBefore}'`
    : createdAfter 
    ? `created_at:>='${createdAfter}'`
    : createdBefore
    ? `created_at:<'${createdBefore}'`
    : null;

  console.log(`📦 Fetching products${dateFilter ? ` where ${dateFilter}` : ''}...`);

  while (hasNextPage) {
    const query = `
      query ($cursor: String) {
        products(first: 250, after: $cursor${dateFilter ? `, query: "${dateFilter}"` : ''}) {
          edges {
            node {
              handle
              title
              vendor
              tags
              availableForSale
              createdAt
              priceRange {
                minVariantPrice {
                  amount
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const res = await fetch(
      `https://${SHOP}/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": TOKEN
        },
        body: JSON.stringify({
          query,
          variables: { cursor }
        })
      }
    );

    const json = await res.json();
    
    if (json.errors && Array.isArray(json.errors)) {
      const hasLimitError = json.errors.some(e => 
        e.message && e.message.includes('Platform limit for pagination')
      );
      
      if (hasLimitError) {
        console.log("⚠️ Hit 25K pagination limit in this batch");
        return { hitLimit: true, lastCursor: cursor };
      } else {
        console.error("❌ API Error:", json.errors);
        process.exit(1);
      }
    } else if (json.errors) {
      console.error("❌ API Error:", json.errors);
      process.exit(1);
    }
    
    if (!json.data) {
      return { hitLimit: false, lastCursor: null };
    }
    
    const data = json.data.products;

    if (data.edges.length === 0) {
      return { hitLimit: false, lastCursor: null };
    }

    let lastCreatedAt = null;
    data.edges.forEach(edge => {
      const handle = edge.node.handle;
      
      // Avoid duplicates
      if (!allProductHandles.has(handle)) {
        allProductHandles.add(handle);
        products.push({
          handle,
          title: edge.node.title,
          vendor: edge.node.vendor,
          tags: edge.node.tags,
          price: Number(edge.node.priceRange.minVariantPrice.amount),
          image: edge.node.images.edges[0]?.node.url || "",
          available: edge.node.availableForSale,
          createdAt: edge.node.createdAt
        });
      }
      cursor = edge.cursor;
      lastCreatedAt = edge.node.createdAt;
    });

    hasNextPage = data.pageInfo.hasNextPage;
    batchCount++;
    console.log(`  ✓ Fetched ${products.length} total products (batch: ${data.edges.length})`);
  }

  return { hitLimit: false, lastCursor: cursor };
}

async function fetchProducts() {
  console.log("🚀 Starting product sync...\n");
  
  // First, try to fetch all products in one go
  let result = await fetchProductsBatch();
  
  // If we hit the limit, do date-based batching
  if (result.hitLimit) {
    console.log("\n📅 Hit limit, switching to date-based batching...\n");
    
    // Fetch older products using created date filters
    const now = new Date();
    let batchDate = new Date(now);
    
    for (let i = 0; i < 10; i++) { // Max 10 batches
      const batchEnd = new Date(batchDate);
      batchDate.setMonth(batchDate.getMonth() - 1); // Go back 1 month
      const batchStart = new Date(batchDate);
      
      const startStr = batchStart.toISOString().split('T')[0];
      const endStr = batchEnd.toISOString().split('T')[0];
      
      result = await fetchProductsBatch(startStr, endStr);
      
      if (products.length > 25000) {
        console.log(`\n✅ Fetched enough products (${products.length}), stopping batches`);
        break;
      }
      
      if (!result.hitLimit) {
        console.log(`\n✅ Completed batching - total products: ${products.length}`);
        break;
      }
    }
  }

  // Remove duplicates and sort
  const uniqueProducts = Array.from(allProductHandles).map(handle =>
    products.find(p => p.handle === handle)
  ).filter(Boolean);

  fs.writeFileSync("products.json", JSON.stringify(uniqueProducts, null, 2));
  console.log(`\n✅ products.json created with ${uniqueProducts.length} products`);
}

fetchProducts();
