import { useEffect } from 'react';
import './App.css';

// utils

const select = document.querySelector.bind(document)

class MySet<T> extends Set<T> {
	eq(otherSet: Set<T>): boolean {
		return this.size === otherSet.size &&
			[...this].every(item => otherSet.has(item))
	}
}

function getRandom(items: any[]) {
	const i = Math.floor(Math.random() * items.length)
	return items[i]
}





class Edge {
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

class Node {
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





// create nodes and edges

const nodes: Node[] = []
const basePriceByItem: {
	[item: string]: number
} = {
	silver: 10,
	gold: 100,
	platinum: 1000,
	diamond: 10000,
}

for (let i = 0; i < 6; i++) {
	nodes.push(new Node())
}

let prevNode: Node|null = null
for (let node of nodes) {
	if (prevNode) prevNode.ensureEdgeTo(node)
	prevNode = node

	const randomNode = getRandom(nodes)
	if (node != randomNode) {
		node.ensureEdgeTo(randomNode)
	}

	const randomItem = getRandom(Object.keys(basePriceByItem))
	const basePrice = basePriceByItem[randomItem]
	const priceFactor = 1 + 0.1 * (Math.random() - 0.5)
	const price = Math.floor(basePrice * priceFactor)
	node.setItemPrice(randomItem, price)
}








function App() {
	useEffect(() => {
		const canvas = select('#canvas') as HTMLCanvasElement
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
		
		const radius = 150
		const centerX = canvas.width / 2
		const centerY = canvas.height / 2
		const angleIncrement = (2 * Math.PI) / nodes.length

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		const pointByNodeId: {
			[id: number]: {
				x: number,
				y: number,
			}
		} = {}

		// draw nodes
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]

			const angle = i * angleIncrement
			const x = centerX + radius * Math.cos(angle)
			const y = centerY + radius * Math.sin(angle)
			pointByNodeId[node.id] = {x, y}

			// draw
			ctx.beginPath()
			ctx.arc(x, y, 5, 0, 2 * Math.PI)
			ctx.fillStyle = 'blue'
			ctx.fill()
			ctx.closePath()
		}

		// draw edges
		ctx.beginPath()
		ctx.strokeStyle = 'orange'

		const seenByEdgeId: {
			[id: number]: boolean
		} = {}
		for (let node of nodes) {
			for (let edge of node.edges) {
				if (seenByEdgeId[edge.id]) continue
				seenByEdgeId[edge.id] = true

				const a = pointByNodeId[edge.a.id]
				const b = pointByNodeId[edge.b.id]

				// draw
				ctx.moveTo(a.x, a.y)
				ctx.lineTo(b.x, b.y)
			}
		}

		ctx.stroke()
		ctx.closePath()
	}, []);

	const canvasStyle = {
		border: "1px solid #d3d3d3"
	}
	return (
		<div className="App">
			<header className="App-header">
				<canvas
					id="canvas"
					width="800"
					height="500"
					style={canvasStyle}
				/>
			</header>
		</div>
	);
}

export default App;
