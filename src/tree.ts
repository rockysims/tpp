export class Edge {
	private static nextId = 0

	readonly id: number
	readonly a: Node
	readonly b: Node
	readonly cost: number

	constructor(a: Node, b: Node, c: number = 1) {
		this.id = Edge.nextId++
		this.a = a
		this.b = b
		this.cost = c
	}
}

export class Node {
	private static nextId = 0

	readonly id: number
    readonly edges: Edge[]
    readonly priceByItem: {[item: string]: number}

    constructor() {
		this.id = Node.nextId++
		this.edges = []
		this.priceByItem = {}
    }

    ensureEdgeTo(node: Node): void {
		const edgeAlreadyExists = this.edges.some(edge => {
			const newEdgeNodeSet = new MySet([this, node])
			const oldEdgeNodeSet = new MySet([edge.a, edge.b])
			return newEdgeNodeSet.eq(oldEdgeNodeSet)
		})
		if (edgeAlreadyExists) return

		const edge = new Edge(this, node)
        this.edges.push(edge)
        node.edges.push(edge)
    }

	setItemPrice(item: string, price: number): void {
		this.priceByItem[item] = price
	}
}

class MySet<T> extends Set<T> {
	eq(otherSet: Set<T>): boolean {
		return this.size === otherSet.size &&
			[...this].every(item => otherSet.has(item))
	}
}

export class Vector extends Array {
	constructor(...values: number[]) {
		super(values.length)
		this.push(...values)
	}

	add(other: Vector) {
		return this.map((val, i) => val + other[i])
	}
}

export type Path = {
	cost: number, // sum of travel + items for each step
	steps: {
		nodeId: number,
		items: string[],
	}[]
}
