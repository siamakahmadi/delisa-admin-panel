import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";

// `handlers` is a mutable ref object ({ current: { getItems, onStart, onUpdate, onKeyDown, onExit } })
// so callers can swap the React-side callbacks on every render without
// having to recreate the whole editor/extension instance.
export function SlashCommand(handlers) {
  return Extension.create({
    name: "slashCommand",

    addOptions() {
      return {
        suggestion: {
          char: "/",
          startOfLine: false,
          allowSpaces: false,
          command: ({ editor, range, props }) => {
            props.run({ editor, range });
          },
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }) => handlers.current.getItems(query),
          render: () => ({
            onStart: (props) => handlers.current.onStart(props),
            onUpdate: (props) => handlers.current.onUpdate(props),
            onKeyDown: (props) => handlers.current.onKeyDown(props),
            onExit: (props) => handlers.current.onExit(props),
          }),
        }),
      ];
    },
  });
}
