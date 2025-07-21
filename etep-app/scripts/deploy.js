const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command) {
    try {
        console.log(`Executando: ${command}`);
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Erro executando: ${command}`);
        process.exit(1);
    }
}

function main() {
    console.log('🚀 Iniciando deploy...');
    
    // 1. Atualizar versão
    console.log('📝 Atualizando versão...');
    runCommand('node scripts/version-bump.js');
    
    // 2. Build do Cordova
    console.log('🔨 Fazendo build...');
    runCommand('cordova build android');
    
    // 3. Git add, commit, push
    console.log('📤 Enviando para Git...');
    const version = JSON.parse(fs.readFileSync('version.json', 'utf8'));
    
    runCommand('git add .');
    runCommand(`git commit -m "Deploy v${version.version} build ${version.build}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"`);
    runCommand('git push origin main');
    
    console.log(`✅ Deploy concluído! Versão: ${version.version} (build ${version.build})`);
}

main();