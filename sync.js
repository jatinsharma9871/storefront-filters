import fs from "fs";

const SHOP = "the-sverve.myshopify.com";
const TOKEN = "acda1d5a1d41bc5b8d927f4efd56d9f3";
const API_VERSION = "2025-04";

let products = [];
let cursor = null;
let hasNextPage = true;

async function fetchProducts() {
  while (hasNextPage) {
    const query = `
      query ($cursor: String) {
        products(first: 250, after: $cursor) {
          edges {
            node {
              handle
              title
              vendor
              tags
              availableForSale
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
    
    if (!json.data) {
      console.error("❌ API Error:", json.errors || "Unknown error");
      console.log("Please update SHOP and TOKEN in sync.js with valid Shopify credentials");
      process.exit(1);
    }
    
    const data = json.data.products;

    data.edges.forEach(edge => {
      products.push({
        handle: edge.node.handle,
        title: edge.node.title,
        vendor: edge.node.vendor,
        tags: edge.node.tags,
        price: Number(edge.node.priceRange.minVariantPrice.amount),
        image: edge.node.images.edges[0]?.node.url || "",
        available: edge.node.availableForSale
      });
      cursor = edge.cursor;
    });

    hasNextPage = data.pageInfo.hasNextPage;
    console.log(`Fetched ${products.length} products...`);
  }

  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
  console.log("✅ products.json created with REAL data");
}

fetchProducts();
