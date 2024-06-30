import { AmazonProductDetails, getProductDetails, SustainabilityRating, SustainResult } from "../service/amazon"
import { hasLoaded, Loadable, useLoadable } from "@tobq/loadable"
import { LoadingIcon } from "../icons"

function NewProduct(props: {
	id: string,
	sustainabilityRating?: SustainabilityRating
}) {
	// parse amazon product page for price
	// const title = document.getElementById("productTitle")?.innerText
	// const price = document.getElementById("priceblock_ourprice")?.innerText

	const newProduct: Loadable<AmazonProductDetails> = useLoadable(() => getProductDetails(props.id), [])

	if (!hasLoaded(newProduct))
		return <LoadingIcon />

	return <a href={newProduct.product_url}>
		<h1>NEW Product: {newProduct.product_title}</h1>
		<h2>NEW Price: {newProduct.product_price}</h2>
		<h3>Sustainability: {JSON.stringify(props.sustainabilityRating, null, 2)}</h3>
	</a>
}

export function Modal(props: {
	result: SustainResult
}) {
	return <div style={{
		background: "red",
	}}>
		Injected modal - savings
		{props.result.newProduct && <NewProduct {...props.result.newProduct} />}
	</div>
}