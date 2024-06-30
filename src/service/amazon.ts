import { ChatGptMessage, processQueryChatGPT } from "./chatgpt"
import { getRequiredEnvVar } from "../utils"
import { ChatMessageContentItemUnion, ChatRequestMessageUnion } from "@azure/openai/types/openai"

const RAPID_API_KEY = getRequiredEnvVar("RAPID_API_KEY")
const MAX_ITERATION_COUNT = 3


export type SustainabilityRating = {
	material: number,
	production: number,
	shipping: number,
	disposability: number,
}

export type SustainResult = {
	type: "result",
	originalSustainabilityRating: SustainabilityRating,
	newProduct?: {
		id: string,
		sustainabilityRating?: SustainabilityRating
	}
}
type SustainQuery = {
	type: "query",
	query: string,
}
export type AmazonProductDetails = {
	asin?: string
	product_title?: string
	product_price?: string
	product_original_price?: null
	currency?: string
	country?: string
	product_star_rating?: string
	product_num_ratings?: number
	product_url?: string
	product_photo?: string
	product_num_offers?: null
	product_availability?: null
	is_best_seller?: boolean
	is_amazon_choice?: boolean
	climate_pledge_friendly?: boolean
	sales_volume?: null
	about_product?: unknown[]
	product_description?: string
	product_information?: {
		"Package Dimensions"?: string
		"Item model number"?: string
		Department?: string
		"Date First Available"?: string
		Manufacturer?: string
		ASIN?: string
		"Best Sellers Rank"?: string
		"Customer Reviews"?: string
		[k: string]: unknown
	}
	rating_distribution?: {
		"1"?: string
		"2"?: string
		"3"?: string
		"4"?: string
		"5"?: string
		[k: string]: unknown
	}
	product_photos?: string[]
	product_details?: {
		[k: string]: unknown
	}
	customers_say?: string
	review_aspects?: {
		Comfort?: string
		Appearance?: string
		Fit?: string
		[k: string]: unknown
	}
	category_path?: {
		id?: string
		name?: string
		link?: string
		[k: string]: unknown
	}[]
	product_variations?: {
		size?: {
			asin?: string
			value?: string
			is_available?: boolean
			[k: string]: unknown
		}[]
		color?: {
			asin?: string
			value?: string
			photo?: string
			is_available?: boolean
			[k: string]: unknown
		}[]
		[k: string]: unknown
	}
	is_prime?: boolean
	// [k: string]: unknown
}


type SustainBotResponse = SustainResult | SustainQuery

export interface AmazonProductDetailsResponse {
	status?: string
	request_id?: string
	data?: AmazonProductDetails

	[k: string]: unknown
}

async function queryAmazon(query: string, maxPrice: number) {
	// const url = "https://real-time-amazon-data.p.rapidapi.com/search?query=Phone&page=1&country=US&sort_by=RELEVANCE&product_condition=ALL"
	const url = new URL("https://real-time-amazon-data.p.rapidapi.com/search")
	url.searchParams.append("query", query)
	url.searchParams.append("page", "1")
	url.searchParams.append("country", "US")
	url.searchParams.append("sort_by", "RELEVANCE")
	url.searchParams.append("product_condition", "ALL")
	// set max-price to 1.5x the price of the product
	url.searchParams.append("max_price", maxPrice.toString())


	const options = {
		method: "GET",
		headers: {
			"x-rapidapi-key": RAPID_API_KEY,
			"x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
		},
	}

	try {
		console.log(`Querying amazon: ${query} - max price: ${maxPrice}`)
		const response = await fetch(url, options)
		const result = await response.json() as {
			status?: string
			request_id?: string
			data?: {
				total_products?: number
				country?: string
				domain?: string
				products?: {}[]
			}
		}
		console.log(result)
		return result
	} catch (error) {
		console.error(error)
	}
}

function formatProductMessage(originalProduct: AmazonProductDetails) {
	const productPhoto = originalProduct.product_photo ?? originalProduct.product_photos?.[0]

	const messages: ChatMessageContentItemUnion[] = [
		{
			type: "text",
			text: JSON.stringify(originalProduct),
		},
	]
	if (productPhoto) {
		// console.log("Inserting image: ", productPhoto)
		messages.push({
			type: "image_url",
			imageUrl: { url: productPhoto },
		})
	}

	return {
		role: "user",
		content: messages,
	}
}

