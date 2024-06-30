import { Mutex } from "async-mutex"
import { getRequiredEnvVar, sleep } from "../utils.js"
import { isAxiosError } from "axios"
import moment from "moment"
import { AzureKeyCredential, OpenAIClient } from "@azure/openai"
import { ChatRequestMessageUnion } from "@azure/openai/types/openai"

// let PRESERVE = process.env.PRESERVE === "true";

export const openai = new OpenAIClient(
	getRequiredEnvVar("AZURE_OAI_ENDPOINT"),
	new AzureKeyCredential(getRequiredEnvVar("AZURE_OAI_KEY")),
)
const gptMutex = new Mutex()
let lastRequest = moment(0)
const timeBetweenRequests = moment.duration(2, "seconds")

const azureDeploymentName = getRequiredEnvVar("AZURE_OAI_CHATGPT_DEPLOYMENT")

export async function processQueryChatGPT(query: ChatRequestMessageUnion[]) {
	// console.log(` - Sending request to GPT: ${query}`);
	return gptMutex.runExclusive(async () => {
		// Calculate the time since the last request
		const timeSinceLastRequest = moment.duration(moment().diff(lastRequest))

		// If not enough time has passed since the last request, wait
		const toWait = timeBetweenRequests.subtract(timeSinceLastRequest)

		if (toWait.asMilliseconds() > 0) {
			console.warn(` -- Waiting ${toWait}ms before sending request to GPT`)
			await sleep(toWait.asMilliseconds())
		}

		let response
		let attempts = 0
		const MAX_ATTEMPTS = 5

		while (attempts < MAX_ATTEMPTS) {
			try {
				// Attempt to make the request
				console.log(`- Sending tokens to ${azureDeploymentName} model`)

				response = await openai.getChatCompletions(
					azureDeploymentName,
					query,
					{
						responseFormat: {
							type: "json_object",
						},
					},
				)

				// If the request was successful, break out of the loop
				break
			} catch (error) {
				// If the error is an Axios error and the status code is 429 or 503, wait and retry
				attempts++
				/*if (error instanceof RateLimitError) {
// TODO: see if azure has a rate limit error type we can use

					console.warn(`Received Rate Limit Error from GPT. Waiting and retrying (${attempts}/${MAX_ATTEMPTS})`);
				} else*/
				if (isAxiosError(error) && error.response?.status && (error.response.status === 429 || error.response.status >= 500)) {
					console.warn(`Received ${error.response.status} error from GPT. Waiting and retrying (${attempts}/${MAX_ATTEMPTS})`)
				} else {
					// If the error is not an Axios error or the status code is not 429 or 503, rethrow the error
					console.error(`Error occurred while processing GPT request`, error)
					throw error
				}
				await sleep(5 * 1.7 ** attempts, "seconds") // wait longer for each attempt
			}
		}
		// If no response was received after 3 attempts, throw an error
		if (!response) {
			throw new Error(`Failed to get a response from GPT after ${MAX_ATTEMPTS} attempts`)
		}

		const data = response.choices[0].message

		// If the response does not contain any content, throw an error
		if (!data?.content)
			throw new Error("No response from GPT")

		// Update the time of the last request
		lastRequest = moment()

		// Return the content of the response
		return data.content.trim()
	})
}