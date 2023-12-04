import { FC, useEffect, useState } from 'react';
import './Home.css';

import util from '../../util'
import BuysForm from '../BuysForm/BuysForm';
import { Node, Path } from '../../tree';
import PathDisplay from '../PathDisplay/PathDisplay';

interface HomeProps {}

let didInit_hacky = false
const Home: FC<HomeProps> = () => {
	const [nodes, setNodes] = useState([] as Node[])

	useEffect(() => {
		if (didInit_hacky) return
		didInit_hacky = true;

		(async () => {
			const nodeBySystemId = await util.getNodeBySystemIdMap()
			const nodes = Object.values(nodeBySystemId)

			// ---

			const basePriceByItem: {
				[item: string]: number
			} = {
				copper: 2**3,
				silver: 2**4,
				gold: 2**5,
				diamond: 2**6,
			}
			for (let node of nodes) {
				for (let i = 0; i < 2; i++) {
					const randomItem = getRandom(Object.keys(basePriceByItem))
					const basePrice = basePriceByItem[randomItem]
					const randomizedPriceFactor = 1 + 0.25 * Math.random()
					const price = Math.floor(basePrice * randomizedPriceFactor)
					node.setItemPrice(randomItem, price)
				}
			}
			function getRandom(items: any[]) {
				const i = Math.floor(Math.random() * items.length)
				return items[i]
			}

			// ---

			setNodes(nodes)
		})()
	}, [])

	// TODO: update this to be a valid path
	const path: Path = {
		cost: 0,
		steps: [{
			nodeId: 1,
			items: []
		}, {
			nodeId: 2,
			items: []
		}, {
			nodeId: 5,
			items: []
		}]
	}

	
	return (
		<div className="Home">
			<BuysForm
				onChange={buys => console.log('onChange buys:', {buys})}
			></BuysForm>
			<PathDisplay
				nodes={nodes}
				path={path}
			></PathDisplay>
		</div>
	)
}

export default Home;