export async function getAlternatives(productId: string): Promise<SustainResult> {
	const originalProduct = await getProductDetails(productId)

	const productData = originalProduct
	if (!productData) {
		throw new Error("Product data not found")
	}
	const productPriceString = productData.product_price
	if (!productPriceString) {
		throw new Error("Product price not found")
	}


	const thread: ChatRequestMessageUnion[] = [{
		role: "system",
		content: `You're an assistant given amazon products to find sustainable alternatives for.
		
You qualify sustainability by a variety of factors:
Material, production, shipping, and disposality.

For each of these, you rate them on a scale of 1-5 - the overall rating is the average of these.

Give me a search query for a sustainable alternative to this product.
The result product must be reasonably sufficient of an alternative. If the users looking for a drill, don't suggest a wooden hammer.
it's for amazon search. I'll then show you the results, and if any of them are acceptable alternatives, we'll suggest the best one -- especially if cheaper!

Your response should be in JSON format:
type SustainabilityRating = {
	material: number,
	production: number,
	shipping: number,
	disposability: number,
}

type response = {
    type: "result",
    originalSustainabilityRating: SustainabilityRating,
    newProduct?: { 
		id: string,
		sustainabilityRating?: SustainabilityRating
    }
} | {
    type: "query",
    query: string,
}

If the given product is already deemed the most sustainable given the requirements, then you can omit a new product in the final response. 
`,
	},
		formatProductMessage(originalProduct),
	]


	const productPrice = parseFloat(productPriceString)
	const maxPrice = productPrice * 1.5


	let i = 0

	for (; i < MAX_ITERATION_COUNT; i++) {
		const nextStringResponse = await processQueryChatGPT(thread)
		const nextResponse = JSON.parse(nextStringResponse) as SustainBotResponse

		if (nextResponse.type === "result") return nextResponse

		const alternativeResults = await queryAmazon(nextResponse.query, maxPrice)

		const products = alternativeResults.data?.products
		thread.push({
				role: "assistant",
				content: nextStringResponse,
			},
			...products ? products.slice(0, 10).map(formatProductMessage) : {
				role: "system",
				content: "No products found",
			},
			{
				role: "system",
				content: `Do any of these alternatives seem like a good fit? If so, please provide response object, else, provide a new query -- ${MAX_ITERATION_COUNT - i} queries left`,
			},
		)
	}

	console.log("Max iteration count reached")

	// ask for final result
	thread.push({
		role: "system",
		content: "QUERY ITERATIONS EXCEEDED: Please provide a final decision on the best alternative product - if any",
	})

	const finalStringResponse = await processQueryChatGPT(thread)
	const parse = JSON.parse(finalStringResponse) as SustainBotResponse
	if (parse.type === "result") return parse
	throw new Error("Final response not a result")
}

