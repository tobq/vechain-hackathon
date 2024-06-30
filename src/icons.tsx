import "material-symbols"

import { withClassname } from "./utils"
import { CSSProperties } from "react"


// export const JamIcon = makeIcon("piano", {
//     opticalSize: 20,
//     fill: true
// })
export const SampleIcon = makeIcon("music_note")
export const PacksIcon = makeIcon("library_music", { fill: true })

export const CloseIcon = makeIcon("close", {
	color: "white",
})

export function LoadingIcon(props: { className?: string }) {
	return <div className={withClassname("loading-spinner", props.className)} />
}


type IconOptions = {
	fill?: boolean | 0 | 1
	weight?: 0 | 100 | 200 | 300 | 400 | 500 | 600 | 700
	grade?: -25 | 0 | 200
	opticalSize?: 20 | 24 | 40 | 48
	color?: string
	size?: number | string
	className?: string,
	sharp?: boolean
}

export function MaterialIcon(props: {
	name: string,
	style?: CSSProperties
} & IconOptions) {
	const formatting: { [setting: string]: string } = {}
	if (props.fill !== undefined) {
		formatting["FILL"] = props.fill ? "1" : "0"
	}
	if (props.weight !== undefined) formatting["wght"] = props.weight.toString()
	if (props.grade !== undefined) formatting["GRAD"] = props.grade.toString()
	if (props.opticalSize !== undefined) formatting["opsz"] = props.opticalSize.toString()

	const fontVariationSettings = Object.entries(formatting)
		.map(([key, value]) => `"${key}" ${value}`)
		.join(", ")

	const className = props.sharp ? "material-symbols-sharp" : "material-symbols-rounded"

	return (
		<span
			className={withClassname(className + " no-translate icon", props.className)}
			translate="no"
			style={{
				fontVariationSettings: fontVariationSettings,
				color: props.color,
				fontSize: props.size,
				...props.style,
			}}
		>
			{props.name}
		</span>
	)
}

export function makeIcon(name: string, options: IconOptions = {}) {
	return (props: IconOptions) => <MaterialIcon name={name}
												 {...options}
												 {...props} />
}