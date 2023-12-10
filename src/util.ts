import { Node, Edge } from "./tree";

const urlPrefix = 'http://localhost:3001'

const JITA_REGION_ID = 10000002; //The Forge

const util = (() => {
	const saveJson = async (path: string, data: any) => {
		await fetch(`${urlPrefix}/file/${path}`, {
			method: 'POST',
			headers: {
			  'Accept': 'application/json',
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
	}
	
	const loadJson = async (path: string, hoursStaleLimit = -1) => {
		const url = `${urlPrefix}/file/${path}?hoursStaleLimit=${hoursStaleLimit}`
		return await fetch(url, {
			method: 'GET'
		}).then(
			res => res.json(),
			() => {}
		)
	}
	
	const fetchWithRetries = async (url: string) => {
		for (let retries = 0; retries < 5; retries++) {
			const fetchedData = await fetch(url, {
				method: 'get'
			}).then(async res => {
				const data = await res.json()
				if (data.error) {
					console.log('GET failed. data.error: ', data.error)
					return null
				}
				return data
			}, async error => {
				console.log('GET failed. error.response.status: ', error.response.status)
				return null
			})
			
			if (fetchedData !== null) {
				return fetchedData
			} else {
				console.log(`retrying ${url}`)
			}
		}
	
		console.error('fetchWithRetries() exhausted retry limit')
		return null
	}
	
	const getOrFetch = async (url: string, hoursStaleLimit = -1) => {
		const path = `${url.replace(/[^a-zA-Z0-9]+/g, '')}.json`
		try {
			const cachedData = await loadJson(path, hoursStaleLimit)
			if (cachedData && cachedData.error) throw "cached data had error: " + cachedData.error
			if (cachedData || cachedData === null) return cachedData;	
		} catch (reason) {
			console.log('getOrFetch caught reason: ', reason)
		}
	
		return fetchWithRetries(url).then(async data => {
			await saveJson(path, data)
			return data
		}, async error => {
			console.log('GET failed because: ', error.response.status)
			await saveJson(path, null)
			return null
		})
	}
	
	//---
	
	const getRegionIds = async (): Promise<number[]> => {
		const url = `https://esi.evetech.net/latest/universe/regions/?datasource=tranquility`
		const promise = getOrFetch(url, 7*24)
		return promise.then(result => {
			console.log('getRegionIds', {result})
			return result
		})
	}
	
	const getConstellationIdsInRegion = async (regionId: number): Promise<number[]> => {
		const url = `https://esi.evetech.net/latest/universe/regions/${regionId}/?datasource=tranquility`
		const promise = getOrFetch(url, 7*24)
		return promise.then(result => {
			// console.log('getConstellationIdsInRegion', {result})
			return result.constellations
		})
	}
	
	const getSystemIdsInConstellation = async (constellationId: number): Promise<number[]> => {
		const url = `https://esi.evetech.net/latest/universe/constellations/${constellationId}/?datasource=tranquility`
		const promise = getOrFetch(url, 7*24)
		return promise.then(result => {
			// console.log('getSystemIdsInConstellation', {result})
			return result.systems
		})
	}
	
	const getStargateIdsInSystem = async (systemId: number): Promise<number[]> => {
		const url = `https://esi.evetech.net/latest/universe/systems/${systemId}/?datasource=tranquility`
		const promise = getOrFetch(url, 7*24)
		return promise.then(result => {
			// console.log('getStargateIdsInSystem', {result})
			return result.stargates
		})
	}
	
	const getDestinationSystemIdOfStargateId = async (stargateId: number): Promise<number> => {
		const url = `https://esi.evetech.net/latest/universe/stargates/${stargateId}/?datasource=tranquility`
		const promise = getOrFetch(url, 7*24)
		return promise.then(result => {
			// console.log('getDestinationSystemIdOfStargateId', {result})
			return result.destination.system_id
		})
	}
	
	// const getAllSystems = async () => {
	// 	const url = `https://esi.evetech.net/latest/universe/systems/?datasource=tranquility`
	// 	const promise = getOrFetch(url, 8)
	// 	return promise.then(result => {
	// 		console.log('getAllSystems', {result})
	// 		return result//.slice(0, 1000)
	// 	})
	// }
	
	const getTypeIds = async (regionId: number) => {
		const promises = []
		for (let p = 1; p <= 16; p++) {
			const url = `https://esi.evetech.net/latest/markets/${regionId}/types/?datasource=tranquility&page=${p}`
			promises.push(getOrFetch(url, 7*24))
		}
		return Promise.all(promises).then(results => {
			return results.flat()//.slice(0, 1000)
		})
	}
	
	const getDays = async (regionId: number, typeId: number, buyOrSell: 'buy'|'sell') => {
		if (!['buy', 'sell'].includes(buyOrSell)) throw `getDays() called with invalid buyOrSell: ${buyOrSell}`

		const url = `http://localhost:4000/https://api.adam4eve.eu/v1/market_price_history?typeID=${typeId}&regionID=${regionId}`
		const days = await getOrFetch(url, 24)
		if (!Array.isArray(days)) return []

		return days.map(day => {
			if (buyOrSell === 'buy') {
				return {
					date: day.price_date,
					lowest: +day.buy_price_low,
					average: +day.buy_price_avg,
					highest: +day.buy_price_high,
					volume: +day.buy_volume_high - +day.buy_volume_low
				}
			} else {
				return {
					date: day.price_date,
					lowest: +day.sell_price_low,
					average: +day.sell_price_avg,
					highest: +day.sell_price_high,
					volume: +day.sell_volume_high - +day.sell_volume_low
				}
			}
		})

		// const url = `https://esi.evetech.net/latest/markets/${regionId}/history/?datasource=tranquility&type_id=${typeId}`
		// const days = await getOrFetch(url, 24)
		// return Array.isArray(days)
		// 	? days
		// 	: []
	}
	
	const getOrders = async (regionId: number, typeId: number, hoursStaleLimit = 1) => {
		const url = `https://esi.evetech.net/latest/markets/${regionId}/orders/?datasource=tranquility&type_id=${typeId}`
		const orders = await getOrFetch(url, hoursStaleLimit)
		return Array.isArray(orders)
			? orders
			: []
	}
	
	//---
	
	const roundNonZero = (num: number, nonZeroDigits = 2) => {
		const numStr = '' + num
		if (numStr.indexOf('e') !== -1) return numStr
	
		const index = numStr.search(/[^\.0]/)
		if (index === -1) return numStr
	
		const dotIndex = numStr.indexOf('.')
		const end = Math.max(
			index + nonZeroDigits,
			dotIndex === -1
				? numStr.length
				: dotIndex + (
					num < Math.pow(10, nonZeroDigits)
						? nonZeroDigits
						: 0
				)
		)
		return numStr.substring(0, end)
	}
	
	const roundMils = (amount: number, nonZeroDigits = 2) => {
		return roundNonZero(amount / 1000000, nonZeroDigits)
	}
	
	const avg = (list: number[]) => {
		return list.reduce((acc, cur) => acc + cur, 0) / list.length
	}
	
	const typeNameById: {
		[id: number]: string
	} = {}
	const getTypeName = async (typeId: number) => {
		if (!typeNameById[typeId]) {
			const url = `https://esi.evetech.net/latest/universe/types/${typeId}/?datasource=tranquility&language=en`
			const type = await getOrFetch(url, 24*7)
			typeNameById[typeId] = type.name
		}
	
		return typeNameById[typeId]
	}
	
	const typeM3ById: {
		[id: number]: number
	} = {}
	const getTypeM3 = async (typeId: number) => {
		if (!typeM3ById[typeId]) {
			const url = `https://esi.evetech.net/latest/universe/types/${typeId}/?datasource=tranquility&language=en`
			const type = await getOrFetch(url, 24*7)
			typeM3ById[typeId] = type.packaged_volume
		}
	
		return typeM3ById[typeId]
	}
	
	const typeIdByName: {
		[id: string]: number
	} = {}
	const getTypeIdByNameMap = async () => {
		const allTypeIds = await getTypeIds(JITA_REGION_ID) // TODO: search other regions too
		
		const chunkSize = 1000
		for (let i = 0; i*chunkSize < allTypeIds.length; i++) {
			const typeIdByNameChunk: {
				[id: string]: number
			} = {}
			const typeIdsInChunk = allTypeIds.slice(i*chunkSize, (i+1)*chunkSize)
			
			const firstTypeIdInChunk = typeIdsInChunk[0]
			const lastTypeIdInChunk = typeIdsInChunk.slice(-1)[0]
			const chunkKey = `typeIdByName_${i}_${firstTypeIdInChunk}_to_${lastTypeIdInChunk}`
			try {
				const loadedTypeIdByNameChunk = await loadJson(chunkKey)
				if (loadedTypeIdByNameChunk) {
					// console.log(`loadedTypeIdByNameChunk (${chunkKey})`, loadedTypeIdByNameChunk)
					Object.assign(
						typeIdByName,
						loadedTypeIdByNameChunk
					)
				}
			} catch (reason) {
				console.warn('getTypeIdByNameMap() caught reason: ', reason)

				const promises = []
				for (let typeId of typeIdsInChunk) {
					promises.push(getTypeName(typeId).then(name => {
						typeIdByNameChunk[name] = typeId
					}))
				}
				await Promise.all(promises)
				Object.assign(
					typeIdByName,
					typeIdByNameChunk
				)
				saveJson(chunkKey, typeIdByNameChunk)
				console.log(`i: ${i}, promises: ${promises.length}`)
			}
			// console.log(`i: ${i} done`)
		}

		console.log({
			allTypeIds_length: allTypeIds.length,
			typeIdByName_length: Object.keys(typeIdByName).length
		})

		return typeIdByName
	}
	
	const nodeBySystemId: {
		[systemId: number]: Node
	} = {}
	const getNodeBySystemIdMap = async () => {
		// const regionIds = await getRegionIds()
		const regionIds = [JITA_REGION_ID]

		for (let regionId of regionIds) {
			const constellationIds = await getConstellationIdsInRegion(regionId)
			for (let constellationId of constellationIds) {
				const constellationSystemIds = await getSystemIdsInConstellation(constellationId)
				for (let constellationSystemId of constellationSystemIds) {
					nodeBySystemId[constellationSystemId] = new Node()
					// console.log(`created node: ${constellationSystemId}`)
				}

				// if (constellationId !== 20000017) break // TODO: delete this line
			}
		}

		for (let systemId in nodeBySystemId) {
			const node = nodeBySystemId[systemId]
			// console.log(`visit node: ${systemId}`)

			const stargateIds = await getStargateIdsInSystem(+systemId)
			for (let stargateId of stargateIds) {
				const destSystemId = await getDestinationSystemIdOfStargateId(stargateId)
				// console.log(`ensured edge: ${systemId} <-> ${destSystemId}`)

				const destNode = nodeBySystemId[destSystemId]
				if (destNode) {
					node.ensureEdgeTo(destNode)
				} else console.warn('destNode is falsy')
			}

			// console.log(`break2`)
			// break // TODO: delete this line
		}	

		console.log({
			nodeBySystemId
		})
		
		// const allTypeIds = await getTypeIds(JITA_REGION_ID) // TODO: search other regions too
		
		// const chunkSize = 1000
		// for (let i = 0; i*chunkSize < allTypeIds.length; i++) {
		// 	const typeIdByNameChunk: {
		// 		[id: string]: number
		// 	} = {}
		// 	const typeIdsInChunk = allTypeIds.slice(i*chunkSize, (i+1)*chunkSize)
			
		// 	const firstTypeIdInChunk = typeIdsInChunk[0]
		// 	const lastTypeIdInChunk = typeIdsInChunk.slice(-1)[0]
		// 	const chunkKey = `typeIdByName_${i}_${firstTypeIdInChunk}_to_${lastTypeIdInChunk}`
		// 	try {
		// 		const loadedTypeIdByNameChunk = await loadJson(chunkKey)
		// 		if (loadedTypeIdByNameChunk) {
		// 			// console.log(`loadedTypeIdByNameChunk (${chunkKey})`, loadedTypeIdByNameChunk)
		// 			Object.assign(
		// 				typeIdByName,
		// 				loadedTypeIdByNameChunk
		// 			)
		// 		}
		// 	} catch (reason) {
		// 		console.warn('getTypeIdByNameMap() caught reason: ', reason)

		// 		const promises = []
		// 		for (let typeId of typeIdsInChunk) {
		// 			promises.push(getTypeName(typeId).then(name => {
		// 				typeIdByNameChunk[name] = typeId
		// 			}))
		// 		}
		// 		await Promise.all(promises)
		// 		Object.assign(
		// 			typeIdByName,
		// 			typeIdByNameChunk
		// 		)
		// 		saveJson(chunkKey, typeIdByNameChunk)
		// 		console.log(`i: ${i}, promises: ${promises.length}`)
		// 	}
		// 	// console.log(`i: ${i} done`)
		// }

		// console.log({
		// 	allTypeIds_length: allTypeIds.length,
		// 	typeIdByName_length: Object.keys(typeIdByName).length
		// })

		return nodeBySystemId
	}
	
	return {
		getTypeIds,
		getDays,
		getOrders,
		roundNonZero,
		roundMils,
		avg,
		getTypeName,
		getTypeM3,
		getTypeIdByNameMap,
		getNodeBySystemIdMap,

		constants: {
			JITA_REGION_ID: 10000002, //The Forge
			AMARR_REGION_ID: 10000043, //Domain
			DODIXIE_REGION_ID: 10000032, //Sinq Laison
			RENS_REGION_ID: 10000030, //Heimatar
			// HEK_REGION_ID: 10000042, //Metropolis
			
			JITA_STATION_ID: 60003760,
			AMARR_STATION_ID: 60008494,
			DODIXIE_STATION_ID: 60011866,
			RENS_STATION_ID: 60004588,
	
			SELL_TAX: 0.08 + 0.024,
			BUY_TAX: 0.024
		}
	}
})()

export default util