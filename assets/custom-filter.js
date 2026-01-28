
window.MinimogExternalFilter = {
  apply: async function () {
    const params = new URLSearchParams(this.getFilters()).toString();
    const res = await fetch("https://YOUR-VERCEL-URL/api/filter?" + params);
    const data = await res.json();
    this.renderProducts(data.products);
  },

  getFilters: function () {
    const filters = {};
    document.querySelectorAll(".m-facet__item input:checked")
      .forEach(i => {
        const k = i.name.replace("filter.", "");
        filters[k] ??= [];
        filters[k].push(i.value);
      });
    return filters;
  },

  renderProducts: function (products) {
    const grid = document.querySelector(".m-product-grid");
    grid.innerHTML = products.map(p => `
      <div class="m-product-grid__item">
        <a href="/products/${p.handle}">
          <img src="${p.image}">
          <h3>${p.title}</h3>
          <span>₹${p.price}</span>
        </a>
      </div>
    `).join("");
  }
};
