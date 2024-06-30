import { useEffect, useState } from "react"
import humanizeDuration from "humanize-duration"
import { DurationInputArg1, DurationInputArg2 } from "moment"
import moment from "moment"

type UUID = string;

export async function allFulfilled<T>(promises: Promise<T>[]): Promise<T[]> {
	const mappedEntries = await Promise.allSettled(promises)

	return mappedEntries
		.filter(result => {
			if (result.status !== "fulfilled")
				console.warn(result.reason)

			return result.status === "fulfilled"
		})
		.map(result => {
			const filteredResult = result as PromiseFulfilledResult<T>
			return filteredResult.value
		})
}


export async function sleep(duration: DurationInputArg1, unit?: DurationInputArg2): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, moment.duration(duration, unit).asMilliseconds()))
}


/**
 * Remove duplicate elements of an array beyond a given threshold value
 *
 * E.g. [3, 3, 3, 2, 2, 1] with threshold=2 would return [3, 3, 2, 2, 1]
 */
export function cleanDuplicates<T>(values: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, threshold: number = 1): T[] {
	const filteredValues: T[] = []

	values.forEach(element => {
		let existingCount = 0
		filteredValues.forEach(existingElement => {
			if (eq(element, existingElement))
				existingCount += 1
		})

		if (existingCount < threshold)
			filteredValues.push(element)
	})

	return filteredValues
}

export function cleanUndefined<T>(values: (T | undefined)[]): T[] {
	return values.filter(value => value !== undefined) as T[]
}

export function promiseMap<T, U>(values: T[], fn: (value: T, index: number) => PromiseLike<U>): Promise<U[]> {
	return Promise.all(values.map(fn))
}

export type Brand<TYPE, TAG> = TYPE & {
	__brand: TAG
}
export type BrandedBrand<TYPE, TAG> = TYPE & {
	__brand_2: TAG
}

export async function promiseFilter<T>(values: T[], predicate: (value: T) => Promise<boolean>) {
	const filtered = await promiseMap(values, async value => {
		const filter = await predicate(value)
		return filter ? undefined : value
	})
	return cleanUndefined(filtered)
}

export function round(value: number, decimalPlacements: number) {
	const mult = 10 ** decimalPlacements
	return Math.round(value * mult) / mult
}

// Define the type for the reducer callback function
type ReducerCallback<T, U> = (accumulator: T, currentValue: U) => Promise<T>;

/**
 * Asynchronous generator reducer function.
 *
 * @param generator - The asynchronous generator.
 * @param callback - The reducer callback function.
 * @param initialValue - The initial value of the accumulator.
 */
export async function asyncGeneratorReducer<T, U>(
	generator: AsyncGenerator<U>,
	callback: ReducerCallback<T, U>,
	initialValue: T,
): Promise<T> {
	let accumulator = initialValue

	// Loop over the generator's yielded values
	for await (const value of generator) {
		// Apply the callback function and update the accumulator
		accumulator = await callback(accumulator, value)
	}

	// Once all values have been processed, return the accumulated result
	return accumulator
}

/**
 * Collects all values yielded by an asynchronous generator into an array.
 *
 * @param generator - The asynchronous generator.
 */
export async function collectArray<U>(generator: AsyncGenerator<U>): Promise<U[]> {
	// Use the asyncGeneratorReducer function to collect all values into an array
	return asyncGeneratorReducer<U[], U>(generator, async (acc, curr) => {
		acc.push(curr)
		return acc
	}, [])
}

export async function* mergeGenerators<T>(...generators: AsyncGenerator<T>[]): AsyncGenerator<T> {
	for (const generator of generators)
		yield* generator
}

export function isAsyncGenerator<T, TReturn = any, TNext = unknown>(
	obj: any,
): obj is AsyncGenerator<T, TReturn, TNext> {
	return obj != null && typeof obj[Symbol.asyncIterator] === "function"
}

export async function* flatMapGenerator<T, U>(generator: AsyncGenerator<T>, callback: (value: T) => AsyncGenerator<U>): AsyncGenerator<U> {
	for await (const value of generator)
		yield* callback(value)
}

export async function nextValue<T>(generator: AsyncGenerator<T>): Promise<T | undefined> {
	const { value, done } = await generator.next()
	return done ? undefined : value
}

