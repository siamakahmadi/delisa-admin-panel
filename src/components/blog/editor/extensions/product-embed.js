import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ProductEmbedView } from "../views/product-embed-view";

function formatToman(n) {
  const num = Number(n) || 0;
  return typeof Intl !== "undefined" && Intl.NumberFormat ? new Intl.NumberFormat("fa-IR").format(num) : String(num);
}

// Atom block node representing an embedded Delisa product card. Attrs mirror
// Post.productSnapshots shape so the backend can extract them straight out
// of the document JSON (see extractProductSnapshotsFromContent server-side).
export const ProductEmbed = Node.create({
  name: "productEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      tempId: { default: null },
      productId: { default: null },
      title: { default: "" },
      slug: { default: "" },
      image: { default: "" },
      price: { default: 0 },
      finalPrice: { default: 0 },
      available: { default: true },
      brandName: { default: null },
      loading: { default: false },
      error: { default: false },
      errorMessage: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="product-embed"]' }];
  },

  // static fallback markup — used for the sanitized contentHtml snapshot
  // (search index / RSS / non-JS fallback), not the primary render path
  renderHTML({ HTMLAttributes, node }) {
    const a = node.attrs;
    if (a.loading || a.error || (!a.productId && !a.slug)) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-type": "product-embed" })];
    }
    const priceHtml = Number(a.finalPrice) > 0 ? `${formatToman(a.finalPrice)} تومان` : Number(a.price) > 0 ? `${formatToman(a.price)} تومان` : "قیمت نامشخص";

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "product-embed",
        "data-product-id": a.productId || "",
        "data-slug": a.slug || "",
        "data-title": a.title || "",
        "data-image": a.image || "",
        "data-price": a.price || 0,
        "data-final-price": a.finalPrice || 0,
        "data-available": a.available !== false,
        class: "bx-product-embed",
      }),
      [
        "a",
        { href: a.slug ? `/product/${a.slug}` : "#", target: "_blank", rel: "noopener noreferrer" },
        a.image ? ["img", { src: a.image, alt: a.title || "محصول" }] : "",
        ["span", {}, a.title || "نام محصول"],
        ["span", {}, priceHtml],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProductEmbedView);
  },

  addCommands() {
    return {
      insertProductEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
