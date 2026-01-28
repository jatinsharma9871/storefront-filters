// import type { VercelRequest, VercelResponse } from '@vercel/node'

// const SHOP = process.env.SHOPIFY_DOMAIN!
// const TOKEN = process.env.STOREFRONT_TOKEN!

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   const {
//     collection,
//     designer,
//     color,
//     fabric,
//     minPrice,
//     maxPrice,
//     cursor
//   } = req.query

//   const filters: string[] = []

//   if (designer) filters.push(`variant.metafield:custom.designer:${designer}`)
//   if (color) filters.push(`variant.metafield:custom.color:${color}`)
//   if (fabric) filters.push(`variant.metafield:custom.fabric:${fabric}`)
//   if (minPrice) filters.push(`variants.price:>=${minPrice}`)
//   if (maxPrice) filters.push(`variants.price:<=${maxPrice}`)

//   const query = `
//   query Products($handle: String!, $cursor: String) {
//     collection(handle: $handle) {
//       products(first: 24, after: $cursor, query: "${filters.join(" AND ")}") {
//         pageInfo {
//           hasNextPage
//           endCursor
//         }
//         nodes {
//           id
//           title
//           handle
//           featuredImage { url }
//           priceRange {
//             minVariantPrice { amount currencyCode }
//           }
//         }
//       }
//     }
//   }`

//   const response = await fetch(
//     `https://${SHOP}/api/2026-01/graphql.json`,
//     {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Shopify-Storefront-Access-Token': TOKEN
//       },
//       body: JSON.stringify({
//         query,
//         variables: {
//           handle: collection,
//           cursor: cursor || null
//         }
//       })
//     }
//   )

//   const json = await response.json()
//   res.status(200).json(json.data.collection.products)
// }
