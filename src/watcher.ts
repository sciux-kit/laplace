export interface MutationCallbacks {
  mounted?: (node: Node) => void
  unmounted?: (node: Node) => void
}

const callbacks = new WeakMap<Node, MutationCallbacks>()

export function setMutationCallback(node: Node | Node[], cbs: MutationCallbacks | undefined): void {
  if (Array.isArray(node)) {
    node.forEach(n => setMutationCallback(n, cbs))
  }
  else {
    if (cbs) {
      callbacks.set(node, cbs)
    }
    else {
      callbacks.delete(node)
    }
  }
}

export function observe(node: Node | Node[], cbs: MutationCallbacks | undefined): void {
  const observer = new MutationObserver((m) => {
    m.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (callbacks.has(node)) {
            callbacks.get(node)!.mounted?.(node)
          }
        })

        mutation.removedNodes.forEach((node) => {
          if (callbacks.has(node)) {
            callbacks.get(node)!.unmounted?.(node)
          }
        })
      }
    })
  })

  if (Array.isArray(node)) {
    node.forEach(n => observe(n, cbs))
  }
  else {
    observer.observe(node, { childList: true, subtree: true })
  }
}
