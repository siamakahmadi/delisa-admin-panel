// Pure helpers for the nested drag-and-drop tree editor. Storage shape is a
// FLAT array of { _id, parentId, order, ...fields }; nesting is derived from
// parentId, never stored as a separate depth field.
export const INDENTATION_WIDTH = 24;
export const MAX_UI_DEPTH = 8;

export function idOf(v) {
  return v === null || v === undefined ? null : String(v);
}

export function buildTree(flatItems = []) {
  const nodes = new Map();
  flatItems.forEach((item) => nodes.set(idOf(item._id), { ...item, children: [] }));

  const roots = [];
  flatItems.forEach((item) => {
    const node = nodes.get(idOf(item._id));
    const parentId = idOf(item.parentId);
    const parent = parentId ? nodes.get(parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  function sortRec(arr) {
    arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    arr.forEach((n) => sortRec(n.children));
  }
  sortRec(roots);
  return roots;
}

export function flattenTree(tree, parentId = null, depth = 0) {
  return tree.reduce((acc, node, index) => {
    const { children, ...rest } = node;
    return [
      ...acc,
      { ...rest, parentId, depth, siblingIndex: index },
      ...flattenTree(children || [], idOf(node._id), depth + 1),
    ];
  }, []);
}

export function removeChildrenOf(flatItems, collapsedIds) {
  const collapsed = collapsedIds instanceof Set ? collapsedIds : new Set(collapsedIds);
  const out = [];
  let hideBelowDepth = null;
  for (const item of flatItems) {
    if (hideBelowDepth !== null) {
      if (item.depth > hideBelowDepth) continue;
      hideBelowDepth = null;
    }
    out.push(item);
    if (collapsed.has(idOf(item._id))) hideBelowDepth = item.depth;
  }
  return out;
}

export function arrayMove(arr, from, to) {
  const copy = arr.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

// Computes a live drop preview {depth, parentId} while dragging, based on the
// currently *visible* (collapse-filtered) flattened rows.
export function getProjection(visibleItems, activeId, overId, dragOffsetX, { indentationWidth = INDENTATION_WIDTH, maxDepth = MAX_UI_DEPTH, rtl = false } = {}) {
  const activeIndex = visibleItems.findIndex((i) => idOf(i._id) === activeId);
  const overIndex = visibleItems.findIndex((i) => idOf(i._id) === overId);
  if (activeIndex < 0 || overIndex < 0) return null;

  const reordered = arrayMove(visibleItems, activeIndex, overIndex);
  const previousItem = reordered[overIndex - 1];
  const nextItem = reordered[overIndex + 1];

  const signedOffset = rtl ? -dragOffsetX : dragOffsetX;
  const dragDepthDelta = Math.round(signedOffset / indentationWidth);
  const activeItem = visibleItems[activeIndex];

  let depth = (activeItem.depth || 0) + dragDepthDelta;
  const maxAllowed = previousItem ? Math.min(previousItem.depth + 1, maxDepth) : 0;
  const minAllowed = nextItem ? nextItem.depth : 0;
  if (depth > maxAllowed) depth = maxAllowed;
  if (depth < minAllowed) depth = minAllowed;
  if (depth < 0) depth = 0;

  function resolveParentId() {
    if (depth === 0) return null;
    if (!previousItem) return null;
    if (depth === previousItem.depth) return previousItem.parentId;
    if (depth > previousItem.depth) return previousItem._id;
    const prevIndex = reordered.indexOf(previousItem);
    for (let i = prevIndex; i >= 0; i -= 1) {
      if (reordered[i].depth === depth - 1) return reordered[i]._id;
      if (reordered[i].depth < depth - 1) break;
    }
    return null;
  }

  return { depth, parentId: idOf(resolveParentId()) };
}

// Walks a nested tree back into the flat storage shape, assigning a fresh
// sequential `order` per sibling group.
export function treeToStorageItems(tree) {
  const out = [];
  function walk(nodes, parentId) {
    nodes.forEach((node, index) => {
      const { children, depth, siblingIndex, ...rest } = node;
      out.push({ ...rest, parentId, order: index });
      if (children && children.length) walk(children, idOf(node._id));
    });
  }
  walk(tree, null);
  return out;
}

export function getMaxDepth(flatItems) {
  return flatItems.reduce((max, i) => Math.max(max, i.depth || 0), 0);
}

// Counts all descendants (children, grandchildren, ...) of `id` within a
// flattened `parentId`-keyed array — used to warn before a cascading delete.
export function countDescendants(flatItems, id) {
  const targetId = idOf(id);
  let count = 0;
  let frontier = [targetId];
  while (frontier.length) {
    const children = flatItems.filter((i) => frontier.includes(idOf(i.parentId))).map((i) => idOf(i._id));
    count += children.length;
    frontier = children;
  }
  return count;
}
