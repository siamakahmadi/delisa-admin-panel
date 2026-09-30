import TiptapImage from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageView } from "../views/image-view";

// Wraps every image in a <figure> so it can carry a size, an alignment and
// an optional caption — plain attrs on the Tiptap node, not editable
// ProseMirror content, so a plain <input> can drive the caption instead of
// a nested editor. delisa-customer/.../extensions/image.js mirrors the attrs
// + renderHTML exactly (minus the NodeView) so SSR output matches.
export const IMAGE_SIZES = ["small", "medium", "large"];
export const IMAGE_ALIGNS = ["right", "center", "left"];
export const IMAGE_FITS = ["cover", "contain"];

export const ArticleImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "large",
        parseHTML: (el) => el.closest("figure")?.getAttribute("data-size") || "large",
        renderHTML: () => ({}),
      },
      align: {
        default: "center",
        parseHTML: (el) => el.closest("figure")?.getAttribute("data-align") || "center",
        renderHTML: () => ({}),
      },
      caption: {
        default: "",
        parseHTML: (el) => el.closest("figure")?.querySelector("figcaption")?.textContent || "",
        renderHTML: () => ({}),
      },
      fit: {
        default: "cover",
        parseHTML: (el) => el.closest("figure")?.getAttribute("data-fit") || "cover",
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    // Unfilled gallery slots (see image-grid.js) are real nodes so the
    // editor can show a "+" placeholder for them — never ship a broken
    // `<img src="">` to any consumer of this static HTML (admin's own
    // autosave snapshot; delisa-customer additionally drops the node
    // entirely before it gets here, see utils/blog/renderArticle.js).
    if (!HTMLAttributes.src) {
      return ["figure", { class: "bx-figure bx-figure--empty", "data-empty": "true", style: "display:none" }];
    }

    const size = IMAGE_SIZES.includes(node.attrs.size) ? node.attrs.size : "large";
    const align = IMAGE_ALIGNS.includes(node.attrs.align) ? node.attrs.align : "center";
    const fit = IMAGE_FITS.includes(node.attrs.fit) ? node.attrs.fit : "cover";
    const caption = typeof node.attrs.caption === "string" ? node.attrs.caption.trim() : "";

    const figureChildren = [
      ["div", { class: "bx-figure__frame" }, ["img", { ...HTMLAttributes, loading: "lazy" }]],
    ];
    if (caption) {
      figureChildren.push(["figcaption", { class: "bx-figure__caption" }, caption]);
    }

    return [
      "figure",
      {
        class: `bx-figure bx-figure--${size} bx-figure--align-${align} bx-figure--fit-${fit}`,
        "data-size": size,
        "data-align": align,
        "data-fit": fit,
      },
      ...figureChildren,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

export default ArticleImage;
