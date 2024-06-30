import { DAppKitProvider, useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { hasLoaded, useLoadable } from "@tobq/loadable"
import { LoadingIcon } from "../icons"
import { getVETPrice } from "../service/vechain"

function useVETPrice() {
	const CACHE_MINS = 60
	const CACHE_KEY = "vetPrice"

	return useLoadable(async () => {
		const cached = localStorage.getItem(CACHE_KEY)
		const cachedValue = cached && JSON.parse(cached) as { value: number, timestamp: number }
		if (cachedValue && Date.now() - cachedValue.timestamp < 1000 * 60 * CACHE_MINS) {
			console.log("Using cached VET price: ", cachedValue.value)
			return cachedValue.value
		}

		console.log("Fetching VET price")
		const vetPrice = await getVETPrice()
		console.log(`Current VET Price: $${vetPrice}`)

		// Cache the value
		localStorage.setItem(CACHE_KEY, JSON.stringify({ value: vetPrice, timestamp: Date.now() }))

		return vetPrice
	}, [])
}

export function App() {
	const savingsVet = useMemo(() => Math.random() * 100, [])
	const vetPrice = useVETPrice()
	const {
		account, availableWallets, source,
	} = useWallet()

	return <div className="flex rounded-lg border p-4">
		<span className="text-sm text-gray-700">My Savings</span>
		<div className="rounded darken border p-4">
			{account} {availableWallets}
		</div>
		<div>{Math.round(savingsVet)}VET</div>
		{hasLoaded(vetPrice) ?
			<div>${(vetPrice * savingsVet).toFixed(2)}</div> :
			<LoadingIcon />}
	</div>
}