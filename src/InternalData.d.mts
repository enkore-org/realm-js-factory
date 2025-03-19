import type {MyTSProgram, MyTSExport} from "@aniojs-types/node-my-ts"

export type Export = {
	name: string
	descriptor: MyTSExport
	relativePath: string
}

export type InternalData = {
	myTSProgram: MyTSProgram
	entryPointMap: Map<string, Map<string, Export>>
}
