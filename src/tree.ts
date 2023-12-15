import PriorityQueue from "ts-priority-queue"

export type Path = {
	cost: number, // sum of travel + items for each step
	steps: {
		nodeId: number,
		items: string[],
	}[]
}

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

export interface Vector extends Array<number> {}

export const sumVectors = (vectors: Vector[]): Vector => {
	if (vectors.length <= 0) {
		throw new Error('Failed to sum() 0 vectors.')
	}

	return vectors.reduce((acc, cur) => {
		return addVectors(acc, cur)
	})
}

const addVectors = (vector1: Vector, vector2: Vector): Vector => {
	return vector1.map((v1, i) => v1+ vector2[i])
}

export const getDistance2D = (vector: Vector) => {
	if (vector.length !== 2) {
		throw new Error('Failed to getDistance2D() because this is not 2d. this.length: ' + vector.length)
	}

	return Math.sqrt(vector[0]**2 + vector[1]**2)
}

// export class Vector_orig extends Array {
// 	static sum(vectors: Vector[]): Vector {
// 		if (vectors.length <= 0) {
// 			throw new Error('Failed to sum() 0 vectors.')
// 		}

// 		return vectors.reduce((acc, cur) => {
// 			return addVectors(acc, cur)
// 		})
// 	}

// 	constructor(...values: number[]) {
// 		super()
// 		this.push(...values)
// 	}

// 	add(other: Vector): Vector {
// 		return this.map((val, i) => val + other[i])
// 	}

// 	getDistance2D() {
// 		if (this.length !== 2) {
// 			throw new Error('Failed to getDistance2D() because this is not 2d. this.length: ' + this.length)
// 		}

// 		return Math.sqrt(this[0]**2 + this[1]**2)
// 	}
// }

interface NodeAndCost {
	node: Node,
	cost: number
}

export interface CostByNodeId {
	[id: number]: number
}

export function getTravelCostByDestNodeIdMap(root: Node): CostByNodeId {
	const vistedByNodeId: {
		[id: number]: boolean,
	} = {}
	const travelCostByDestNodeId: CostByNodeId = {}

	const q = new PriorityQueue<NodeAndCost>({
		comparator: (a, b) => {
			return b.cost - a.cost
		}
	})

	q.queue({
		node: root,
		cost: 0
	})

	let loopLimit = 10000
	while (q.length > 0) {
		if (loopLimit-- < 0) throw 'loopLimit exhausted'

		const {
			node: n,
			cost: c
		} = q.dequeue()

		for (const edge of n.edges) {
			const otherNode = edge.a.id === n.id ? edge.b : edge.a

			const oldTravelCost = travelCostByDestNodeId[otherNode.id] || Number.POSITIVE_INFINITY
			const newTravelCost = c + edge.cost

			if (newTravelCost < oldTravelCost) {
				travelCostByDestNodeId[otherNode.id] = newTravelCost
				q.queue({
					node: otherNode,
					cost: newTravelCost
				})
			}
		}
	}

	return travelCostByDestNodeId
}