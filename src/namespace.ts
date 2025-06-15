import type { Component } from './component'

export interface NamespaceOptions {
  alias?: string[]
  extends?: string[]
  config?: Record<string, unknown>
}

export interface Namespace {
  name: string
  components: Map<string, Component<string, any, any>>
  options: NamespaceOptions
  parent?: Namespace
  children: Set<Namespace>
}

export class NamespaceManager {
  private namespaces: Map<string, Namespace> = new Map()
  private defaultNamespace: string = 'default'
  private namespaceAliases: Map<string, string> = new Map()

  constructor() {
    // 初始化默认命名空间
    this.createNamespace('default')
  }

  createNamespace(name: string, options: NamespaceOptions = {}): Namespace {
    if (this.namespaces.has(name)) {
      throw new Error(`Namespace '${name}' already exists`)
    }

    const namespace: Namespace = {
      name,
      components: new Map(),
      options,
      children: new Set(),
    }

    this.namespaces.set(name, namespace)

    // 处理继承关系
    if (options.extends) {
      options.extends.forEach((parentName) => {
        const parentNamespace = this.resolveNamespace(parentName)
        if (!parentNamespace) {
          throw new Error(`Parent namespace '${parentName}' not found`)
        }
        this.extendNamespace(namespace, parentNamespace)
      })
    }

    // 处理别名
    if (options.alias) {
      options.alias.forEach((alias) => {
        this.registerNamespaceAlias(alias, name)
      })
    }

    return namespace
  }

  private extendNamespace(child: Namespace, parent: Namespace): void {
    // 设置父子关系
    child.parent = parent
    parent.children.add(child)

    // 复制父命名空间的组件
    this.copyComponents(parent, child)
  }

  private copyComponents(source: Namespace, target: Namespace): void {
    source.components.forEach((component, name) => {
      if (!target.components.has(name)) {
        target.components.set(name, component)
      }
    })
  }

  registerComponent(namespace: string, name: string, component: Component<string, any, any>): void {
    const targetNamespace = this.resolveNamespace(namespace)
    if (!targetNamespace) {
      throw new Error(`Namespace '${namespace}' not found`)
    }

    // 注册组件到目标命名空间
    targetNamespace.components.set(name, component)

    // 更新所有子命名空间
    this.updateChildrenComponents(targetNamespace, name, component)
  }

  private updateChildrenComponents(namespace: Namespace, name: string, component: Component<string, any, any>): void {
    namespace.children.forEach((child) => {
      // 只有当子命名空间没有覆盖该组件时才更新
      if (!child.components.has(name)) {
        child.components.set(name, component)
      }
      this.updateChildrenComponents(child, name, component)
    })
  }

  registerComponents(namespace: string, components: Record<string, Component<string, any, any>>): void {
    const targetNamespace = this.resolveNamespace(namespace)
    if (!targetNamespace) {
      throw new Error(`Namespace '${namespace}' not found`)
    }

    Object.entries(components).forEach(([name, component]) => {
      this.registerComponent(namespace, name, component)
    })
  }

  getComponent(namespace: string, name: string): Component<string, any, any> | undefined {
    const targetNamespace = this.resolveNamespace(namespace)
    if (!targetNamespace) {
      return undefined
    }

    // 在当前命名空间中查找组件
    let component = targetNamespace.components.get(name)
    if (component) {
      return component
    }

    // 在父命名空间中查找组件
    let currentNamespace = targetNamespace.parent
    while (currentNamespace) {
      component = currentNamespace.components.get(name)
      if (component) {
        return component
      }
      currentNamespace = currentNamespace.parent
    }

    return undefined
  }

  setDefaultNamespace(namespace: string): void {
    if (!this.namespaces.has(namespace)) {
      throw new Error(`Namespace '${namespace}' not found`)
    }
    this.defaultNamespace = namespace
  }

  registerNamespaceAlias(alias: string, targetNamespace: string): void {
    if (!this.namespaces.has(targetNamespace)) {
      throw new Error(`Target namespace '${targetNamespace}' not found`)
    }
    this.namespaceAliases.set(alias, targetNamespace)
  }

  resolveNamespace(name: string): Namespace | undefined {
    // 1. 直接查找命名空间
    if (this.namespaces.has(name)) {
      return this.namespaces.get(name)
    }

    // 2. 查找别名
    const aliasedNamespace = this.namespaceAliases.get(name)
    if (aliasedNamespace) {
      return this.namespaces.get(aliasedNamespace)
    }

    // 3. 返回默认命名空间
    return this.namespaces.get(this.defaultNamespace)
  }

  parseComponentName(fullName: string): { namespace: string; name: string } {
    const parts = fullName.split(':')
    if (parts.length === 1) {
      return {
        namespace: this.defaultNamespace,
        name: parts[0],
      }
    }
    return {
      namespace: parts[0],
      name: parts[1],
    }
  }

  getNamespace(name: string): Namespace | undefined {
    return this.namespaces.get(name)
  }

  getAllNamespaces(): Namespace[] {
    return Array.from(this.namespaces.values())
  }

  // 获取命名空间的继承链
  getNamespaceInheritanceChain(namespace: string): Namespace[] {
    const targetNamespace = this.resolveNamespace(namespace)
    if (!targetNamespace) {
      return []
    }

    const chain: Namespace[] = [targetNamespace]
    let current = targetNamespace.parent
    while (current) {
      chain.push(current)
      current = current.parent
    }

    return chain
  }
}

// 创建全局命名空间管理器实例
export const namespaceManager = new NamespaceManager()