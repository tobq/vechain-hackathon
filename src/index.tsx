import { createRoot } from "react-dom/client"
import { App } from "./component/app"
import "./service/modal"
import { DAppKitProvider } from "@vechain/dapp-kit-react"

const rootElement = document.getElementById("sustain-root")

if (rootElement)
	createRoot(rootElement)
		.render(
			// <React.StrictMode>
			<DAppKitProvider nodeUrl="https://mainnet.veblocks.net/">
				<App />
			</DAppKitProvider>
			,
			// </React.StrictMode>
		)