export async function* mapGenerator<T, U>(generator: AsyncGenerator<T>, callback: (value: T) => Promise<U>): AsyncGenerator<U> {
	for await (const value of generator)
		yield await callback(value)
}

export function filter<R, I>(array: (I | R)[], f: (value: I | R) => value is R): R[] {
	return array.filter(f) as R[]
}

export function withClassname(className: string, optionalClassName: string | undefined | null) {
	const classList = [className]
	if (optionalClassName)
		classList.push(optionalClassName)

	return classList.join(" ")
}

export function cyrb53(str: string, seed = 0) {
	let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i)
		h1 = Math.imul(h1 ^ ch, 2654435761)
		h2 = Math.imul(h2 ^ ch, 1597334677)
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
	return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}


export async function copyClipboard(text: string) {
	await navigator.clipboard.writeText(text)
}

export function countDecimals(n: number) {
	const str = n.toString()
	const indexOfDecimal = str.lastIndexOf(".")
	return indexOfDecimal === -1 ? 0 : str.length - indexOfDecimal
}

export function useAbort() {
	const [abortController, setAbortController] = useState(() => new AbortController())

	const abort = () => {
		abortController.abort()
		setAbortController(new AbortController())
	}

	useEffect(() => {
		return () => {
			abort()
		}
	}, [])

	return {
		abort,
		signal: abortController.signal,
	}
}

export function doParseInt(raw: string) {
	const int = parseInt(raw)
	if (isNaN(int))
		throw new Error("Invalid int: " + raw)
	return int
}


export function formatSeconds(seconds: number) {
	function formatFractional(fractionDigits: number) {
		return seconds?.toFixed(fractionDigits).replace(/\.?0+$/, "") + "s"
	}

	if (seconds < 1)
		return formatFractional(2)

	if (seconds < 10)
		return formatFractional(1)

	if (seconds < 60)
		return Math.round(seconds) + "s"

	// if over 1 hour, use Xh MM:SSs format
	// otherwise use MM:SS format

	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = Math.round(seconds % 60)
	const hours = Math.floor(minutes / 60)
	const remainingMinutes = Math.round(minutes % 60)
	return `${hours > 0 ? hours + "h " : ""}${remainingMinutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}s`
}

export function formatBPM(bpm: number) {
	return bpm?.toFixed(1).replace(/\.0$/, "")
}

export function containsSpecialRegexChars(string: string) {
	const specialChars = /[-\/\\^$*+?.()|[\]{}]/g
	return specialChars.test(string)
}

export function getTimeSince(time: Date, largest = 1) {
	const differenceMs = new Date().valueOf() - time.valueOf()
	return humanizeDuration(differenceMs, {
		largest: largest,
		round: true,
		conjunction: " and ",
		units: ["w", "d", "h", "m", "s"],
	})
}

export function nearestPowerOfTwo(n: number) {
	return Math.pow(2, Math.round(Math.log(n) / Math.log(2)))
}

export function nextPowerOfTwo(n: number) {
	return Math.pow(2, Math.ceil(Math.log(n) / Math.log(2)))
}

export function useDebounce<T>(value: T, delay = 500): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		console.debug("Debouncing value: ", value)
		const timer = setTimeout(() => {
			console.debug("Debounced value: ", value)
			setDebouncedValue(value)
		}, delay)

		return () => {
			console.debug("Clearing debounce timer")
			clearTimeout(timer)
		}
	}, [value, delay])

	return debouncedValue
}

export function getEnvVarString(envVar: string, defaultValue: string | null = null) {
	const value = import.meta.env["VITE_" + envVar]
	return (!value || typeof value === "boolean") ? defaultValue : value ?? defaultValue
}

export function getEnvVarNumber(envVar: string, defaultValue: number | null = null) {
	const value = getEnvVarString(envVar)
	if (!value) return defaultValue
	const parsed = parseFloat(value)
	if (Number.isNaN(parsed)) return defaultValue
	return parsed
}

export function getRequiredEnvVarNumber(envVar: string) {
	const value = getEnvVarString(envVar)
	if (!value) throw new Error(`Missing required env var: ${envVar}`)
	const parsed = parseFloat(value)
	if (Number.isNaN(parsed)) throw new Error(`Invalid number for env var: ${envVar}`)
	return parsed
}

