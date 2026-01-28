import products from "./products.json";

export default function handler(req, res) {
  let result = products;

  const { price_min, price_max, vendor, tag } = req.query;

  if (price_min)
    result = result.filter(p => p.price >= +price_min);

  if (price_max)
    result = result.filter(p => p.price <= +price_max);

  if (vendor)
    result = result.filter(p => vendor.includes(p.vendor));

  if (tag)
    result = result.filter(p => p.tags.includes(tag));

  res.json({
    products: result.slice(0, 24),
    counts: {
      "vendor:Nike": 120,
      "vendor:Adidas": 90
    }
  });
}
