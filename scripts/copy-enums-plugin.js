const fs = require('node:fs')

// Plugin to copy enum values directly into generated GraphQL file
module.exports = {
  plugin: (_schema, _documents, _config) => {
    const generatedFile = 'src/graphql/generated/graphql.ts'

    // Read the current generated file
    let content = fs.readFileSync(generatedFile, 'utf8')

    // Find all enum imports and extract them
    const enumImportRegex =
      /import\s+\{\s*(\w+(?:\s*,\s*\w+)*)\s*\}\s+from\s+['"]@\/graphql\/schema\/([^'"]+)['"];?/g
    const enumImports = []

    for (const m of content.matchAll(enumImportRegex)) {
      const enumNames = m[1].split(',').map((name) => name.trim())
      const schemaFile = m[2]
      enumImports.push({ enumNames, schemaFile })
    }

    // Read schema files and extract enum definitions
    const enumDefinitions = []

    for (const { enumNames, schemaFile } of enumImports) {
      const schemaPath = `src/graphql/schema/${schemaFile}.ts`
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8')

        for (const enumName of enumNames) {
          // Find enum definition - look for export enum EnumName { ... }
          const enumStart = `export enum ${enumName} {`
          const startIndex = schemaContent.indexOf(enumStart)

          if (startIndex !== -1) {
            // Find the matching closing brace
            let braceCount = 0
            let endIndex = startIndex

            for (let i = startIndex; i < schemaContent.length; i++) {
              if (schemaContent[i] === '{') {
                braceCount++
              } else if (schemaContent[i] === '}') {
                braceCount--
                if (braceCount === 0) {
                  endIndex = i
                  break
                }
              }
            }

            // Extract the enum block
            const enumBlock = schemaContent.substring(startIndex, endIndex + 1)

            // Clean up the enum body
            const lines = enumBlock.split('\n')
            const cleanLines = lines
              .map((line) => line.trim())
              .filter(
                (line) =>
                  line && !line.startsWith('//') && !line.startsWith('*')
              )
              .map((line) => {
                if (line.includes('=')) {
                  const [key, value] = line.split('=').map((s) => s.trim())
                  return `  ${key} = ${value}`
                }
                return line
              })
              .filter((line) => line)

            const cleanEnumBody = cleanLines.join('\n')
            enumDefinitions.push(cleanEnumBody)
          }
        }
      }
    }

    // Remove the problematic imports
    content = content.replace(enumImportRegex, '')

    // Add enum definitions after the imports
    if (enumDefinitions.length > 0) {
      const enumBlock = `\n${enumDefinitions.join('\n\n')}\n\n`
      content = content.replace(
        'export type Maybe<T> = T | null;',
        `${enumBlock}export type Maybe<T> = T | null;`
      )
    }

    // Write the updated content back
    fs.writeFileSync(generatedFile, content)

    return ''
  },
}
