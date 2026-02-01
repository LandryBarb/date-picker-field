#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { execSync } from 'child_process'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function run() {
  const projectName = await ask('Project name (kebab-case): ')
  const useAtomic = await ask('Use atomic design? (y/n): ')

  if (!projectName) {
    console.error('❌ Project name required')
    process.exit(1)
  }

  const targetDir = path.resolve(process.cwd(), '..', projectName)
  const templateDir = process.cwd()

  if (fs.existsSync(targetDir)) {
    console.error('❌ Directory already exists')
    process.exit(1)
  }

  console.log('📁 Creating project...')
  fs.cpSync(templateDir, targetDir, {
    recursive: true,
    filter: (src) => !src.includes('node_modules') && !src.includes('.git')
  })

  process.chdir(targetDir)

  if (useAtomic.toLowerCase() !== 'y') {
    console.log('🧹 Removing atomic folders...')
    fs.rmSync('src/components/atoms', { recursive: true, force: true })
    fs.rmSync('src/components/molecules', { recursive: true, force: true })
    fs.rmSync('src/components/organisms', { recursive: true, force: true })
  }

  console.log('🧹 Resetting git...')
  execSync('git init', { stdio: 'inherit' })

  console.log('📦 Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })

  console.log('✅ Project ready!')
  console.log(`👉 cd ../${projectName}`)
  console.log('👉 npm run dev')

  rl.close()
}

run()
