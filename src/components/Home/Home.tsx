import React, { FC, useEffect, useState } from 'react';
import './Home.css';

import util from '../../util'

interface HomeProps {}

const EXAMPLE_INPUT = `High power
4x Modal Electron Particle Accelerator I
Medium power
1x 50MN Quad LiF Restrained Microwarpdrive
1x Warp Scrambler II
1x X5 Enduring Stasis Webifier
1x Medium F-RX Compact Capacitor Booster
Low power
1x Damage Control II
1x Medium I-a Enduring Armor Repairer
1x Compact Multispectrum Energized Membrane
1x 400mm Crystalline Carbonide Restrained Plates
1x Medium Ancillary Armor Repairer
Rig Slot
1x Medium Nanobot Accelerator I
1x Medium Auxiliary Nano Pump I
1x Medium Ancillary Current Router I
Charges
4,000x Caldari Navy Antimatter Charge M
120x Nanite Repair Paste
10x Navy Cap Booster 800
Drones
6x Hobgoblin II
2x 'Integrated' Ogre
5x Acolyte II
2x 'Integrated' Hammerhead`

const Home: FC<HomeProps> = () => {
	const [lines, setLines] = useState([] as string[])
	const [typeIdByName, setTypeIdByName] = useState({} as {
		[name: string]: number
	})

	const onChangeBuysTextarea = (e: any) => {
		const str = e.target.value
		const lines: string[] = str.split('\n')
		setLines(lines)
	}

	useEffect(() => {
		(async () => {
			const typeIdByName = await util.getTypeIdByNameMap()
			setTypeIdByName(typeIdByName)
		})()
	}, [])

	useEffect(() => {
		const buys = lines
			.map(line => {
				const matches = line.match(/([\d,]+)x (.+)/)
				if (!matches) return null

				const qty = +matches[1].replace(',', '')
				const name = matches[2]
				const typeId = typeIdByName[name]
				return {
					qty,
					name,
					typeId
				}
			})
			.filter(buy => !!buy)
		console.log({
			buys
		})
	}, [lines, typeIdByName])

	return (
		<div className="Home">
			<textarea
				id="buysTextarea"
				onChange={onChangeBuysTextarea}
				value={EXAMPLE_INPUT}
			></textarea>
		</div>
	)
}

export default Home;