export function getRequiredEnvVar(envVar: string) {
	const value = getEnvVarString(envVar)
	if (!value) throw new Error(`Missing required env var: ${envVar}`)
	return value
}

export const API_HOST = getEnvVarString("TWOSHOT_API_HOSTNAME")!
export const ML_API_HOST = getEnvVarString("TWOSHOT_ML_API_HOSTNAME")!
export const PLUGIN_HOST = getEnvVarString("TWOSHOT_PLUGIN_HOST")!


export function getGradient(from: string, to: string, angle: number) {
	return `url(/noise-bg.png), linear-gradient(${angle}deg,${from}, ${to})`
}

export function parseJwt(token: string) {
	const base64Url = token.split(".")[1]
	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")

	const uriComponent =
		window.atob(base64)
			// Buffer.from(base64, "base64")
			//     .toString()
			.split("")
			.map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
			.join("")

	const jsonPayload = decodeURIComponent(uriComponent)

	return JSON.parse(jsonPayload)
}

export function parseFloatParam(numberParam: string | undefined | null) {
	if (!numberParam) {
		return null
	}
	const paramValue = parseFloat(numberParam)
	if (Number.isNaN(paramValue)) {
		return null
	}
	return paramValue
}

export function getErrorMessage(e: any, defaultMessage: string = DEFAULT_ERROR_MESSAGE) {
	if (e instanceof Error) {
		return e.message
	} else if (typeof e === "string" && e.length !== 0)
		return e
	else return defaultMessage
}

// export async function getErrorMessageRest(e: any, defaultMessage: string = DEFAULT_ERROR_MESSAGE) {
// 	if (e instanceof Response) {
// 		try {
// 			const response = await e.json()
// 			return response.message
// 		} catch (e) {
// 		}
// 	} else if (e instanceof ResponseError) {
// 		try {
// 			const response = await e.response.json()
// 			return response.message
// 		} catch (e) {
// 		}
// 	}
// 	return getErrorMessage(e, defaultMessage)
// }

// export async function getRestErrorMessage(e: any): Promise<string | null> {
// 	if (e instanceof Response) {
// 		try {
// 			const response = await e.json()
// 			return response.message
// 		} catch (e) {
// 		}
// 	} else if (e instanceof ResponseError) {
// 		try {
// 			const response = await e.response.json()
// 			return response.message
// 		} catch (e) {
// 		}
// 	}
// 	return null
// }

const DEFAULT_ERROR_MESSAGE = "unknown reason"

export function parseNumberParam(numberParam: string | undefined | null) {
	if (!numberParam) {
		return null
	}
	const paramValue = parseInt(numberParam)
	if (!Number.isInteger(paramValue)) {
		return null
	}
	return paramValue
}

export function optionalClamp(min: number | undefined | null, value: number, max: number | undefined | null): number {
	return Math.min(Math.max(min ?? value, value), max ?? value)
}

export function clamp(min: number, value: number, max: number): number {
	return Math.min(Math.max(min, value), max)
}


export function randomUUID<T extends UUID = UUID>(): T {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
		const r = Math.random() * 16 | 0
		const v = c === "x" ? r : (r & 0x3 | 0x8)
		return v.toString(16)
	}) as T
}

export function isChildOfType(element: HTMLElement | EventTarget, ...types: (new () => HTMLElement)[]): boolean {
	for (const type of types)
		if (element instanceof type) return true

	if ("parentElement" in element && element.parentElement)
		return isChildOfType(element.parentElement as HTMLElement, ...types)

	return false
}

export const TWOSHOT_DISCORD_LINK = getEnvVarString("TWOSHOT_DISCORD_LINK")
export const IMAGE_HOSTNAME = getEnvVarString("TWOSHOT_IMAGE_HOSTNAME") // TODO: implement graphql API, fetch only the necessary fields required in this UI - rather than the entire sample
//  may become more necessary with more sensitive / verbose metadata
export const audioPreviewHostname = getEnvVarString("TWOSHOT_AUDIO_PREVIEW_HOSTNAME")
export const AIVA_IMAGE_URL = "https://aiva.bio/i/favicon.png"

