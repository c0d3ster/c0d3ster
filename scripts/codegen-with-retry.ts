import { spawn } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'

const waitForServer = async (
  url: string,
  maxAttempts = 30,
  delay = 1000
): Promise<boolean> => {
  console.log(`🔄 Waiting for server at ${url}...`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ __typename }' }),
      })

      if (response.ok) {
        console.log(`✅ Server is ready after ${attempt} attempts`)
        return true
      }
    } catch {
      // Server not ready, continue waiting
    }

    if (attempt < maxAttempts) {
      console.log(
        `⏳ Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`
      )
      await setTimeout(delay)
    }
  }

  console.log(`❌ Server did not become ready after ${maxAttempts} attempts`)
  return false
}

const runCodegen = async (): Promise<void> => {
  console.log('🚀 Starting codegen with server check...')

  const serverReady = await waitForServer('http://localhost:3000/api/graphql')

  if (!serverReady) {
    console.error('❌ Server is not ready, codegen cannot proceed')
    process.exit(1)
  }

  console.log('🔧 Running GraphQL codegen...')
  const codegen = spawn('npx', ['graphql-codegen'], {
    stdio: 'inherit',
    shell: true,
  })

  codegen.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Codegen completed successfully')
    } else {
      console.error(`❌ Codegen failed with exit code ${code}`)
    }
    process.exit(code ?? 1)
  })
}

const runCodegenWatch = async (): Promise<void> => {
  console.log('🚀 Starting codegen watch with server check...')

  const serverReady = await waitForServer('http://localhost:3000/api/graphql')

  if (!serverReady) {
    console.error('❌ Server is not ready, codegen cannot proceed')
    process.exit(1)
  }

  console.log('👀 Running GraphQL codegen in watch mode...')
  const codegen = spawn('npx', ['graphql-codegen', '--watch'], {
    stdio: 'inherit',
    shell: true,
  })

  codegen.on('close', (code) => {
    console.log(`Codegen watch exited with code ${code}`)
    process.exit(code ?? 1)
  })
}

const isWatch = process.argv.includes('--watch')

if (isWatch) {
  runCodegenWatch().catch(console.error)
} else {
  runCodegen().catch(console.error)
}
