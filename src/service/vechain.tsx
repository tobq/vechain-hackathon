import Connex from "@vechain/connex"

const isInstalled = "vechain" in window
console.log("VeWorld is installed: ", isInstalled)

const connex = new Connex({
	node: "https://mainnet.veblocks.net/",
	network: "main",
})

async function connectWallet() {
	const res = await connex.vendor.sign("cert", {
		purpose: "identification",
		payload: {
			type: "text",
			content: "I am a human",
		},
	}).request()
}

// // connect wallet
// connectWallet()

export async function getVETPrice() {
	const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=vechain&vs_currencies=usd")
	const body = await response.json()
	return body.vechain.usd
}