import { createRoot } from "react-dom/client"
import { Modal } from "../component/modal"
import { getAlternatives } from "./amazon"

window.addEventListener("load", async () => {
	// Create the modal
	const modalRoot = document.createElement("div")
	modalRoot.id = "my-modal"

	let insertAfterDiv = document.getElementById("alternativeOfferEligibilityMessaging_feature_div")
	if (!insertAfterDiv) {
		insertAfterDiv = document.getElementById("twister_feature_div")
	}

	if (!insertAfterDiv) {
		insertAfterDiv = document.getElementById("sustain-root")
	}

	const amazonProductAsinElement = document.getElementById("ASIN")
	let amazonProductAsin: string
	if (!amazonProductAsinElement || !("value" in amazonProductAsinElement)) {
		console.log("Amazon Product ASIN not found")
		// return
		amazonProductAsin = "B0858J4BTK"
	}else {
		amazonProductAsin = amazonProductAsinElement.value as string
		console.log("Amazon product ASIN: ", amazonProductAsin)
	}

	// if the product is not found, return
	if (!amazonProductAsin) {
		console.log("Amazon Product not found")
		return
	}

	const result = await getAlternatives(amazonProductAsin)

	// react render into modalroot the Modal component
	createRoot(modalRoot).render(<Modal result={result} />)

	console.log("Inserting modal after: ", insertAfterDiv)
	if (insertAfterDiv?.parentNode)
		insertAfterDiv.parentNode.insertBefore(modalRoot, insertAfterDiv.nextSibling)
})


