import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageGridView } from "../views/image-grid-view";

// Fixed-slot layouts place children by nth-child position in CSS (see
// globals.css / ArticleBody.module.scss), so their slot count can't change —
// deleting a filled slot clears it back to an empty placeholder instead of
// removing it. "row-*" layouts are plain wrapping grids: any number of
// slots, add/remove freely.
export const LAYOUTS = {
  "row-2": { label: "دو ستونی", slots: 2, fixed: false },
  "row-3": { label: "سه ستونی", slots: 3, fixed: false },
  "feature-right": { label: "۱ عمودی راست + ۲ روی هم", slots: 3, fixed: true },
  "feature-left": { label: "۱ عمودی چپ + ۲ روی هم", slots: 3, fixed: true },
  "feature-top": { label: "۱ باریک بالا + ۲ پایین", slots: 3, fixed: true },
  "feature-bottom": { label: "۲ بالا + ۱ باریک پایین", slots: 3, fixed: true },
};

function emptySlot() {
  return { type: "image", attrs: { src: "", alt: "" } };
}

// Groups sibling `image` nodes (see ./image.js) into a CSS-grid gallery —
// delisa-customer/.../extensions/imageGrid.js mirrors this schema without
// the NodeView.
export const ImageGrid = Node.create({
  name: "imageGrid",
  group: "block",
  content: "image+",
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      layout: {
        default: "row-2",
        parseHTML: (el) => {
          const layout = el.getAttribute("data-layout");
          if (layout && LAYOUTS[layout]) return layout;
          // legacy content saved before named layouts existed
          return el.getAttribute("data-cols") === "3" ? "row-3" : "row-2";
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-grid"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const layout = LAYOUTS[node.attrs.layout] ? node.attrs.layout : "row-2";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "image-grid",
        "data-layout": layout,
        class: `bx-image-grid bx-image-grid--${layout}`,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGridView);
  },

  addCommands() {
    return {
      // Inserts an all-empty gallery for the given layout — every slot
      // starts as a placeholder with its own "+" upload button (see
      // ImageView), rather than requiring every image up front.
      insertImageGrid:
        (layout = "row-2") =>
        ({ chain }) => {
          const meta = LAYOUTS[layout] || LAYOUTS["row-2"];
          return chain()
            .insertContent({
              type: this.name,
              attrs: { layout },
              content: Array.from({ length: meta.slots }, emptySlot),
            })
            .run();
        },
    };
  },
});

export default ImageGrid;
