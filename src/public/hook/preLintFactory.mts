import type {API} from "#~src/API.d.mts"
import type {APIContext} from "#~src/APIContext.d.mts"
import {getInternalData} from "#~src/getInternalData.mts"
import {getRealmDependency} from "#~src/getRealmDependency.mts"

const impl: API["hook"]["preLint"] = async function(
	this: APIContext, session
) {
	const nodeMyTS = getRealmDependency(session, "@enkore/typescript")
	const myProgram = getInternalData(session).myTSProgram

	const realmOptions = session.target.getConfig(this.target)

	if (realmOptions.exports) {
		for (const exportPath in realmOptions.exports) {
			const exp = realmOptions.exports[exportPath]

			if (!exp.checkAgainstInterface) continue
			if (!exp.checkAgainstInterface) continue

			const [interfaceSource, interfaceName] = exp.checkAgainstInterface

			const modules = getInternalData(session).entryPointMap.get(exportPath)!;

			let testCodeImports = ``, testCode = ``

			testCodeImports += `import type {${interfaceName} as __InterfaceToTestAgainst} from "${interfaceSource}"\n`
			testCode += `const exportObject: __InterfaceToTestAgainst = {\n`

			for (const [exportName, meta] of modules) {
				if (meta.descriptor.kind === "type") continue

				testCodeImports += `import {${exportName}} from "../${meta.relativePath}"\n`

				testCode += `    ${exportName},\n`
			}

			testCode += `}\n`

			const vFile = nodeMyTS.defineVirtualProgramFile(
				`project/src/testInterfaceCode.mts`, `${testCodeImports}\n${testCode}`
			)

			const {program: testProg} = nodeMyTS.createProgram(
				session.project.root,
				[vFile],
				getInternalData(session).myTSProgram.compilerOptions
			)

			const diagnosticMessages = nodeMyTS.typeCheckModule(
				testProg.getModule(vFile.path), true
			)

			for (const message of diagnosticMessages) {
				session.enkore.emitMessage(
					"error",
					`checkAgainstInterface: ts(${message.code}) ${message.message}`
				)
			}

			if (!diagnosticMessages.length) {
				session.enkore.emitMessage(
					`info`, `export '${exportPath}' type checks against interface '${interfaceName}' from '${interfaceSource}'`
				)
			}
		}
	}

	if (session.enkore.getOptions().isCIEnvironment) {
		session.enkore.emitMessage(
			"info", "doing complete typescript check (ci-only)"
		)

		const {diagnosticMessages} = nodeMyTS.typeCheckProgram(myProgram)

		for (const msg of diagnosticMessages) {
			session.enkore.emitMessage(
				"error", msg.message
			)
		}
	}
}

export function preLintFactory(context: APIContext) {
	return impl!.bind(context)
}