export async function getProductDetails(...ids: string[]) {
	if (ids[0] === "B0858J4BTK") {
		return {
			"asin": "B0858J4BTK",
			"product_title": "DEWALT 20V MAX Power Tool Combo Kit, 4-Tool Cordless Power Tool Set with Battery and Charger (DCK551D1M1)",
			"product_price": "599.00",
			"product_original_price": "$639.00",
			"currency": "USD",
			"country": "US",
			"product_star_rating": "4.7",
			"product_num_ratings": 750,
			"product_url": "https://www.amazon.com/dp/B0858J4BTK",
			"product_photo": "https://m.media-amazon.com/images/I/51KTe8+ULeL.jpg",
			"product_num_offers": 9,
			"product_availability": "Only 17 left in stock - order soon.",
			"is_best_seller": false,
			"is_amazon_choice": false,
			"is_prime": false,
			"climate_pledge_friendly": false,
			"sales_volume": "200+ bought in past month",
			"about_product": [
				"DCD771 Drill/Driver in the cordless drill combo kit is compact (front to back) and lightweight, designed to fit into tight areas",
				"DCD771 Cordless Drill/Driver in the cordless tools combo kit has a high-performance motor that delivers 300 unit watts out (UWO) of power for completing a wide range of applications",
				"DCF885 Cordless Impact Driver of the drill/impact driver combo kit has a compact design (5.55-inch front to back) to fit into tight areas",
				"DCS381 Cordless Reciprocating Saw has a keyless blade clamp for quick blade changes without touching the blade or reciprocating shaft",
				"DCS393 Cordless Circular Saw with 6-1/2-inch carbide blade can cut 2x4s at a 45-degree angle in a single pass",
				"DCS356 Oscillating Multi-Tool has a 3-speed selector that allows users to choose their speed setting based on application",
			],
			"product_description": "This Cordless 5-Tool Combo Kit features DEWALT cordless tools including a 1/2-inch Drill/Driver, Reciprocating Saw, 6-1/2-inch Circular Saw, Brushless Oscillating Multi-Tool, 1/4-inch Impact Driver, 20V MAX* 2.0Ah battery, 20V MAX* 4.0Ah battery, charger, and bag. The DCS393 Circular Saw with a 6-1/2-inch carbide blade can cut 2x4s at a 45-degree angle in a single pass. The DCS381 Reciprocating Saw with keyless blade clamp allows for quick blade changes. The DCD771 Drill/Driver has a high-speed transmission with two speeds (0-450 and 1,500 rpm) for a range of fastening and drilling applications. The DCF885 Impact Driver in DEWALT tool kit has 3 LEDs with a 20-second delay after the trigger is released for increased visibility.",
			"product_information": {
				"Amperage": "4 Amps",
				"Included Components": "(1) DCD771 20V MAX* 1/2 in. Cordless Drill/Driver; (1) DCF885 20V MAX* 1/4 in. Cordless Impact Driver; (1) DCS381 20V MAX* Cordless Reciprocating Saw; (1) DCS393 20V MAX* 6-1/2 in. Cordless Circular Saw; (1) DCS356 20V MAX* XR® Brushless 3-Speed Cordless Oscillating Multi-Tool; (1) DCB203 20V MAX* 2.0Ah Battery; (1) DCB204 20V MAX* 4.0Ah Battery; (1) DCB112 Charger; (1) Kit Bag",
				"UPC": "885911696425",
				"Manufacturer": "DEWALT",
				"Part Number": "DCK551D1M1",
				"Item Weight": "25 pounds",
				"Product Dimensions": "21.25 x 9.22 x 12.75 inches",
				"Item model number": "DCK551D1M1",
				"Batteries": "2 Lithium Ion batteries required. (included)",
				"Is Discontinued By Manufacturer": "No",
				"Size": "One Size",
				"Color": "Multi",
				"Style": "5-Tool Kit",
				"Material": "Blend",
				"Power Source": "Battery Powered",
				"Item Package Quantity": "1",
				"Batteries Included?": "Yes",
				"Batteries Required?": "Yes",
				"ASIN": "B0858J4BTK",
				"Best Sellers Rank": "#120,928 in Tools & Home Improvement (See Top 100 in Tools & Home Improvement)   #72 in Power Tool Combo Kits",
				"Date First Available": "March 1, 2020",
			},
			"rating_distribution": {
				"1": "2",
				"2": "1",
				"3": "3",
				"4": "10",
				"5": "85",
			},
			"product_photos": [
				"https://m.media-amazon.com/images/I/51KTe8+ULeL.jpg",
				"https://m.media-amazon.com/images/I/41CR4AVIMwL.jpg",
				"https://m.media-amazon.com/images/I/51XQHdJamsL.jpg",
				"https://m.media-amazon.com/images/I/41ln+5GNugL.jpg",
				"https://m.media-amazon.com/images/I/41oW50nj69L.jpg",
				"https://m.media-amazon.com/images/I/41dQnjSXw6L.jpg",
				"https://m.media-amazon.com/images/I/51KAUt87U+L.jpg",
			],
			"product_details": {
				"Brand": "DEWALT",
				"Voltage": "20 Volts",
				"Item Weight": "25 Pounds",
				"Battery Cell Composition": "Lithium Ion",
				"Number of Batteries": "2 Lithium Ion batteries required. (included)",
			},
			"customers_say": "Customers like the quality, value, and performance of the power tool set. They mention that it's excellent for craftsmen or homeowners, has good build quality, and works great. That said, opinions are mixed on battery life.",
			"category_path": [
				{
					"id": "228013",
					"name": "Tools & Home Improvement",
					"link": "https://www.amazon.com/Tools-and-Home-Improvement/b/ref=dp_bc_aui_C_1?ie=UTF8&node=228013",
				},
				{
					"id": "328182011",
					"name": "Power & Hand Tools",
					"link": "https://www.amazon.com/Power-Tools-and-Hand-Tools/b/ref=dp_bc_aui_C_2?ie=UTF8&node=328182011",
				},
				{
					"id": "551236",
					"name": "Power Tools",
					"link": "https://www.amazon.com/Power-Tools/b/ref=dp_bc_aui_C_3?ie=UTF8&node=551236",
				},
				{
					"id": "552734",
					"name": "Combo Kits",
					"link": "https://www.amazon.com/Cordless-Combo-Kits/b/ref=dp_bc_aui_C_4?ie=UTF8&node=552734",
				},
			],
			"product_variations": [],
		}
	}


	// const url = 'https://real-time-amazon-data.p.rapidapi.com/product-details?asin=B07ZPKBL9V&country=US';
	const url = new URL("https://real-time-amazon-data.p.rapidapi.com/product-details")
	url.searchParams.append("asin", ids.join(","))
	url.searchParams.append("country", "US")


	const options = {
		method: "GET",
		headers: {
			"x-rapidapi-key": RAPID_API_KEY,
			"x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
		},
	}

	const response = await fetch(url, options)
	const result = await response.json() as AmazonProductDetailsResponse
	console.log(`Product details for ${ids.join(",")}:`, result)

	const data = result.data
	if (!data) throw new Error("Product details not found")

	return data
}
