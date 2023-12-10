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
	static sum(vectors: Vector[]): Vector {
		if (vectors.length <= 0) {
			throw new Error('Failed to addAll() 0 vectors.')
		}

		return vectors.reduce((acc, cur) => {
			return acc.add(cur)
		})
	}

	constructor(...values: number[]) {
		super()
		this.push(...values)
	}

	add(other: Vector): Vector {
		return new Vector(
			...this.map((val, i) => val + other[i])
		)
	}

	getDistance2D() {
		if (this.length !== 2) {
			throw new Error('Failed to getDistance2D() because this is not 2d. this.length: ' + this.length)
		}

		return Math.sqrt(this[0]**2 + this[1]**2)
	}
}

export type Path = {
	cost: number, // sum of travel + items for each step
	steps: {
		nodeId: number,
		items: string[],
	}[]
}
