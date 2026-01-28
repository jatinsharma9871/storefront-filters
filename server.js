import http from "http";
import url from "url";
import products from "./products.json" assert { type: "json" };

const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  if (pathname === "/api/filter") {
    let result = [...products];

    const {
      vendor,
      tag,
      price_min,
      price_max,
      sort_by,
      page = 1,
      limit = 24
    } = query;

    if (vendor) {
      const vendors = Array.isArray(vendor) ? vendor : [vendor];
      result = result.filter(p => vendors.includes(p.vendor));
    }

    if (tag) {
      const tags = Array.isArray(tag) ? tag : [tag];
      result = result.filter(p =>
        tags.some(t => p.tags.includes(t))
      );
    }

    if (price_min)
      result = result.filter(p => p.price >= Number(price_min));

    if (price_max)
      result = result.filter(p => p.price <= Number(price_max));

    if (sort_by === "price-ascending")
      result.sort((a, b) => a.price - b.price);

    if (sort_by === "price-descending")
      result.sort((a, b) => b.price - a.price);

    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + Number(limit));

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });

    res.end(
      JSON.stringify({
        total: result.length,
        products: paginated
      })
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3000, () => {
  console.log("✅ Local filter API running:");
  console.log("👉 http://localhost:3000/api/filter");
});
