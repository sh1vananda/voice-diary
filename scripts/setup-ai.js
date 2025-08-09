#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎙️  Voice Diary AI Setup\n');

// Check if Ollama is installed
function checkOllama() {
  try {
    execSync('ollama --version', { stdio: 'pipe' });
    console.log('✅ Ollama is installed');
    return true;
  } catch (error) {
    console.log('❌ Ollama is not installed');
    console.log('📥 Please install Ollama from: https://ollama.ai/download');
    return false;
  }
}

// Check if model is available
function checkModel() {
  try {
    const output = execSync('ollama list', { encoding: 'utf8' });
    if (output.includes('qwen3:4b-thinking')) {
      console.log('✅ Qwen3 4B Thinking model is available');
      return true;
    } else {
      console.log('❌ Qwen3 4B Thinking model not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Could not check models (is Ollama running?)');
    return false;
  }
}

// Pull the model
function pullModel() {
  console.log('📥 Downloading Qwen3 4B Thinking model (this may take a few minutes)...');
  try {
    execSync('ollama pull qwen3:4b-thinking', { stdio: 'inherit' });
    console.log('✅ Model downloaded successfully');
    return true;
  } catch (error) {
    console.log('❌ Failed to download model');
    return false;
  }
}

// Check if Ollama service is running
function checkService() {
  try {
    const response = require('child_process').execSync('curl -s http://localhost:11434/api/tags', { encoding: 'utf8' });
    console.log('✅ Ollama service is running');
    return true;
  } catch (error) {
    console.log('❌ Ollama service is not running');
    console.log('🚀 Start it with: ollama serve');
    return false;
  }
}

async function main() {
  // Step 1: Check Ollama installation
  if (!checkOllama()) {
    process.exit(1);
  }

  // Step 2: Check if service is running
  const serviceRunning = checkService();

  // Step 3: Check model availability
  if (!checkModel()) {
    if (serviceRunning) {
      pullModel();
    } else {
      console.log('⚠️  Please start Ollama service first: ollama serve');
      console.log('   Then run this script again to download the model');
    }
  }

  console.log('\n🎉 Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure Ollama is running: ollama serve');
  console.log('2. Start the app: npm run dev');
  console.log('3. Check the AI status indicator in the app');
  console.log('\n📖 For more help, see SETUP.md');
}

main().catch(console.error);